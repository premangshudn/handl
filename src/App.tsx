import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/supabase';
import { Auth } from '@/components/Auth';
import { Layout } from '@/components/Layout';
import { Dashboard } from '@/components/Dashboard';
import { KanbanBoard } from '@/components/KanbanBoard';
import { TaskList } from '@/components/TaskList';
import { TaskDialog } from '@/components/TaskDialog';
import { Toaster } from '@/components/ui/sonner';
import { Loader2 } from 'lucide-react';
import type { Session } from '@supabase/supabase-js';

type ViewType = 'dashboard' | 'kanban' | 'list';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [activeView, setActiveView] = useState<ViewType>('dashboard');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [defaultStatus, setDefaultStatus] = useState<Task['status']>('Todo');
  const [isRecovering, setIsRecovering] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (event === 'PASSWORD_RECOVERY') {
        setIsRecovering(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTasks();
      const preferredView = session.user.user_metadata?.default_view as ViewType;
      if (preferredView && ['dashboard', 'kanban', 'list'].includes(preferredView)) {
        setActiveView(preferredView);
      }
    }
  }, [session]);

  const handleProfileUpdate = async () => {
    try {
      // Force Supabase to refresh the session token so it contains the fresh user_metadata
      const { data: { session: newSession } } = await supabase.auth.refreshSession();
      if (newSession) {
        setSession(newSession);
      } else {
        // Fallback to getSession if refreshSession didn't return a new session
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        setSession(currentSession);
      }
      fetchTasks();
      
      const preferredView = (newSession || session)?.user?.user_metadata?.default_view as ViewType;
      if (preferredView && ['dashboard', 'kanban', 'list'].includes(preferredView)) {
        setActiveView(preferredView);
      }
    } catch (err) {
      console.error('Error refreshing session:', err);
    }
  };

  const fetchTasks = async () => {
    if (!session?.user?.id) return;
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', session.user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTasks(data || []);
    } catch (error) {
      console.error('Error fetching tasks:', error);
    }
  };

  const handleAddTask = (status: Task['status'] = 'Todo') => {
    setSelectedTask(null);
    setDefaultStatus(status);
    setIsDialogOpen(true);
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setIsDialogOpen(true);
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isRecovering) {
    return (
      <>
        <Auth mode="reset" onResetSuccess={() => setIsRecovering(false)} />
        <Toaster position="top-center" />
      </>
    );
  }

  if (!session) {
    return (
      <>
        <Auth mode="auth" />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <Layout 
        session={session} 
        activeView={activeView} 
        setActiveView={setActiveView}
        onAddTask={() => handleAddTask()}
        onProfileUpdate={handleProfileUpdate}
      >
        <div className="max-w-7xl mx-auto h-full">
          {activeView === 'dashboard' && (
            <Dashboard 
              tasks={tasks} 
              session={session} 
              onRefresh={fetchTasks} 
            />
          )}
          {activeView === 'kanban' && (
            <KanbanBoard 
              tasks={tasks} 
              onTaskClick={handleEditTask} 
              onAddTask={handleAddTask}
            />
          )}
          {activeView === 'list' && (
            <TaskList 
              tasks={tasks} 
              onTaskClick={handleEditTask} 
            />
          )}
        </div>
      </Layout>

      <TaskDialog 
        open={isDialogOpen} 
        onOpenChange={setIsDialogOpen} 
        task={selectedTask}
        defaultStatus={defaultStatus}
        onRefresh={fetchTasks}
      />
      
      <Toaster position="top-right" closeButton richColors />
    </>
  );
}
