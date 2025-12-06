import { Star, Quote } from "lucide-react";

const testimonials = [
  {
    name: "Alex Rivera",
    handle: "@alexcreates",
    avatar: "AR",
    content: "Alchify cut my editing time by 80%. The AI clips feature alone has doubled my engagement on TikTok.",
    role: "YouTuber • 2.5M Subscribers",
  },
  {
    name: "Sarah Chen",
    handle: "@sarahstreams",
    avatar: "SC",
    content: "Finally, a tool that understands content creators. The one-click streaming to multiple platforms is a game-changer.",
    role: "Twitch Partner • 500K Followers",
  },
  {
    name: "Marcus Thompson",
    handle: "@marcuspods",
    avatar: "MT",
    content: "The audio enhancement AI is unreal. My podcast sounds professionally produced without any extra work.",
    role: "Podcaster • Top 100 Charts",
  },
];

const CreatorsSection = () => {
  return (
    <section id="creators" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-accent/10 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-primary font-semibold text-sm uppercase tracking-wider">Creator Stories</span>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mt-4 mb-6">
            Loved by{" "}
            <span className="gradient-text">50,000+ Creators</span>
          </h2>
          <p className="text-muted-foreground text-lg">
            Join the community of creators who have transformed their workflow with Alchify.
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {testimonials.map((testimonial) => (
            <div
              key={testimonial.handle}
              className="p-6 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all duration-300 group"
            >
              {/* Quote icon */}
              <Quote className="h-8 w-8 text-primary/30 mb-4" />

              {/* Content */}
              <p className="text-foreground mb-6 leading-relaxed">
                "{testimonial.content}"
              </p>

              {/* Stars */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                ))}
              </div>

              {/* Author */}
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-semibold">
                  {testimonial.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{testimonial.name}</div>
                  <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Logos Section */}
        <div className="mt-20 text-center">
          <p className="text-muted-foreground mb-8">Trusted by creators from</p>
          <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
            {["YouTube", "Twitch", "TikTok", "Instagram", "X / Twitter", "Spotify"].map((platform) => (
              <span key={platform} className="text-xl font-semibold text-foreground">
                {platform}
              </span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CreatorsSection;
