---
trigger: always_on
---

🧠 GEDWEY IGNASIA — DASHBOARD & SETTINGS DESIGN RULES

This file defines the navigation, architectural layout, and features for the Sidebar Dashboard and the dedicated Settings screen in the application.

🧱 SIDEBAR DASHBOARD (DRAWER NAVIGATION)
The application layout should support a drawer-based sidebar menu for high-level relationship details and dashboard utilities.

✅ SIDEBAR ELEMENTS:
- Relationship Status Panel: A clean, calm card showing:
  - Streak Tracker: Soft active days counter.
  - Anniversary Counter: Weeks/months connected.
- Profile Quick-View: Avatar and display name split panel showing both the user and the partner (or invite code option).
- Milestones Progress: Visual progression tracking for locked features (Journal, Capsule, etc.).
- Mode Toggle: Display of the current app mode (discovery, early_dating, couples).

⚙️ DEDICATED SETTINGS TAB / SCREEN
To keep the dashboard decluttered, all profile management, connection configurations, and system preferences must reside on a dedicated Settings screen.

✅ SETTINGS SECTIONS:
- Profile Settings:
  - Display name customization.
  - Personal accent color/avatar choices.
  - Active relationship stage selection.
- Connection & Pairing:
  - Partner profile overview.
  - Unpair/disconnect option (with strict warning confirmation).
  - Invite code viewing, copying, and redemption.
- Preferences:
  - Notification toggle settings (Session, Partner Answer, Capsule reminders).
- Danger Zone:
  - Account Sign Out.
  - Account Deletion.

📊 DASHBOARD FEATURES
The dashboard should present a soft, non-intrusive summary of the relationship state.

✅ KEY DASHBOARD WIDGETS:
- Streak Tracker: Prominently showing active days in a visually premium, soft layout.
- Partner's Active Status & Mood: Realtime visualization of the partner's daily mood selector.
- Recent Moments Feed: Quick navigation to the latest unlocked cards, journal entries, or capsule updates.
