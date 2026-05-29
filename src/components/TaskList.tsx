import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabase';
import type { Task } from '@/lib/supabase';
import { format, isBefore, startOfDay } from 'date-fns';
import { Clock, Trash2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onRefresh?: () => void;
  onTagClick?: (tag: string) => void;
}

export function TaskList({ tasks, onTaskClick, onRefresh, onTagClick }: TaskListProps) {
  const priorityColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-300 dark:border-red-900/50',
    High: 'bg-orange-100 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-300 dark:border-orange-900/50',
    Medium: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-900/50',
    Low: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/40 dark:text-slate-300 dark:border-slate-700/50',
  };

  const statusColors = {
    Todo: 'bg-muted text-muted-foreground',
    'In Progress': 'bg-blue-500 text-white',
    Done: 'bg-green-500 text-white',
  };

  const handleToggleComplete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // Prevent opening the edit dialog
    const newStatus = task.status === 'Done' ? 'Todo' : 'Done';
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', task.id);
      
      if (error) throw error;
      toast.success(newStatus === 'Done' ? 'Handl completed!' : 'Handl updated');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error updating status:', err);
      toast.error('Failed to update status');
    }
  };

  const handleDelete = async (e: React.MouseEvent, task: Task) => {
    e.stopPropagation(); // Prevent opening the edit dialog
    if (!confirm('Are you sure you want to delete this handl?')) return;
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);
      
      if (error) throw error;
      toast.success('Handl deleted successfully');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error('Error deleting handl:', err);
      toast.error('Failed to delete handl');
    }
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[50px]"></TableHead>
            <TableHead className="w-[380px]">Handl</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right w-[80px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isCompleted = task.status === 'Done';
            const isOverdue = task.due_date && 
              !isCompleted && 
              isBefore(new Date(task.due_date), startOfDay(new Date()));

            return (
              <TableRow 
                key={task.id} 
                className={`cursor-pointer hover:bg-muted/30 group transition-colors ${isCompleted ? 'opacity-70' : ''}`}
                onClick={() => onTaskClick(task)}
              >
                <TableCell className="py-3 pl-4 pr-0">
                  <button
                    onClick={(e) => handleToggleComplete(e, task)}
                    className="flex items-center justify-center h-5 w-5 rounded-full hover:scale-105 transition-transform duration-200 focus:outline-none"
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 fill-green-500" />
                    ) : (
                      <Circle className="h-5 w-5 text-muted-foreground/30 hover:text-primary transition-colors" />
                    )}
                  </button>
                </TableCell>
                <TableCell className="py-3">
                  <div className="flex flex-col gap-1">
                    <span className={`font-semibold group-hover:text-primary transition-all duration-200 ${isCompleted ? 'line-through text-muted-foreground/60' : ''}`}>
                      {task.title}
                    </span>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {task.tags.map(tag => (
                          <span 
                            key={tag} 
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onTagClick) onTagClick(tag);
                            }}
                            className="text-[10px] text-muted-foreground px-1.5 py-0.5 bg-muted rounded hover:bg-primary/10 hover:text-primary transition-all cursor-pointer"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="secondary" className={`${statusColors[task.status]} border-none text-[11px]`}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  <Badge variant="outline" className={`${priorityColors[task.priority]} text-[11px]`}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell className="py-3">
                  {task.due_date ? (
                    <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(task.due_date), 'PPP')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right py-3 pr-4">
                  <div className="flex items-center justify-end">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-200 rounded-lg"
                      onClick={(e) => handleDelete(e, task)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                No handls found. Create one to get started!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
