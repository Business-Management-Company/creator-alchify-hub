import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Starting check-due-tasks cron job...');

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get tasks due within the next 24 hours that:
    // 1. Have a due date
    // 2. Are not already done
    // 3. Have an assignee
    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    console.log(`Checking for tasks due between ${now.toISOString()} and ${in24Hours.toISOString()}`);

    const { data: dueTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, title, due_date, assignee_id')
      .not('assignee_id', 'is', null)
      .not('status', 'eq', 'done')
      .gte('due_date', now.toISOString().split('T')[0])
      .lte('due_date', in24Hours.toISOString().split('T')[0]);

    if (tasksError) {
      console.error('Error fetching tasks:', tasksError);
      throw tasksError;
    }

    console.log(`Found ${dueTasks?.length || 0} tasks due within 24 hours`);

    if (!dueTasks || dueTasks.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No tasks due soon', notificationsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check which notifications already exist to avoid duplicates
    const taskIds = dueTasks.map(t => t.id);
    const { data: existingNotifications, error: notifError } = await supabase
      .from('notifications')
      .select('task_id, user_id')
      .in('task_id', taskIds)
      .eq('type', 'task_due_soon')
      .gte('created_at', new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString());

    if (notifError) {
      console.error('Error checking existing notifications:', notifError);
      throw notifError;
    }

    // Create a set of existing notification keys for fast lookup
    const existingKeys = new Set(
      (existingNotifications || []).map(n => `${n.task_id}-${n.user_id}`)
    );

    // Filter out tasks that already have recent notifications
    const tasksNeedingNotification = dueTasks.filter(
      task => !existingKeys.has(`${task.id}-${task.assignee_id}`)
    );

    console.log(`${tasksNeedingNotification.length} tasks need new notifications`);

    if (tasksNeedingNotification.length === 0) {
      return new Response(
        JSON.stringify({ message: 'All due tasks already notified', notificationsCreated: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for each task
    const notifications = tasksNeedingNotification.map(task => ({
      user_id: task.assignee_id,
      task_id: task.id,
      type: 'task_due_soon',
      title: 'Task Due Soon',
      message: `"${task.title}" is due ${task.due_date === now.toISOString().split('T')[0] ? 'today' : 'tomorrow'}`,
      is_read: false,
    }));

    const { data: createdNotifications, error: insertError } = await supabase
      .from('notifications')
      .insert(notifications)
      .select();

    if (insertError) {
      console.error('Error creating notifications:', insertError);
      throw insertError;
    }

    console.log(`Created ${createdNotifications?.length || 0} due-soon notifications`);

    return new Response(
      JSON.stringify({
        message: 'Due task notifications created',
        notificationsCreated: createdNotifications?.length || 0,
        tasks: tasksNeedingNotification.map(t => ({ id: t.id, title: t.title })),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in check-due-tasks:', errorMessage);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
