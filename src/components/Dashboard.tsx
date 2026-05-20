import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ListTodo,
  TrendingUp
} from 'lucide-react';
import type { Task } from '@/lib/supabase';
import { isBefore, startOfDay } from 'date-fns';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Cell 
} from 'recharts';

interface DashboardProps {
  tasks: Task[];
}

export function Dashboard({ tasks }: DashboardProps) {
  const stats = {
    total: tasks.length,
    completed: tasks.filter(t => t.status === 'Done').length,
    overdue: tasks.filter(t => t.status !== 'Done' && t.due_date && isBefore(new Date(t.due_date), startOfDay(new Date()))).length,
    dueToday: tasks.filter(t => {
      if (!t.due_date) return false;
      const dueDate = new Date(t.due_date);
      const today = startOfDay(new Date());
      return dueDate >= today && dueDate < new Date(today.getTime() + 24 * 60 * 60 * 1000);
    }).length
  };

  const chartData = [
    { name: 'Todo', value: tasks.filter(t => t.status === 'Todo').length, color: 'hsl(var(--muted-foreground))' },
    { name: 'In Progress', value: tasks.filter(t => t.status === 'In Progress').length, color: 'hsl(var(--primary))' },
    { name: 'Done', value: tasks.filter(t => t.status === 'Done').length, color: 'hsl(var(--success, 142 71% 45%))' },
  ];

  const statCards = [
    { label: 'Total Tasks', value: stats.total, icon: ListTodo, color: 'text-blue-500', bg: 'bg-blue-50' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-50' },
    { label: 'Overdue', value: stats.overdue, icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-50' },
    { label: 'Due Today', value: stats.dueToday, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h2 className="text-3xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">Here's an overview of your tasks and productivity.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Card key={stat.label} className="border-none shadow-sm bg-card hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className={`${stat.bg} p-2 rounded-full`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground mt-1">
                {stat.label === 'Completed' && stats.total > 0 
                  ? `${Math.round((stats.completed / stats.total) * 100)}% completion rate`
                  : 'Current status'
                }
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-4 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Task Distribution
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px] pl-2">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <XAxis 
                  dataKey="name" 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                />
                <YAxis 
                  stroke="#888888" 
                  fontSize={12} 
                  tickLine={false} 
                  axisLine={false} 
                  tickFormatter={(value) => `${value}`}
                />
                <Tooltip 
                  cursor={{fill: 'hsl(var(--muted)/0.3)'}}
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="col-span-3 border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Priority Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['Critical', 'High', 'Medium', 'Low'].map((p) => {
                const count = tasks.filter(t => t.priority === p).length;
                const percentage = tasks.length > 0 ? (count / tasks.length) * 100 : 0;
                return (
                  <div key={p} className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{p}</span>
                      <span className="text-muted-foreground">{count} tasks</span>
                    </div>
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${
                          p === 'Critical' ? 'bg-red-500' : 
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
      </div>
    </div>
  );
}
