import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Newspaper, TrendingUp, AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

type BriefAudience = 'ceo' | 'board' | 'investor' | 'creator';

interface Insight {
  headline: string;
  detail: string;
  source: string;
  sentiment: 'positive' | 'negative' | 'neutral';
}

interface CompetitorUpdate {
  competitor: string;
  update: string;
  impact: string;
}

interface MarketSignal {
  signal: string;
  relevance: string;
}

interface ActionItem {
  item: string;
  priority: 'high' | 'medium' | 'low';
}

interface DailyBrief {
  id: string;
  brief_date: string;
  audience: BriefAudience;
  title: string;
  summary: string;
  insights: Insight[];
  competitor_updates: CompetitorUpdate[];
  market_signals: MarketSignal[];
  action_items: ActionItem[];
  created_at: string;
}

interface DailyBriefViewerProps {
  defaultAudience?: BriefAudience;
}

export function DailyBriefViewer({ defaultAudience = 'creator' }: DailyBriefViewerProps) {
  const { user } = useAuth();
  const [briefs, setBriefs] = useState<Record<BriefAudience, DailyBrief | null>>({
    ceo: null,
    board: null,
    investor: null,
    creator: null,
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<BriefAudience>(defaultAudience);

  useEffect(() => {
    if (user) {
      fetchTodaysBriefs();
    }
  }, [user]);

  const fetchTodaysBriefs = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('daily_briefs')
        .select('*')
        .eq('brief_date', today);

      if (error) throw error;

      const briefsMap: Record<BriefAudience, DailyBrief | null> = {
        ceo: null,
        board: null,
        investor: null,
        creator: null,
      };

      (data || []).forEach((row) => {
        const brief: DailyBrief = {
          id: row.id,
          brief_date: row.brief_date,
          audience: row.audience as BriefAudience,
          title: row.title,
          summary: row.summary,
          insights: (row.insights as unknown as Insight[]) || [],
          competitor_updates: (row.competitor_updates as unknown as CompetitorUpdate[]) || [],
          market_signals: (row.market_signals as unknown as MarketSignal[]) || [],
          action_items: (row.action_items as unknown as ActionItem[]) || [],
          created_at: row.created_at,
        };
        briefsMap[brief.audience] = brief;
      });

      setBriefs(briefsMap);
    } catch (err) {
      console.error('Error fetching briefs:', err);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative': return 'bg-red-500/10 text-red-500 border-red-500/20';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-500/10 text-red-500';
      case 'medium': return 'bg-amber-500/10 text-amber-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const brief = briefs[activeTab];

  if (loading) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Newspaper className="h-5 w-5 text-primary" />
            <CardTitle className="text-lg">Daily Brief</CardTitle>
          </div>
          <Badge variant="outline" className="text-xs">
            {format(new Date(), 'MMM d, yyyy')}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as BriefAudience)}>
          <TabsList className="grid w-full grid-cols-4 mb-4">
            <TabsTrigger value="creator" className="text-xs">Creator</TabsTrigger>
            <TabsTrigger value="ceo" className="text-xs">CEO</TabsTrigger>
            <TabsTrigger value="investor" className="text-xs">Investor</TabsTrigger>
            <TabsTrigger value="board" className="text-xs">Board</TabsTrigger>
          </TabsList>

          {!brief ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No brief available for today yet.</p>
              <p className="text-xs mt-1">Briefs are generated daily at 6:00 AM.</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px] pr-3">
              <div className="space-y-4">
                {/* Title & Summary */}
                <div>
                  <h3 className="font-semibold text-base mb-1">{brief.title}</h3>
                  <p className="text-sm text-muted-foreground">{brief.summary}</p>
                </div>

                {/* Key Insights */}
                {brief.insights?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <TrendingUp className="h-4 w-4" />
                      Key Insights
                    </h4>
                    <div className="space-y-2">
                      {brief.insights.map((insight, i) => (
                        <div key={i} className="p-2 rounded-lg bg-muted/50 text-sm">
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{insight.headline}</span>
                            <Badge variant="outline" className={`text-xs ${getSentimentColor(insight.sentiment)}`}>
                              {insight.sentiment}
                            </Badge>
                          </div>
                          <p className="text-muted-foreground text-xs">{insight.detail}</p>
                          <p className="text-xs text-primary/70 mt-1">Source: {insight.source}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Competitor Updates */}
                {brief.competitor_updates?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Competitor Updates</h4>
                    <div className="space-y-2">
                      {brief.competitor_updates.map((update, i) => (
                        <div key={i} className="p-2 rounded-lg border text-sm">
                          <div className="font-medium text-primary">{update.competitor}</div>
                          <p className="text-xs text-muted-foreground">{update.update}</p>
                          <p className="text-xs mt-1"><span className="text-foreground">Impact:</span> {update.impact}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Market Signals */}
                {brief.market_signals?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2">Market Signals</h4>
                    <div className="space-y-1">
                      {brief.market_signals.map((signal, i) => (
                        <div key={i} className="text-sm p-2 bg-muted/30 rounded">
                          <span className="font-medium">{signal.signal}</span>
                          <p className="text-xs text-muted-foreground">{signal.relevance}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Items */}
                {brief.action_items?.length > 0 && (
                  <div>
                    <h4 className="text-sm font-medium mb-2 flex items-center gap-1">
                      <CheckCircle2 className="h-4 w-4" />
                      Action Items
                    </h4>
                    <div className="space-y-1">
                      {brief.action_items.map((action, i) => (
                        <div key={i} className="flex items-center justify-between text-sm p-2 bg-muted/30 rounded">
                          <span>{action.item}</span>
                          <Badge className={`text-xs ${getPriorityColor(action.priority)}`}>
                            {action.priority}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </Tabs>
      </CardContent>
    </Card>
  );
}
