import { APIRequestContext } from '@playwright/test';
import type { AuthSession, UserCredentials } from '../types/testTypes';

/**
 * Programmatically logs in a user via Supabase GoTrue API to retrieve a JWT session.
 */
export const getAuthToken = async (
  request: APIRequestContext,
  supabaseUrl: string,
  apiKey: string,
  credentials: UserCredentials
): Promise<AuthSession> => {
  const response = await request.post(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
    headers: {
      'apikey': apiKey,
      'Content-Type': 'application/json',
    },
    data: credentials,
  });

  if (!response.ok()) {
    const errorBody = await response.text();
    throw new Error(`Authentication failed with status ${response.status()}: ${errorBody}`);
  }

  const result = await response.json();
  return {
    access_token: result.access_token,
    refresh_token: result.refresh_token,
    user: {
      id: result.user.id,
      email: result.user.email,
    },
  };
};
