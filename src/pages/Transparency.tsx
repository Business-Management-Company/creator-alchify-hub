import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { 
  Flame, 
  Shield, 
  Eye, 
  Award, 
  Users, 
  Lock, 
  Ban, 
  FileCheck, 
  Accessibility,
  Scale 
} from "lucide-react";
import { Link } from "react-router-dom";

const Transparency = () => {
  const principles = [
    {
      icon: Shield,
      title: "Authenticity First",
      points: [
        "No deepfakes, no impersonations, no AI-created people who don't exist",
        "Tools that polish and refine creators' real voices — never replace them",
        "Every output is traceable back to the original creator",
      ],
    },
    {
      icon: Eye,
      title: "Accuracy & No Hallucinations",
      points: [
        "Embedded fact-checking guardrails to prevent AI hallucinations",
        "Confidence scoring in transcriptions (see what's solid vs. uncertain)",
        "Never confidently makes things up or spreads misinformation",
      ],
    },
    {
      icon: Award,
      title: "Attribution & IP Protection",
      points: [
        "Automatic watermarking with invisible code in outputs",
        "Clear attribution systems so creators keep credit when content is reshared",
        "Metadata embedded proving content origin and ownership",
      ],
    },
    {
      icon: Scale,
      title: "Platform Respect",
      points: [
        "Automatic compliance with TikTok, YouTube, IG, and Spotify rules",
        "Less risk of takedowns from sizing or caption errors",
        "Adaptive formatting so content is always ready-to-post",
      ],
    },
    {
      icon: Users,
      title: "Creator Control",
      points: [
        "Every refinement is editable — no locked black box",
        "Side-by-side view of raw vs. refined, you stay in charge",
        "Final cut is always the creator's decision",
      ],
    },
    {
      icon: Ban,
      title: "No Exploitation of Creators",
      points: [
        "We will not scrape creators' content without consent",
        "Models trained on licensed, transparent data — not stolen IP",
        "Your content is yours. Period.",
      ],
    },
    {
      icon: FileCheck,
      title: "Transparency & Disclosure",
      points: [
        "Embedded disclosure tools if AI touched a piece",
        "Creators can choose to label AI-assisted content",
        "Full audit trail of every AI action taken",
      ],
    },
    {
      icon: Accessibility,
      title: "Accessibility by Default",
      points: [
        "ADA-compliant captions auto-generated",
        "Audio descriptions and alt text included",
        "Language localization available",
      ],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Alchify's Way - Our Transparency & Ethics Commitment</title>
        <meta
          name="description"
          content="Alchify's Way: Our commitment to authenticity, creator rights, and ethical AI. No deepfakes. Full transparency. Creator control always."
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
                  <span className="text-sm font-medium text-primary">Our Commitment</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold mb-6">
                  <span className="gradient-text">Alchify's Way</span>
                </h1>
                
                <p className="text-xl text-muted-foreground mb-4">
                  Protecting Creators and Raising Standards
                </p>
                
                <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                  This is our AI code of conduct. Every feature, every algorithm, every decision is guided by these principles. Because creators deserve better.
                </p>
              </div>
            </div>
          </section>

          {/* Quote Section */}
          <section className="py-12 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto text-center">
                <Lock className="h-12 w-12 text-primary mx-auto mb-6" />
                <blockquote className="text-2xl font-serif italic text-foreground mb-4">
                  "People don't buy products, they buy how you make them feel."
                </blockquote>
                <p className="text-primary font-medium">
                  So we make sure every creator feels respected, valued, and in control.
                </p>
              </div>
            </div>
          </section>

          {/* Principles Grid */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="text-center max-w-2xl mx-auto mb-12">
                <h2 className="text-3xl font-bold mb-4">
                  The <span className="gradient-text">8 Principles</span>
                </h2>
                <p className="text-muted-foreground">
                  These aren't suggestions — they're requirements. Built into every part of Alchify.
                </p>
              </div>

              <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
                {principles.map((principle) => (
                  <div
                    key={principle.title}
                    className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <principle.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-semibold mb-3">{principle.title}</h3>
                        <ul className="space-y-2">
                          {principle.points.map((point, idx) => (
                            <li key={idx} className="flex items-start gap-2 text-muted-foreground">
                              <span className="text-primary mt-1">•</span>
                              <span>{point}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Governance Section */}
          <section className="py-16 bg-card/50">
            <div className="container mx-auto px-4">
              <div className="max-w-3xl mx-auto">
                <div className="text-center mb-12">
                  <h2 className="text-3xl font-bold mb-4">
                    <span className="gradient-text">Governance</span> & Accountability
                  </h2>
                  <p className="text-muted-foreground">
                    We hold ourselves to the highest standards.
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="p-6 rounded-2xl bg-background border border-border">
                    <h3 className="text-lg font-semibold mb-2">Partner Vetting</h3>
                    <p className="text-muted-foreground">
                      Every partner and integration is vetted against Alchify's Way. We don't work with companies that exploit creators.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-background border border-border">
                    <h3 className="text-lg font-semibold mb-2">Leadership Accountability</h3>
                    <p className="text-muted-foreground">
                      Our leadership team is publicly committed to these principles. Any deviation is a violation of our core mission.
                    </p>
                  </div>
                  <div className="p-6 rounded-2xl bg-background border border-border">
                    <h3 className="text-lg font-semibold mb-2">Open Audit Trail</h3>
                    <p className="text-muted-foreground">
                      Every AI action is logged and auditable. Creators can see exactly what was changed and why.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* CTA Section */}
          <section className="py-16">
            <div className="container mx-auto px-4">
              <div className="max-w-2xl mx-auto text-center">
                <h2 className="text-3xl font-bold mb-4">
                  Questions About <span className="gradient-text">Our Ethics</span>?
                </h2>
                <p className="text-muted-foreground mb-8">
                  We're always happy to discuss our approach. Transparency starts with conversation.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button variant="hero" size="lg" asChild>
                    <Link to="/auth">Start Refining</Link>
                  </Button>
                  <Button variant="hero-outline" size="lg" asChild>
                    <Link to="/about">About Alchify</Link>
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

export default Transparency;
