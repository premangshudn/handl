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

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
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

  if (!session) {
    return (
      <>
        <Auth />
        <Toaster position="top-center" />
      </>
    );
  }

  return (
    <>
      <Layout 
        userEmail={session.user.email} 
        activeView={activeView} 
        setActiveView={setActiveView}
        onAddTask={() => handleAddTask()}
      >
        <div className="max-w-7xl mx-auto h-full">
          {activeView === 'dashboard' && <Dashboard tasks={tasks} />}
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
