import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Brain } from 'lucide-react';
import { CEOAdjustments, VTOData } from '@/types/vto';

interface VTOCEOInsightPanelProps {
  adjustments: CEOAdjustments;
  data: VTOData;
}

export const VTOCEOInsightPanel = ({ adjustments, data }: VTOCEOInsightPanelProps) => {
  const generateInsights = () => {
    const insights: string[] = [];
    
    // Vision clarity analysis
    if (adjustments.visionClarity < 5) {
      insights.push("Vision clarity is below optimal. Consider revisiting your 10-Year Target and Core Focus to ensure alignment across leadership.");
    } else if (adjustments.visionClarity >= 8) {
      insights.push("Strong vision clarity detected. Your team has a clear North Star to guide decisions.");
    }
    
    // Team alignment analysis
    if (adjustments.teamAlignment < 5) {
      insights.push("Team alignment needs attention. Schedule a VTO session to ensure everyone is on the same page.");
    }
    
    // Execution confidence
    if (adjustments.executionConfidence < 50) {
      insights.push("Execution confidence is low. Review your Rocks to ensure they're SMART and achievable within the quarter.");
    }
    
    // Risk analysis
    if (adjustments.riskLevel === 'high') {
      insights.push("Operating at high risk level. Ensure you have contingency plans and adequate runway for potential setbacks.");
    }
    
    // Rocks analysis
    const incompleteRocks = data.rocks.filter(r => r.status !== 'complete').length;
    const totalRocks = data.rocks.length;
    if (totalRocks > 0 && incompleteRocks / totalRocks > 0.7) {
      insights.push(`${incompleteRocks} of ${totalRocks} Rocks are not yet complete. Focus on completion before adding new initiatives.`);
    }
    
    // Issues analysis
    const highPriorityIssues = data.issues.filter(i => i.priority === 'high').length;
    if (highPriorityIssues > 3) {
      insights.push(`${highPriorityIssues} high-priority issues identified. Consider scheduling an IDS session to address blockers.`);
    }
    
    if (insights.length === 0) {
      insights.push("Organization appears well-aligned. Continue monitoring execution metrics and maintain focus on quarterly priorities.");
    }
    
    return insights;
  };

  const insights = generateInsights();

  return (
    <Card className="bg-primary/5 border-primary/20">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 bg-primary/10 rounded-full">
            <Brain className="h-5 w-5 text-primary" />
          </div>
          <CardTitle className="flex items-center gap-2">
            CEO Insight Panel
            <Sparkles className="h-4 w-4 text-primary" />
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {insights.map((insight, index) => (
            <p key={index} className="text-sm text-muted-foreground leading-relaxed">
              {insight}
            </p>
          ))}
        </div>
        <div className="mt-4 pt-4 border-t border-primary/20">
          <p className="text-xs text-muted-foreground italic">
            Powered by Refiner AI • Analysis based on current VTO data and adjustment settings
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
