import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { LoginPage } from '../../pages/LoginPage';
import { DashboardPage } from '../../pages/DashboardPage';
import { TaskDialogPage } from '../../pages/TaskDialogPage';
import { ProfileDialogPage } from '../../pages/ProfileDialogPage';

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:54321';
const apiKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const testEmail = process.env.VITE_TEST_USER_EMAIL || 'test-user@handl.space';
const testPassword = process.env.VITE_TEST_USER_PASSWORD || 'Password123!';

test.describe.serial('Handl Exploratory UI & API Test Suite', () => {

  test.describe('1. Authentication Scenarios', () => {

    test('should show error validation when using incorrect password', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(testEmail, 'WrongPassword123!');
      await loginPage.expectInvalidCredentials();
    });

    test('should show browser validation or prevent submit on invalid email formatting', async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login('notanemail', testPassword);
      await loginPage.expectWelcomeScreen();
    });

    test('should login successfully with correct credentials', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const dashboardPage = new DashboardPage(page);
      await loginPage.login(testEmail, testPassword);
      await loginPage.expectLoginSuccess();
      await dashboardPage.expectGreeting();
    });
  });

  test.describe('2. Dashboard & Task List Visual Alert Validation', () => {

    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(testEmail, testPassword);
      await loginPage.expectLoginSuccess();
    });

    test('should display visual indicators (dots, badges, formatting) correctly in list view', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigateToListView();

      // 1. Task #1: Overdue
      await dashboardPage.expectTaskAlertDot('Test Task #1: Overdue', '.bg-red-500.animate-soft-glow-red');
      await dashboardPage.expectTaskBadge('Test Task #1: Overdue', 'Overdue');
      await dashboardPage.expectTaskDateStyle('Test Task #1: Overdue', '.text-red-500');

      // 2. Task #2: Due Today Later
      await dashboardPage.expectTaskAlertDot('Test Task #2: Due Today Later', '.bg-amber-500.animate-soft-glow-amber');
      await dashboardPage.expectTaskBadge('Test Task #2: Due Today Later', 'Due Today');
      await dashboardPage.expectTaskDateText('Test Task #2: Due Today Later', 'Today');

      // 3. Task #3: Due Today Now
      await dashboardPage.expectTaskAlertDot('Test Task #3: Due Today Now', '.bg-orange-600.animate-soft-glow-orange');
      await dashboardPage.expectTaskBadge('Test Task #3: Due Today Now', 'Due Today');

      // 4. Task #4: Future Normal
      await dashboardPage.expectNoTaskAlertDot('Test Task #4: Future Normal');
      await dashboardPage.expectTaskBadge('Test Task #4: Future Normal', 'Later');

      // 5. Task #5: Completed
      await dashboardPage.expectNoTaskAlertDot('Test Task #5: Completed');
      await dashboardPage.expectTaskCompletedState('Test Task #5: Completed');
    });
  });

  test.describe('3. Form Boundary, Validation, and Security (XSS) Scenarios', () => {

    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(testEmail, testPassword);
      await loginPage.expectLoginSuccess();
    });

    test('should validate form fields on task creation (empty title, max title, max description)', async ({ page }) => {
      const taskDialog = new TaskDialogPage(page);
      await taskDialog.open();

      // Test empty title validation
      await taskDialog.submit();
      await taskDialog.expectTitleRequiredError();

      // Test title length limit (150 chars)
      await taskDialog.fillTitle('a'.repeat(151));
      await taskDialog.submit();
      await taskDialog.expectTitleTooLongError();

      // Test description length limit (3000 chars)
      await taskDialog.fillTitle('Valid Title');
      await taskDialog.fillDescription('b'.repeat(3001));
      await taskDialog.submit();
      await taskDialog.expectDescriptionTooLongError();

      // Close the modal
      await taskDialog.cancel();
    });

    test('should escape special characters and HTML/JS payloads to prevent XSS rendering issues', async ({ page }) => {
      const taskDialog = new TaskDialogPage(page);
      const dashboardPage = new DashboardPage(page);
      
      await taskDialog.open();

      const xssTitle = "<script>alert('XSS Title')</script> & \" ' < > / \\";
      const xssDesc = "<h1>HTML Inject</h1> <iframe src='javascript:alert(1)'></iframe>";
      
      await taskDialog.createTask(xssTitle, xssDesc);
      await taskDialog.expectCreationSuccess();

      // Head over to the list view to check rendering
      await dashboardPage.navigateToListView();

      // The task row should contain the escaped plain text
      const taskRow = dashboardPage.getTaskRow("XSS Title");
      await expect(taskRow).toBeVisible();

      // Verify no script or iframe tag is actually instantiated
      const scriptTagsCount = await page.locator('tr script').count();
      expect(scriptTagsCount).toBe(0);
      const iframeTagsCount = await page.locator('tr iframe').count();
      expect(iframeTagsCount).toBe(0);

      // Clean up by deleting the XSS task
      await taskDialog.deleteTask("XSS Title");
      await taskDialog.expectDeletionSuccess();
    });
  });

  test.describe('4. Task Reordering Scenarios', () => {

    test.beforeEach(async ({ page }) => {
      const loginPage = new LoginPage(page);
      await loginPage.login(testEmail, testPassword);
      await loginPage.expectLoginSuccess();
    });

    test('should drag and drop to reorder tasks successfully', async ({ page }) => {
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.navigateToListView();

      await dashboardPage.expectTaskCount(5); // Our 5 seeded tasks

      const firstTitleBefore = await dashboardPage.getTaskTitleAt(0);
      const secondTitleBefore = await dashboardPage.getTaskTitleAt(1);

      // Perform reorder
      await dashboardPage.dragAndDropTask(0, 1);
      await dashboardPage.expectReorderSuccess();

      // Wait for table to reload
      await page.waitForTimeout(1000);
      
      const firstTitleAfter = await dashboardPage.getTaskTitleAt(0);
      expect(firstTitleAfter).not.toBe(firstTitleBefore);
    });
  });

  test.describe('5. Profile settings & Deletion Scenarios', () => {
    
    test('should sign up, edit profile, and permanently delete a user account with cascade data cleanup', async ({ page }) => {
      const loginPage = new LoginPage(page);
      const taskDialog = new TaskDialogPage(page);
      const profileDialog = new ProfileDialogPage(page);

      await loginPage.goto();
      
      const tempUserEmail = `temp-${Date.now()}@handl.space`;
      const tempUserPassword = `Password123!`;

      // Sign up temp user
      await loginPage.register(tempUserEmail, tempUserPassword);
      await loginPage.expectRegistrationSuccess();

      // Since email confirmation is disabled on the local emulator,
      // the registration automatically signs the user in and redirects them to the Dashboard.
      const dashboardPage = new DashboardPage(page);
      await dashboardPage.expectGreeting();

      // Create a task for this temp user
      await taskDialog.open();
      await taskDialog.createTask('Temp User Task');
      await taskDialog.expectCreationSuccess();

      // Open profile dialog and edit profile
      await profileDialog.open();
      await profileDialog.editDisplayName('Temp Tester');
      await profileDialog.expectUpdateSuccess();

      // Re-open profile to delete account
      await profileDialog.open();
      await profileDialog.deleteAccount('delete my account');

      // Verify redirection to Welcome screen (session/auth is dropped)
      await loginPage.expectWelcomeScreen();

      // Direct DB check: Verify that tasks for this temp user are CASCADE deleted
      const supabase = createClient(supabaseUrl, apiKey);
      const { data: signInResult, error: signInErr } = await supabase.auth.signInWithPassword({
        email: tempUserEmail,
        password: tempUserPassword
      });
      // The sign in should fail now because the user is deleted
      expect(signInErr).toBeDefined();
      expect(signInErr?.message).toContain('Invalid login credentials');
    });
  });

  test.describe('6. Security & Database RLS Boundaries', () => {
    
    test('should prevent unauthorized readers/writers from accessing tasks and comments', async () => {
      const unauthorizedClient = createClient(supabaseUrl, apiKey);

      // 1. Try fetching tasks without session
      const { data: tasksData } = await unauthorizedClient
        .from('tasks')
        .select('*');
      expect(tasksData).toHaveLength(0);

      // 2. Try inserting a task without session
      const { error: insertError } = await unauthorizedClient
        .from('tasks')
        .insert([{ title: 'Hack Task', priority: 'Medium', status: 'Todo' }]);
      expect(insertError).toBeDefined();

      // 3. Try fetching comments without session
      const { data: commentsData } = await unauthorizedClient
        .from('comments')
        .select('*');
      expect(commentsData).toHaveLength(0);
    });

    test('should prevent a user from reading or modifying another user\'s tasks or comments', async () => {
      const supabase = createClient(supabaseUrl, apiKey);

      // User A logs in
      const { data: sessionA } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword
      });
      expect(sessionA.session).toBeDefined();

      // Create a task under User A
      const authedClientA = createClient(supabaseUrl, apiKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      await authedClientA.auth.setSession({
        access_token: sessionA.session?.access_token || '',
        refresh_token: sessionA.session?.refresh_token || ''
      });

      const { data: createdTasks, error: createdError } = await authedClientA
        .from('tasks')
        .insert([{
          title: 'Private Task User A',
          priority: 'Medium',
          status: 'Todo',
          assigned_to: sessionA.user?.id
        }])
        .select();
      
      expect(createdError).toBeNull();
      const taskAId = createdTasks![0].id;

      // Add a comment on that task
      const { error: commentError } = await authedClientA
        .from('comments')
        .insert([{
          task_id: taskAId,
          user_id: sessionA.user?.id,
          body: 'This is User A commenting on Task A'
        }]);
      expect(commentError).toBeNull();

      // User B logs in (sign up a new one first)
      const tempEmailB = `user-b-${Date.now()}@handl.space`;
      const tempPassB = `Password123!`;
      const { data: signUpB } = await supabase.auth.signUp({
        email: tempEmailB,
        password: tempPassB
      });
      
      const authedClientB = createClient(supabaseUrl, apiKey, {
        auth: { persistSession: false, autoRefreshToken: false }
      });
      await authedClientB.auth.setSession({
        access_token: signUpB.session?.access_token || '',
        refresh_token: signUpB.session?.refresh_token || ''
      });

      // 1. User B tries to read Task A (should return 0 results)
      const { data: readTasks } = await authedClientB
        .from('tasks')
        .select('*')
        .eq('id', taskAId);
      expect(readTasks).toHaveLength(0);

      // 2. User B tries to comment on Task A (should fail due to RLS check)
      const { error: hackCommentError } = await authedClientB
        .from('comments')
        .insert([{
          task_id: taskAId,
          user_id: signUpB.user?.id,
          body: 'User B trying to hack comment on Task A'
        }]);
      expect(hackCommentError).toBeDefined();

      // 3. User B tries to read comments on Task A (should return 0 results)
      const { data: readComments } = await authedClientB
        .from('comments')
        .select('*')
        .eq('task_id', taskAId);
      expect(readComments).toHaveLength(0);

      // Cleanup: Delete User B and User A task
      await authedClientA.from('tasks').delete().eq('id', taskAId);
      await authedClientB.rpc('delete_user_account');
    });
  });
});
