import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import type { Task } from '@/lib/supabase';
import { Clock, MessageSquare, Tag } from 'lucide-react';
import { format, isBefore, startOfDay } from 'date-fns';

interface TaskCardProps {
  task: Task;
  onClick: (task: Task) => void;
}

export function TaskCard({ task, onClick }: TaskCardProps) {
  const isOverdue = task.due_date && 
    task.status !== 'Done' && 
    isBefore(new Date(task.due_date), startOfDay(new Date()));

  const priorityColors = {
    Critical: 'bg-red-100 text-red-700 border-red-200 hover:bg-red-200',
    High: 'bg-orange-100 text-orange-700 border-orange-200 hover:bg-orange-200',
    Medium: 'bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200',
    Low: 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200',
  };

  return (
    <Card 
      onClick={() => onClick(task)}
      className="p-4 cursor-pointer hover:shadow-md transition-all border-none shadow-sm ring-1 ring-border group"
    >
      <div className="space-y-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={`${priorityColors[task.priority]} font-semibold text-[10px] uppercase tracking-wider px-2 py-0`}>
            {task.priority}
          </Badge>
          {task.due_date && (
            <div className={`flex items-center gap-1 text-[11px] font-medium ${isOverdue ? 'text-red-500' : 'text-muted-foreground'}`}>
              <Clock className="h-3 w-3" />
              {format(new Date(task.due_date), 'MMM d')}
            </div>
          )}
        </div>

        <h4 className="font-semibold text-sm leading-tight group-hover:text-primary transition-colors">
          {task.title}
        </h4>

        {task.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
            {task.description}
          </p>
        )}

        <div className="flex items-center gap-3 pt-1 border-t">
          {task.tags && task.tags.length > 0 && (
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Tag className="h-3 w-3" />
              {task.tags[0]}
              {task.tags.length > 1 && `+${task.tags.length - 1}`}
            </div>
          )}
          <div className="flex items-center gap-1 text-[10px] text-muted-foreground ml-auto">
            <MessageSquare className="h-3 w-3" />
            <span>2</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
