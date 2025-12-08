import { TenantConfig } from '@/types/tenant';

export const alchifyConfig: TenantConfig = {
  id: 'alchify',
  name: 'Alchify',
  tagline: 'The Crucible for Creators',
  domain: 'alchifydemo.com',
  
  branding: {
    logo: '/assets/alchify/logo.svg',
    logoMark: '/assets/alchify/mark.svg',
    favicon: '/assets/alchify/favicon.ico',
  },
  
  modules: {
    studio: true,
    refiner: true,
    transcription: true,
    clipGenerator: true,
    dashboard: true,
    analytics: true,
    integrations: true,
    podcasts: false,
    meetings: false,
    events: false,
    crm: false,
    newsletter: false,
    monetization: false,
  },
  
  navigation: {
    layout: 'sidebar',
    items: [
      { id: 'dashboard', label: 'Dashboard', icon: 'LayoutDashboard', path: '/dashboard' },
      { id: 'upload', label: 'Upload', icon: 'Upload', path: '/upload' },
      { id: 'projects', label: 'Projects', icon: 'FolderOpen', path: '/projects' },
      { id: 'refiner', label: 'Refiner Studio', icon: 'Wand2', path: '/refiner' },
      { id: 'exports', label: 'Exports', icon: 'Download', path: '/exports' },
      { divider: true },
      { id: 'integrations', label: 'Integrations', icon: 'Plug', path: '/integrations' },
      { id: 'analytics', label: 'Analytics', icon: 'BarChart3', path: '/analytics' },
      { id: 'settings', label: 'Settings', icon: 'Settings', path: '/settings' },
    ],
  },
  
  aiAgent: {
    name: 'Refiner AI',
    persona: 'alchify-refiner',
    avatar: '/assets/alchify/refiner-ai.svg',
    greeting: "Hey! I'm Refiner AI — ready to transform your raw content into polished, platform-ready assets. What are we working on today?",
    capabilities: [
      'transcription',
      'filler-removal',
      'caption-sync',
      'format-conversion',
      'noise-reduction',
      'export-guidance',
    ],
    ui: 'slide-out',
  },
  
  features: {
    deepfakeProtection: true,
    blockchainCertification: false,
    factChecking: false,
    translations: false,
    aiDisclosure: true,
    watermarking: true,
  },
  
  auth: {
    providers: ['email', 'google'],
    requireEmailVerification: false,
    allowSignup: true,
  },
};

export function getTenantConfig(): TenantConfig {
  return alchifyConfig;
}
