import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import MainLayout from "@/components/layout/MainLayout";

import Landing from "@/pages/index";
import Dashboard from "@/pages/dashboard";
import MyAssessments from "@/pages/my-assessments";
import CasesList from "@/pages/cases";
import NewCase from "@/pages/new-case";
import CaseDetail from "@/pages/case-detail";
import ManagerReport from "@/pages/manager-report";
import ParticipantReport from "@/pages/participant-report";
import SelfAssessment from "@/pages/self-assessment";
import ExternalAssessment from "@/pages/external-assessment";

const queryClient = new QueryClient();

// A layout specifically for the external assessment route which doesn't need MainLayout chrome
function ExternalAssessmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-[100dvh] bg-background">
      {children}
    </div>
  );
}

function Router() {
  return (
    <Switch>
      {/* Routes without auth / MainLayout chrome */}
      <Route path="/respond/:token">
        <ExternalAssessmentLayout>
          <ExternalAssessment />
        </ExternalAssessmentLayout>
      </Route>
      
      {/* Protected routes wrapped in MainLayout */}
      <Route>
        <MainLayout>
          <Switch>
            <Route path="/" component={Landing} />
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/my-assessments" component={MyAssessments} />
            <Route path="/cases" component={CasesList} />
            <Route path="/cases/new" component={NewCase} />
            <Route path="/cases/:id" component={CaseDetail} />
            <Route path="/cases/:id/report" component={ManagerReport} />
            <Route path="/report/:caseId" component={ParticipantReport} />
            <Route path="/self/:caseId" component={SelfAssessment} />
            <Route component={NotFound} />
          </Switch>
        </MainLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
