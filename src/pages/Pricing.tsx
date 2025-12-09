import { useState } from 'react';
import { Helmet } from "react-helmet-async";
import { Check, Zap, HardDrive, Mic, Video, Radio, Users, Crown, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { usePricingPlans, useUserPlan, usePlanLimits } from '@/hooks/usePricing';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function Pricing() {
  const [annual, setAnnual] = useState(false);
  const { data: plans, isLoading } = usePricingPlans();
  const { data: subscription } = useUserPlan();
  const { plan: currentPlan } = usePlanLimits();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSelectPlan = (planId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    if (planId === 'enterprise') {
      toast({
        title: "Contact Sales",
        description: "Our team will reach out to discuss your enterprise needs.",
      });
      return;
    }

    // Demo: show success toast
    toast({
      title: "Plan Selected",
      description: `You've selected the ${plans?.find(p => p.id === planId)?.name} plan. Payment integration coming soon!`,
    });
  };

  const getPrice = (price: number) => {
    if (price === 0) return 'Free';
    if (price >= 2000) return 'Custom';
    const finalPrice = annual ? Math.round(price * 0.8) : price;
    return `$${finalPrice}`;
  };

  const getPlanIcon = (planId: string) => {
    const icons: Record<string, React.ReactNode> = {
      free: <Zap className="h-5 w-5" />,
      starter: <Mic className="h-5 w-5" />,
      creator: <Video className="h-5 w-5" />,
      pro: <Crown className="h-5 w-5" />,
      power_user: <Radio className="h-5 w-5" />,
      studio: <Users className="h-5 w-5" />,
      enterprise: <Building2 className="h-5 w-5" />
    };
    return icons[planId] || <Zap className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen flex items-center justify-center pt-16">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Helmet>
        <title>Pricing - Alchify</title>
        <meta
          name="description"
          content="Simple, transparent pricing for Alchify. Start free and scale as you grow."
        />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-24 pb-16 px-4">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Start free and scale as you grow. All plans include our core AI-powered tools.
          </p>

          {/* Annual Toggle */}
          <div className="flex items-center justify-center gap-3">
            <Label htmlFor="annual" className={!annual ? 'font-semibold' : 'text-muted-foreground'}>
              Monthly
            </Label>
            <Switch id="annual" checked={annual} onCheckedChange={setAnnual} />
            <Label htmlFor="annual" className={annual ? 'font-semibold' : 'text-muted-foreground'}>
              Annual
            </Label>
            {annual && (
              <Badge variant="secondary" className="ml-2">Save 20%</Badge>
            )}
          </div>
        </div>

        {/* Plans Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {plans?.slice(0, 4).map((plan) => (
            <Card 
              key={plan.id}
              className={`relative flex flex-col ${
                plan.is_popular 
                  ? 'border-primary shadow-lg shadow-primary/20 scale-105' 
                  : ''
              }`}
            >
              {plan.is_popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <Badge className="bg-primary text-primary-foreground">
                    Best Value
                  </Badge>
                </div>
              )}

              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`p-2 rounded-lg ${plan.is_popular ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}>
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{getPrice(plan.price)}</span>
                  {plan.price > 0 && plan.price < 2000 && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Limits */}
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.storage_gb === 'custom' ? 'Custom' : `${plan.storage_gb} GB`} storage</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Mic className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.recording_hours === 'unlimited' ? 'Unlimited' : `${plan.recording_hours} hrs`} recording</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Video className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.livestream_hours === 'unlimited' ? 'Unlimited' : `${plan.livestream_hours} hrs`} streaming</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Radio className="h-4 w-4 text-muted-foreground" />
                    <span>{plan.podcasts === 'unlimited' ? 'Unlimited' : plan.podcasts} podcast{plan.podcasts !== '1' ? 's' : ''}</span>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant={plan.is_popular ? 'default' : 'outline'}
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={currentPlan?.id === plan.id}
                >
                  {currentPlan?.id === plan.id ? 'Current Plan' : plan.price === 0 ? 'Get Started' : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* Higher Tier Plans */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {plans?.slice(4).map((plan) => (
            <Card key={plan.id} className="flex flex-col">
              <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                  <div className="p-2 rounded-lg bg-muted">
                    {getPlanIcon(plan.id)}
                  </div>
                  <CardTitle>{plan.name}</CardTitle>
                </div>
                <div className="mt-2">
                  <span className="text-3xl font-bold">{getPrice(plan.price)}</span>
                  {plan.price > 0 && plan.price < 2000 && (
                    <span className="text-muted-foreground">/mo</span>
                  )}
                </div>
                <CardDescription className="mt-2">
                  {plan.id === 'power_user' && 'For serious content production'}
                  {plan.id === 'studio' && 'For teams, agencies, studios'}
                  {plan.id === 'enterprise' && 'For networks and large organizations'}
                </CardDescription>
              </CardHeader>

              <CardContent className="flex-1">
                {/* Limits */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-lg font-semibold">
                      {plan.storage_gb === 'custom' ? '10TB+' : `${parseInt(plan.storage_gb) >= 1000 ? `${parseInt(plan.storage_gb)/1000}TB` : `${plan.storage_gb}GB`}`}
                    </div>
                    <div className="text-xs text-muted-foreground">Storage</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-lg font-semibold">
                      {plan.recording_hours === 'unlimited' ? '∞' : plan.recording_hours}
                    </div>
                    <div className="text-xs text-muted-foreground">Recording</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-lg font-semibold">
                      {plan.livestream_hours === 'unlimited' ? '∞' : plan.livestream_hours}
                    </div>
                    <div className="text-xs text-muted-foreground">Streaming</div>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <div className="text-lg font-semibold">
                      {plan.podcasts === 'unlimited' ? '∞' : plan.podcasts}
                    </div>
                    <div className="text-xs text-muted-foreground">Podcasts</div>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-2">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>{feature}</span>
                    </div>
                  ))}
                  {plan.team_members && (
                    <div className="flex items-start gap-2 text-sm">
                      <Users className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                      <span>Up to {plan.team_members} team members</span>
                    </div>
                  )}
                </div>
              </CardContent>

              <CardFooter>
                <Button 
                  className="w-full"
                  variant="outline"
                  onClick={() => handleSelectPlan(plan.id)}
                  disabled={currentPlan?.id === plan.id}
                >
                  {currentPlan?.id === plan.id ? 'Current Plan' : plan.id === 'enterprise' ? 'Contact Sales' : 'Upgrade'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>

        {/* FAQ or Trust */}
        <div className="mt-16 text-center">
          <p className="text-muted-foreground">
            All plans include a 14-day free trial. No credit card required to start.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Questions? <button className="text-primary hover:underline">Contact our sales team</button>
          </p>
        </div>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}
