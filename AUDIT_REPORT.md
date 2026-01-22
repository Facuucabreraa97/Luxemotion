# OPERATION DEEP CLEAN: FORENSIC AUDIT REPORT
**Date**: 2026-01-22
**Status**: DRAFT (Review Required)

## 1. Structural Integrity & Ghosts
We detected potential "Ghost Files" (Legacy/Unused Code) that clutter the workspace:

| File | Status | Recommendation |
| :--- | :--- | :--- |
| `src/pages/LandingPage.tsx` | **SUSPICIOUS**. We currently route `/` to `LandingWaitlist.tsx`. This file likely contains the old landing page. | **ARCHIVE / DELETE** |
| `src/pages/Admin.tsx` | **CRITICAL ZOMBIE**. We use `src/pages/admin/Sentinel_V3.tsx` (Vydy Ops) or `AdminConsole.tsx`. Also contains legacy "Purple" styles. | **DELETE** |
| `src/pages/AccessPending.tsx` | **REDUNDANT**. The new "Golden Gate" logic handles pending status inside `LoginScreen` or redirects to a specific flow? We need to verify if this is still routed. | **REVIEW** |
| `src/components/Sidebar.tsx` | **UPDATED**. Confirmed active (Gold/Status logic). | **KEEP** |

## 2. Database Synchronization (Types vs Reality)
*Checking `src/types.ts` against Migration Schema (`status`, `PENDING`, `APPROVED`)*:
- **Migration**: `status` (enum: PENDING, APPROVED, ACTIVE).
- **TypeScript**: `[PENDING CHECK]` (If `UserProfile` interface uses `access_status` instead of `status`, simple queries will break UI).

## 3. The "Purple" Threat (Legacy Styles)
We found `purple` / `violet` references in:
- `src/index.css` (Might be utility classes, verify "Deep Void" didn't miss spots).
- `src/components/VideoCard.tsx`
- `src/components/ModelSelector.tsx`
- `src/pages/EarningsDashboard.tsx`
- `src/styles.ts`
- **Impact**: Inconsistent UI. User expects "Deep Void / Gold". Purple = Cheap/Old.

## 4. Logic Zombies (`access_status`)
- `src/App.tsx`: 1 match. Likely checking `profile.access_status` for routing? **MUST UPDATE TO `status`**.
- `src/pages/admin/components/UsersDatabase.tsx`: Updated locally, but need to ensure no other component relies on old column.

## 5. Critical Path Verification
- **Router**: `src/App.tsx`
    - `/` -> `LandingWaitlist` (Correct).
    - `/login` -> `LoginScreen` (Correct).
    - `/activate-account` -> `ActivateAccount` (Correct).
    - `/vydy-ops/console` -> `Sentinel_V3` (Correct).
- **Auth**: `LoginScreen` uses `checkStatusAndLogin` (Correct).

## Action Plan (The Purge)
1.  **Modify `src/types.ts`**: Rename `access_status` -> `status`.
2.  **Fix `src/App.tsx`**: Update zombie reference.
3.  **Delete `src/pages/Admin.tsx`** & `src/pages/LandingPage.tsx`.
4.  **Refactor Styles**: Visit `VideoCard` and `ModelSelector` to remove Purple/Violet.
