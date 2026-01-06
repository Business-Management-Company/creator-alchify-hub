import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Tooltip as RechartsTooltip } from 'recharts';
import { HelpCircle, TrendingUp, DollarSign, Users, Cpu, Sparkles, Loader2, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { apiPost } from '@/lib/api';

interface Assumptions {
  alphaCreatorsYear1: number;
  creatorGrowthYear2Percent: number;
  creatorGrowthYear3Percent: number;
  avgMonthlyRevenuePerCreator: number;
  avgMinutesPerCreatorPerMonth: number;
  aiCostPerMinute: number;
  fixedCostsYear1: number;
  fixedCostGrowthYear2Percent: number;
  fixedCostGrowthYear3Percent: number;
  startingCash: number;
}

const baseAssumptions: Assumptions = {
  alphaCreatorsYear1: 100,
  creatorGrowthYear2Percent: 200,
  creatorGrowthYear3Percent: 100,
  avgMonthlyRevenuePerCreator: 39,
  avgMinutesPerCreatorPerMonth: 120,
  aiCostPerMinute: 0.01,
  fixedCostsYear1: 600000,
  fixedCostGrowthYear2Percent: 10,
  fixedCostGrowthYear3Percent: 10,
  startingCash: 0,
};

function formatCurrency(value: number): string {
  if (Math.abs(value) >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  if (Math.abs(value) >= 1000) {
    return `$${(value / 1000).toFixed(1)}K`;
  }
  return `$${value.toFixed(0)}`;
}

function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

function InputWithHelp({ 
  id, 
  label, 
  value, 
  onChange, 
  helpText, 
  prefix = '',
  suffix = ''
}: { 
  id: string; 
  label: string; 
  value: number; 
  onChange: (val: number) => void; 
  helpText: string;
  prefix?: string;
  suffix?: string;
}) {
  const [displayValue, setDisplayValue] = useState<string>(value.toString());

  // Sync displayValue when prop value changes externally (e.g., scenario buttons)
  React.useEffect(() => {
    setDisplayValue(value.toString());
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setDisplayValue(inputValue);
    
    const numValue = parseFloat(inputValue);
    if (!isNaN(numValue)) {
      onChange(numValue);
    } else if (inputValue === '' || inputValue === '-') {
      // Allow empty or just minus sign while typing
    }
  };

  const handleBlur = () => {
    // On blur, if empty or invalid, reset to 0
    const numValue = parseFloat(displayValue);
    if (isNaN(numValue) || displayValue === '') {
      setDisplayValue('0');
      onChange(0);
    }
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5">
        <Label htmlFor={id} className="text-sm font-medium text-foreground">{label}</Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
          </TooltipTrigger>
          <TooltipContent className="max-w-[250px]">
            <p className="text-xs">{helpText}</p>
          </TooltipContent>
        </Tooltip>
      </div>
      <div className="relative">
        {prefix && <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{prefix}</span>}
        <Input
          id={id}
          type="number"
          value={displayValue}
          onChange={handleChange}
          onBlur={handleBlur}
          className={`${prefix ? 'pl-7' : ''} ${suffix ? 'pr-8' : ''}`}
        />
        {suffix && <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">{suffix}</span>}
      </div>
    </div>
  );
}

export default function AdminCFODashboard() {
  const navigate = useNavigate();
  const [assumptions, setAssumptions] = useState<Assumptions>(baseAssumptions);
  const [boardSummary, setBoardSummary] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  const updateAssumption = (key: keyof Assumptions, value: number) => {
    setAssumptions(prev => ({ ...prev, [key]: value }));
  };

  // Derived calculations
  const creatorsYear1 = assumptions.alphaCreatorsYear1;
  const creatorsYear2 = creatorsYear1 * (1 + assumptions.creatorGrowthYear2Percent / 100);
  const creatorsYear3 = creatorsYear2 * (1 + assumptions.creatorGrowthYear3Percent / 100);

  const fixedCostsYear2 = assumptions.fixedCostsYear1 * (1 + assumptions.fixedCostGrowthYear2Percent / 100);
  const fixedCostsYear3 = fixedCostsYear2 * (1 + assumptions.fixedCostGrowthYear3Percent / 100);

  const year1Revenue = creatorsYear1 * assumptions.avgMonthlyRevenuePerCreator * 12;
  const year2Revenue = creatorsYear2 * assumptions.avgMonthlyRevenuePerCreator * 12;
  const year3Revenue = creatorsYear3 * assumptions.avgMonthlyRevenuePerCreator * 12;

  const year1AiCost = creatorsYear1 * assumptions.avgMinutesPerCreatorPerMonth * 12 * assumptions.aiCostPerMinute;
  const year2AiCost = creatorsYear2 * assumptions.avgMinutesPerCreatorPerMonth * 12 * assumptions.aiCostPerMinute;
  const year3AiCost = creatorsYear3 * assumptions.avgMinutesPerCreatorPerMonth * 12 * assumptions.aiCostPerMinute;

  const year1GrossProfit = year1Revenue - year1AiCost;
  const year2GrossProfit = year2Revenue - year2AiCost;
  const year3GrossProfit = year3Revenue - year3AiCost;

  const year1GrossMarginPercent = year1Revenue > 0 ? year1GrossProfit / year1Revenue : 0;
  const year2GrossMarginPercent = year2Revenue > 0 ? year2GrossProfit / year2Revenue : 0;
  const year3GrossMarginPercent = year3Revenue > 0 ? year3GrossProfit / year3Revenue : 0;

  const year1Ebitda = year1GrossProfit - assumptions.fixedCostsYear1;
  const year2Ebitda = year2GrossProfit - fixedCostsYear2;
  const year3Ebitda = year3GrossProfit - fixedCostsYear3;

  const year1EbitdaMarginPercent = year1Revenue > 0 ? year1Ebitda / year1Revenue : 0;
  const year2EbitdaMarginPercent = year2Revenue > 0 ? year2Ebitda / year2Revenue : 0;
  const year3EbitdaMarginPercent = year3Revenue > 0 ? year3Ebitda / year3Revenue : 0;

  const cumulativeCashEndYear1 = assumptions.startingCash + year1Ebitda;
  const cumulativeCashEndYear2 = cumulativeCashEndYear1 + year2Ebitda;
  const cumulativeCashEndYear3 = cumulativeCashEndYear2 + year3Ebitda;

  const breakEvenYearLabel = cumulativeCashEndYear1 >= 0 
    ? 'Year 1' 
    : (cumulativeCashEndYear2 >= 0 
      ? 'Year 2' 
      : (cumulativeCashEndYear3 >= 0 
        ? 'Year 3' 
        : 'After Year 3'));

  // Chart data
  const revenueChartData = [
    { year: 'Year 1', revenue: year1Revenue },
    { year: 'Year 2', revenue: year2Revenue },
    { year: 'Year 3', revenue: year3Revenue },
  ];

  const marginChartData = [
    { year: 'Year 1', grossMargin: year1GrossMarginPercent * 100, aiCost: year1AiCost },
    { year: 'Year 2', grossMargin: year2GrossMarginPercent * 100, aiCost: year2AiCost },
    { year: 'Year 3', grossMargin: year3GrossMarginPercent * 100, aiCost: year3AiCost },
  ];

  const ebitdaChartData = [
    { year: 'Year 1', ebitda: year1Ebitda },
    { year: 'Year 2', ebitda: year2Ebitda },
    { year: 'Year 3', ebitda: year3Ebitda },
  ];

  // Scenario handlers
  const resetToBaseScenario = () => {
    setAssumptions(baseAssumptions);
    toast.success('Reset to base scenario');
  };

  const applyOptimisticScenario = () => {
    setAssumptions(prev => ({
      ...prev,
      alphaCreatorsYear1: Math.round(baseAssumptions.alphaCreatorsYear1 * 1.2),
    }));
    toast.success('Applied optimistic scenario (+20% creators)');
  };

  const applyConservativeScenario = () => {
    setAssumptions(prev => ({
      ...prev,
      alphaCreatorsYear1: Math.round(baseAssumptions.alphaCreatorsYear1 * 0.8),
    }));
    toast.success('Applied conservative scenario (-20% creators)');
  };

  // AI Board Summary
  const generateBoardSummary = async () => {
    setIsGenerating(true);
    try {
      const { data, error } = await apiPost<{ summary: string }>('/generate-board-summary', {
        creatorsYear1,
        creatorsYear2,
        creatorsYear3,
        year1Revenue,
        year2Revenue,
        year3Revenue,
        year3GrossMarginPercent,
        year3Ebitda,
        year3EbitdaMarginPercent,
        fixedCostsYear1: assumptions.fixedCostsYear1,
        fixedCostsYear2,
        fixedCostsYear3,
        cumulativeCashEndYear1,
        cumulativeCashEndYear2,
        cumulativeCashEndYear3,
        breakEvenYearLabel,
      });

      if (error) throw error;
      setBoardSummary(data?.summary || '');
      toast.success('Board summary generated');
    } catch (error) {
      console.error('Error generating board summary:', error);
      toast.error('Failed to generate board summary');
    } finally {
      setIsGenerating(false);
    }
  };

  // Helper for EBITDA margin badge
  const getEbitdaMarginColor = (margin: number) => {
    if (margin >= 0.2) return 'bg-green-500/20 text-green-400 border-green-500/30';
    if (margin >= 0) return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
    return 'bg-red-500/20 text-red-400 border-red-500/30';
  };

  const getMarginHealthBadge = (margin: number) => {
    if (margin >= 0.7) return { color: 'bg-green-500/20 text-green-400 border-green-500/30', text: 'Excellent' };
    if (margin >= 0.5) return { color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', text: 'OK but Tight' };
    return { color: 'bg-red-500/20 text-red-400 border-red-500/30', text: 'Too Low — Revisit Pricing or Costs' };
  };

  const marginHealth = getMarginHealthBadge(year3GrossMarginPercent);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/admin')} 
            className="mb-2 -ml-2 text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-bold text-foreground">CFO Dashboard</h1>
          <p className="text-muted-foreground">3-Year Pro-Forma Financial Model for Alchify</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Left Column - Assumptions (40%) */}
          <div className="lg:col-span-2 space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Key Assumptions
            </h2>

            {/* Creator Growth Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Creator Growth
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithHelp
                  id="alphaCreatorsYear1"
                  label="Year 1 Creators (Alpha)"
                  value={assumptions.alphaCreatorsYear1}
                  onChange={(val) => updateAssumption('alphaCreatorsYear1', val)}
                  helpText="How many paying creators you expect in Year 1."
                />
                <InputWithHelp
                  id="creatorGrowthYear2Percent"
                  label="Year 2 Growth %"
                  value={assumptions.creatorGrowthYear2Percent}
                  onChange={(val) => updateAssumption('creatorGrowthYear2Percent', val)}
                  helpText="Percent growth in creators vs Year 1 (e.g., 200 = 3x)."
                  suffix="%"
                />
                <InputWithHelp
                  id="creatorGrowthYear3Percent"
                  label="Year 3 Growth %"
                  value={assumptions.creatorGrowthYear3Percent}
                  onChange={(val) => updateAssumption('creatorGrowthYear3Percent', val)}
                  helpText="Percent growth in creators vs Year 2."
                  suffix="%"
                />
                {/* Derived values display */}
                <div className="pt-2 border-t border-border space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>→ Creators Year 1:</span>
                    <span className="font-medium text-foreground">{creatorsYear1.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>→ Creators Year 2:</span>
                    <span className="font-medium text-foreground">{Math.round(creatorsYear2).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>→ Creators Year 3:</span>
                    <span className="font-medium text-foreground">{Math.round(creatorsYear3).toLocaleString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription & Usage Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Subscription & Usage
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithHelp
                  id="avgMonthlyRevenuePerCreator"
                  label="Average Revenue per Creator / Month (ARPC)"
                  value={assumptions.avgMonthlyRevenuePerCreator}
                  onChange={(val) => updateAssumption('avgMonthlyRevenuePerCreator', val)}
                  helpText="Blended monthly subscription per active creator (Basic + Pro + Studio)."
                  prefix="$"
                />
                <InputWithHelp
                  id="avgMinutesPerCreatorPerMonth"
                  label="Average AI Minutes per Creator / Month"
                  value={assumptions.avgMinutesPerCreatorPerMonth}
                  onChange={(val) => updateAssumption('avgMinutesPerCreatorPerMonth', val)}
                  helpText="Average number of minutes processed by Refiner AI per creator per month."
                />
                <InputWithHelp
                  id="aiCostPerMinute"
                  label="AI Cost per Minute ($)"
                  value={assumptions.aiCostPerMinute}
                  onChange={(val) => updateAssumption('aiCostPerMinute', val)}
                  helpText="Total variable cost per processed minute (inference + infra)."
                  prefix="$"
                />
              </CardContent>
            </Card>

            {/* Fixed Operating Costs Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Cpu className="h-4 w-4 text-primary" />
                  Fixed Operating Costs
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithHelp
                  id="fixedCostsYear1"
                  label="Year 1 Fixed Costs / Year"
                  value={assumptions.fixedCostsYear1}
                  onChange={(val) => updateAssumption('fixedCostsYear1', val)}
                  helpText="Salaries, rent, tools, support, marketing, etc. Excludes AI variable costs."
                  prefix="$"
                />
                <InputWithHelp
                  id="fixedCostGrowthYear2Percent"
                  label="Year 2 Fixed Cost Growth %"
                  value={assumptions.fixedCostGrowthYear2Percent}
                  onChange={(val) => updateAssumption('fixedCostGrowthYear2Percent', val)}
                  helpText="Expected increase in fixed costs vs Year 1."
                  suffix="%"
                />
                <InputWithHelp
                  id="fixedCostGrowthYear3Percent"
                  label="Year 3 Fixed Cost Growth %"
                  value={assumptions.fixedCostGrowthYear3Percent}
                  onChange={(val) => updateAssumption('fixedCostGrowthYear3Percent', val)}
                  helpText="Expected increase in fixed costs vs Year 2."
                  suffix="%"
                />
                {/* Derived values display */}
                <div className="pt-2 border-t border-border space-y-1 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>→ Fixed Costs Year 2:</span>
                    <span className="font-medium text-foreground">{formatCurrency(fixedCostsYear2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground">
                    <span>→ Fixed Costs Year 3:</span>
                    <span className="font-medium text-foreground">{formatCurrency(fixedCostsYear3)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cash & Scenario Settings Card */}
            <Card className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Cash & Scenario Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <InputWithHelp
                  id="startingCash"
                  label="Starting Cash on Hand"
                  value={assumptions.startingCash}
                  onChange={(val) => updateAssumption('startingCash', val)}
                  helpText="Optional — used to show cumulative cash and break-even timing."
                  prefix="$"
                />
                <div className="flex flex-wrap gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={resetToBaseScenario}>
                    Base Case
                  </Button>
                  <Button variant="outline" size="sm" onClick={applyOptimisticScenario}>
                    Optimistic (+20%)
                  </Button>
                  <Button variant="outline" size="sm" onClick={applyConservativeScenario}>
                    Conservative (-20%)
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Outputs (60%) */}
          <div className="lg:col-span-3 space-y-4">
            <h2 className="text-lg font-semibold text-foreground">3-Year Outlook</h2>

            {/* Top Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Year 1 Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(year1Revenue)}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Year 2 Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(year2Revenue)}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Year 3 Revenue</p>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(year3Revenue)}</p>
                </CardContent>
              </Card>
              <Card className="border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-xs text-muted-foreground mb-1">Year 3 EBITDA Margin</p>
                  <p className={`text-xl font-bold ${year3EbitdaMarginPercent >= 0.2 ? 'text-green-400' : year3EbitdaMarginPercent >= 0 ? 'text-yellow-400' : 'text-red-400'}`}>
                    {formatPercent(year3EbitdaMarginPercent)}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Revenue Forecast Chart */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Revenue Forecast (3 Years)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={revenueChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [formatCurrency(value), 'Revenue']}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Gross Margin vs AI Costs Chart */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Gross Margin vs AI Costs</CardTitle>
                  <Badge variant="outline" className={marginHealth.color}>
                    {marginHealth.text}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={marginChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis yAxisId="left" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => `${v}%`} />
                      <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number, name: string) => 
                          name === 'grossMargin' ? [`${value.toFixed(1)}%`, 'Gross Margin'] : [formatCurrency(value), 'AI Cost']
                        }
                      />
                      <Legend />
                      <Line yAxisId="left" type="monotone" dataKey="grossMargin" stroke="hsl(var(--primary))" name="Gross Margin %" strokeWidth={2} dot={{ r: 4 }} />
                      <Line yAxisId="right" type="monotone" dataKey="aiCost" stroke="#f97316" name="AI Variable Cost" strokeWidth={2} dot={{ r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Profitability & Cash Card */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Profitability & Cash</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground text-xs">Year 1 EBITDA</p>
                    <p className={`font-semibold ${year1Ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(year1Ebitda)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Year 2 EBITDA</p>
                    <p className={`font-semibold ${year2Ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(year2Ebitda)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Year 3 EBITDA</p>
                    <p className={`font-semibold ${year3Ebitda >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(year3Ebitda)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Break-Even Year</p>
                    <p className="font-semibold text-foreground">{breakEvenYearLabel}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Cash End of Year 3</p>
                    <p className={`font-semibold ${cumulativeCashEndYear3 >= 0 ? 'text-green-400' : 'text-red-400'}`}>{formatCurrency(cumulativeCashEndYear3)}</p>
                  </div>
                </div>
                <div className="h-[160px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ebitdaChartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="year" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                      <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(v) => formatCurrency(v)} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', border: '1px solid hsl(var(--border))' }}
                        formatter={(value: number) => [formatCurrency(value), 'EBITDA']}
                      />
                      <Bar 
                        dataKey="ebitda" 
                        fill="hsl(var(--primary))"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* AI Board Summary Card */}
            <Card className="border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  AI Explanation for Board
                </CardTitle>
                <CardDescription>One-click narrative the CFO can paste into a board deck.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  onClick={generateBoardSummary} 
                  disabled={isGenerating}
                  className="w-full"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4 mr-2" />
                      Generate Board Summary
                    </>
                  )}
                </Button>
                <Textarea
                  value={boardSummary}
                  onChange={(e) => setBoardSummary(e.target.value)}
                  placeholder='Click "Generate Board Summary" to create a short narrative explaining this 3-year plan.'
                  className="min-h-[200px] text-sm"
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
