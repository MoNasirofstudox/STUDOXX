# Studox — Educational Infrastructure

A modular SaaS platform for Nigerian tertiary institutions.

## Apps
- **Registry** — School administration, structure, members, sessions, offerings
- **Acadex** — Academic records, results workflow, lecturer/HOD/exam officer panels
- **Skedocs** — Coming soon

## Tech Stack
- React 18 + Vite
- React Router v6
- Supabase (Auth, Postgres, RLS, RPCs)
- Deployed on Vercel

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/YOUR_USERNAME/studox.git
cd studox
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
```
Open `.env` and fill in:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```
Get these from: **Supabase Dashboard → Settings → API**

### 3. Run locally
```bash
npm run dev
```
App runs at `http://localhost:5173`

---

## Deployment (Vercel)

### First time
1. Push code to GitHub
2. Go to [vercel.com](https://vercel.com) → New Project → Import your GitHub repo
3. Add environment variables in Vercel:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy

### After that
Every `git push` to `main` auto-deploys.

---

## Database

All database schema, RPCs, triggers and RLS policies live in Supabase.

Key tables: `schools`, `profiles`, `school_memberships`, `faculties`, `departments`, `programs`, `courses`, `academic_sessions`, `semesters`, `course_offerings`, `offering_assignments`, `course_registrations`, `student_enrollments`, `results`, `grade_scales`

Key RPCs: `create_school`, `get_school_details`, `get_faculty_structure`, `invite_member`, `get_current_semester`, `get_offerings`, `get_my_offerings`, `get_offering_students`, `upsert_result`, `submit_offering_results`, `approve_offering_results`, `publish_offering_results`, `get_my_results`, `get_enrollments`, `enroll_student`, `register_student_courses`, `setup_grade_scales`, `get_grade_scales`

---

## Project Structure

```
src/
  App.jsx                    # Router + auth state + error boundary
  main.jsx                   # Entry point
  supabaseClient.js          # Supabase client
  constants.js               # Shared constants and helpers
  styles.js                  # Shared style object
  components/
    Shared.jsx               # All reusable UI components
  pages/
    HubPage.jsx              # App selection hub
    auth/
      LoginPage.jsx
      SignUpPage.jsx
    registry/
      RegistryApp.jsx        # Registry shell + dashboard
      OverviewTab.jsx
      StructureTab.jsx       # Faculties → Departments → Programs → Courses
      MembersTab.jsx
      SessionsTab.jsx        # Sessions + Semesters
      OfferingsTab.jsx
      BulkUploadMembers.jsx
      BulkUploadCourses.jsx
    acadex/
      AcadexApp.jsx          # Acadex shell + role routing
      StudentView.jsx        # Course registration + results
      LecturerView.jsx       # Score entry + submit
      ExamOfficerView.jsx    # Verify results
      HODView.jsx            # Assign lecturers + approve results
      ManagementView.jsx     # Admin/Dean: enrollments, results, grade scales
      ResultEntryView.jsx    # Shared result table used by all roles
```

---

## Roles & Workflow

| Role | Can Do |
|------|--------|
| school_admin | Everything |
| hod | Assign lecturers, approve verified results |
| exam_officer | Verify submitted results (dept-scoped) |
| lecturer | Enter scores, submit results |
| student | Register for courses, view published results |

**Result lifecycle:** Draft → Submitted → Verified → Approved → Published
