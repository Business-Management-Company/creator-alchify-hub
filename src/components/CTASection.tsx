import { Button } from "@/components/ui/button";
import { Zap, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const CTASection = () => {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Animated background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/15 via-background to-accent/15" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-primary/10 rounded-full blur-3xl animate-pulse-glow" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Content */}
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
            Ready to{" "}
            <span className="gradient-text">Alchify</span>
            {" "}Your Content?
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-4">
            Join creators who are saving hours every week and growing their audience with authentic, AI-refined content.
          </p>
          <p className="text-lg font-medium text-primary mb-10">
            Alchify Your Voice. From Raw to Refined.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
            <Button variant="hero" size="xl" className="gap-3" asChild>
              <Link to="/auth">
                <Zap className="h-5 w-5" />
                Start Refining Free
              </Link>
            </Button>
            <Button variant="hero-outline" size="xl" className="gap-3" asChild>
              <Link to="/transparency">
                Learn Alchify's Way
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
          </div>

          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>No deepfakes, ever</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>You own your content</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
