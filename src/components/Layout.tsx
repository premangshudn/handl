import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  LayoutDashboard, 
  Kanban, 
  List, 
  LogOut, 
  Plus,
  CheckCircle2,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { ProfileDialog } from '@/components/ProfileDialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel
} from "@/components/ui/dropdown-menu";

interface LayoutProps {
  children: React.ReactNode;
  session: Session | null;
  activeView: 'dashboard' | 'kanban' | 'list';
  setActiveView: (view: 'dashboard' | 'kanban' | 'list') => void;
  onAddTask: () => void;
  onProfileUpdate: () => void;
}

export function Layout({ children, session, activeView, setActiveView, onAddTask, onProfileUpdate }: LayoutProps) {
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) toast.error(error.message);
    else toast.success('Logged out successfully');
  };

  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email;
  const fallbackName = userEmail ? userEmail.split('@')[0].split(/[._-]/)[0] : 'U';
  const defaultDisplayName = fallbackName.charAt(0).toUpperCase() + fallbackName.slice(1);
  const displayName = meta.display_name || defaultDisplayName;
  const avatarUrl = meta.avatar_url || '';

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'kanban', label: 'Focus Board', icon: Kanban },
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
          <h1 className="text-xl font-bold tracking-tight">Handl</h1>
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
            <h1 className="text-xl font-bold">Handl</h1>
          </div>
          
          <div className="hidden md:block">
            <h2 className="text-sm font-medium text-muted-foreground capitalize">
              {activeView === 'kanban' ? 'Focus Board' : activeView}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 pr-4 border-r cursor-pointer hover:opacity-85 transition-opacity focus:outline-none text-left">
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold leading-none">{displayName}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{userEmail}</p>
                  </div>
                  <Avatar className="h-8 w-8 border shadow-sm">
                    {avatarUrl ? (
                      <AvatarImage src={avatarUrl} alt={displayName} className="object-cover" />
                    ) : (
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {userEmail?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    )}
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-xl shadow-md">
                <DropdownMenuLabel className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">
                  Personal Account
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setIsProfileOpen(true)} className="rounded-lg cursor-pointer flex items-center gap-2 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>Edit Profile</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="rounded-lg cursor-pointer text-red-500 hover:text-red-600 focus:text-red-600 flex items-center gap-2 py-2">
                  <LogOut className="h-4 w-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 pb-24 md:pb-8">
          {children}
        </main>

        {/* Mobile Bottom Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 flex items-center justify-around px-2 z-40 pb-safe shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveView(item.id)}
              className={`flex flex-col items-center justify-center gap-1 w-16 h-full transition-colors ${
                activeView === item.id 
                  ? 'text-primary' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="text-[10px] font-semibold">{item.label}</span>
            </button>
          ))}
          <button
            onClick={onAddTask}
            className="flex flex-col items-center justify-center gap-1 w-16 h-full text-muted-foreground hover:text-foreground"
          >
            <div className="bg-primary text-primary-foreground p-1.5 rounded-full shadow-md hover:bg-primary/95 transition-colors">
              <Plus className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-semibold">New Task</span>
          </button>
        </nav>

        {/* Profile Settings Modal Portal */}
        <ProfileDialog 
          open={isProfileOpen} 
          onOpenChange={setIsProfileOpen} 
          user={session?.user || null} 
          onUpdate={onProfileUpdate} 
        />
      </div>
    </div>
  );
}
