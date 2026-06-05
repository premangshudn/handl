# Handl - Project Context & Guidelines

## 🛠️ Commands
* **Dev Server (Local):** `npm run dev`
* **Dev Server (Mobile Testing):** `npx vite --host --port 5173 --strictPort`
* **Production Build:** `npm run build` (runs `tsc -b && vite build`)
* **TypeScript Check:** `npm run typecheck`
* **Run Tests:** `npm run test`

## ⚙️ Tech Stack & Database Schema
* **Stack:** React, Vite, TypeScript, Tailwind CSS, Supabase (Auth & Database).
* **Database Schema (`tasks` table):**
  * `id` (uuid, primary key)
  * `title` (text)
  * `description` (text, optional)
  * `status` ('Todo' | 'Done')
  * `priority` ('Critical' | 'High' | 'Medium' | 'Low')
  * `due_date` (date, optional)
  * `tags` (text array)
  * `position` (double precision)
  * `assigned_to` (uuid, references auth.users)

## 🎨 Design & Coding Rules
1. **Dynamic Alert Dots:** Blinking/glowing dots are reserved strictly for **Overdue** tasks (Red dot: `animate-soft-glow-red`) and **Due Today** tasks (Orange dot: `animate-soft-glow-orange` if Now priority, Amber dot: `animate-soft-glow-amber` if Later priority). Other future tasks must not blink.
2. **Badge Color Rules:**
   * Overdue tasks -> Red badge (`bg-red-500`)
   * Due Today + Now priority -> Orange badge (`bg-orange-600`)
   * Due Today + Later priority -> Amber badge (`bg-amber-500`)
3. **Grid Alignment & Spacing:** Use the compact **6px** spacing rule for status dot columns to keep checkbox elements vertically aligned:
   * Class markup: `pl-1.5`, `gap-1.5`, dot size container `w-1.5 h-1.5`.
4. **Active Status:** Tasks are active if their status is not `Done`. The UI labels active tasks as `Active` (internally they are stored as `'Todo'`).
5. **Concise Forms:** Form labels must be concise (e.g. use `"Tags"` instead of `"Tags (comma separated)"`) and rely on placeholders or helper descriptions for input guides to preserve layout height symmetry.

## 📁 Key File Locations
* **Table View Component:** `src/components/TaskList.tsx`
* **Dashboard Component:** `src/components/Dashboard.tsx`
* **Create/Edit Dialog Form:** `src/components/TaskDialog.tsx`
* **Supabase Client:** `src/lib/supabase.ts`
* **Task Utility Functions:** `src/lib/taskUtils.ts`
