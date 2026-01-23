# MivideoAI - Technical & Business Constitution

## 1. CORE IDENTITY & BRANDING (IMMUTABLE)

- **Product:** MivideoAI (Marketplace de Influencers IA).
- **Aesthetic:** "Velvet Mode" / High-End Luxury.
- **Design System:**
  - **Background:** Deep Black (`#000000` or `#050505`).
  - **Accent:** Gold Gradient (`from-[#D4AF37] to-[#F2C94C]`).
  - **FORBIDDEN:** NO PURPLE, NO VIOLET, NO PINK generic templates.
  - **UI Components:** Glassmorphism, Thin Borders, Serif Headings.

## 2. INFRASTRUCTURE & DEPLOYMENT PROTOCOLS

- **Hosting:** Vercel.
- **Live Branch:** `main` (This is PRODUCTION).
- **Staging Branch:** `production` (Legacy name, serves as Staging).
- **Environment Variables:**
  - MUST exist in Vercel Settings (NOT in code).
  - Critical: `SUPABASE_SERVICE_ROLE_KEY`, `VITE_SUPABASE_URL`.
- **Build Safety:** Always run `npm run build` locally before pushing.

## 3. DATABASE SCHEMA (SUPABASE)

- **Primary User Table:** `public.profiles` (Do NOT use `users` table directly).
- **Critical Columns:**
  - `id` (UUID, references auth.users).
  - `email` (Text).
  - `status` (Text: 'PENDING' | 'APPROVED').
  - `credits` (Integer).
- **Auth Flow:**
  - Waitlist = `INSERT` into `profiles` (Status: PENDING).
  - Approval = Admin Dashboard -> API -> `inviteUserByEmail`.
  - RLS Policies: Must allow Anon inserts for Waitlist.

## 4. APP STRUCTURE (ROUTING)

- **Public:**
  - `/` -> LandingWaitlist (Redirects to `/app` if Auth)
  - `/login` -> LoginScreen (Redirects to `/app` on success)
- **Protected (`/app`):**
  - `/app` -> Redirects to `/app/studio`
  - `/app/studio` -> **Studio Console** (The New Freepik-Style Studio)
  - `/app/explore` -> Explore Page
  - `/app/casting` -> Casting
  - `/app/gallery` -> Gallery
  - `/app/earnings` -> Earnings
  - `/app/plan` -> Plan
  - `/app/settings` -> Settings

## 5. DEVELOPMENT RULES (THE "ZERO REGRESSION" PLEDGE)

1. **Context First:** Before editing, scan for imports to avoid breaking references (e.g., `App.tsx` imports).
2. **Type Safety:** TypeScript types must match the DB Schema strictly.
3. **Self-Correction:** If a build fails, revert and analyze. Do not force push.
4. **Imports:** Verify `default` vs `named` exports when refactoring.

## 5. SELF-MAINTENANCE PROTOCOL (MANDATORY)

**Rule:** This document is the Single Source of Truth.
**Trigger:** Whenever the Agent changes DB Schema, Env Vars, or Architeture.
**Action:** The Agent MUST update this file (`CONTEXT.md`) as the final step of the task.

## 6. SENTINEL OPERATING PROTOCOLS (THE KILL SWITCH)

**Role:** Guardians of Code Integrity.
**Mandate:** Protect the `main` branch at all costs.

**Rules of Engagement:**

1. **The "First Do No Harm" Test:**
    - BEFORE pushing any code, the Sentinel MUST run `npm run build` internally.
    - IF `npm run build` FAILS -> The operation is **ABORTED IMMEDIATELY**.
    - The Sentinel must log a "BLOCKED" event to `public.sentinel_logs` and revert changes.
2. **The Black Box Rule:**
    - Every operation (Success or Failure) MUST be logged to the `public.sentinel_logs` database table.
    - Silence is not an option.
3. **Anti-Hallucination:**
    - Before editing a file, verify it exists. Do not import "ghost files".
    - Adhere strictly to the "Black & Gold" visual standard defined in Section 1.

## 7. SYSTEM STATUS SNAPSHOT (Confirmed Wins)

1. **Landing Page:** OPERATIONAL. "Black & Gold" UI deployed. Direct DB inserts active.
2. **Auth & Email:** OPERATIONAL.
   - HTML Templates applied manually in Supabase.
   - Custom Domain URL (`mivideoai.com`) configured in Supabase.
   - DO NOT OVERWRITE Email Logic without checking Supabase Settings first.
3. **Sentinel System:** OPERATIONAL.
   - Table: `sentinel_logs` verified.
   - Schema: Uses `sentinel_name`, `action_type`, `report_text`.
   - **Sentinel UI:** Upgraded to 'Glass Terminal' Table. Maps `sentinel_name` & `action_type` correctly. No more 'EVENT' placeholders.
   - **Admin Email System:** Native (Supabase SMTP). Wired via `server.js` route `/api/admin/approve-user`. No external providers (Resend) required.
4. **Dashboard v2 (God Mode):** Active.
   - Stack: `recharts` for Analytics.
   - **RPC Functions:** `add_credits`, `update_user_status` are REQUIRED in DB.
   - **Sentinel Protocol:** Context-Awareness Badge enforced in UI.
   - **User Management:** Ban/Inject Credits features enabled via RPC.
5. **Studio V2 (Velvet Native):** Active.
   - **Frontend:** Integrated directly into User App (`/app/studio`).
   - **DB:** Connected to `public.generations` and `profiles`.
   - **Mobile:** Input zoom locked for "Native App" feel.
   - **UI:** Custom "Creative Suite" interface matching Velvet aesthetic.
