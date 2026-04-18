import { useLocation, useParams } from "wouter";
import { 
  useGetCase, 
  useGetCurrentUser, 
  useUpdateCase, 
  useAddRespondent,
  useGenerateReport,
  useReleaseReport,
  getGetCaseQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft, Mail, UserPlus, CheckCircle, BarChart2, Eye, FileText, Share } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export default function CaseDetail() {
  const { id } = useParams();
  const caseId = id ? parseInt(id, 10) : 0;
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: caseDetail, isLoading: isLoadingCase } = useGetCase(caseId, {
    query: { enabled: !!caseId, queryKey: getGetCaseQueryKey(caseId) }
  });

  const updateCaseMutation = useUpdateCase();
  const addRespondentMutation = useAddRespondent();
  const generateReportMutation = useGenerateReport();
  const releaseReportMutation = useReleaseReport();

  const [respondentName, setRespondentName] = useState("");
  const [respondentEmail, setRespondentEmail] = useState("");
  const [isRespondentDialogOpen, setIsRespondentDialogOpen] = useState(false);

  if (isLoadingUser || isLoadingCase) {
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

  if (!caseDetail) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Case Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested case could not be found or you do not have access.</p>
        <Button onClick={() => setLocation("/cases")}>Return to Cases</Button>
      </div>
    );
  }

  const handleUpdateStatus = (newStatus: string) => {
    updateCaseMutation.mutate(
      { id: caseId, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast({ title: "Status updated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        },
        onError: (err: any) => {
          toast({ title: "Update failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleAddRespondent = (e: React.FormEvent) => {
    e.preventDefault();
    addRespondentMutation.mutate(
      { id: caseId, data: { name: respondentName, email: respondentEmail } },
      {
        onSuccess: () => {
          toast({ title: "Respondent added successfully" });
          setIsRespondentDialogOpen(false);
          setRespondentName("");
          setRespondentEmail("");
          queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        },
        onError: (err: any) => {
          toast({ title: "Failed to add respondent", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const handleGenerateReport = () => {
    generateReportMutation.mutate(
      { id: caseId },
      {
        onSuccess: () => {
          toast({ title: "Report generated successfully" });
          queryClient.invalidateQueries({ queryKey: getGetCaseQueryKey(caseId) });
        },
        onError: (err: any) => {
          toast({ title: "Report generation failed", description: err.message, variant: "destructive" });
        }
      }
    );
  };

  const selfAssessment = caseDetail.assessments.find(a => a.type === "self");
  const externalAssessments = caseDetail.assessments.filter(a => a.type === "external");
  const latestReport = caseDetail.reports.length > 0 ? caseDetail.reports[caseDetail.reports.length - 1] : null;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl space-y-8">
      <div>
        <Button variant="ghost" onClick={() => setLocation("/cases")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-4xl font-serif font-bold text-foreground">{caseDetail.title}</h1>
              <StatusBadge status={caseDetail.status} className="mt-2" />
            </div>
            <p className="text-lg text-muted-foreground">
              Target: <span className="font-medium text-foreground">{caseDetail.targetPersonName}</span>
            </p>
          </div>
          
          <div className="flex gap-2 flex-wrap">
            {caseDetail.status === "draft" && (
              <Button onClick={() => handleUpdateStatus("self_assessment_open")} disabled={updateCaseMutation.isPending}>
                Open Self-Assessment
              </Button>
            )}
            
            {(caseDetail.status === "self_assessment_open" || caseDetail.status === "draft") && (
              <Button onClick={() => handleUpdateStatus("collecting_responses")} disabled={updateCaseMutation.isPending}>
                Open External Assessment
              </Button>
            )}
            
            {caseDetail.status === "collecting_responses" && (
              <Button onClick={() => handleUpdateStatus("ready_for_report")} disabled={updateCaseMutation.isPending}>
                Close Collection
              </Button>
            )}
            
            {caseDetail.status === "ready_for_report" && (
              <Button onClick={handleGenerateReport} disabled={generateReportMutation.isPending}>
                {generateReportMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Generate Report
              </Button>
            )}
            
            {(caseDetail.status === "report_generated" || caseDetail.status === "reviewed") && latestReport && (
              <Button onClick={() => setLocation(`/cases/${caseId}/report`)}>
                View Report
              </Button>
            )}
            
            {caseDetail.status === "released" && latestReport && (
              <Button variant="outline" onClick={() => setLocation(`/cases/${caseId}/report`)}>
                View Released Report
              </Button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-serif">External Respondents</CardTitle>
              <CardDescription>Manage feedback providers for this case.</CardDescription>
            </div>
            
            <Dialog open={isRespondentDialogOpen} onOpenChange={setIsRespondentDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" disabled={caseDetail.status === "ready_for_report" || caseDetail.status === "report_generated" || caseDetail.status === "reviewed" || caseDetail.status === "released" || caseDetail.status === "closed"}>
                  <UserPlus className="mr-2 h-4 w-4" />
                  Add
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddRespondent}>
                  <DialogHeader>
                    <DialogTitle>Add Respondent</DialogTitle>
                    <DialogDescription>
                      Add a new external respondent. They will receive a unique link to complete the assessment.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input 
                        id="name" 
                        value={respondentName} 
                        onChange={(e) => setRespondentName(e.target.value)} 
                        required 
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input 
                        id="email" 
                        type="email" 
                        value={respondentEmail} 
                        onChange={(e) => setRespondentEmail(e.target.value)} 
                        required 
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsRespondentDialogOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={addRespondentMutation.isPending}>
                      {addRespondentMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Add Respondent
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {externalAssessments.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Link</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {externalAssessments.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.respondentName}</TableCell>
                      <TableCell className="text-muted-foreground">{a.respondentEmail}</TableCell>
                      <TableCell><StatusBadge status={a.status} /></TableCell>
                      <TableCell className="text-right">
                        {a.token && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-8"
                            onClick={() => {
                              const url = `${window.location.origin}${import.meta.env.BASE_URL.replace(/\/$/, "")}/respond/${a.token}`;
                              navigator.clipboard.writeText(url);
                              toast({ title: "Link copied to clipboard" });
                            }}
                          >
                            <Share className="h-4 w-4" />
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No respondents added yet.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Self-Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              {selfAssessment ? (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Status</span>
                    <StatusBadge status={selfAssessment.status} />
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Created</span>
                    <span className="text-sm text-muted-foreground">{new Date(selfAssessment.createdAt).toLocaleDateString()}</span>
                  </div>
                  {selfAssessment.submittedAt && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Submitted</span>
                      <span className="text-sm text-muted-foreground">{new Date(selfAssessment.submittedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Not included in this case.</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-serif">Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Total Respondents</span>
                <span className="font-medium">{caseDetail.respondentCount}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Completed</span>
                <span className="font-medium">{caseDetail.completedRespondentCount}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-border/50">
                <span className="text-sm text-muted-foreground">Response Rate</span>
                <span className="font-medium">
                  {caseDetail.respondentCount > 0 
                    ? Math.round((caseDetail.completedRespondentCount / caseDetail.respondentCount) * 100) 
                    : 0}%
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
