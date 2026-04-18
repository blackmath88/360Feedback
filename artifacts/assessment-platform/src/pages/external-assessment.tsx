import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { 
  useGetAssessmentByToken, 
  useGetQuestionnaireStructure,
  useGetAnswers,
  getGetAssessmentByTokenQueryKey,
  getGetQuestionnaireStructureQueryKey,
  getGetAnswersQueryKey
} from "@workspace/api-client-react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Questionnaire } from "@/components/assessment/Questionnaire";

export default function ExternalAssessment() {
  const { token } = useParams();
  const t = token || "";

  const { data: assessment, isLoading: isLoadingAssessment } = useGetAssessmentByToken(t, {
    query: { enabled: !!t, queryKey: getGetAssessmentByTokenQueryKey(t) }
  });

  const { data: structure, isLoading: isLoadingStructure } = useGetQuestionnaireStructure(
    { mode: "external" },
    { query: { queryKey: getGetQuestionnaireStructureQueryKey({ mode: "external" }) } }
  );

  const { data: answersSet, isLoading: isLoadingAnswers } = useGetAnswers(assessment?.id || 0, {
    query: { enabled: !!assessment?.id, queryKey: getGetAnswersQueryKey(assessment?.id || 0) }
  });

  const [submitted, setSubmitted] = useState(false);

  if (isLoadingAssessment || isLoadingStructure || isLoadingAnswers) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <header className="border-b border-border bg-background py-4">
          <div className="container mx-auto px-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg leading-none">U</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
              Universität Basel
            </span>
          </div>
        </header>
        <div className="flex-1 flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
        </div>
      </div>
    );
  }

  if (!assessment || !structure) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <header className="border-b border-border bg-background py-4">
          <div className="container mx-auto px-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg leading-none">U</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
              Universität Basel
            </span>
          </div>
        </header>
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center px-4">
          <h2 className="text-2xl font-serif font-bold mb-2">Invalid or Expired Link</h2>
          <p className="text-muted-foreground max-w-md">
            The assessment link you used is invalid or has expired. Please contact the program administrator if you believe this is an error.
          </p>
        </div>
      </div>
    );
  }

  if (assessment.status === "submitted" || submitted) {
    return (
      <div className="min-h-[100dvh] bg-background flex flex-col">
        <header className="border-b border-border bg-background py-4">
          <div className="container mx-auto px-4 flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg leading-none">U</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground">
              Universität Basel
            </span>
          </div>
        </header>
        <div className="flex-1 container mx-auto py-20 px-4 text-center max-w-lg">
          <div className="bg-green-50 text-green-800 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
            <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
          </div>
          <h1 className="text-3xl font-serif font-bold mb-4">Thank You</h1>
          <p className="text-muted-foreground mb-8">
            Your feedback has been successfully submitted. We appreciate your time and contribution to the leadership development process.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col">
      <header className="border-b border-border bg-background py-4 sticky top-0 z-50">
        <div className="container mx-auto px-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-serif font-bold text-lg leading-none">U</span>
            </div>
            <span className="font-serif font-semibold text-lg tracking-tight text-foreground hidden sm:inline-block">
              Universität Basel
            </span>
          </div>
          <div className="text-sm font-medium text-muted-foreground">
            External Assessment
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="container mx-auto py-10 px-4 max-w-5xl">
          <div className="mb-8">
            <h1 className="text-4xl font-serif font-bold text-foreground mb-4">Leadership Feedback Assessment</h1>
            <div className="bg-muted/30 p-6 rounded-lg border border-border">
              <p className="text-lg text-foreground mb-2">
                You have been invited to provide feedback for <span className="font-bold">{assessment.respondentName || "a colleague"}</span>.
              </p>
              <p className="text-muted-foreground">
                Your candid responses are crucial for their leadership development. All individual responses are aggregated and presented anonymously in the final report.
              </p>
            </div>
          </div>

          <Questionnaire 
            assessmentId={assessment.id}
            structure={structure}
            initialAnswers={answersSet?.answers || {}}
            initialComments={answersSet?.comments || {}}
            onSubmitted={() => setSubmitted(true)}
          />
        </div>
      </main>

      <footer className="border-t border-border bg-background py-8 mt-auto">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          <p>Leadership Assessment Platform &copy; {new Date().getFullYear()}</p>
        </div>
      </footer>
    </div>
  );
}
