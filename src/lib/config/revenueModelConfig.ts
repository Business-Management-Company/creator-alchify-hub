/**
 * Revenue Model Configuration
 * Contains helper functions for calculating podcast analytics and revenue
 */

export const formatNumber = (num: number): string => {
  if (num >= 1_000_000) return (num / 1_000_000).toFixed(1) + 'M';
  if (num >= 1_000) return (num / 1_000).toFixed(1) + 'K';
  return num.toString();
};

export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

export const calculateEpisodeImpressions = (episodeAge: number, adReads: number): number => {
  // Mock calculation: 100 impressions per ad read, decaying over time
  const decay = Math.max(0.5, 1 - episodeAge / 365);
  return Math.round(adReads * 100 * decay);
};

export const calculateRevenue = (impressions: number, adReads: number): number => {
  // Mock calculation: $25 CPM
  const cpm = 25;
  return (impressions / 1000) * cpm;
};
