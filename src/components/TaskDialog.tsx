import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import type { Task } from '@/lib/supabase';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Loader2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  mapDBPriorityToForm, 
  mapFormPriorityToDB, 
  mapDBStatusToForm, 
  mapFormStatusToDB 
} from '@/lib/taskUtils';

const taskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(150, 'Title must be under 150 characters'),
  description: z.string().max(3000, 'Description must be under 3000 characters').optional(),
  priority: z.enum(['Later', 'Immediate']),
  status: z.enum(['Pending', 'Done']),
  due_date: z.string().optional(),
  tags: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskSchema>;


interface TaskDialogProps {
  task?: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefresh: () => void;
  defaultStatus?: Task['status'];
  minPosition?: number;
}

export function TaskDialog({ task, open, onOpenChange, onRefresh, defaultStatus, minPosition }: TaskDialogProps) {
  const form = useForm<TaskFormValues>({
    resolver: zodResolver(taskSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'Later',
      status: defaultStatus ? mapDBStatusToForm(defaultStatus) : 'Pending',
      due_date: '',
      tags: '',
    },
  });

  useEffect(() => {
    if (task) {
      form.reset({
        title: task.title,
        description: task.description || '',
        priority: mapDBPriorityToForm(task.priority),
        status: mapDBStatusToForm(task.status),
        due_date: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        tags: task.tags?.join(', ') || '',
      });
    } else {
      form.reset({
        title: '',
        description: '',
        priority: 'Later',
        status: defaultStatus ? mapDBStatusToForm(defaultStatus) : 'Pending',
        due_date: '',
        tags: '',
      });
    }
  }, [task, open, defaultStatus, form]);

  const onSubmit = async (values: TaskFormValues) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) throw new Error('User not authenticated');

      if (task) {
        const updateData = {
          title: values.title,
          description: values.description,
          priority: mapFormPriorityToDB(values.priority),
          status: mapFormStatusToDB(values.status),
          due_date: values.due_date ? new Date(values.due_date + 'T12:00:00').toISOString() : null,
          tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          assigned_to: task.assigned_to, // Preserve original assignee
        };

        const { error } = await supabase
          .from('tasks')
          .update(updateData)
          .eq('id', task.id);
        if (error) throw error;
        toast.success('Handl updated successfully');
      } else {
        const insertData = {
          title: values.title,
          description: values.description,
          priority: mapFormPriorityToDB(values.priority),
          status: mapFormStatusToDB(values.status),
          due_date: values.due_date ? new Date(values.due_date + 'T12:00:00').toISOString() : null,
          tags: values.tags ? values.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
          assigned_to: userData.user.id, // Set initial assignee to creator
          position: typeof minPosition === 'number' ? minPosition - 1000.0 : 0.0,
        };

        const { error } = await supabase
          .from('tasks')
          .insert([insertData]);
        if (error) throw error;
        toast.success('Handl created successfully');
      }

      onRefresh();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const onDelete = async () => {
    if (!task) return;
    if (!confirm('Are you sure you want to delete this handl?')) return;

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', task.id);
      if (error) throw error;
      toast.success('Handl deleted successfully');
      onRefresh();
      onOpenChange(false);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto"
        onOpenAutoFocus={(e) => {
          const isMobileTouch = typeof window !== 'undefined' && (
            window.matchMedia('(pointer: coarse)').matches || 
            window.matchMedia('(max-width: 768px)').matches
          );
          if (isMobileTouch) {
            e.preventDefault();
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>{task ? 'Edit Handl' : 'Create New Handl'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Call Mom to catch up..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add more details about this handl..." 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Done">Done</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Later">Later</SelectItem>
                        <SelectItem value="Immediate">Immediate</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="due_date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel className="mb-1">Due Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal rounded-xl h-10 border shadow-inner bg-background/50 hover:bg-background transition-colors flex items-center justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            <span>
                              {field.value ? (
                                format(new Date(field.value + 'T12:00:00'), "PPP")
                              ) : (
                                "Pick a date"
                              )}
                            </span>
                            <CalendarIcon className="h-4 w-4 opacity-50 text-muted-foreground" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 rounded-2xl shadow-xl border bg-card" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value ? new Date(field.value + 'T12:00:00') : undefined}
                          onSelect={(date) => field.onChange(date ? format(date, "yyyy-MM-dd") : "")}
                          disabled={(date) => date < startOfDay(new Date())}
                          initialFocus
                          className="rounded-2xl"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags (comma separated)</FormLabel>
                    <FormControl>
                      <Input placeholder="work, urgent" {...field} className="rounded-xl shadow-inner bg-background/50" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              {task && (
                <Button 
                  type="button" 
                  variant="destructive" 
                  onClick={onDelete}
                  className="mr-auto"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              )}
              <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">
                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {task ? 'Update Handl' : 'Create Handl'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
