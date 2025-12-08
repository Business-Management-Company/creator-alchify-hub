import { Clock, Ban, Accessibility, Shield, LayoutDashboard } from "lucide-react";

const painPoints = [
  {
    icon: Clock,
    pain: "Losing hours to repetitive edits",
    solution: "Refiner automates filler cuts, caption sync, and resizing automatically.",
  },
  {
    icon: Ban,
    pain: "Getting shadow-banned for wrong formatting",
    solution: "Auto-optimize for platform rules. No more sizing or caption errors.",
  },
  {
    icon: Accessibility,
    pain: "Lack of accessibility tools",
    solution: "ADA-compliant captions, alt text, and translations auto-generated.",
  },
  {
    icon: Shield,
    pain: "IP theft and content scraping",
    solution: "Embedded metadata and watermarks prove content origin.",
  },
  {
    icon: LayoutDashboard,
    pain: "Overwhelmed by tool sprawl",
    solution: "One dashboard connects everything. No more juggling 10 apps.",
  },
];

const CreatorsSection = () => {
  return (
    <section id="creators" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-accent/5 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Built for Creators</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            We Fix What{" "}
            <span className="gradient-text">Creators Hate</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            We talked to hundreds of creators. Here's what they struggle with — and how Alchify solves it.
          </p>
        </div>

        {/* Pain Points Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {painPoints.map((item, index) => (
            <div
              key={index}
              className="group relative p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300"
            >
              {/* Icon */}
              <div className="w-12 h-12 rounded-xl bg-destructive/10 flex items-center justify-center mb-4">
                <item.icon className="h-6 w-6 text-destructive" />
              </div>

              {/* Pain */}
              <p className="text-sm text-destructive/80 font-medium mb-2">
                😤 {item.pain}
              </p>

              {/* Solution */}
              <p className="text-foreground font-medium">
                ✨ {item.solution}
              </p>

              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
            </div>
          ))}
        </div>

        {/* Quote */}
        <div className="mt-16 max-w-3xl mx-auto text-center">
          <blockquote className="text-2xl font-serif italic text-muted-foreground">
            "People don't buy products, they buy how you make them feel."
          </blockquote>
          <p className="mt-4 text-primary font-medium">
            That's why Alchify respects creators first.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
