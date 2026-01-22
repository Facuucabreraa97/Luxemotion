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

## 4. DEVELOPMENT RULES (THE "ZERO REGRESSION" PLEDGE)
1. **Context First:** Before editing, scan for imports to avoid breaking references (e.g., `App.tsx` imports).
2. **Type Safety:** TypeScript types must match the DB Schema strictly.
3. **Self-Correction:** If a build fails, revert and analyze. Do not force push.
4. **Imports:** Verify `default` vs `named` exports when refactoring.

## 5. SELF-MAINTENANCE PROTOCOL (MANDATORY)
**Rule:** This document is the Single Source of Truth.
**Trigger:** Whenever the Agent changes DB Schema, Env Vars, or Architeture.
**Action:** The Agent MUST update this file (`CONTEXT.md`) as the final step of the task.
