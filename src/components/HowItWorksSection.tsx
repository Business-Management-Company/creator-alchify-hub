import { Upload, Wand2, Share, Sparkles } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload Your Raw Content",
    description: "Drop in your video, audio, or recording. We support all major formats, up to 4K quality.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "Refiner AI Works Its Magic",
    description: "Auto-transcribe, remove fillers, sync captions, clean audio — all with full transparency. See raw vs. refined side-by-side.",
  },
  {
    number: "03",
    icon: Sparkles,
    title: "Review & Refine",
    description: "Every edit is reversible. You stay in control of the final cut. No locked black boxes.",
  },
  {
    number: "04",
    icon: Share,
    title: "Publish Everywhere",
    description: "Export optimized content for every platform with one click. Automatic compliance with TikTok, YouTube, IG rules.",
  },
];

const HowItWorksSection = () => {
  return (
    <section id="how-it-works" className="py-24 bg-card/50 relative overflow-hidden">
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }} />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">How It Works</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            <span className="gradient-text">Less Grind</span>, More Shine
          </h2>
          <p className="text-muted-foreground text-lg">
            No complex editing software. No steep learning curve. Just create and let Alchify handle the rest.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 max-w-6xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0" />
              )}

              <div className="relative text-center p-6">
                {/* Step number */}
                <div className="text-5xl font-bold text-primary/20 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary">
                  <step.icon className="h-7 w-7 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-lg font-semibold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground text-sm">
                  {step.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
