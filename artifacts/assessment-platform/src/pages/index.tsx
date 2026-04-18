import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { 
  useGetCurrentUser, 
  useListUsers, 
  useLogin,
  getGetCurrentUserQueryKey 
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export default function Landing() {
  const [location, setLocation] = useLocation();
  const { data: user, isLoading: isLoadingUser, isError: isUserError } = useGetCurrentUser({
    query: { retry: false }
  });
  const { data: users, isLoading: isLoadingUsers } = useListUsers({ query: { retry: false } });
  const loginMutation = useLogin();
  const queryClient = useQueryClient();
  
  const [selectedUserId, setSelectedUserId] = useState<string>("");

  useEffect(() => {
    if (user) {
      if (user.role === "manager" || user.role === "admin") {
        setLocation("/dashboard");
      } else {
        setLocation("/my-assessments");
      }
    }
  }, [user, setLocation]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    
    loginMutation.mutate(
      { data: { userId: parseInt(selectedUserId, 10) } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        }
      }
    );
  };

  if (isLoadingUser && !isUserError) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary/50" />
      </div>
    );
  }

  if (user) return null; // Will redirect

  return (
    <div className="flex-1 flex flex-col items-center justify-center py-20 px-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-4">
            <span className="font-serif text-4xl font-bold leading-none">U</span>
          </div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            Leadership Assessment
          </h1>
          <p className="text-muted-foreground text-lg">
            University of Basel
          </p>
        </div>

        <Card className="border-border shadow-sm">
          <CardHeader>
            <CardTitle className="text-xl font-serif">Sign In</CardTitle>
            <CardDescription>
              Select your demo account to continue to the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  Select User Account
                </label>
                <Select value={selectedUserId} onValueChange={setSelectedUserId} disabled={isLoadingUsers}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose an account..." />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.map(u => (
                      <SelectItem key={u.id} value={u.id.toString()}>
                        {u.name} — <span className="text-muted-foreground capitalize">{u.role}</span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button 
                type="submit" 
                className="w-full font-medium" 
                disabled={!selectedUserId || loginMutation.isPending}
              >
                {loginMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Sign In securely
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-muted-foreground">
          This is a structured, institutional tool for reflective leadership development. 
          Responses are collected confidentially and handled with utmost care.
        </p>
      </div>
    </div>
  );
}
