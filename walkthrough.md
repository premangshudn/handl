# TaskFlow Web App - Setup & Walkthrough

Welcome to **TaskFlow**! This document provides the steps to get your professional task management app up and running locally.

## 🛠️ Step 0: Preparation (Supabase)

If you haven't already:
1.  **Create a Supabase Account**: Visit [supabase.com](https://supabase.com) and sign up for a free account.
2.  **Create a New Project**: Click on "New Project", give it a name (e.g., "TaskFlow"), and set a secure database password. Wait for the project to finish provisioning.

## 🛠️ Step 1: Supabase Configuration

1.  **Project Credentials**:
    - Go to your [Supabase Dashboard](https://supabase.com/dashboard).
    - Navigate to **Project Settings** > **API**.
    - Copy your **Project URL** and **anon public** key.
    - Open the `.env` file in this project's root directory and update it:
      ```env
      VITE_SUPABASE_URL=https://rpwneexotbictudjkcsv.supabase.co
      VITE_SUPABASE_ANON_KEY=your_anon_public_key_here
      ```

2.  **Database Schema**:
    - Go to the **SQL Editor** in your Supabase dashboard.
    - Open the `supabase_schema.sql` file located in this project root.
    - Copy all the SQL code.
    - Paste it into the Supabase SQL Editor and click **Run**.

## 🚀 Step 2: Launch the App

1.  **Install Dependencies** (if not already done):
    ```bash
    npm install
    ```
2.  **Start Development Server**:
    ```bash
    npm run dev
    ```
3.  **Open the App**:
    Navigate to [http://localhost:5173](http://localhost:5173) in your browser.

---

## ✨ Features Implemented

### 1. Dashboard
- Real-time statistics for Total, Completed, Overdue, and Due Today tasks.
- Interactive Bar Chart showing task distribution across 'Todo', 'In Progress', and 'Done' statuses.
- Priority breakdown visualization.

### 2. Task Management
- **Kanban Board**: Drag-and-drop style view to manage workflow.
- **List View**: Detailed table view for power users.
- **Task Dialog**: Full CRUD support (Create, Read, Update, Delete) with priority levels, due dates, and tags.

### 3. Authentication
- Secure Login and Registration using Supabase Auth.
- Protected routes (authentication required to view tasks).

### 4. Professional UI
- Built with **React**, **Tailwind CSS**, and **shadcn/ui**.
- Fully responsive design for mobile and desktop.
- Premium aesthetics with smooth animations and dark mode support.

## 📄 API Documentation
- A full OpenAPI 3.0 specification is available in the public assets directory at `public/swagger.json` and is served statically at `/swagger.json` (e.g., `http://localhost:5173/swagger.json`).
