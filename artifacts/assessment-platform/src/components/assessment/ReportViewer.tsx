import { Report } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

export function ReportViewer({ report, title, targetName }: { report: Report; title: string; targetName: string }) {
  const data = report.data as any;
  const sections = data?.sections || [];
  const isComparison = report.type === "comparison";

  return (
    <div className="space-y-12">
      <div className="text-center py-10 border-b border-border">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-6">
          <span className="font-serif text-4xl font-bold leading-none">U</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-4">{title}</h1>
        <h2 className="text-2xl font-serif text-muted-foreground mb-6">Leadership Assessment Report</h2>
        <div className="inline-block bg-muted/30 px-6 py-3 rounded-lg border border-border">
          <p className="text-lg font-medium text-foreground">Target Person: {targetName}</p>
          <p className="text-sm text-muted-foreground mt-1">Generated: {new Date(report.generatedAt).toLocaleDateString()}</p>
        </div>
      </div>

      <div className="prose prose-stone max-w-none mx-auto">
        <p className="text-lg leading-relaxed text-muted-foreground">
          This report aggregates feedback collected during the {title} assessment cycle. 
          {isComparison 
            ? " It presents a comparison between your self-perception and the observations of your external feedback providers." 
            : " It presents the aggregated results of the assessment."}
        </p>
      </div>

      <div className="space-y-12">
        {sections.map((section: any, idx: number) => (
          <section key={idx} className="space-y-6">
            <h3 className="text-2xl font-serif font-bold text-foreground pb-2 border-b border-border/50">
              {section.sectionTitle}
            </h3>
            
            <div className="grid gap-6">
              {section.questions.map((q: any, qIdx: number) => (
                <Card key={qIdx} className="overflow-hidden bg-card/50">
                  <CardContent className="p-6">
                    <p className="font-medium text-lg mb-6">{q.text}</p>
                    
                    {isComparison ? (
                      <div className="space-y-6">
                        <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4">
                          <span className="text-sm font-medium text-muted-foreground text-right">Self</span>
                          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-primary/40 rounded-full" 
                              style={{ width: `${(q.selfScore / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold">{q.selfScore ? q.selfScore.toFixed(1) : '-'}</span>
                        </div>
                        <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4">
                          <span className="text-sm font-medium text-muted-foreground text-right">External</span>
                          <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                              style={{ width: `${(q.externalScore / 5) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-bold">{q.externalScore ? q.externalScore.toFixed(1) : '-'}</span>
                        </div>
                        
                        {q.gap !== undefined && (
                          <div className="pt-4 mt-2 border-t border-border/30 flex justify-end">
                            <span className="text-sm">
                              Gap: <span className={`font-medium ${Math.abs(q.gap) > 1 ? 'text-destructive' : 'text-muted-foreground'}`}>
                                {q.gap > 0 ? '+' : ''}{q.gap.toFixed(1)}
                              </span>
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-[100px_1fr_40px] items-center gap-4">
                        <span className="text-sm font-medium text-muted-foreground text-right">Score</span>
                        <div className="relative h-4 bg-muted rounded-full overflow-hidden">
                          <div 
                            className="absolute top-0 left-0 h-full bg-primary rounded-full" 
                            style={{ width: `${(q.score / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{q.score ? q.score.toFixed(1) : '-'}</span>
                      </div>
                    )}

                    {q.comments && q.comments.length > 0 && (
                      <div className="mt-8 pt-6 border-t border-border/50">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-4">Comments</h4>
                        <ul className="space-y-3">
                          {q.comments.map((comment: string, cIdx: number) => (
                            <li key={cIdx} className="text-sm bg-background p-3 rounded border border-border/50 italic text-muted-foreground">
                              "{comment}"
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        ))}
      </div>
      
      <div className="text-center pt-10 border-t border-border text-sm text-muted-foreground">
        <p>End of Report</p>
        <p className="mt-2">Center for Leadership, Universität Basel</p>
      </div>
    </div>
  );
}
