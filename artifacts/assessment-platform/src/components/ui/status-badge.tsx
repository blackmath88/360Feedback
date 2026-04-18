import { Badge } from "@/components/ui/badge";

type CaseStatus = "draft" | "self_assessment_open" | "external_assessment_open" | "collecting_responses" | "ready_for_report" | "report_generated" | "reviewed" | "released" | "closed";

const STATUS_CONFIG: Record<string, { label: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
  draft: { label: "Draft", variant: "outline" },
  self_assessment_open: { label: "Self-Assessment Open", variant: "secondary" },
  external_assessment_open: { label: "External Open", variant: "secondary" },
  collecting_responses: { label: "Collecting Responses", variant: "default" },
  ready_for_report: { label: "Ready for Report", variant: "secondary" },
  report_generated: { label: "Report Generated", variant: "outline" },
  reviewed: { label: "Reviewed", variant: "secondary" },
  released: { label: "Released", variant: "default" },
  closed: { label: "Closed", variant: "outline" },
  
  pending: { label: "Pending", variant: "outline" },
  in_progress: { label: "In Progress", variant: "secondary" },
  submitted: { label: "Submitted", variant: "default" },
};

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  const config = STATUS_CONFIG[status] || { label: status, variant: "outline" };
  
  return (
    <Badge variant={config.variant} className={`font-medium ${className}`}>
      {config.label}
    </Badge>
  );
}
