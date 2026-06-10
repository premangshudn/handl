# Supabase API Performance testing with k6

This directory contains performance testing scripts for Handl's backend, specifically targeting the local Supabase emulator endpoints (GoTrue auth and PostgREST tasks API).

## Installation

To run these performance tests, you need to install [k6](https://k6.io/).

On macOS, you can install it using Homebrew:

```bash
brew install k6
```

For other operating systems, refer to the [k6 installation documentation](https://k6.io/docs/getting-started/installation/).

## Configuration

The test automatically loads local developer credentials from the `.env.test` file located in the project root. If the file is not present or you wish to override these values, you can set the environment variables directly:

* `VITE_SUPABASE_URL`: Supabase API base URL (default: `http://localhost:54321`)
* `VITE_SUPABASE_ANON_KEY`: Supabase anon public API key
* `VITE_TEST_USER_EMAIL`: Test user email address
* `VITE_TEST_USER_PASSWORD`: Test user password

Example overriding via CLI:
```bash
k6 run -e VITE_SUPABASE_URL=http://localhost:54321 -e VITE_TEST_USER_EMAIL=user@example.com load-test.js
```

## Running the Load Test

To run the load test script:

```bash
k6 run load-test.js
```

## Test Scenario Detail

The script simulates a realistic user journey:
1. **Authenticate**: Authenticates via Supabase GoTrue API (`/auth/v1/token`) using email and password to retrieve a JWT and the user's UUID.
2. **Retrieve Tasks**: Fetches all tasks assigned to the user from the Supabase REST API (`/rest/v1/tasks?select=*`).
3. **Create Temporary Task**: Inserts a new task associated with the user into Supabase (`/rest/v1/tasks`).
4. **Clean Up**: Deletes the temporary task immediately afterward (`/rest/v1/tasks?id=eq.<id>`) to keep the test database clean.

### Load Profile (Stages)
The test uses ramping stages to simulate real traffic behavior:
* **Ramp-up**: 0 to 10 Virtual Users (VUs) over **30 seconds**.
* **Sustain**: Steady load of 10 VUs for **1 minute**.
* **Ramp-down**: 10 to 0 VUs over **30 seconds**.

### Performance Thresholds
The test will fail if:
* More than **1%** of HTTP requests return errors (`http_req_failed < 0.01`).
* The 95th percentile response time is greater than **1.5 seconds** (`http_req_duration: p(95) < 1500`).
