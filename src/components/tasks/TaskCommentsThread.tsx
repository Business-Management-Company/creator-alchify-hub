import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useTaskComments, useAddComment } from '@/hooks/useTasks';
import { formatDistanceToNow } from 'date-fns';
import { Loader2, Send } from 'lucide-react';

interface TaskCommentsThreadProps {
  taskId: string;
}

export function TaskCommentsThread({ taskId }: TaskCommentsThreadProps) {
  const [newComment, setNewComment] = useState('');
  const { data: comments = [], isLoading } = useTaskComments(taskId);
  const addComment = useAddComment();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    
    await addComment.mutateAsync({ taskId, body: newComment.trim() });
    setNewComment('');
  };

  return (
    <div className="space-y-4">
      <h3 className="font-medium text-sm">Comments</h3>
      
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </div>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-2">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="h-8 w-8">
                <AvatarImage src={comment.author?.avatar_url || undefined} />
                <AvatarFallback className="text-xs">
                  {(comment.author?.display_name || 'U')[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {comment.author?.display_name || 'Unknown'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm text-foreground mt-1 whitespace-pre-wrap">
                  {comment.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          placeholder="Add an update or note for the team..."
          className="min-h-[60px] resize-none"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={addComment.isPending || !newComment.trim()}
        >
          {addComment.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </form>
    </div>
  );
}
