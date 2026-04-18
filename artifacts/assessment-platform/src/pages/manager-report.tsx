import { useLocation, useParams } from "wouter";
import { 
  useGetCase, 
  useGetCurrentUser,
  useGetReportForCase,
  useReleaseReport,
  getGetCaseQueryKey,
  getGetReportForCaseQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, ArrowLeft, Send, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ReportViewer } from "@/components/assessment/ReportViewer";
import { useToast } from "@/hooks/use-toast";

export default function ManagerReport() {
  const { id } = useParams();
  const caseId = id ? parseInt(id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  
  const { data: caseDetail, isLoading: isLoadingCase } = useGetCase(caseId, {
    query: { enabled: !!caseId, queryKey: getGetCaseQueryKey(caseId) }
  });

  const { data: report, isLoading: isLoadingReport } = useGetReportForCase(caseId, {
    query: { enabled: !!caseId, queryKey: getGetReportForCaseQueryKey(caseId) }
  });

  const releaseReportMutation = useReleaseReport();

  if (isLoadingUser || isLoadingCase || isLoadingReport) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user || (user.role !== "manager" && user.role !== "admin")) {
    setLocation("/");
    return null;
  }

  if (!caseDetail || !report) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Report Not Found</h2>
        <p className="text-muted-foreground mb-6">The report has not been generated yet or you don't have access.</p>
        <Button onClick={() => setLocation(`/cases/${caseId}`)}>Return to Case</Button>
      </div>
    );
  }

  const handleRelease = () => {
    releaseReportMutation.mutate(
      { id: caseId },
      {
        onSuccess: () => {
          toast({ title: "Report released to participant" });
          queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
          queryClient.invalidateQueries({ queryKey: getGetReportForCaseQueryKey(caseId) });
        },
        onError: (err: any) => {
          toast({ title: "Failed to release report", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  return (
    <div className="bg-background min-h-[100dvh] pb-20">
      <div className="sticky top-16 z-40 bg-background/95 backdrop-blur border-b border-border py-4 shadow-sm">
        <div className="container mx-auto px-4 max-w-4xl flex items-center justify-between">
          <Button variant="ghost" onClick={() => setLocation(`/cases/${caseId}`)} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Case
          </Button>
          
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => window.print()}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
            
            {report.releaseState !== "released" ? (
              <Button onClick={handleRelease} disabled={releaseReportMutation.isPending}>
                {releaseReportMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                Release to Participant
              </Button>
            ) : (
              <Button disabled variant="secondary">
                Released
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 max-w-4xl mt-10 print:mt-0 print:max-w-none">
        <div className="bg-card border border-border shadow-sm rounded-xl p-8 sm:p-12 print:border-none print:shadow-none print:p-0">
          <ReportViewer 
            report={report} 
            title={caseDetail.title} 
            targetName={caseDetail.targetPersonName} 
          />
        </div>
      </div>
    </div>
  );
}
