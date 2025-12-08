export interface TenantConfig {
  id: string;
  name: string;
  tagline: string;
  domain: string;
  
  branding: {
    logo: string;
    logoMark: string;
    favicon: string;
  };
  
  modules: Record<string, boolean>;
  
  navigation: {
    layout: 'sidebar' | 'topbar' | 'hybrid';
    items: NavItem[];
  };
  
  aiAgent: {
    name: string;
    persona: string;
    avatar: string;
    greeting: string;
    capabilities: string[];
    ui: 'slide-out' | 'modal' | 'inline' | 'page';
  };
  
  features: Record<string, boolean>;
  
  auth: {
    providers: ('email' | 'google' | 'github' | 'apple')[];
    requireEmailVerification: boolean;
    allowSignup: boolean;
  };
}

export interface NavItem {
  id?: string;
  label?: string;
  icon?: string;
  path?: string;
  divider?: boolean;
}
