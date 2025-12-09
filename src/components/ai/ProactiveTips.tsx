import { useState, useEffect } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { 
  Lightbulb, 
  X, 
  Wand2, 
  Scissors, 
  Upload, 
  TrendingUp,
  Sparkles,
  Video,
  Mic,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Tip {
  id: string;
  icon: React.ElementType;
  title: string;
  description: string;
  action?: string;
  actionPrompt?: string;
}

interface ProactiveTipsProps {
  onTipAction?: (prompt: string) => void;
}

export function ProactiveTips({ onTipAction }: ProactiveTipsProps) {
  const [currentTip, setCurrentTip] = useState<Tip | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [projectContext, setProjectContext] = useState({
    hasProject: false,
    hasTranscript: false,
    projectStatus: '',
  });
  const location = useLocation();
  const params = useParams();
  const { user } = useAuth();

  // Fetch project context
  useEffect(() => {
    const fetchContext = async () => {
      const projectId = params.projectId;
      if (!projectId || !user) {
        setProjectContext({ hasProject: false, hasTranscript: false, projectStatus: '' });
        return;
      }

      try {
        const { data: project } = await supabase
          .from('projects')
          .select('status')
          .eq('id', projectId)
          .single();

        const { data: transcript } = await supabase
          .from('transcripts')
          .select('id')
          .eq('project_id', projectId)
          .maybeSingle();

        setProjectContext({
          hasProject: !!project,
          hasTranscript: !!transcript,
          projectStatus: project?.status || '',
        });
      } catch (error) {
        console.error('Failed to fetch project context:', error);
      }
    };

    fetchContext();
  }, [params.projectId, user, location.pathname]);

  // Generate contextual tips
  useEffect(() => {
    const path = location.pathname;
    let tip: Tip | null = null;

    // Dashboard tips - only show on first visit (check localStorage)
    if (path === '/' || path.includes('/dashboard')) {
      const hasSeenDashboardTip = localStorage.getItem('alchify_seen_dashboard_tip');
      if (!hasSeenDashboardTip) {
        tip = {
          id: 'dashboard-start',
          icon: Upload,
          title: 'Ready to create?',
          description: 'Upload your first video or audio to start refining',
          action: 'Get started',
          actionPrompt: 'Help me upload my first content and walk me through the refinement process',
        };
      }
    }

    // Upload page tips
    if (path.includes('/upload')) {
      tip = {
        id: 'upload-formats',
        icon: FileText,
        title: 'Pro tip: Best formats',
        description: 'MP4, MOV work best. Keep files under 500MB for fastest processing',
        action: 'Learn more',
        actionPrompt: 'What are the best video formats and settings for optimal processing?',
      };
    }

    // Refiner page without transcript
    if (path.includes('/refiner') && !projectContext.hasTranscript && projectContext.hasProject) {
      tip = {
        id: 'refiner-transcribe',
        icon: Wand2,
        title: 'Auto-processing in progress',
        description: 'Your content is being transcribed and enhanced automatically',
      };
    }

    // Refiner page with transcript
    if (path.includes('/refiner') && projectContext.hasTranscript) {
      tip = {
        id: 'refiner-clips',
        icon: Scissors,
        title: 'Ready for clips!',
        description: 'Your transcript is ready. Create viral clips for TikTok, Reels, and Shorts',
        action: 'Create clips',
        actionPrompt: 'Analyze my transcript and suggest the top 5 viral moments for short-form clips',
      };
    }

    // Projects page tips
    if (path.includes('/projects')) {
      tip = {
        id: 'projects-batch',
        icon: TrendingUp,
        title: 'Batch processing available',
        description: 'Select multiple projects to process them all at once',
        action: 'Learn how',
        actionPrompt: 'How do I batch process multiple projects efficiently?',
      };
    }

    // Recording studio tips
    if (path.includes('/recording')) {
      tip = {
        id: 'recording-quality',
        icon: Mic,
        title: 'Optimize your setup',
        description: 'Check your audio levels and lighting before starting',
        action: 'Get tips',
        actionPrompt: 'Give me quick tips for getting the best recording quality with my current setup',
      };
    }

    // Library tips
    if (path.includes('/library')) {
      tip = {
        id: 'library-organize',
        icon: Video,
        title: 'Organize your content',
        description: 'Use folders to keep your media organized by project or theme',
        action: 'Learn more',
        actionPrompt: 'How can I best organize my media library for maximum productivity?',
      };
    }

    // Only show tip if not dismissed
    if (tip && !dismissed.has(tip.id)) {
      setCurrentTip(tip);
    } else {
      setCurrentTip(null);
    }
  }, [location.pathname, projectContext, dismissed]);

  const handleDismiss = () => {
    if (currentTip) {
      // Mark dashboard tip as permanently seen
      if (currentTip.id === 'dashboard-start') {
        localStorage.setItem('alchify_seen_dashboard_tip', 'true');
      }
      setDismissed(prev => new Set([...prev, currentTip.id]));
      setCurrentTip(null);
    }
  };

  const handleAction = () => {
    if (currentTip?.actionPrompt && onTipAction) {
      onTipAction(currentTip.actionPrompt);
      handleDismiss();
    }
  };

  if (!currentTip) return null;

  const Icon = currentTip.icon;

  return (
    <div
      className={cn(
        "fixed bottom-24 right-6 z-40 max-w-xs",
        "bg-primary text-primary-foreground rounded-xl shadow-lg",
        "animate-in slide-in-from-bottom-5 fade-in duration-300"
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-primary-foreground/20 text-primary-foreground flex-shrink-0">
            <Icon className="h-5 w-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-medium text-primary-foreground text-sm">
                {currentTip.title}
              </h4>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-primary-foreground/20 rounded-md transition-colors flex-shrink-0"
              >
                <X className="h-4 w-4 text-primary-foreground/80" />
              </button>
            </div>
            <p className="text-xs text-primary-foreground/80 mt-1">
              {currentTip.description}
            </p>
            {currentTip.action && (
              <button
                onClick={handleAction}
                className={cn(
                  "mt-3 flex items-center gap-1.5 text-xs font-medium",
                  "text-primary-foreground hover:text-primary-foreground/90 transition-colors"
                )}
              >
                <Sparkles className="h-3.5 w-3.5" />
                {currentTip.action}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
