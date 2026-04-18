import { useQueryClient } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useGetCurrentUser, useLogout, getGetCurrentUserQueryKey } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const { data: user } = useGetCurrentUser();
  const logout = useLogout();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
        setLocation("/");
      },
    });
  };

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-serif font-bold text-lg leading-none">U</span>
              </div>
              <span className="font-serif font-semibold text-lg hidden sm:inline-block tracking-tight text-foreground">
                Universität Basel
              </span>
            </Link>
            
            {user && (
              <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
                {user.role === "manager" || user.role === "admin" ? (
                  <>
                    <Link
                      href="/dashboard"
                      className={`px-4 py-2 rounded-md transition-colors hover:text-foreground/80 hover:bg-accent/50 ${
                        location.startsWith("/dashboard") ? "bg-accent text-accent-foreground" : "text-foreground/60"
                      }`}
                    >
                      Dashboard
                    </Link>
                    <Link
                      href="/cases"
                      className={`px-4 py-2 rounded-md transition-colors hover:text-foreground/80 hover:bg-accent/50 ${
                        location.startsWith("/cases") ? "bg-accent text-accent-foreground" : "text-foreground/60"
                      }`}
                    >
                      Cases
                    </Link>
                  </>
                ) : null}
                
                {user.role === "participant" && (
                  <Link
                    href="/my-assessments"
                    className={`px-4 py-2 rounded-md transition-colors hover:text-foreground/80 hover:bg-accent/50 ${
                      location.startsWith("/my-assessments") ? "bg-accent text-accent-foreground" : "text-foreground/60"
                    }`}
                  >
                    My Assessments
                  </Link>
                )}
              </nav>
            )}
          </div>

          <div className="flex items-center gap-4">
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9 border border-border">
                      <AvatarFallback className="bg-primary/10 text-primary font-medium">
                        {user.name.split(" ").map(n => n[0]).join("").substring(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <div className="px-2 py-1.5">
                    <div className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wider">Role</div>
                    <div className="text-sm capitalize">{user.role}</div>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer focus:bg-destructive/10 focus:text-destructive">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border bg-background py-8 mt-auto">
        <div className="container mx-auto px-4 text-center md:text-left md:flex justify-between items-center text-sm text-muted-foreground">
          <p>Leadership Assessment Platform &copy; {new Date().getFullYear()}</p>
          <div className="flex items-center justify-center gap-4 mt-4 md:mt-0">
            <span>Universität Basel</span>
            <span className="w-1 h-1 rounded-full bg-border" />
            <span>Center for Leadership</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
