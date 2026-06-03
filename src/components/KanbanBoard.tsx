import type { Task } from '@/lib/supabase';
import { TaskCard } from './TaskCard';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface KanbanBoardProps {
  tasks: Task[];
  onTaskClick: (task: Task) => void;
  onAddTask: (status: Task['status']) => void;
  onTagClick?: (tag: string) => void;
}

export function KanbanBoard({ tasks, onTaskClick, onAddTask, onTagClick }: KanbanBoardProps) {
  const columns = [
    { 
      title: 'Pending', 
      key: 'Pending',
      color: 'bg-muted/30',
      filter: (t: Task) => t.status !== 'Done',
      onAddStatus: 'Todo' as Task['status']
    },
    { 
      title: 'Done', 
      key: 'Done',
      color: 'bg-green-500/5 border-green-500/10',
      filter: (t: Task) => t.status === 'Done',
      onAddStatus: 'Done' as Task['status']
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full min-h-[500px]">
      {columns.map((column) => (
        <div key={column.key} className={`flex flex-col gap-4 p-5 rounded-2xl ${column.color} border border-border/50 shadow-sm`}>
          <div className="flex items-center justify-between px-2">
            <div className="flex items-center gap-2">
              <h3 className="font-extrabold text-sm uppercase tracking-wider text-muted-foreground">{column.title}</h3>
              <span className="bg-background text-muted-foreground px-2 py-0.5 rounded-full text-[10px] font-bold border">
                {tasks.filter(column.filter).length}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 text-muted-foreground hover:bg-background/80 rounded-lg"
                onClick={() => onAddTask(column.onAddStatus)}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto pr-1">
            {tasks
              .filter(column.filter)
              .map(task => (
                <TaskCard key={task.id} task={task} onClick={onTaskClick} onTagClick={onTagClick} />
              ))
            }
            {tasks.filter(column.filter).length === 0 && (
              <div className="flex flex-col items-center justify-center py-16 text-muted-foreground border-2 border-dashed border-border/40 rounded-xl bg-background/50">
                <p className="text-xs font-semibold">No Handls in this list</p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

