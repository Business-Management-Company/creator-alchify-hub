import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { HardDrive, Mic, Video, Radio, Crown } from 'lucide-react';
import { usePlanLimits, useUserUsage } from '@/hooks/usePricing';
import { Link } from 'react-router-dom';

export function UsageIndicator() {
  const { plan, limits } = usePlanLimits();
  const { data: usage } = useUserUsage();

  // Demo data for visual appeal
  const demoUsage = {
    storage_used_gb: 12.5,
    recording_hours_used: 4.2,
    livestream_hours_used: 2.1,
    podcasts_count: 1
  };

  const currentUsage = usage?.storage_used_gb ? usage : demoUsage;

  const getPercentage = (used: number, limit: number | string): number => {
    if (limit === 'unlimited' || limit === 'custom') return 0;
    return Math.min((used / Number(limit)) * 100, 100);
  };

  const formatLimit = (value: number | string): string => {
    if (value === 'unlimited') return '∞';
    if (value === 'custom') return 'Custom';
    return String(value);
  };

  const usageItems = [
    {
      label: 'Storage',
      icon: HardDrive,
      used: currentUsage.storage_used_gb,
      limit: limits.storage_gb,
      unit: 'GB'
    },
    {
      label: 'Recording',
      icon: Mic,
      used: currentUsage.recording_hours_used,
      limit: limits.recording_hours,
      unit: 'hrs'
    },
    {
      label: 'Streaming',
      icon: Video,
      used: currentUsage.livestream_hours_used,
      limit: limits.livestream_hours,
      unit: 'hrs'
    },
    {
      label: 'Podcasts',
      icon: Radio,
      used: currentUsage.podcasts_count,
      limit: limits.podcasts,
      unit: ''
    }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Crown className="h-5 w-5 text-primary" />
            {plan?.name || 'Free'} Plan
          </CardTitle>
          <Button variant="outline" size="sm" asChild>
            <Link to="/pricing">Upgrade</Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {usageItems.map((item) => {
            const Icon = item.icon;
            const percentage = getPercentage(item.used, item.limit);
            const isUnlimited = item.limit === 'unlimited' || item.limit === 'custom';

            return (
              <div key={item.label} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </div>
                  <span className="font-medium">
                    {item.used.toFixed(1)}{item.unit} / {formatLimit(item.limit)}{!isUnlimited && item.unit}
                  </span>
                </div>
                {!isUnlimited && (
                  <Progress 
                    value={percentage} 
                    className={`h-2 ${percentage >= 90 ? '[&>div]:bg-destructive' : percentage >= 70 ? '[&>div]:bg-yellow-500' : ''}`}
                  />
                )}
                {isUnlimited && (
                  <div className="text-xs text-muted-foreground">Unlimited on your plan</div>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
