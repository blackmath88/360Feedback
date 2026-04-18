import { useLocation, useParams } from "wouter";
import { 
  useGetCurrentUser,
  useGetReportForCase,
  getGetReportForCaseQueryKey
} from "@workspace/api-client-react";
import { Loader2, ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportViewer } from "@/components/assessment/ReportViewer";

export default function ParticipantReport() {
  const { caseId } = useParams();
  const id = caseId ? parseInt(caseId, 10) : 0;
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  
  const { data: report, isLoading: isLoadingReport } = useGetReportForCase(id, {
    query: { enabled: !!id, queryKey: getGetReportForCaseQueryKey(id) }
  });

  if (isLoadingUser || isLoadingReport) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user || user.role !== "participant") {
    setLocation("/");
    return null;
  }

  if (!report || report.releaseState !== "released") {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Report Not Available</h2>
        <p className="text-muted-foreground mb-6">This report is not available or has not been released to you yet.</p>
        <Button onClick={() => setLocation("/my-assessments")}>Return to My Assessments</Button>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-[100dvh] pb-20">
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation("/my-assessments")} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" />
            Print Report
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl mt-10 print:mt-0 print:max-w-none">
        <div className="bg-card border border-border shadow-sm rounded-xl p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
          <ReportViewer 
            report={report} 
            title="Leadership Assessment Results" // Fallback title since participant can't fetch full case details securely
            targetName={user.name} 
          />
        </div>
      </div>
    </div>
  );
}
