import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Send,
  Flame,
  ArrowRight,
  Loader2
} from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import type { Session } from '@supabase/supabase-js';
import { getFocusTasks } from '@/lib/taskUtils';

interface DashboardProps {
  tasks: Task[];
  session: Session | null;
  onRefresh?: () => void;
  onTaskClick?: (task: Task) => void;
}

export function Dashboard({ tasks, session, onRefresh, onTaskClick }: DashboardProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email;

  const [mantra, setMantra] = useState(meta.mantra || "Let's focus on what matters today. Take it one step at a time.");
  const [isEditingMantra, setIsEditingMantra] = useState(false);
  const [isSavingMantra, setIsSavingMantra] = useState(false);

  useEffect(() => {
    setMantra(meta.mantra || "Let's focus on what matters today. Take it one step at a time.");
  }, [meta.mantra]);

  const handleMantraBlur = async () => {
    setIsEditingMantra(false);
    const cleanMantra = mantra.trim();
    if (cleanMantra === (meta.mantra || "Let's focus on what matters today. Take it one step at a time.")) return;
    
    setIsSavingMantra(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { mantra: cleanMantra }
      });
      if (error) throw error;
      toast.success('Mantra updated!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      toast.error('Failed to update mantra');
      setMantra(meta.mantra || "Let's focus on what matters today. Take it one step at a time.");
    } finally {
      setIsSavingMantra(false);
    }
  };

  // 1. Mindful Greetings Logic
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getDisplayName = () => {
    if (meta.display_name) return meta.display_name;
    if (!userEmail) return 'there';
    const prefix = userEmail.split('@')[0];
    const rawName = prefix.split(/[._-]/)[0];
    return rawName.charAt(0).toUpperCase() + rawName.slice(1);
  };

  // mantra text is managed via state to support direct inline editing

  // 2. Statistics Calculations
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Done').length;
  const overdueTasks = tasks.filter(t => t.status !== 'Done' && t.due_date && isBefore(new Date(t.due_date), startOfDay(new Date()))).length;
  
  const dueTodayTasks = tasks.filter(t => {
    if (!t.due_date || t.status === 'Done') return false;
    const dueDate = new Date(t.due_date);
    const today = startOfDay(new Date());
    return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
  }).length;

  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // 3. Focus of the Day Logic (Top 3 tasks: Immediate or due today/overdue)
  const focusTasks = getFocusTasks(tasks).slice(0, 3);

  // 4. Quick Capture Submit Handler
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setIsCapturing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User session not found');

      const minPosition = tasks.length > 0 ? Math.min(...tasks.map(t => t.position || 0.0)) : 0.0;

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: quickTitle.trim(),
          status: 'Todo',
          priority: 'Medium',
          assigned_to: userData.user.id,
          position: minPosition - 1000.0
        }]);

      if (error) throw error;

      toast.success('Handl captured!');
      setQuickTitle('');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to capture Handl');
    } finally {
      setIsCapturing(false);
    }
  };

  // 5. Complete Task directly from Dashboard
  const handleToggleComplete = async (taskId: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: 'Done' })
        .eq('id', taskId);

      if (error) throw error;
      toast.success('Handl completed! Keep up the momentum.');
      if (onRefresh) onRefresh();
    } catch (error: any) {
      toast.error(error.message || 'Failed to update Handl');
    }
  };



  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* 1. Dynamic Mindful Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border border-primary/10">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            {getGreeting()}, {getDisplayName()}
          </h2>
          {isEditingMantra ? (
            <input
              type="text"
              value={mantra}
              onChange={(e) => setMantra(e.target.value)}
              onBlur={handleMantraBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleMantraBlur();
                if (e.key === 'Escape') {
                  setIsEditingMantra(false);
                  setMantra(meta.mantra || "Let's focus on what matters today. Take it one step at a time.");
                }
              }}
              autoFocus
              className="text-muted-foreground text-sm bg-transparent border-b border-primary/45 focus:outline-none focus:border-primary w-full max-w-md py-0.5 animate-in fade-in duration-200"
              maxLength={80}
              disabled={isSavingMantra}
            />
          ) : (
            <p 
              onClick={() => setIsEditingMantra(true)}
              className="text-muted-foreground text-sm flex items-center gap-1.5 cursor-pointer hover:text-foreground transition-colors group/mantra select-none"
              title="Click to edit your daily mantra"
            >
              <Sparkles className="h-4 w-4 text-primary animate-pulse shrink-0" />
              <span>{mantra}</span>
              <span className="text-[10px] text-muted-foreground/0 group-hover/mantra:text-muted-foreground/50 transition-opacity ml-1 font-semibold select-none">(edit)</span>
            </p>
          )}
        </div>
        {totalTasks > 0 && (
          <div className="flex items-center gap-3 bg-background/50 backdrop-blur-sm border px-4 py-2.5 rounded-xl shadow-sm">
            <div className="flex flex-col text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Handl Streak</span>
              <span className="text-sm font-bold flex items-center gap-1 justify-end">
                <Flame className="h-4 w-4 text-orange-500 fill-orange-500" />
                {completedTasks} handled
              </span>
            </div>
            <div className="h-8 w-[1px] bg-border" />
            <div className="flex items-center justify-center font-extrabold text-lg text-primary">
              {completionRate}%
            </div>
          </div>
        )}
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Side: Actions & Focus (8 Columns) */}
        <div className="lg:col-span-8 space-y-8">
          
           {/* Quick Capture Inbox Form */}
          <Card className="border shadow-sm overflow-hidden bg-card/65 backdrop-blur-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Quick Capture
              </CardTitle>
              <CardDescription className="text-xs">
                Dump your thoughts instantly. Captured Handls go straight to your Handl List.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleQuickCapture} className="flex gap-2">
                <input
                  type="text"
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="Type to handle it later..."
                  className="flex-1 bg-background/80 border rounded-xl px-4 py-2 text-base md:text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                  disabled={isCapturing}
                />
                <button
                  type="submit"
                  disabled={!quickTitle.trim() || isCapturing}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-3 sm:px-4 py-2 rounded-xl text-sm flex items-center gap-1.5 transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:pointer-events-none"
                >
                  {isCapturing ? (
                     <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      <span className="hidden sm:inline">Capture</span>
                    </>
                  )}
                </button>
              </form>
            </CardContent>
          </Card>

          {/* Focus of the Day Checklist */}
          <Card className="border shadow-sm bg-card gap-0 pb-4">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" />
                    Handl Today
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Priority items and Handls due today.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              {focusTasks.length > 0 ? (
                <div className="space-y-4">
                  {focusTasks.map(task => {
                    const dueDateObj = task.due_date ? new Date(task.due_date) : null;
                    const isImmediate = task.priority === 'Critical' || task.priority === 'High';
                    const isOverdue = dueDateObj && isBefore(dueDateObj, startOfDay(new Date()));
                    const isDueToday = dueDateObj && (() => {
                      const dueDate = startOfDay(dueDateObj);
                      const today = startOfDay(new Date());
                      return dueDate.getTime() === today.getTime();
                    })();
                    const isAlertActive = !!isOverdue || !!isDueToday;
                    const animationClass = isAlertActive ? 'animate-pulse' : '';
                    const showPriorityBadge = !isOverdue;
                    const badgeText = isDueToday ? 'Due Today' : (isImmediate ? 'Now' : 'Later');
                    const badgeColorClass = isImmediate 
                      ? 'bg-orange-600 text-white border-transparent' 
                      : isDueToday 
                        ? 'bg-amber-500 text-white border-transparent' 
                        : 'bg-slate-400 dark:bg-slate-500 text-white border-transparent';
                    const showDueDate = task.due_date && !isDueToday;

                    return (
                      <div 
                        key={task.id} 
                        className="group flex items-start gap-4 p-4 rounded-xl border bg-background/50 hover:bg-accent/30 hover:border-primary/20 transition-all shadow-sm cursor-pointer"
                        onClick={() => onTaskClick?.(task)}
                      >
                        <div className="flex items-center gap-1.5 mt-0.5 shrink-0">
                          <div className="w-1.5 h-1.5 flex items-center justify-center shrink-0">
                            {isAlertActive && (
                              <span 
                                className={`h-1.5 w-1.5 rounded-full shrink-0 ${
                                  isOverdue 
                                    ? 'bg-red-500 animate-soft-glow-red' 
                                    : isImmediate
                                      ? 'bg-orange-600 animate-soft-glow-orange'
                                      : 'bg-amber-500 animate-soft-glow-amber'
                                }`}
                                title={isOverdue ? "Overdue Handl" : "Handl Alert"}
                              />
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleComplete(task.id);
                            }}
                            className="h-5 w-5 rounded-md border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-all bg-background text-transparent hover:text-primary active:scale-90"
                          >
                            <CheckCircle2 className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                          </button>
                        </div>

                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-semibold text-sm leading-snug text-foreground group-hover:text-primary transition-colors">
                              {task.title}
                            </h4>
                            {showPriorityBadge && (
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${badgeColorClass} ${animationClass}`}>
                                {badgeText}
                              </span>
                            )}
                          </div>
                            {task.description && (
                              <p className="text-xs text-muted-foreground line-clamp-1">
                                {task.description}
                              </p>
                            )}
                            {showDueDate && dueDateObj && (
                              <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                                <Clock className="h-3 w-3" />
                                <span>Due: {dueDateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                                {isOverdue && (
                                  <span className="text-white font-bold bg-red-500 px-1.5 py-0.5 rounded-md text-[9px] uppercase tracking-wide animate-pulse">Overdue</span>
                                )}
                              </div>
                            )}
                          </div>

                        <ArrowRight className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all self-center" />
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm">All Clear for Today</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    No priority items or Handls due today. Take a mindful breath, or capture something new.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Side: Mindful Stats & Distribution (4 Columns) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Quick Metrics Grid */}
          <div className="grid grid-cols-3 gap-4">
            
            <div className="bg-card border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Due Today</span>
              <span className="text-xl font-extrabold mt-1 text-amber-500">{dueTodayTasks}</span>
              <Clock className="h-3.5 w-3.5 text-amber-500/50 mt-1" />
            </div>

            <div className="bg-card border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Overdue</span>
              <span className="text-xl font-extrabold mt-1 text-red-500">{overdueTasks}</span>
              <AlertCircle className="h-3.5 w-3.5 text-red-500/50 mt-1" />
            </div>

            <div className="bg-card border rounded-xl p-3 flex flex-col items-center justify-center text-center shadow-sm hover:shadow-md transition-shadow">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">Completed</span>
              <span className="text-xl font-extrabold mt-1 text-green-500">{completedTasks}</span>
              <CheckCircle2 className="h-3.5 w-3.5 text-green-500/50 mt-1" />
            </div>

          </div>

          {/* Priority breakdown card */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Priority Breakdown</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3.5">
                {[
                  { key: 'Now', label: 'Now', colors: 'bg-orange-600 animate-pulse', dbKeys: ['Critical', 'High'] },
                  { key: 'Later', label: 'Later', colors: 'bg-slate-500', dbKeys: ['Medium', 'Low'] },
                ].map((item) => {
                  const activeTasks = tasks.filter(t => t.status !== 'Done');
                  const count = activeTasks.filter(t => item.dbKeys.includes(t.priority)).length;
                  const percentage = activeTasks.length > 0 ? (count / activeTasks.length) * 100 : 0;
                  return (
                    <div key={item.key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{item.label}</span>
                        <span className="text-muted-foreground">{count} active</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${item.colors}`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>



        </div>

      </div>
    </div>
  );
}
