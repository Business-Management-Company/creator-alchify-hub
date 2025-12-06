import { Sparkles } from "lucide-react";

const footerLinks = {
  Product: ["Features", "Pricing", "Integrations", "API", "Changelog"],
  Company: ["About", "Blog", "Careers", "Press", "Contact"],
  Resources: ["Documentation", "Help Center", "Community", "Templates", "Tutorials"],
  Legal: ["Privacy", "Terms", "Security", "Cookies"],
};

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <a href="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">Alchify</span>
            </a>
            <p className="text-muted-foreground mb-6 max-w-xs">
              The AI-powered platform for content creators. Record, stream, and transform your content.
            </p>
            <div className="flex gap-4">
              {["Twitter", "Discord", "YouTube"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          {Object.entries(footerLinks).map(([category, links]) => (
            <div key={category}>
              <h4 className="font-semibold text-foreground mb-4">{category}</h4>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            © 2024 Alchify. All rights reserved.
          </p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Made with</span>
            <span className="text-primary">♥</span>
            <span>for creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
