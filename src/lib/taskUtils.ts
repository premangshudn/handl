import { isBefore, startOfDay } from 'date-fns';
import type { Task } from './supabase';

/**
 * Calculates the new position value for a task when it is dragged and dropped in the list.
 */
export function calculateNewPosition(dragIndex: number, targetIdx: number, tasks: Task[]): number {
  if (tasks.length === 0) return 0.0;
  
  if (targetIdx === 0) {
    const firstPos = tasks[0].position || 0.0;
    return firstPos - 1000.0;
  }
  
  if (targetIdx === tasks.length - 1) {
    const lastPos = tasks[tasks.length - 1].position || 0.0;
    return lastPos + 1000.0;
  }
  
  if (targetIdx < dragIndex) {
    const prevPos = tasks[targetIdx - 1].position || 0.0;
    const nextPos = tasks[targetIdx].position || 0.0;
    return (prevPos + nextPos) / 2.0;
  } else {
    const prevPos = tasks[targetIdx].position || 0.0;
    const nextPos = tasks[targetIdx + 1].position || 0.0;
    return (prevPos + nextPos) / 2.0;
  }
}

/**
 * Maps database priorities to client-side Form priorities.
 */
export function mapDBPriorityToForm(p: Task['priority']): 'Later' | 'Now' {
  if (p === 'Critical' || p === 'High') return 'Now';
  return 'Later';
}

/**
 * Maps client-side Form priorities to database priorities.
 */
export function mapFormPriorityToDB(p: 'Later' | 'Now'): Task['priority'] {
  return p === 'Now' ? 'Critical' : 'Medium';
}

/**
 * Maps database status to client-side Form status.
 */
export function mapDBStatusToForm(s: Task['status']): 'Active' | 'Done' {
  return s === 'Done' ? 'Done' : 'Active';
}

/**
 * Maps client-side Form status to database status.
 */
export function mapFormStatusToDB(s: 'Active' | 'Done'): Task['status'] {
  return s === 'Done' ? 'Done' : 'Todo';
}

/**
 * Calculates an urgency score for a task (2 = Overdue, 1 = Due Today, 0 = Otherwise).
 */
export function calculateUrgencyScore(task: Task, todayRef: Date = new Date()): number {
  if (!task.due_date || task.status === 'Done') return 0;
  const dueDate = startOfDay(new Date(task.due_date));
  const today = startOfDay(todayRef);
  
  if (isBefore(dueDate, today)) return 2; // Overdue
  
  if (dueDate.getTime() === today.getTime()) return 1; // Due Today
  
  return 0;
}

/**
 * Filters and sorts active tasks for "Today's Handls" focus view.
 */
export function getFocusTasks(tasks: Task[], todayRef: Date = new Date()): Task[] {
  return tasks
    .filter(t => {
      if (t.status === 'Done') return false;
      const isImmediate = t.priority === 'Critical' || t.priority === 'High';
      const hasUrgentDate = calculateUrgencyScore(t, todayRef) > 0;
      return isImmediate || hasUrgentDate;
    })
    .sort((a, b) => {
      // Tier 1: Urgency Score (Overdue > Due Today > No Date)
      const urgencyA = calculateUrgencyScore(a, todayRef);
      const urgencyB = calculateUrgencyScore(b, todayRef);
      if (urgencyB !== urgencyA) return urgencyB - urgencyA;

      // Tier 2: Priority (Now > Later)
      const isImmediateA = a.priority === 'Critical' || a.priority === 'High' ? 1 : 0;
      const isImmediateB = b.priority === 'Critical' || b.priority === 'High' ? 1 : 0;
      if (isImmediateB !== isImmediateA) return isImmediateB - isImmediateA;

      // Tier 3: Position (Manual Sort)
      const posA = a.position || 0.0;
      const posB = b.position || 0.0;
      return posA - posB;
    });
}
