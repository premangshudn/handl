import { test, expect } from '@playwright/test';
import { getAuthToken } from '../../helpers/authHelper';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const apiKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const testEmail = process.env.VITE_TEST_USER_EMAIL || 'test-user@handl.space';
const testPassword = process.env.VITE_TEST_USER_PASSWORD || 'Password123!';

test.describe('Supabase Auth API integration tests', () => {
  
  test('should successfully sign in with static test user credentials', async ({ request }) => {
    const session = await getAuthToken(request, supabaseUrl, apiKey, {
      email: testEmail,
      password: testPassword
    });

    expect(session.access_token).toBeDefined();
    expect(typeof session.access_token).toBe('string');
    expect(session.user.email).toBe(testEmail);
    expect(session.user.id).toBeDefined();
  });

  test('should fail sign in with incorrect password', async ({ request }) => {
    await expect(
      getAuthToken(request, supabaseUrl, apiKey, {
        email: testEmail,
        password: 'WrongPassword999!'
      })
    ).rejects.toThrow(/Authentication failed/);
  });
});
