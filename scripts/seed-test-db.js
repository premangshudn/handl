import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// 1. Parse .env.test manually to avoid third-party dependencies
const envPath = path.resolve(process.cwd(), '.env.test');
if (!fs.existsSync(envPath)) {
  console.error("Error: .env.test file not found! Make sure you created it.");
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) return;
  const parts = trimmed.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

if (!supabaseAnonKey || supabaseAnonKey.includes('placeholder')) {
  console.warn("Warning: VITE_SUPABASE_ANON_KEY is not configured or is placeholder. Seeding might fail on auth/db rules.");
}

console.log("Connecting to local Supabase at:", supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey);

const TEST_EMAIL = env.VITE_TEST_USER_EMAIL || 'test-user@handl.space';
const TEST_PASSWORD = env.VITE_TEST_USER_PASSWORD || 'Password123!';

async function seed() {
  try {
    console.log(`Authenticating test user: ${TEST_EMAIL}...`);
    
    // Try signing in
    let { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD
    });

    let userId;
    let session;

    if (signInError) {
      console.log("Sign-in failed, attempting to sign up new test user...");
      
      // Try signing up
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: TEST_EMAIL,
        password: TEST_PASSWORD,
        options: {
          data: {
            display_name: 'Test Account',
            mantra: 'Focus on quality and testing.'
          }
        }
      });

      if (signUpError) {
        throw new Error(`Failed both sign-in and sign-up: ${signUpError.message}`);
      }

      userId = signUpData.user?.id;
      session = signUpData.session;
      console.log(`Signed up new user with ID: ${userId}`);
    } else {
      userId = authData.user?.id;
      session = authData.session;
      console.log(`Logged in existing user with ID: ${userId}`);
    }

    if (!userId) throw new Error("Could not retrieve test user ID.");

    // Initialize authenticated client context for data insertion (satisfies RLS policies)
    const authedClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });
    
    // Set the session
    await authedClient.auth.setSession({
      access_token: session?.access_token || '',
      refresh_token: session?.refresh_token || ''
    });

    console.log("Clearing existing tasks for test user...");
    const { error: deleteError } = await authedClient
      .from('tasks')
      .delete()
      .eq('assigned_to', userId);

    if (deleteError) throw deleteError;

    // Define dates relative to today
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date();
    tomorrow.setDate(now.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    console.log("Seeding test tasks...");
    const seedTasks = [
      {
        title: "Test Task #1: Overdue",
        description: "This task was due yesterday and is overdue.",
        priority: "Medium", // Later
        status: "Todo",
        due_date: yesterdayStr,
        assigned_to: userId,
        position: 100.0,
        tags: ["personal", "late"]
      },
      {
        title: "Test Task #2: Due Today Later",
        description: "This task is due today with Later priority.",
        priority: "Medium", // Later
        status: "Todo",
        due_date: todayStr,
        assigned_to: userId,
        position: 200.0,
        tags: ["routine"]
      },
      {
        title: "Test Task #3: Due Today Now",
        description: "This task is due today with High (Now) priority.",
        priority: "High", // Now
        status: "Todo",
        due_date: todayStr,
        assigned_to: userId,
        position: 300.0,
        tags: ["work", "critical"]
      },
      {
        title: "Test Task #4: Future Normal",
        description: "This task is due tomorrow.",
        priority: "Medium", // Later
        status: "Todo",
        due_date: tomorrowStr,
        assigned_to: userId,
        position: 400.0,
        tags: ["ideas"]
      },
      {
        title: "Test Task #5: Completed",
        description: "This task has already been completed.",
        priority: "Low", // Later
        status: "Done",
        due_date: todayStr,
        assigned_to: userId,
        position: 500.0,
        tags: ["done"]
      }
    ];

    const { data, error: insertError } = await authedClient
      .from('tasks')
      .insert(seedTasks)
      .select();

    if (insertError) throw insertError;

    console.log(`Successfully seeded ${data.length} tasks!`);
    console.log("Seed execution completed.");
    process.exit(0);

  } catch (err) {
    console.error("Seeding failed with error:", err);
    process.exit(1);
  }
}

seed();
