import { useLocation } from "wouter";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useCreateCase, useListUsers, useGetCurrentUser, getListCasesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, ArrowLeft } from "lucide-react";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";

const createCaseSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  targetPersonId: z.string({ required_error: "Please select a target person" }),
  includeSelfAssessment: z.boolean().default(true),
});

type CreateCaseValues = z.infer<typeof createCaseSchema>;

export default function NewCase() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: user, isLoading: isLoadingUser } = useGetCurrentUser();
  const { data: users, isLoading: isLoadingUsers } = useListUsers();
  
  const createCaseMutation = useCreateCase();

  const form = useForm<CreateCaseValues>({
    resolver: zodResolver(createCaseSchema),
    defaultValues: {
      title: "",
      targetPersonId: "",
      includeSelfAssessment: true,
    },
  });

  if (isLoadingUser || isLoadingUsers) {
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

  const participants = users?.filter(u => u.role === "participant") || [];

  const onSubmit = (data: CreateCaseValues) => {
    createCaseMutation.mutate(
      { 
        data: { 
          title: data.title, 
          targetPersonId: parseInt(data.targetPersonId, 10),
          includeSelfAssessment: data.includeSelfAssessment
        } 
      },
      {
        onSuccess: (newCase) => {
          toast({
            title: "Case created",
            description: "The leadership assessment case has been created successfully.",
          });
          queryClient.invalidateQueries({ queryKey: getListCasesQueryKey() });
          setLocation(`/cases/${newCase.id}`);
        },
        onError: (error: any) => {
          toast({
            title: "Failed to create case",
            description: error.message || "An unexpected error occurred.",
            variant: "destructive",
          });
        }
      }
    );
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-3xl space-y-8">
      <div>
        <Button variant="ghost" onClick={() => setLocation("/cases")} className="mb-4 -ml-4 text-muted-foreground hover:text-foreground">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Cases
        </Button>
        <h1 className="text-4xl font-serif font-bold text-foreground mb-2">Initiate Assessment</h1>
        <p className="text-lg text-muted-foreground">
          Create a new leadership assessment case for a participant.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-serif">Case Details</CardTitle>
          <CardDescription>
            Specify the parameters for this assessment cycle.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Assessment Title</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g. Annual Leadership Review 2025" {...field} />
                    </FormControl>
                    <FormDescription>
                      A clear, identifiable name for this specific assessment cycle.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="targetPersonId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Participant</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a participant" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {participants.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.name} ({p.email})
                          </SelectItem>
                        ))}
                        {participants.length === 0 && (
                          <SelectItem value="none" disabled>No participants available</SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                    <FormDescription>
                      The individual whose leadership is being assessed.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="includeSelfAssessment"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-muted/20">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>
                        Include Self-Assessment
                      </FormLabel>
                      <FormDescription>
                        Generate a self-assessment questionnaire for the target participant to complete.
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-4 pt-4 border-t border-border">
                <Button type="button" variant="outline" onClick={() => setLocation("/cases")}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createCaseMutation.isPending}>
                  {createCaseMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Case
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
