import { Flame } from "lucide-react";
import { Link } from "react-router-dom";

const footerLinks = {
  Product: [
    { name: "Features", href: "/#features" },
    { name: "How It Works", href: "/#how-it-works" },
    { name: "Pricing", href: "/pricing", isRoute: true },
    { name: "Integrations", href: "/integrations", isRoute: true },
  ],
  Company: [
    { name: "About", href: "/about", isRoute: true },
    { name: "Transparency", href: "/transparency", isRoute: true },
    { name: "Blog", href: "#" },
    { name: "Careers", href: "#" },
  ],
  Resources: [
    { name: "Help Center", href: "#" },
    { name: "Community", href: "#" },
    { name: "Tutorials", href: "#" },
    { name: "API", href: "#" },
  ],
  Legal: [
    { name: "Privacy", href: "#" },
    { name: "Terms", href: "#" },
    { name: "Security", href: "#" },
  ],
};

const Footer = () => {
  return (
    <footer className="py-16 border-t border-border bg-card/30">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Logo & Description */}
          <div className="lg:col-span-2">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="relative">
                <Flame className="h-8 w-8 text-primary" />
              </div>
              <span className="text-xl font-bold gradient-text">Alchify</span>
            </Link>
            <p className="text-muted-foreground mb-2 max-w-xs">
              The Crucible for Creators. Transform raw content into polished, platform-ready gold.
            </p>
            <p className="text-sm text-primary font-medium mb-6">
              For Humans, by Humans.
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
                  <li key={link.name}>
                    {link.isRoute ? (
                      <Link
                        to={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </Link>
                    ) : (
                      <a
                        href={link.href}
                        className="text-muted-foreground hover:text-foreground transition-colors"
                      >
                        {link.name}
                      </a>
                    )}
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
            <span className="text-primary">🔥</span>
            <span>for creators</span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
