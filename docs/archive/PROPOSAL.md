# LuxeMotion: Architectural & UX Proposal

## 1. Executive Summary
This proposal outlines the transformation of "LuxeMotion" into a state-of-the-art AI Video Generation platform, targeting high-net-worth creators (Velvet Mode) and agencies (Agency Mode). The goal is to achieve a "High-End Investment" feel, superior to competitors, with a focus on "Hyperrealism" and "Extreme Ease of Use."

## 2. User Experience (UX) & Visual Design Strategy

### Core Aesthetic: "Technological Luxury"
*   **Palette:** Deep blacks (OLED optimized), Gold (#C6A649) for primary actions, subtle gradients.
*   **Typography:** Elegant, mono-spaced for data, sans-serif for UI. Uppercase tracking for headers.
*   **Motion:** Slow, smooth micro-interactions (parallax cards, glow effects).

### Dual Mode Segmentation
We will implement a global `ModeContext` that transforms the application state and visual theme.

| Feature | **Velvet Mode** (Creators/OnlyFans) | **Agency Mode** (Brands/V-Tubers) |
| :--- | :--- | :--- |
| **Primary Goal** | Intimacy, Speed, Monetization | Scalability, Consistency, Control |
| **Visual Theme** | "Midnight Boudoir": Deep Pinks, Purples, Gold | "Corporate Future": Stark White/Black, Sharp Lines, Blue/Silver |
| **Dashboard** | Focus on "Quick Gen", "Subscriber Requests" | Focus on "Campaigns", "Brand Assets", "Team" |
| **Asset Mgmt** | "My Closet", "Private Gallery" | "Brand Kits", "Product Catalog" |
| **Privacy** | High (Face blurring toggles, Secure Vault) | Collaborative (Shared folders) |

## 3. Architecture Proposal

### 3.1. Directory Structure Refactoring
We will restructure `src/` to support scalability and domain-driven design.

```text
src/
├── features/           # Feature-based modules
│   ├── studio/         # Video Editor & Generation Logic
│   ├── dashboard/      # Main stats & overview
│   ├── assets/         # Talent & Product management
│   └── settings/       # User config & Billing
├── components/         # Shared UI (Buttons, Modals, Inputs)
│   ├── ui/             # Primitive styling (Atomic design)
│   └── layout/         # Sidebar, Header, Shell
├── context/            # Global State (Auth, Mode, I18n)
├── hooks/              # Custom React Hooks
├── lib/                # Utilities (Supabase, API)
└── locales/            # i18n JSON files (es, en)
```

### 3.2. Internationalization (i18n)
*   **Library:** `react-i18next`
*   **Default:** Spanish (`es-ES`)
*   **Structure:**
    *   `locales/es/common.json`, `locales/es/studio.json`
    *   `locales/en/common.json`, `locales/en/studio.json`
*   **Implementation:** Automatic detection with a prominent toggle in the Sidebar/Header.

### 3.3. Dashboard & Video Editor Structure

**The "Studio" (Editor) will use a "Cinematic Workspace" layout:**
*   **Left Panel (The Source):** Inputs. Image upload, Avatar selection (Carousel), Product placement.
*   **Center (The Canvas):** Large preview area, 16:9 / 9:16 toggle overlay. "Magical" generation progress bar (no spinner, but a rendering visualization).
*   **Right Panel (The Controls):** Refined settings. Sliders for duration, motion, camera angle.
*   **Bottom (The Timeline/History):** Horizontal scroll of previous generations.

**Velvet Differentiation:**
*   In Velvet mode, the "Controls" panel simplifies to "Vibe" selectors (e.g., "Romantic", "Spicy", "Dark") instead of technical camera parameters, unless expanded.

## 4. Immediate Next Steps (Technical)
1.  **Install i18n dependencies.**
2.  **Create `ModeContext`** to handle the Velvet/Agency toggle.
3.  **Refactor `StudioPage`** into the new 3-panel layout.
4.  **Implement the "Magical" Avatar flow.**
