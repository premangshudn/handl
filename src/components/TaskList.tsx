import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import type { Task } from '@/lib/supabase';
import { format, isBefore, startOfDay } from 'date-fns';
import { Clock, MessageSquare, MoreHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface TaskListProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
}

export function TaskList({ tasks, onTaskClick }: TaskListProps) {
  const priorityColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200',
    Medium: 'bg-blue-100 text-blue-700 border-blue-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const statusColors = {
    Todo: 'bg-muted text-muted-foreground',
    'In Progress': 'bg-blue-500 text-white',
    Done: 'bg-green-500 text-white',
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden shadow-sm overflow-x-auto w-full">
      <Table>
        <TableHeader className="bg-muted/50">
          <TableRow>
            <TableHead className="w-[400px]">Task</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {tasks.map((task) => {
            const isOverdue = task.due_date && 
              task.status !== 'Done' && 
              isBefore(new Date(task.due_date), startOfDay(new Date()));

            return (
              <TableRow 
                key={task.id} 
                className="cursor-pointer hover:bg-muted/30 group"
                onClick={() => onTaskClick(task)}
              >
                <TableCell>
                  <div className="flex flex-col gap-1">
                    <span className="font-semibold group-hover:text-primary transition-colors">{task.title}</span>
                    {task.tags && task.tags.length > 0 && (
                      <div className="flex gap-1">
                        {task.tags.map(tag => (
                          <span key={tag} className="text-[10px] text-muted-foreground px-1 bg-muted rounded">#{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`${statusColors[task.status]} border-none text-[11px]`}>
                    {task.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={`${priorityColors[task.priority]} text-[11px]`}>
                    {task.priority}
                  </Badge>
                </TableCell>
                <TableCell>
                  {task.due_date ? (
                    <div className={`flex items-center gap-1.5 text-sm ${isOverdue ? 'text-red-500 font-medium' : 'text-muted-foreground'}`}>
                      <Clock className="h-3.5 w-3.5" />
                      {format(new Date(task.due_date), 'PPP')}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mr-4">
                      <MessageSquare className="h-3.5 w-3.5" />
                      <span>0</span>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
          {tasks.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                No tasks found. Create one to get started!
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
