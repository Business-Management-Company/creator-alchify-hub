import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Sparkles, Zap, Mic, Users, DollarSign, TrendingUp } from "lucide-react";
import heroImage from "@/assets/hero-bg.png";
import DemoScheduleDialog from "./DemoScheduleDialog";

const HeroSection = () => {
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  const creatorEconomyStats = [
    { value: "3M+", label: "Active Podcasts Worldwide", icon: Mic, color: "text-orange-500" },
    { value: "50M+", label: "Creators Earning Online", icon: Users, color: "text-cyan-500" },
    { value: "$250B+", label: "Creator Economy Market Size", icon: DollarSign, color: "text-emerald-500" },
    { value: "93%", label: "Consumers Trust Creators Over Ads", icon: TrendingUp, color: "text-pink-500" },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Futuristic content creation"
          className="w-full h-full object-cover opacity-40"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/80 to-background" />
      </div>

      {/* Animated glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-accent/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '0.75s' }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted/50 border border-border mb-8 animate-float">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm text-muted-foreground">AI-Powered Post Production</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            Refine Your Media with{" "}
            <span className="gradient-text">Alchify</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            The one-stop platform for content creators. Record, stream, and transform your content with AI-powered post-production that creates viral clips in seconds.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="xl" className="gap-3">
              <Zap className="h-5 w-5" />
              Start Creating Free
            </Button>
            <Button variant="hero-outline" size="xl" className="gap-3" onClick={() => setDemoDialogOpen(true)}>
              <Calendar className="h-5 w-5" />
              Schedule a Demo
            </Button>
          </div>

          {/* Creator Economy Stats */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/20 border border-primary/30 mb-6">
              <span className="text-sm font-medium text-primary">The Opportunity</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold mb-8">
              The Creator Economy is <span className="gradient-text">Booming</span>
            </h2>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {creatorEconomyStats.map((stat) => (
              <div key={stat.label} className="bg-card/50 backdrop-blur-sm border border-border rounded-xl p-6 text-left">
                <div className={`w-12 h-12 rounded-xl ${stat.color} bg-current/10 flex items-center justify-center mb-4`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
                <div className={`text-2xl sm:text-3xl font-bold text-foreground mb-1`}>
                  {stat.value}
                </div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-6 h-10 rounded-full border-2 border-muted-foreground/30 flex justify-center pt-2">
          <div className="w-1.5 h-3 bg-primary rounded-full animate-pulse" />
        </div>
      </div>

      <DemoScheduleDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />
    </section>
  );
};

export default HeroSection;
