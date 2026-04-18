import { useLocation } from "wouter";
import { useGetDashboardSummary, useGetCurrentUser } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, Users, FileText, CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();

  if (isLoadingUser || isLoadingSummary) {
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

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl space-y-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Manager Dashboard</h1>
          <p className="text-lg text-muted-foreground">
            Overview of leadership assessments and institutional progress.
          </p>
        </div>
        <Button onClick={() => setLocation("/cases/new")}>
          Create New Case
        </Button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Active Cases
              </CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold">{summary.activeCases}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Out of {summary.totalCases} total cases
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pending Reports
              </CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold">{summary.pendingReports}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Awaiting review and release
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Respondents
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold">{summary.totalRespondents}</div>
              <p className="text-xs text-muted-foreground mt-1">
                External feedback providers
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Completed Assessments
              </CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-serif font-bold">{summary.completedAssessments}</div>
              <p className="text-xs text-muted-foreground mt-1">
                Self and external combined
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle className="font-serif">Quick Actions</CardTitle>
            <CardDescription>Manage your institutional leadership cases.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full justify-start h-12" onClick={() => setLocation("/cases")}>
              <FileText className="mr-2 h-4 w-4" />
              View all active cases
            </Button>
            <Button variant="outline" className="w-full justify-start h-12" onClick={() => setLocation("/cases/new")}>
              <Users className="mr-2 h-4 w-4" />
              Initiate a new leadership assessment
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
