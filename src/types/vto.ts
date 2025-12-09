export interface CoreValue {
  id: string;
  value: string;
}

export interface CoreFocus {
  purpose: string;
  niche: string;
}

export interface TenYearTarget {
  target: string;
  description: string;
}

export interface MarketingStrategy {
  targetMarket: string;
  threeUniques: string[];
  provenProcess: string;
  guarantee: string;
}

export interface ThreeYearPicture {
  revenue: string;
  profit: string;
  keyMetrics: string;
  teamSize: string;
  productMilestones: string;
  successNarrative: string;
}

export interface OneYearPlan {
  revenueTarget: string;
  profitTarget: string;
  priorities: string[];
}

export interface Rock {
  id: string;
  title: string;
  owner: string;
  dueQuarter: string;
  status: 'not_started' | 'in_progress' | 'complete';
}

export interface Issue {
  id: string;
  title: string;
  priority: 'low' | 'medium' | 'high';
  forL10: boolean;
}

export interface CEOAdjustments {
  visionClarity: number;
  teamAlignment: number;
  executionConfidence: number;
  quarterlyFocusLevel: number;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface VTOData {
  coreValues: CoreValue[];
  coreFocus: CoreFocus;
  tenYearTarget: TenYearTarget;
  marketingStrategy: MarketingStrategy;
  threeYearPicture: ThreeYearPicture;
  oneYearPlan: OneYearPlan;
  rocks: Rock[];
  issues: Issue[];
  ceoAdjustments: CEOAdjustments;
}
