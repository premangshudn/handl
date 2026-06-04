import { describe, it, expect } from 'vitest';
import { 
  calculateNewPosition, 
  mapDBPriorityToForm, 
  mapFormPriorityToDB, 
  mapDBStatusToForm, 
  mapFormStatusToDB,
  calculateUrgencyScore,
  getFocusTasks
} from './taskUtils';
import type { Task } from './supabase';

/**
 * Creates a valid, complete Task mock instance for testing.
 */
const createMockTask = (overrides: Partial<Task>): Task => {
  return {
    id: 'test-id',
    title: 'Test Task',
    description: null,
    priority: 'Medium',
    status: 'Todo',
    due_date: null,
    created_at: '',
    updated_at: '',
    assigned_to: null,
    tags: [],
    position: 0,
    ...overrides
  };
};

describe('taskUtils - priority and status mapping', () => {
  it('should map DB priorities to Form priorities correctly', () => {
    expect(mapDBPriorityToForm('Critical')).toBe('Now');
    expect(mapDBPriorityToForm('High')).toBe('Now');
    expect(mapDBPriorityToForm('Medium')).toBe('Later');
    expect(mapDBPriorityToForm('Low')).toBe('Later');
  });

  it('should map Form priorities to DB priorities correctly', () => {
    expect(mapFormPriorityToDB('Now')).toBe('Critical');
    expect(mapFormPriorityToDB('Later')).toBe('Medium');
  });

  it('should map DB status to Form status correctly', () => {
    expect(mapDBStatusToForm('Done')).toBe('Done');
    expect(mapDBStatusToForm('Todo')).toBe('Pending');
    expect(mapDBStatusToForm('In Progress')).toBe('Pending');
  });

  it('should map Form status to DB status correctly', () => {
    expect(mapFormStatusToDB('Done')).toBe('Done');
    expect(mapFormStatusToDB('Pending')).toBe('Todo');
  });
});

describe('taskUtils - position calculations (reordering)', () => {
  const mockTasks: Task[] = [
    createMockTask({ id: '1', title: 'Task 1', position: 1000.0 }),
    createMockTask({ id: '2', title: 'Task 2', position: 2000.0 }),
    createMockTask({ id: '3', title: 'Task 3', position: 3000.0 }),
  ];

  it('should handle drop at the top', () => {
    const newPos = calculateNewPosition(2, 0, mockTasks);
    expect(newPos).toBe(0.0); // 1000 - 1000
  });

  it('should handle drop at the bottom', () => {
    const newPos = calculateNewPosition(0, 2, mockTasks);
    expect(newPos).toBe(4000.0); // 3000 + 1000
  });

  it('should handle middle drop dragging upwards', () => {
    const newPos = calculateNewPosition(2, 1, mockTasks);
    expect(newPos).toBe(1500.0); // (1000 + 2000) / 2
  });

  it('should handle middle drop dragging downwards', () => {
    const newPos = calculateNewPosition(0, 1, mockTasks);
    expect(newPos).toBe(2500.0); // (2000 + 3000) / 2
  });
});

describe('taskUtils - urgency calculation', () => {
  const todayRef = new Date('2026-06-03T12:00:00');

  it('should return 0 if task has no due date', () => {
    const task = createMockTask({ id: '1', due_date: null });
    expect(calculateUrgencyScore(task, todayRef)).toBe(0);
  });

  it('should return 0 if task is completed', () => {
    const task = createMockTask({ id: '1', status: 'Done', due_date: '2026-06-02T12:00:00' });
    expect(calculateUrgencyScore(task, todayRef)).toBe(0);
  });

  it('should return 2 if task is overdue', () => {
    const task = createMockTask({ id: '1', due_date: '2026-06-02T12:00:00' });
    expect(calculateUrgencyScore(task, todayRef)).toBe(2);
  });

  it('should return 1 if task is due today', () => {
    const task = createMockTask({ id: '1', due_date: '2026-06-03T08:00:00' });
    expect(calculateUrgencyScore(task, todayRef)).toBe(1);
  });

  it('should return 0 if task is due in future', () => {
    const task = createMockTask({ id: '1', due_date: '2026-06-04T12:00:00' });
    expect(calculateUrgencyScore(task, todayRef)).toBe(0);
  });
});

describe('taskUtils - Today\'s Handls focus filtering and sorting', () => {
  const todayRef = new Date('2026-06-03T12:00:00');

  it('should filter out completed tasks', () => {
    const tasks = [
      createMockTask({ id: '1', status: 'Done', priority: 'Critical', due_date: '2026-06-03T12:00:00' })
    ];
    expect(getFocusTasks(tasks, todayRef)).toHaveLength(0);
  });

  it('should filter out future Later-priority tasks', () => {
    const tasks = [
      createMockTask({ id: '1', priority: 'Medium', due_date: '2026-06-05T12:00:00' })
    ];
    expect(getFocusTasks(tasks, todayRef)).toHaveLength(0);
  });

  it('should include Now tasks even without due date', () => {
    const tasks = [
      createMockTask({ id: '1', priority: 'Critical', due_date: null })
    ];
    expect(getFocusTasks(tasks, todayRef)).toHaveLength(1);
  });

  it('should sort overdue tasks above due today and non-date immediate tasks', () => {
    const tasks = [
      createMockTask({ id: '1', priority: 'Critical', due_date: null, position: 10.0 }),
      createMockTask({ id: '2', priority: 'Medium', due_date: '2026-06-02T12:00:00', position: 20.0 }),
      createMockTask({ id: '3', priority: 'Critical', due_date: '2026-06-03T12:00:00', position: 30.0 })
    ];
    
    const sorted = getFocusTasks(tasks, todayRef);
    expect(sorted).toHaveLength(3);
    expect(sorted[0].id).toBe('2'); // Overdue is first
    expect(sorted[1].id).toBe('3'); // Due today is second
    expect(sorted[2].id).toBe('1'); // Now no date is third
  });

  it('should sort identical urgency/priority by manual position value', () => {
    const tasks = [
      createMockTask({ id: '2', priority: 'Critical', position: 200.0 }),
      createMockTask({ id: '1', priority: 'Critical', position: 100.0 })
    ];
    
    const sorted = getFocusTasks(tasks, todayRef);
    expect(sorted[0].id).toBe('1'); // Lower position first
    expect(sorted[1].id).toBe('2');
  });
});
