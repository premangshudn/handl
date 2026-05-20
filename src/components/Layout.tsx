import React from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Kanban, 
  List, 
  LogOut, 
  Plus,
  CheckCircle2
} from 'lucide-react';
import { toast } from 'sonner';

interface LayoutProps {
  children: React.ReactNode;
  userEmail: string | undefined;
  activeView: 'dashboard' | 'kanban' | 'list';
  setActiveView: (view: 'dashboard' | 'kanban' | 'list') => void;
  onAddTask: () => void;
}

export function Layout({ children, userEmail, activeView, setActiveView, onAddTask }: LayoutProps) {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success('Logged out successfully');
  };

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Kanban Board', icon: Kanban },
    { id: 'list', label: 'Task List', icon: List },
  ] as const;

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-muted/30 hidden md:flex flex-col">
        <div className="p-6 flex items-center gap-2">
          <div className="bg-primary p-1.5 rounded-lg">
            <CheckCircle2 className="h-6 w-6 text-primary-foreground" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">TaskFlow</h1>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                activeView === item.id 
                  ? 'bg-primary text-primary-foreground' 
                  : 'hover:bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-4 w-4" />
              <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t mt-auto">
          <Button onClick={onAddTask} className="w-full gap-2 shadow-md">
            <Plus className="h-4 w-4" /> New Task
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Navbar */}
        <header className="h-16 border-b flex items-center justify-between px-6 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
          <div className="md:hidden flex items-center gap-2">
            <CheckCircle2 className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">TaskFlow</h1>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-muted-foreground capitalize">
              {activeView}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3 pr-4 border-r">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{userEmail?.split('@')[0]}</p>
                <p className="text-xs text-muted-foreground">{userEmail}</p>
              </div>
              <Avatar className="h-8 w-8 border shadow-sm">
                <AvatarFallback className="bg-primary/10 text-primary">
                  {userEmail?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
            </div>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
