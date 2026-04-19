import { useState, useEffect, useRef, useCallback } from "react";
import { 
  QuestionnaireStructure, 
  ResponseSetAnswers, 
  ResponseSetComments 
} from "@workspace/api-client-react";
import { useSaveAnswers, useSubmitAssessment } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuestionnaireProps {
  assessmentId: number;
  structure: QuestionnaireStructure;
  initialAnswers: ResponseSetAnswers;
  initialComments: ResponseSetComments;
  onSubmitted: () => void;
}

export function Questionnaire({ 
  assessmentId, 
  structure, 
  initialAnswers, 
  initialComments,
  onSubmitted 
}: QuestionnaireProps) {
  const { toast } = useToast();
  const saveAnswersMutation = useSaveAnswers();
  const submitMutation = useSubmitAssessment();
  
  const [answers, setAnswers] = useState<ResponseSetAnswers>(initialAnswers || {});
  const [comments, setComments] = useState<ResponseSetComments>(initialComments || {});
  const [currentSectionIdx, setCurrentSectionIdx] = useState(0);
  
  const lastSavedAnswers = useRef<ResponseSetAnswers>(initialAnswers || {});
  const lastSavedComments = useRef<ResponseSetComments>(initialComments || {});
  
  const sections = structure.sections || [];
  const currentSection = sections[currentSectionIdx];

  const totalQuestions = sections.reduce((acc, sec) => acc + sec.questions.length, 0);
  const answeredCount = Object.keys(answers).filter(k => answers[k] !== null && answers[k] !== undefined).length;
  const progress = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0;
  
  const isComplete = answeredCount === totalQuestions;

  const mutateFnRef = useRef(saveAnswersMutation.mutate);
  mutateFnRef.current = saveAnswersMutation.mutate;

  const saveAnswers = useCallback(() => {
    mutateFnRef.current(
      { id: assessmentId, data: { answers, comments } },
      {
        onSuccess: () => {
          lastSavedAnswers.current = { ...answers };
          lastSavedComments.current = { ...comments };
        }
      }
    );
  }, [assessmentId, answers, comments]);

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      const hasChanges = 
        JSON.stringify(answers) !== JSON.stringify(lastSavedAnswers.current) ||
        JSON.stringify(comments) !== JSON.stringify(lastSavedComments.current);
        
      if (hasChanges) {
        saveAnswers();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [answers, comments, saveAnswers]);

  const handleAnswerChange = (questionId: string, value: number) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleCommentChange = (questionId: string, text: string) => {
    setComments(prev => ({ ...prev, [questionId]: text }));
  };

  const handleSubmit = () => {
    if (!isComplete) {
      toast({
        title: "Incomplete Assessment",
        description: "Please answer all questions before submitting.",
        variant: "destructive"
      });
      return;
    }

    submitMutation.mutate(
      { id: assessmentId, data: { answers, comments } },
      {
        onSuccess: () => {
          toast({ title: "Assessment submitted successfully" });
          onSubmitted();
        },
        onError: (err: any) => {
          toast({ 
            title: "Submission failed", 
            description: err.message || "An error occurred while submitting.",
            variant: "destructive"
          });
        }
      }
    );
  };

  if (!sections.length) return <div>No questions available.</div>;

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar Navigation */}
      <div className="w-full md:w-64 md:shrink-0 space-y-6 sticky top-24">
        <div className="bg-card border border-border p-4 rounded-lg">
          <h3 className="font-serif font-semibold text-lg mb-4">Progress</h3>
          <Progress value={progress} className="h-2 mb-2" />
          <p className="text-sm text-muted-foreground text-right">
            {answeredCount} of {totalQuestions} answered
          </p>
          
          <div className="mt-4 flex items-center text-xs text-muted-foreground">
            {saveAnswersMutation.isPending ? (
              <>
                <Loader2 className="h-3 w-3 mr-1 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" /> Saved automatically
              </>
            )}
          </div>
        </div>

        <div className="bg-card border border-border p-2 rounded-lg hidden md:block">
          <nav className="space-y-1">
            {sections.map((sec, idx) => {
              const secAnswered = sec.questions.filter(q => answers[q.id] !== null && answers[q.id] !== undefined).length;
              const secTotal = sec.questions.length;
              const isSecComplete = secAnswered === secTotal;
              
              return (
                <button
                  key={sec.id}
                  onClick={() => setCurrentSectionIdx(idx)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors flex justify-between items-center",
                    currentSectionIdx === idx 
                      ? "bg-primary/10 text-primary font-medium" 
                      : "hover:bg-muted/50 text-foreground/70"
                  )}
                >
                  <span className="truncate pr-2">{sec.title}</span>
                  {isSecComplete && <CheckCircle2 className="h-3 w-3 text-green-500 shrink-0" />}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 space-y-8 w-full">
        <div>
          <h2 className="text-2xl font-serif font-bold mb-2">{currentSection.title}</h2>
          <p className="text-muted-foreground">{currentSection.description}</p>
        </div>

        <div className="space-y-8">
          {currentSection.questions.map((q) => (
            <Card key={q.id} className={cn("transition-colors", answers[q.id] ? "bg-card" : "bg-card border-l-4 border-l-primary/40")}>
              <CardContent className="p-6">
                <h4 className="text-base font-medium mb-6">{q.text}</h4>
                
                <RadioGroup 
                  value={answers[q.id]?.toString()} 
                  onValueChange={(val) => handleAnswerChange(q.id, parseInt(val, 10))}
                  className="flex flex-col sm:flex-row gap-4 sm:gap-0 justify-between items-stretch sm:items-center mb-6"
                >
                  {Array.from({ length: q.scaleMax - q.scaleMin + 1 }, (_, i) => i + q.scaleMin).map(val => (
                    <div key={val} className="flex sm:flex-col items-center sm:justify-center gap-3 sm:gap-2">
                      <RadioGroupItem value={val.toString()} id={`${q.id}-${val}`} className="h-5 w-5" />
                      <Label 
                        htmlFor={`${q.id}-${val}`} 
                        className="text-sm font-normal sm:text-xs text-muted-foreground cursor-pointer"
                      >
                        {val} - {q.scaleLabels[val] || val}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>

                {q.allowComment && (
                  <div className="mt-6 pt-4 border-t border-border/50">
                    <Label htmlFor={`comment-${q.id}`} className="text-sm text-muted-foreground mb-2 block">
                      Additional Comments (Optional)
                    </Label>
                    <Textarea 
                      id={`comment-${q.id}`}
                      placeholder="Provide any context for your rating..."
                      value={comments[q.id] || ""}
                      onChange={(e) => handleCommentChange(q.id, e.target.value)}
                      className="resize-y min-h-[80px]"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-border">
          <Button 
            variant="outline" 
            onClick={() => setCurrentSectionIdx(prev => Math.max(0, prev - 1))}
            disabled={currentSectionIdx === 0}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Previous Section
          </Button>

          {currentSectionIdx < sections.length - 1 ? (
            <Button onClick={() => setCurrentSectionIdx(prev => Math.min(sections.length - 1, prev + 1))}>
              Next Section
              <ChevronRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={handleSubmit} 
              disabled={!isComplete || submitMutation.isPending}
              className={cn(isComplete && "bg-green-600 hover:bg-green-700 text-white")}
            >
              {submitMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Submit Assessment
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
