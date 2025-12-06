import { Video, Wand2, Scissors, Share2, Mic, Sparkles } from "lucide-react";

const features = [
  {
    icon: Video,
    title: "Record & Stream",
    description: "Professional-grade recording studio with multi-platform streaming. Go live everywhere at once.",
    gradient: "from-primary to-accent",
  },
  {
    icon: Wand2,
    title: "AI Post-Production",
    description: "Let AI enhance your audio, color grade your videos, and remove backgrounds automatically.",
    gradient: "from-secondary to-primary",
  },
  {
    icon: Scissors,
    title: "Smart Clip Generation",
    description: "AI identifies viral moments and creates perfectly timed clips ready for social media.",
    gradient: "from-accent to-secondary",
  },
  {
    icon: Share2,
    title: "One-Click Distribution",
    description: "Publish to all platforms simultaneously with optimized formats for each network.",
    gradient: "from-primary to-secondary",
  },
  {
    icon: Mic,
    title: "Audio Enhancement",
    description: "Crystal clear audio with AI noise removal, voice enhancement, and dynamic normalization.",
    gradient: "from-secondary to-accent",
  },
  {
    icon: Sparkles,
    title: "Caption & Subtitle AI",
    description: "Auto-generate accurate captions in 100+ languages with perfect timing and styling.",
    gradient: "from-accent to-primary",
  },
];

const FeaturesSection = () => {
  return (
    <section id="features" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Features</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Everything You Need to{" "}
            <span className="gradient-text">Create Magic</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            From recording to viral distribution, Alchify handles every step of your content creation journey.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 hover:-translate-y-1"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon */}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="h-6 w-6 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold mb-2 text-foreground">
                {feature.title}
              </h3>
              <p className="text-muted-foreground">
                {feature.description}
              </p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
