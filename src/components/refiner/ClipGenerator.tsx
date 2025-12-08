import { useState } from 'react';
import { Scissors, Loader2, Sparkles, Download, Clock, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Clip {
  title: string;
  startTime: string;
  endTime: string;
  hook: string;
  platforms: string[];
  score: number;
}

interface ClipGeneratorProps {
  projectId: string;
  transcriptContent: string | null;
  onClipGenerated?: () => void;
}

const platformColors: Record<string, string> = {
  tiktok: 'bg-pink-500/20 text-pink-400 border-pink-500/30',
  reels: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  shorts: 'bg-red-500/20 text-red-400 border-red-500/30',
  linkedin: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
};

export function ClipGenerator({ projectId, transcriptContent, onClipGenerated }: ClipGeneratorProps) {
  const [clips, setClips] = useState<Clip[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateClips = async () => {
    if (!transcriptContent) {
      toast({
        title: 'No transcript',
        description: 'Generate a transcript first before creating clips.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    try {
      const { data, error } = await supabase.functions.invoke('generate-clips', {
        body: { projectId, transcriptContent }
      });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setClips(data.clips || []);

      toast({
        title: 'Clips generated!',
        description: `Found ${data.clips?.length || 0} potential clips from your content.`,
      });

      onClipGenerated?.();
    } catch (error) {
      console.error('Clip generation error:', error);
      toast({
        title: 'Generation failed',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return 'text-green-400';
    if (score >= 6) return 'text-yellow-400';
    return 'text-muted-foreground';
  };

  if (clips.length === 0) {
    return (
      <div className="bg-card/50 border border-border rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4">
          <Scissors className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI Clip Generator</h2>
        </div>

        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-4 rounded-full bg-primary/10 mb-4">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
          <h3 className="font-medium text-foreground mb-2">Generate Viral Clips</h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-sm">
            AI will analyze your transcript and suggest the most engaging moments for social media clips.
          </p>
          <Button
            variant="hero"
            onClick={generateClips}
            disabled={isGenerating || !transcriptContent}
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Generate Clips
              </>
            )}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card/50 border border-border rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Scissors className="h-5 w-5 text-primary" />
          <h2 className="font-semibold text-foreground">AI Clips</h2>
          <Badge variant="secondary">{clips.length} clips</Badge>
        </div>
        <Button variant="outline" size="sm" onClick={generateClips} disabled={isGenerating}>
          {isGenerating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              <Sparkles className="mr-2 h-3 w-3" />
              Regenerate
            </>
          )}
        </Button>
      </div>

      <div className="space-y-3 max-h-[400px] overflow-y-auto">
        {clips.map((clip, index) => (
          <div
            key={index}
            className="p-4 bg-background/50 rounded-lg border border-border hover:border-primary/30 transition-colors"
          >
            <div className="flex items-start justify-between mb-2">
              <h4 className="font-medium text-foreground">{clip.title}</h4>
              <div className={`flex items-center gap-1 ${getScoreColor(clip.score)}`}>
                <TrendingUp className="h-3 w-3" />
                <span className="text-sm font-medium">{clip.score}/10</span>
              </div>
            </div>

            <p className="text-sm text-muted-foreground mb-3">{clip.hook}</p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  {clip.startTime} - {clip.endTime}
                </div>
                <div className="flex gap-1">
                  {clip.platforms.map((platform) => (
                    <span
                      key={platform}
                      className={`text-xs px-2 py-0.5 rounded-full border ${platformColors[platform] || 'bg-muted text-muted-foreground'}`}
                    >
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              <Button variant="ghost" size="sm" className="text-primary">
                <Download className="mr-1 h-3 w-3" />
                Export
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}