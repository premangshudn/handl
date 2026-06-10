import { APIRequestContext, APIResponse } from '@playwright/test';
import type { TaskPayload } from '../types/testTypes';

/**
 * Sends a POST request to create a new task in Supabase.
 */
export const createTask = async (
  request: APIRequestContext,
  supabaseUrl: string,
  apiKey: string,
  token: string,
  payload: TaskPayload
) => {
  return await request.post(`${supabaseUrl}/rest/v1/tasks`, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    data: payload,
  });
};

/**
 * Sends a GET request to fetch tasks in Supabase.
 */
export const getTasks = async (
  request: APIRequestContext,
  supabaseUrl: string,
  apiKey: string,
  token: string,
  queryParam = 'select=*'
) => {
  return await request.get(`${supabaseUrl}/rest/v1/tasks?${queryParam}`, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${token}`,
    },
  });
};

/**
 * Sends a PATCH request to update a task in Supabase by UUID.
 */
export const updateTask = async (
  request: APIRequestContext,
  supabaseUrl: string,
  apiKey: string,
  token: string,
  taskId: string,
  payload: Partial<TaskPayload>
) => {
  return await request.patch(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    },
    data: payload,
  });
};

/**
 * Sends a DELETE request to delete a task in Supabase by UUID.
 */
export const deleteTask = async (
  request: APIRequestContext,
  supabaseUrl: string,
  apiKey: string,
  token: string,
  taskId: string
) => {
  return await request.delete(`${supabaseUrl}/rest/v1/tasks?id=eq.${taskId}`, {
    headers: {
      'apikey': apiKey,
      'Authorization': `Bearer ${token}`,
    },
  });
};

export interface ParsedResponse<T> {
  status: number;
  body: T | null;
  raw: APIResponse;
}

/**
 * Utility helper to parse APIResponse status and JSON body in a single call.
 */
export const parseResponse = async <T = any>(
  responsePromise: Promise<APIResponse>
): Promise<ParsedResponse<T>> => {
  const response = await responsePromise;
  const status = response.status();
  const body = status !== 204 ? (await response.json() as T) : null;
  return { status, body, raw: response };
};
