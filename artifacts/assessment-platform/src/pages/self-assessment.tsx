import { useLocation, useParams } from "wouter";
import { 
  useGetSelfAssessment, 
  useGetQuestionnaireStructure,
  useGetAnswers,
  useGetCurrentUser,
  getGetSelfAssessmentQueryKey,
  getGetQuestionnaireStructureQueryKey,
  getGetAnswersQueryKey
} from "@workspace/api-client-react";
import { Loader2, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Questionnaire } from "@/components/assessment/Questionnaire";

export default function SelfAssessment() {
  const { caseId } = useParams();
  const id = caseId ? parseInt(caseId, 10) : 0;
  const [, setLocation] = useLocation();

  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  
  const { data: assessment, isLoading: isLoadingAssessment } = useGetSelfAssessment(id, {
    query: { enabled: !!id, queryKey: getGetSelfAssessmentQueryKey(id) }
  });

  const { data: structure, isLoading: isLoadingStructure } = useGetQuestionnaireStructure(
    { mode: "self" },
    { query: { queryKey: getGetQuestionnaireStructureQueryKey({ mode: "self" }) } }
  );

  const { data: answersSet, isLoading: isLoadingAnswers } = useGetAnswers(assessment?.id || 0, {
    query: { enabled: !!assessment?.id, queryKey: getGetAnswersQueryKey(assessment?.id || 0) }
  });

  if (isLoadingUser || isLoadingAssessment || isLoadingStructure || isLoadingAnswers) {
    return (
      <div className="flex-1 flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (!user || !assessment || !structure) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20 text-center">
        <h2 className="text-2xl font-serif font-bold mb-2">Assessment Not Found</h2>
        <p className="text-muted-foreground mb-6">The requested assessment could not be found or you do not have access.</p>
        <Button onClick={() => setLocation("/my-assessments")}>Return to My Assessments</Button>
      </div>
    );
  }

  if (assessment.status === "submitted") {
    return (
      <div className="container mx-auto py-20 px-4 text-center max-w-lg">
        <div className="bg-green-50 text-green-800 p-4 rounded-full w-20 h-20 mx-auto flex items-center justify-center mb-6">
          <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
        </div>
        <h1 className="text-3xl font-serif font-bold mb-4">Assessment Completed</h1>
        <p className="text-muted-foreground mb-8">
          Thank you for completing your self-assessment. Your responses have been recorded and will be included in the final report.
        </p>
        <Button onClick={() => setLocation("/my-assessments")}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-10 px-4 max-w-5xl">
      <div className="mb-8">
        <Button variant="ghost" onClick={() => setLocation("/my-assessments")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to My Assessments
        </Button>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Self-Assessment</h1>
        <p className="text-lg text-muted-foreground">
          Reflect on your leadership practices. Your responses will be compared with external feedback in the final report.
        </p>
      </div>

      <Questionnaire 
        assessmentId={assessment.id}
        structure={structure}
        initialAnswers={answersSet?.answers || {}}
        initialComments={answersSet?.comments || {}}
        onSubmitted={() => setLocation("/my-assessments")}
      />
    </div>
  );
}
