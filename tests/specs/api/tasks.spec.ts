import { test, expect } from '@playwright/test';
import { getAuthToken } from '../../helpers/authHelper';
import { createTask, getTasks, updateTask, deleteTask, parseResponse } from '../../helpers/apiHelper';
import { TaskPriority, TaskStatus } from '../../types/testTypes';
import testTasks from '../../data/testTasks.json' with { type: 'json' };

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const apiKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const testEmail = process.env.VITE_TEST_USER_EMAIL || 'test-user@handl.space';
const testPassword = process.env.VITE_TEST_USER_PASSWORD || 'Password123!';

test.describe.serial('Tasks REST API Integration Tests', () => {
  let authToken: string;
  let userId: string;
  let createdTaskId: string;

  // 1. Authenticate before all tests in this suite
  test.beforeAll(async ({ request }) => {
    const session = await getAuthToken(request, supabaseUrl, apiKey, {
      email: testEmail,
      password: testPassword
    });
    authToken = session.access_token;
    userId = session.user.id;
  });

  test('should create a new task with Later priority', async ({ request }) => {
    // Merge userId into mock task payload
    const payload = {
      ...testTasks.validTaskLater,
      assigned_to: userId,
      priority: testTasks.validTaskLater.priority as any,
      status: testTasks.validTaskLater.status as any
    };

    const { status, body } = await parseResponse<any[]>(
      createTask(request, supabaseUrl, apiKey, authToken, payload)
    );
    
    expect(status).toBe(201); // Created
    expect(body).toHaveLength(1);
    expect(body![0].title).toBe(testTasks.validTaskLater.title);
    expect(body![0].priority).toBe(testTasks.validTaskLater.priority);
    expect(body![0].status).toBe(testTasks.validTaskLater.status);
    expect(body![0].assigned_to).toBe(userId);
    
    // Save created ID for subsequent tests
    createdTaskId = body![0].id;
  });

  test('should retrieve the list of active tasks including seeded ones', async ({ request }) => {
    const { status, body } = await parseResponse<any[]>(
      getTasks(request, supabaseUrl, apiKey, authToken)
    );

    expect(status).toBe(200);
    expect(body!.length).toBeGreaterThan(0);
    
    // Verify our created task is present in the list
    const found = body!.some((task: any) => task.id === createdTaskId);
    expect(found).toBe(true);
  });

  test('should update task status to Done and priority to Now (Critical)', async ({ request }) => {
    expect(createdTaskId).toBeDefined();

    const updatePayload = {
      status: TaskStatus.DONE,
      priority: TaskPriority.CRITICAL,
      position: 999.0
    };

    const { status, body } = await parseResponse<any[]>(
      updateTask(request, supabaseUrl, apiKey, authToken, createdTaskId, updatePayload)
    );

    expect(status).toBe(200);
    expect(body).toHaveLength(1);
    expect(body![0].id).toBe(createdTaskId);
    expect(body![0].status).toBe(TaskStatus.DONE);
    expect(body![0].priority).toBe(TaskPriority.CRITICAL);
    expect(body![0].position).toBe(999.0);
  });

  test('should delete the task from the database', async ({ request }) => {
    expect(createdTaskId).toBeDefined();

    const { status: deleteStatus } = await parseResponse(
      deleteTask(request, supabaseUrl, apiKey, authToken, createdTaskId)
    );
    expect(deleteStatus).toBe(204); // No Content

    // Verify it is gone
    const { body } = await parseResponse<any[]>(
      getTasks(request, supabaseUrl, apiKey, authToken)
    );
    const found = body!.some((task: any) => task.id === createdTaskId);
    expect(found).toBe(false);
  });
});
