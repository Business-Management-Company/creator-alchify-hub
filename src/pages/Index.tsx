import { Helmet } from "react-helmet-async";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import FeaturesSection from "@/components/FeaturesSection";
import HowItWorksSection from "@/components/HowItWorksSection";
import CreatorsSection from "@/components/CreatorsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import { WelcomeVideoModal } from "@/components/WelcomeVideoModal";

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
          <FeaturesSection />
          <HowItWorksSection />
          <CreatorsSection />
          <CTASection />
        </main>
        <Footer />
      </div>
      
      {/* Welcome video popup - shows after 5 seconds for first-time visitors */}
      <WelcomeVideoModal delay={5000} videoPath="welcome.mp4" />
    </>
  );
};

export default Index;
