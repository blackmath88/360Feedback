import { useLocation } from "wouter";
import { useGetMyCases, useGetCurrentUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ClipboardEdit, BarChart2, ArrowRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";

export default function MyAssessments() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: cases, isLoading: isLoadingCases } = useGetMyCases();

  if (isLoadingUser || isLoadingCases) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl space-y-10">
      <div>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">My Assessments</h1>
        <p className="text-lg text-muted-foreground">
          View your leadership development cases and complete assigned self-assessments.
        </p>
      </div>

      {cases && cases.length > 0 ? (
        <div className="grid gap-6">
          {cases.map((c) => (
            <Card key={c.id} className="overflow-hidden border-border/50">
              <div className="border-b border-border/50 bg-muted/20 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-xl font-semibold">{c.title}</h3>
                  <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                    <StatusBadge status={c.status} />
                    <span>Case #{c.id}</span>
                  </div>
                </div>
                
                {c.reportReleased && c.reportId ? (
                  <Button onClick={() => setLocation(`/report/${c.id}`)}>
                    <BarChart2 className="mr-2 h-4 w-4" />
                    View Final Report
                  </Button>
                ) : null}
              </div>
              
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="space-y-1">
                    <h4 className="font-medium text-foreground">Self-Assessment</h4>
                    <p className="text-sm text-muted-foreground">
                      {c.selfAssessmentStatus === "submitted" 
                        ? "You have completed your self-assessment."
                        : c.selfAssessmentStatus === "in_progress"
                        ? "You have started but not finished your self-assessment."
                        : c.selfAssessmentStatus === "pending"
                        ? "Your self-assessment is pending."
                        : "No self-assessment available."}
                    </p>
                  </div>
                  
                  {c.selfAssessmentId && c.selfAssessmentStatus !== "submitted" && (
                    <Button 
                      variant={c.selfAssessmentStatus === "in_progress" ? "default" : "outline"} 
                      onClick={() => setLocation(`/self/${c.id}`)}
                    >
                      <ClipboardEdit className="mr-2 h-4 w-4" />
                      {c.selfAssessmentStatus === "in_progress" ? "Continue Assessment" : "Start Assessment"}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  )}

                  {c.selfAssessmentStatus === "submitted" && (
                    <div className="text-sm font-medium text-green-600 flex items-center">
                      <ClipboardEdit className="mr-2 h-4 w-4" />
                      Submitted successfully
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="border-dashed border-2 py-12">
          <CardContent className="flex flex-col items-center justify-center text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-muted flex items-center justify-center mb-2">
              <ClipboardEdit className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle className="font-serif text-2xl">No Active Cases</CardTitle>
            <CardDescription className="max-w-md">
              You currently do not have any leadership assessment cases assigned to you. 
              When a manager initiates a case for you, it will appear here.
            </CardDescription>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
