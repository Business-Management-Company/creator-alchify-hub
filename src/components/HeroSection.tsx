import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Calendar, Flame, Zap, Shield, Eye, Users } from "lucide-react";
import heroImage from "@/assets/hero-bg.png";
import DemoScheduleDialog from "./DemoScheduleDialog";

const HeroSection = () => {
  const [demoDialogOpen, setDemoDialogOpen] = useState(false);

  const pillars = [
    { icon: Shield, label: "Authenticity First", description: "No deepfakes. Real voices only." },
    { icon: Eye, label: "Full Transparency", description: "See every AI decision." },
    { icon: Users, label: "Creator Control", description: "You own the final cut." },
  ];

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Background */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="The Crucible for Creators"
          className="w-full h-full object-cover opacity-30"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/70 to-background" />
      </div>

      {/* Animated glow effects - gold/amber theme */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1.5s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '0.75s' }} />

      {/* Content */}
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8 animate-float">
            <Flame className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-primary">The Crucible for Creators</span>
          </div>

          {/* Main Heading */}
          <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 leading-tight">
            From{" "}
            <span className="gradient-text">Raw</span>
            {" "}to{" "}
            <span className="gradient-text">Refined</span>
          </h1>

          {/* Subheading */}
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-6">
            Alchify transforms your raw content into polished, platform-ready assets. 
            Our Refiner AI handles the grind — so you can focus on your story.
          </p>

          {/* Campaign tagline */}
          <p className="text-md font-medium text-primary mb-10">
            Less Grind, More Shine. For Humans, by Humans.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Button variant="hero" size="xl" className="gap-3">
              <Zap className="h-5 w-5" />
              Start Refining Free
            </Button>
            <Button variant="hero-outline" size="xl" className="gap-3" onClick={() => setDemoDialogOpen(true)}>
              <Calendar className="h-5 w-5" />
              Schedule a Demo
            </Button>
          </div>

          {/* Alchify's Way Pillars */}
          <div className="mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/15 border border-accent/30 mb-6">
              <span className="text-sm font-medium text-accent">Alchify's Way</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
            {pillars.map((pillar) => (
              <div key={pillar.label} className="bg-card/60 backdrop-blur-sm border border-border rounded-xl p-6 text-center hover:border-primary/50 transition-colors">
                <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mx-auto mb-4">
                  <pillar.icon className="h-6 w-6 text-primary" />
                </div>
                <div className="text-lg font-semibold text-foreground mb-1">
                  {pillar.label}
                </div>
                <div className="text-sm text-muted-foreground">{pillar.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <DemoScheduleDialog open={demoDialogOpen} onOpenChange={setDemoDialogOpen} />
    </section>
  );
};

export default HeroSection;
