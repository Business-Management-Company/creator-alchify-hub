import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, Zap, Crown } from 'lucide-react';
import { usePricingPlans, usePlanLimits } from '@/hooks/usePricing';
import { useNavigate } from 'react-router-dom';

interface UpgradeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason?: string;
  requiredPlan?: string;
}

export function UpgradeModal({ open, onOpenChange, reason, requiredPlan }: UpgradeModalProps) {
  const navigate = useNavigate();
  const { data: plans } = usePricingPlans();
  const { plan: currentPlan } = usePlanLimits();

  const suggestedPlan = plans?.find(p => p.id === requiredPlan) || plans?.find(p => p.id === 'pro');

  const handleViewPlans = () => {
    onOpenChange(false);
    navigate('/pricing');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 rounded-full bg-primary/10">
              <Crown className="h-5 w-5 text-primary" />
            </div>
            <DialogTitle>Upgrade Required</DialogTitle>
          </div>
          <DialogDescription>
            {reason || "You've reached a limit on your current plan. Upgrade to continue."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Current Plan */}
          <div className="p-3 rounded-lg bg-muted/50 border">
            <div className="text-sm text-muted-foreground mb-1">Current Plan</div>
            <div className="font-semibold">{currentPlan?.name || 'Free'}</div>
          </div>

          {/* Suggested Plan */}
          {suggestedPlan && (
            <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">{suggestedPlan.name}</span>
                    {suggestedPlan.is_popular && (
                      <Badge variant="default" className="text-xs">Best Value</Badge>
                    )}
                  </div>
                  <div className="text-2xl font-bold mt-1">
                    ${suggestedPlan.price}<span className="text-sm font-normal text-muted-foreground">/mo</span>
                  </div>
                </div>
                <Zap className="h-8 w-8 text-primary" />
              </div>

              <div className="space-y-2">
                {suggestedPlan.features.slice(0, 4).map((feature, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Maybe Later
          </Button>
          <Button onClick={handleViewPlans} className="flex-1">
            View All Plans
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
