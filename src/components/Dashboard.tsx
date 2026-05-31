import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Sparkles,
  Send,
  Flame,
  ArrowRight,
  TrendingUp,
  Loader2
} from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { isBefore, startOfDay } from 'date-fns';
import { toast } from 'sonner';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';
import type { Session } from '@supabase/supabase-js';

interface DashboardProps {
  tasks: Task[];
  session: Session | null;
  onRefresh?: () => void;
}

export function Dashboard({ tasks, session, onRefresh }: DashboardProps) {
  const [quickTitle, setQuickTitle] = useState('');
  const [isCapturing, setIsCapturing] = useState(false);

  const meta = session?.user?.user_metadata || {};
  const userEmail = session?.user?.email;

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

  const displayMantra = meta.mantra || "Let's focus on what matters today. Take it one step at a time.";

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

  // 3. Focus of the Day Logic (Top 3 tasks that are high priority or overdue or due today)
  const focusTasks = tasks
    .filter(t => t.status !== 'Done')
    .sort((a, b) => {
      // Sort priority: Critical > High > Medium > Low
      const priorityWeights = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      const weightA = priorityWeights[a.priority] || 2;
      const weightB = priorityWeights[b.priority] || 2;
      
      if (weightB !== weightA) return weightB - weightA;
      
      // Secondary sort: due date nearest first
      if (a.due_date && b.due_date) return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
      if (a.due_date) return -1;
      if (b.due_date) return 1;
      return 0;
    })
    .slice(0, 3);

  // 4. Quick Capture Submit Handler
  const handleQuickCapture = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickTitle.trim()) return;
    setIsCapturing(true);

    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User session not found');

      const { error } = await supabase
        .from('tasks')
        .insert([{
          title: quickTitle.trim(),
          status: 'Todo',
          priority: 'Medium',
          assigned_to: userData.user.id
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

  // Chart data configuration with theme-independent high-contrast colors
  const chartData = [
    { name: 'Todo', count: tasks.filter(t => t.status === 'Todo').length, color: '#94a3b8' }, // Slate 400
    { name: 'In Progress', count: tasks.filter(t => t.status === 'In Progress').length, color: '#3b82f6' }, // Blue 500
    { name: 'Done', count: completedTasks, color: '#10b981' }, // Emerald 500
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-8">
      {/* 1. Dynamic Mindful Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-gradient-to-r from-primary/5 via-primary/10 to-transparent rounded-2xl border border-primary/10">
        <div className="space-y-1">
          <h2 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-foreground via-foreground/90 to-primary bg-clip-text text-transparent">
            {getGreeting()}, {getDisplayName()}
          </h2>
          <p className="text-muted-foreground text-sm flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary animate-pulse" />
            {displayMantra}
          </p>
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
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-4 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Flame className="h-5 w-5 text-primary" />
                    Today's Handls
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Your highest priority and most urgent Handls to complete today.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {focusTasks.length > 0 ? (
                <div className="space-y-4">
                  {focusTasks.map(task => (
                    <div 
                      key={task.id} 
                      className="group flex items-start gap-4 p-4 rounded-xl border bg-background/50 hover:bg-accent/30 hover:border-primary/20 transition-all shadow-sm"
                    >
                      <button
                        onClick={() => handleToggleComplete(task.id)}
                        className="mt-1 h-5 w-5 rounded-md border-2 border-muted-foreground/30 hover:border-primary flex items-center justify-center transition-all bg-background text-transparent hover:text-primary active:scale-90"
                      >
                        <CheckCircle2 className="h-4 w-4 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </button>

                      <div className="flex-1 space-y-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm leading-none text-foreground group-hover:text-primary transition-colors">
                            {task.title}
                          </h4>
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            task.priority === 'Critical' ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                            task.priority === 'High' ? 'bg-orange-500/10 text-orange-500 border border-orange-500/20' :
                            task.priority === 'Medium' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' :
                            'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                          }`}>
                            {task.priority}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-xs text-muted-foreground line-clamp-1">
                            {task.description}
                          </p>
                        )}
                        {task.due_date && (
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground pt-1">
                            <Clock className="h-3 w-3" />
                            <span>Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                            {isBefore(new Date(task.due_date), startOfDay(new Date())) && (
                              <span className="text-red-500 font-bold bg-red-50 px-1.5 py-0.5 rounded text-[9px] uppercase tracking-wide">Overdue</span>
                            )}
                          </div>
                        )}
                      </div>

                      <ArrowRight className="h-4 w-4 text-muted-foreground/30 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all self-center" />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center border-2 border-dashed border-border/60 rounded-xl bg-muted/10">
                  <div className="p-3 bg-primary/10 rounded-full text-primary mb-3">
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-bold text-sm">Clear Mind, Safe Focus</h4>
                  <p className="text-xs text-muted-foreground max-w-xs mt-1">
                    No critical or urgent Handls pending! Capture new notes or take a moment of rest.
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
                {['Critical', 'High', 'Medium', 'Low'].map((p) => {
                  const count = tasks.filter(t => t.priority === p && t.status !== 'Done').length;
                  const percentage = tasks.filter(t => t.status !== 'Done').length > 0 
                    ? (count / tasks.filter(t => t.status !== 'Done').length) * 100 
                    : 0;
                  return (
                    <div key={p} className="space-y-1">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span>{p}</span>
                        <span className="text-muted-foreground">{count} active</span>
                      </div>
                      <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full transition-all duration-500 ${
                            p === 'Critical' ? 'bg-red-500 animate-pulse' : 
                            p === 'High' ? 'bg-orange-500' : 
                            p === 'Medium' ? 'bg-blue-500' : 'bg-slate-400'
                          }`} 
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Task Status Bar Chart Card */}
          <Card className="border shadow-sm bg-card">
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-primary" />
                Handl Distribution
              </CardTitle>
            </CardHeader>
            <CardContent className="h-[180px] pt-4 pl-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ left: -25, right: 10, bottom: 0, top: 0 }}>
                  <XAxis 
                    dataKey="name" 
                    stroke="#94a3b8" 
                    fontSize={11} 
                    fontWeight={600}
                    tickLine={false} 
                    axisLine={false} 
                  />
                  <YAxis 
                    stroke="#94a3b8" 
                    fontSize={10} 
                    tickLine={false} 
                    axisLine={false} 
                    allowDecimals={false}
                  />
                  <Tooltip 
                    cursor={{fill: 'rgba(148, 163, 184, 0.1)'}}
                    contentStyle={{ borderRadius: '12px', border: '1px solid #cbd5e1', boxShadow: '0 4px 12px rgba(0,0,0,0.05)', fontSize: '12px', color: '#1e293b' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
