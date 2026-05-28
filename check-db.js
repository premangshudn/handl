import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    const key = parts[0].trim();
    const value = parts.slice(1).join('=').trim();
    env[key] = value;
  }
});

const supabaseUrl = env.VITE_SUPABASE_URL;
const supabaseAnonKey = env.VITE_SUPABASE_ANON_KEY;

console.log("Supabase URL:", supabaseUrl);
console.log("Supabase Anon Key:", supabaseAnonKey ? "Found (starts with " + supabaseAnonKey.substring(0, 5) + "...)" : "Not Found");

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function run() {
  console.log("Fetching tasks...");
  const { data, error } = await supabase.from('tasks').select('*');
  if (error) {
    console.error("Error fetching tasks:", error);
  } else {
    console.log("Total tasks:", data.length);
    console.log("Sample tasks:", data.slice(0, 3));
  }
}

run();
