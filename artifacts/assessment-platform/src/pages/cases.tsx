import { useState } from "react";
import { useLocation } from "wouter";
import { useListCases, useGetCurrentUser, getListCasesQueryKey } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Search, ChevronRight } from "lucide-react";
import { StatusBadge } from "@/components/ui/status-badge";
import { Input } from "@/components/ui/input";

export default function CasesList() {
  const [, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  
  const { data: cases, isLoading: isLoadingCases } = useListCases(
    statusFilter ? { status: statusFilter } : undefined,
    { query: { queryKey: getListCasesQueryKey(statusFilter ? { status: statusFilter } : undefined) } }
  );

  const [searchQuery, setSearchQuery] = useState("");

  if (isLoadingUser || isLoadingCases) {
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

  const filteredCases = cases?.filter(c => 
    c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    c.targetPersonName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl space-y-8">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Cases</h1>
          <p className="text-lg text-muted-foreground">
            Manage leadership assessment cases across the institution.
          </p>
        </div>
        <Button onClick={() => setLocation("/cases/new")}>
          <Plus className="mr-2 h-4 w-4" />
          Create New Case
        </Button>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-muted/20 p-4 rounded-lg border border-border/50">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search cases or participants..." 
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          <Button 
            variant={statusFilter === undefined ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setStatusFilter(undefined)}
          >
            All
          </Button>
          <Button 
            variant={statusFilter === "collecting_responses" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setStatusFilter("collecting_responses")}
          >
            Active
          </Button>
          <Button 
            variant={statusFilter === "ready_for_report" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setStatusFilter("ready_for_report")}
          >
            Needs Review
          </Button>
          <Button 
            variant={statusFilter === "released" ? "secondary" : "ghost"} 
            size="sm"
            onClick={() => setStatusFilter("released")}
          >
            Completed
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border overflow-hidden">
        {filteredCases && filteredCases.length > 0 ? (
          <div className="divide-y divide-border">
            {filteredCases.map((c) => (
              <div 
                key={c.id} 
                className="p-4 sm:p-6 hover:bg-muted/30 transition-colors cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setLocation(`/cases/${c.id}`)}
              >
                <div className="space-y-1">
                  <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {c.title}
                  </h3>
                  <div className="flex items-center text-sm text-muted-foreground gap-2">
                    <span className="font-medium text-foreground/80">{c.targetPersonName}</span>
                    <span>•</span>
                    <span>Created {new Date(c.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 sm:gap-6">
                  <div className="text-right text-sm">
                    <div className="font-medium">{c.completedRespondentCount} / {c.respondentCount}</div>
                    <div className="text-muted-foreground">Responses</div>
                  </div>
                  <StatusBadge status={c.status} className="w-fit" />
                  <ChevronRight className="h-5 w-5 text-muted-foreground hidden sm:block" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center">
            <FileText className="h-10 w-10 mb-4 opacity-50" />
            <p className="font-medium text-lg">No cases found</p>
            <p className="text-sm mt-1">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="16" x2="8" y1="13" y2="13" />
      <line x1="16" x2="8" y1="17" y2="17" />
      <line x1="10" x2="8" y1="9" y2="9" />
    </svg>
  )
}
