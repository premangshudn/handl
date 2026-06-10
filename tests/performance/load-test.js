import http from 'k6/http';
import { check, sleep } from 'k6';

// Helper to parse environment file
function parseEnv(content) {
  const env = {};
  const lines = content.split('\n');
  for (let line of lines) {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const match = line.match(/^([^=]+)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        let value = match[2].trim();
        // Remove quotes if present
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.substring(1, value.length - 1);
        }
        env[key] = value;
      }
    }
  }
  return env;
}

// Load .env.test parameters with fallbacks
let env = {};
try {
  const envContent = open('../../.env.test');
  env = parseEnv(envContent);
} catch (e) {
  // Ignore error if file not found, use __ENV or defaults
}

const SUPABASE_URL = __ENV.VITE_SUPABASE_URL || env.VITE_SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_ANON_KEY = __ENV.VITE_SUPABASE_ANON_KEY || env.VITE_SUPABASE_ANON_KEY || '';
const TEST_USER_EMAIL = __ENV.VITE_TEST_USER_EMAIL || env.VITE_TEST_USER_EMAIL || 'test-user@handl.space';
const TEST_USER_PASSWORD = __ENV.VITE_TEST_USER_PASSWORD || env.VITE_TEST_USER_PASSWORD || 'Password123!';

export const options = {
  stages: [
    { duration: '30s', target: 10 }, // Ramp up to 10 VUs
    { duration: '1m', target: 10 },  // Sustain 10 VUs for 1 minute
    { duration: '30s', target: 0 },  // Ramp down to 0 VUs
  ],
  thresholds: {
    http_req_failed: ['rate<0.01'],   // Error rate should be less than 1%
    http_req_duration: ['p(95)<1500'], // 95% of requests should be below 1.5s
  },
};

export default function () {
  // 1. Authenticate to get session token & user ID
  const authUrl = `${SUPABASE_URL}/auth/v1/token?grant_type=password`;
  const authPayload = JSON.stringify({
    email: TEST_USER_EMAIL,
    password: TEST_USER_PASSWORD,
  });
  const authParams = {
    headers: {
      'apikey': SUPABASE_ANON_KEY,
      'Content-Type': 'application/json',
    },
  };

  const authRes = http.post(authUrl, authPayload, authParams);
  
  const authSuccess = check(authRes, {
    'auth status is 200': (r) => r.status === 200,
    'auth response contains access token': (r) => r.json('access_token') !== undefined,
  });

  if (!authSuccess) {
    console.error(`Auth failed for user ${TEST_USER_EMAIL}: ${authRes.status} ${authRes.body}`);
    sleep(1);
    return;
  }

  const token = authRes.json('access_token');
  const userId = authRes.json('user.id');

  // Headers for subsequent authenticated requests
  const commonHeaders = {
    'apikey': SUPABASE_ANON_KEY,
    'Authorization': `Bearer ${token}`,
  };

  // 2. Retrieve tasks for the authenticated user
  const getTasksUrl = `${SUPABASE_URL}/rest/v1/tasks?select=*`;
  const tasksRes = http.get(getTasksUrl, { headers: commonHeaders });

  check(tasksRes, {
    'retrieve tasks status is 200': (r) => r.status === 200,
    'retrieve tasks returned array': (r) => Array.isArray(r.json()),
  });

  // 3. Create a temporary task
  const createTaskUrl = `${SUPABASE_URL}/rest/v1/tasks`;
  const taskTitle = `k6 Temp Task - VU ${__VU} - Iter ${__ITER} - ${Math.floor(Math.random() * 1000000)}`;
  const createTaskPayload = JSON.stringify({
    title: taskTitle,
    description: 'Performance testing temporary task',
    priority: 'Medium',
    status: 'Todo',
    assigned_to: userId,
    tags: ['k6', 'load-test-temp'],
  });

  const createTaskParams = {
    headers: Object.assign({}, commonHeaders, {
      'Content-Type': 'application/json',
      'Prefer': 'return=representation',
    }),
  };

  const createTaskRes = http.post(createTaskUrl, createTaskPayload, createTaskParams);

  const createSuccess = check(createTaskRes, {
    'create task status is 201': (r) => r.status === 201,
    'created task returns payload representation': (r) => {
      const body = r.json();
      return Array.isArray(body) && body.length > 0 && body[0].title === taskTitle;
    },
  });

  // 4. Delete the temporary task to clean up database state
  if (createSuccess) {
    const createdTasks = createTaskRes.json();
    const taskId = createdTasks[0].id;
    const deleteTaskUrl = `${SUPABASE_URL}/rest/v1/tasks?id=eq.${taskId}`;
    
    const deleteTaskRes = http.del(deleteTaskUrl, null, { headers: commonHeaders });
    
    check(deleteTaskRes, {
      'delete task status is 204': (r) => r.status === 204,
    });
  }

  // Think time between iterations
  sleep(1);
}
