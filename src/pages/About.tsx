import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Flame, Heart, Shield, Users, Sparkles, Target } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const values = [
    {
      icon: Shield,
      title: "Authenticity First",
      description: "No deepfakes, no impersonations, no AI that creates people who don't exist. We polish real creators — never replace them.",
    },
    {
      icon: Heart,
      title: "Creator Respect",
      description: "People don't buy products, they buy how you make them feel. We make sure creators feel respected and valued.",
    },
    {
      icon: Users,
      title: "For Humans, by Humans",
      description: "AI assists, humans decide. Every refinement is editable, reversible, and under your control.",
    },
    {
      icon: Sparkles,
      title: "Transparency Always",
      description: "No black boxes. See raw vs. refined side-by-side. Know exactly what AI touched and why.",
    },
  ];

  return (
    <>
      <Helmet>
        <title>About Alchify - The Crucible for Creators</title>
        <meta
          name="description"
          content="Learn about Alchify's mission to transform raw content into polished gold while protecting creator authenticity and rights."
        />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main className="pt-24">
          {/* Hero Section */}
          <section className="py-16 relative overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
            
            <div className="container mx-auto px-4 relative z-10">
              <div className="max-w-3xl mx-auto text-center">
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/30 mb-8">
                  <Flame className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Our Story</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                  The <span className="gradient-text">Crucible</span> for Creators
                </h1>
                
                <p className="text-xl text-muted-foreground mb-8">
                  Alchify was born from a simple frustration: creators spend more time on repetitive editing than actual creating. We're here to change that.
                </p>
              </div>
            </div>
          </section>

          {/* Mission Section */}
          <section className="py-16 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                  <div>
                    <h2 className="text-3xl font-bold mb-6">
                      Our <span className="gradient-text">Mission</span>
                    </h2>
                    <p className="text-muted-foreground mb-4">
                      We believe every creator deserves professional-quality tools without the professional-level complexity. Alchify's Refiner AI handles the grind — filler cuts, caption sync, format conversion — so you can focus on what matters: your story.
                    </p>
                    <p className="text-muted-foreground mb-6">
                      But we're not just another AI tool. We've built Alchify on a foundation of respect for creators, their authenticity, and their intellectual property.
                    </p>
                    <Button variant="hero" asChild>
                      <Link to="/transparency">Learn About Alchify's Way</Link>
                    </Button>
                  </div>
                  <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 border border-primary/30">
                    <Target className="h-12 w-12 text-primary mb-4" />
                    <h3 className="text-xl font-bold mb-2">Our Goal</h3>
                    <p className="text-muted-foreground">
                      Transform 1 million hours of raw creator content into polished, platform-ready assets — while keeping creators in full control.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Values Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  What We <span className="gradient-text">Stand For</span>
                </h2>
                <p className="text-muted-foreground">
                  These aren't just values on a wall. They're encoded into every feature we build.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {values.map((value) => (
                  <div
                    key={value.title}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center mb-4">
                      <value.icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{value.title}</h3>
                    <p className="text-muted-foreground">{value.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Ready to <span className="gradient-text">Join Us</span>?
                </h2>
                <p className="text-muted-foreground mb-8">
                  Start transforming your content today. No credit card required.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/auth">Start Refining Free</Link>
                  </Button>
                  <Button variant="hero-outline" size="lg" asChild>
                    <Link to="/pricing">View Pricing</Link>
                  </Button>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default About;
