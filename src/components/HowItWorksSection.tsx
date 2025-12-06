import { Upload, Wand2, Share } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Upload,
    title: "Upload or Record",
    description: "Import your existing footage or record directly in our cloud studio. Support for 4K and all major formats.",
  },
  {
    number: "02",
    icon: Wand2,
    title: "AI Does the Magic",
    description: "Our AI enhances audio, color grades, generates captions, and identifies the best moments for clips.",
  },
  {
    number: "03",
    icon: Share,
    title: "Publish Everywhere",
    description: "Export optimized content for every platform with one click. YouTube, TikTok, Instagram, X, and more.",
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
            Create in{" "}
            <span className="gradient-text">Three Simple Steps</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            No complex editing software. No steep learning curve. Just create.
          </p>
        </div>

        {/* Steps */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <div key={step.number} className="relative">
              {/* Connector line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute top-16 left-full w-full h-0.5 bg-gradient-to-r from-primary/50 to-transparent z-0" />
              )}

              <div className="relative text-center p-6">
                {/* Step number */}
                <div className="text-6xl font-bold text-muted/30 mb-4">
                  {step.number}
                </div>

                {/* Icon */}
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mx-auto mb-6 glow-primary">
                  <step.icon className="h-8 w-8 text-primary-foreground" />
                </div>

                {/* Content */}
                <h3 className="text-xl font-semibold mb-3 text-foreground">
                  {step.title}
                </h3>
                <p className="text-muted-foreground">
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
