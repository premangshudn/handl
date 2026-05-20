import type { Task } from '@/lib/supabase';
import { TaskCard } from './TaskCard';
import { MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Task['status']) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onAddTask }: KanbanBoardProps) {
  const columns: { title: string; status: Task['status']; color: string }[] = [
    { title: 'Todo', status: 'Todo', color: 'bg-muted/50' },
    { title: 'In Progress', status: 'In Progress', color: 'bg-blue-50/50' },
    { title: 'Done', status: 'Done', color: 'bg-green-50/50' },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-full min-h-[500px]">
      {columns.map((column) => (
        <div key={column.status} className={`flex flex-col gap-4 p-4 rounded-xl ${column.color} border border-border/50`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm uppercase tracking-wider">{column.title}</h3>
              <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-bold border">
                {tasks.filter(t => t.status === column.status).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground"
                onClick={() => onAddTask(column.status)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto">
            {tasks
              .filter(t => t.status === column.status)
              .map(task => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} />
              ))
            }
            {tasks.filter(t => t.status === column.status).length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border-2 border-dashed border-border/50 rounded-xl bg-background/50">
                <p className="text-xs font-medium">No tasks here</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
