# Security Audit Report: Handl

This report provides a detailed security posture evaluation of the Handl application. It covers three main areas:
1. **Software Composition Analysis (SCA)**: Dependency vulnerability check via `npm audit`.
2. **Static Application Security Testing (SAST) Checklist**: Frontend input validation, XSS prevention, and injection reviews.
3. **Database Security (RLS Policies)**: Audit of Supabase Row Level Security (RLS) policies, schemas, triggers, and RPCs.

---

## 1. Software Composition Analysis (SCA)

A security audit of dependencies was performed using `npm audit`. The analysis identified **2 vulnerabilities** (1 Moderate, 1 High) in the project's dependency tree.

### Vulnerability Summary Table

| Package | Severity | Dependency Type | Advisory ID / CVE | Description / Impact | Remediation |
| :--- | :---: | :---: | :--- | :--- | :--- |
| **vite** | High | Direct (dev) | [GHSA-p9ff-h696-f583](https://github.com/advisories/GHSA-p9ff-h696-f583)<br>[GHSA-v2wj-q39q-566r](https://github.com/advisories/GHSA-v2wj-q39q-566r)<br>[GHSA-4w7w-66w2-5vf9](https://github.com/advisories/GHSA-4w7w-66w2-5vf9) | **1. Path Traversal** in optimized deps `.map` files.<br>**2. Bypassed `server.fs.deny`** configuration via query parameters.<br>**3. Arbitrary File Read** via dev server WebSockets. | Upgrade `vite` to version **`>=7.3.2`** (currently `^7.3.1`). |
| **postcss** | Moderate | Indirect (dev) | [GHSA-qx2v-qp2m-jg93](https://github.com/advisories/GHSA-qx2v-qp2m-jg93) | **CSS Stringify XSS**: Unescaped `</style>` tags in CSS stringify output allow script injection if CSS is dynamically built. | Run `npm audit fix` or upgrade postcss to **`>=8.5.10`**. |

### Detailed Impact Analysis
- **Vite (High)**: These vulnerabilities affect the development environment. 
  - **Arbitrary File Read**: A malicious page open in the developer's browser could use WebSockets to read arbitrary files from the developer's local filesystem.
  - **Path Traversal / Bypass**: Allows accessing files that should be blocked by `server.fs.deny`.
- **PostCSS (Moderate)**: Affects build tools and styling compilation. If any style compilation parses user-supplied CSS strings, an attacker could inject `</style><script>...</script>` and bypass XSS filters. In Handl, CSS compiling is static during build time, so actual runtime exploitability is low.

---

## 2. Static Application Security Testing (SAST) Checklist

We reviewed the frontend codebase (`src/` directory) for common vulnerabilities, focusing on input sanitization, XSS injection prevention, and database querying patterns.

### Audit Checklist

| Check Category | Status | Details |
| :--- | :---: | :--- |
| **Cross-Site Scripting (XSS)** | **Pass** | All user inputs (`title`, `description`, `tags`, `displayName`) are rendered using native React bindings (e.g. `{task.title}`), which automatically escape HTML entities. |
| **Dangerously Set Inner HTML** | **Pass (Low Risk)** | A search for `dangerouslySetInnerHTML` found a single instance in `src/components/ui/chart.tsx` (Line 95) inside the `ChartStyle` component. This component dynamically constructs CSS variables inside a `<style>` block. Since the chart keys and values are developer-defined configurations and not directly user-controlled, this is safe. |
| **URL-based Script Injections** | **Pass** | User avatars (`avatar_url`) are generated in `ProfileDialog.tsx` via Canvas API (`canvas.toDataURL('image/jpeg')`) producing a clean base64-encoded `data:image/jpeg;base64` URL. The UI renders this via a standard `<AvatarImage src={avatarUrl} />` component. Since modern browsers block JavaScript execution inside image tags (`<img src="javascript:...">`), there is no XSS threat. |
| **Client-Side SQL Injection** | **Pass** | Queries are built using the Supabase JavaScript Client. Under the hood, this compiles to REST requests to PostgREST, which uses fully parameterized SQL queries. There is no raw SQL string manipulation in the frontend client. |
| **Input Constraints** | **Pass** | The frontend uses `react-hook-form` and `zod` to enforce limits at the application boundary: <br>- Task Title: `1` to `150` characters.<br>- Task Description: Max `3000` characters.<br>- Display Name: `1` to `30` characters. |

---

## 3. Database Row Level Security (RLS) Validation

We audited the database schema in `supabase_schema.sql` and the initialization migration `supabase/migrations/20260608205518_init_schema.sql`.

### RLS Policies Evaluation

Both the `public.tasks` and `public.comments` tables have Row Level Security enabled.

#### `public.tasks` Table

RLS is enabled: `ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;`

| Operation | SQL Policy Expression | Evaluation |
| :---: | :--- | :--- |
| **SELECT** | `FOR SELECT USING (auth.uid() = assigned_to)` | **Secure**. Users can only fetch tasks assigned to their own authenticated user ID. |
| **INSERT** | `FOR INSERT WITH CHECK (auth.uid() = assigned_to)` | **Secure**. Users can only insert tasks that are assigned to their own authenticated user ID. |
| **UPDATE** | `FOR UPDATE USING (auth.uid() = assigned_to)` | **Secure**. Users can only edit tasks assigned to themselves. *Note: Since no `WITH CHECK` expression is specified, PostgreSQL implicitly applies the `USING` check to the newly updated row, preventing users from reassigning their tasks to other users.* |
| **DELETE** | `FOR DELETE USING (auth.uid() = assigned_to)` | **Secure**. Users can only delete their own tasks. |

#### `public.comments` Table

RLS is enabled: `ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;`

| Operation | SQL Policy Expression | Evaluation |
| :---: | :--- | :--- |
| **SELECT** | `FOR SELECT USING (EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = comments.task_id AND tasks.assigned_to = auth.uid()))` | **Secure**. Users can only read comments on tasks that are assigned to them. |
| **INSERT** | `FOR INSERT WITH CHECK (auth.uid() = user_id AND EXISTS (SELECT 1 FROM public.tasks WHERE tasks.id = comments.task_id AND tasks.assigned_to = auth.uid()))` | **Secure**. Users can only post a comment under their own `user_id` and only on tasks assigned to them. |
| **UPDATE** | *None defined* | **Strict Deny**. By default, comments cannot be updated by any user. |
| **DELETE** | *None defined* | **Strict Deny**. By default, comments cannot be manually deleted by users. *(Cascade deletions from tasks/user account removals still function at the database level).* |

---

## 4. Key Security Findings & Recommendations

### [Finding 1] Database Integrity: Task Orphanage on Account Deletion
> [!WARNING]
> **Severity: Medium (Data Leak / Database Bloat)**
>
> In `supabase_schema.sql` and `init_schema.sql`, the `tasks.assigned_to` column is configured with `ON DELETE SET NULL`:
> ```sql
> assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL
> ```
> However, the `delete_user_account()` RPC is structured to delete the user record from `auth.users`:
> ```sql
> CREATE OR REPLACE FUNCTION delete_user_account()
> ...
> BEGIN
>     ...
>     DELETE FROM auth.users WHERE id = auth.uid();
> END;
> ```
> **The Problem:**
> When a user deletes their account:
> 1. The record in `auth.users` is deleted.
> 2. Because of `ON DELETE SET NULL`, all tasks assigned to that user in `public.tasks` have their `assigned_to` column set to `NULL`.
> 3. These tasks remain in the database indefinitely but become completely **orphaned**.
> 4. Since RLS policies require `auth.uid() = assigned_to`, and `assigned_to` is now `NULL`, no user (including the former owner or any standard user) can access, query, or delete these tasks. They clutter the database and leak metadata.
>
> *Note: While the frontend UI (`ProfileDialog.tsx`) performs a client-side deletion of tasks before calling the RPC, this can be bypassed if the user calls the RPC directly or if the client-side task deletion fails.*

#### Recommendation:
Change the foreign key reference on `public.tasks` to cascade deletions, ensuring that deleting the user automatically purges their tasks:
```sql
ALTER TABLE public.tasks 
DROP CONSTRAINT tasks_assigned_to_fkey,
ADD CONSTRAINT tasks_assigned_to_fkey 
    FOREIGN KEY (assigned_to) 
    REFERENCES auth.users(id) 
    ON DELETE CASCADE;
```
Alternatively, modify the `delete_user_account()` function to purge the user's tasks first:
```sql
CREATE OR REPLACE FUNCTION delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;
    
    -- Explicitly delete user's tasks
    DELETE FROM public.tasks WHERE assigned_to = auth.uid();
    
    -- Delete the user
    DELETE FROM auth.users WHERE id = auth.uid();
END;
$$;
```

---

### [Finding 2] Vite Dev-Server Path Traversal and WebSocket Vulnerabilities
> [!IMPORTANT]
> **Severity: High (Local Development Risk)**
>
> The project utilizes `vite@^7.3.1` in development. Version `<=7.3.1` has known high-severity vulnerabilities (GHSA-p9ff-h696-f583, GHSA-v2wj-q39q-566r, and GHSA-4w7w-66w2-5vf9) that permit arbitrary file reading from the development machine.

#### Recommendation:
Update the devDependency in `package.json` to Vite version `^7.3.2` or later and run `npm install`:
```bash
npm install vite@latest --save-dev
```

---

## 5. Summary Posture

The overall security posture of **Handl** is strong. The frontend utilizes standard, secure-by-default React rendering models which successfully prevent XSS. The database schema has strict RLS enabled for all core tables. The single active database logic risk is the orphaned tasks on account deletion, which can be easily resolved using the database cascades or explicit triggers.
