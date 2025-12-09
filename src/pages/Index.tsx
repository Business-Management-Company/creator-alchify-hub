import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CreatorsSection from "@/components/CreatorsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { WelcomeVideoSection } from "@/components/WelcomeVideoSection";

const Index = () => {
  return (
    <>
      <Helmet>
        <title>Alchify - AI-Powered Post Production for Content Creators</title>
        <meta
          name="description"
          content="Refine your media with Alchify, the one-stop platform for post production. Record, stream, and create AI clips that go viral."
        />
      </Helmet>
      <div className="min-h-screen bg-background text-foreground">
        <Navbar />
        <main>
          <HeroSection />
          <WelcomeVideoSection videoPath="Alchify_Content Gold.mp4" />
          <FeaturesSection />
          <HowItWorksSection />
          <CreatorsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Index;
