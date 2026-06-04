# Handl - Setup & Walkthrough

Welcome to **Handl**! A mindful, minimal task manager built to help you focus on what matters today, one step at a time.

## 🛠️ Step 0: Preparation (Supabase)

If you haven't already:
1. **Create a Supabase Account**: Visit [supabase.com](https://supabase.com) and sign up for a free account.
2. **Create a New Project**: Click on "New Project", name it "Handl", and set a secure database password. Wait for the project to finish provisioning.

## 🛠️ Step 1: Supabase Configuration

1. **Project Credentials**:
   - Go to your [Supabase Dashboard](https://supabase.com/dashboard).
   - Navigate to **Project Settings** > **API**.
   - Copy your **Project URL** and **anon public** key.
   - Open the `.env` file in this project's root directory and update it:
     ```env
     VITE_SUPABASE_URL=https://your-project-url.supabase.co
     VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
     ```

2. **Database Schema**:
   - Go to the **SQL Editor** in your Supabase dashboard.
   - Open the `supabase_schema.sql` file located in this project's root.
   - Copy all the SQL code.
   - Paste it into the Supabase SQL Editor and click **Run**.

## 🚀 Step 2: Launch the App

1. **Install Dependencies** (if not already done):
   ```bash
   npm install
   ```
2. **Start Development Server**:
   ```bash
   npm run dev
   ```
3. **Open the App**:
   - Navigate to the local server at [http://localhost:5173](http://localhost:5173) in your browser.
   - Or view the live deployment at [https://handl-space.vercel.app](https://handl-space.vercel.app).

---

## ✨ Features Implemented

### 1. Mindful Dashboard
- **Mindful Stats**: Real-time stats for Total, Completed, Overdue, and Due Today tasks.
- **Focus of the Day**: Elevates the top 3 highest-priority or urgent tasks ("Now" priority or due today) to help you focus.
- **Quick Capture**: Quick input field to capture tasks instantly without going through forms.
- **Interactive Metrics**: Shows completion rate progress bars and task statuses.

### 2. Task Management (List View)
- **Status Alignment**: Non-completed tasks are designated as **Active** rather than "Pending" to encourage positive progress.
- **Detailed Table View**: Features tag sorting, due-date formatting, drag-to-reorder, and fast completions.
- **Interactive Filter**: Click on any tag to filter the task list instantly.

### 3. Frictionless Task Creation (Task Dialog)
- **No Status Redundancy**: Removed the status dropdown from creation and editing. Tasks are created as **Active** (or **Done** if checked) and managed from the list.
- **Single-Click Priority**: Replaced the standard priority dropdown with a sleek, tactile **"Handle Now ⚡" Toggle Switch**, minimizing clicks to prioritize tasks.
- **Animated Placeholders**: The title input cycles through helpful personal examples (e.g., *"Water the indoor plants..."*, *"Call Mom to catch up..."*, *"Read 10 pages of my book..."*) with a smooth, 500ms fade transition every 2 seconds.

### 4. Authentication & Customization
- Secure Sign In, Sign Up, and Password Recovery powered by Supabase.
- Support for customizable displays and daily mantras.

### 5. High-Quality UI & Architecture
- Modern React, Vite, Tailwind CSS, and Radix UI primitives.
- Fully responsive design supporting mobile touch anchors.
- Unused/redundant legacy views (such as the Kanban board components) have been fully pruned from the workspace for optimal codebase health.

## 📄 API Documentation
- A full OpenAPI 3.0 specification is available in the public assets directory at `public/swagger.json` and is served statically at `/swagger.json`.
