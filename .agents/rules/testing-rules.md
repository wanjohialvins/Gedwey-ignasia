ESTING & QA RULES (STRICT)
⚠️ PRIMARY RULE

Every feature MUST be:

Tested immediately after implementation
Verified before moving forward
Stable before adding new features

👉 DO NOT stack untested features

🧪 TESTING LEVELS

You MUST validate at three levels:

Functional Testing (Does it work?)
UI/UX Testing (Is it usable?)
Data Testing (Is data correct & synced?)
🔍 1. FUNCTIONAL TESTING
🎯 PURPOSE

Ensure features actually work as expected

✅ CHECKLIST

For EVERY feature:

✔ No runtime errors
✔ All buttons work
✔ Navigation works
✔ Inputs behave correctly
✔ Edge cases handled
🚫 FORBIDDEN
❌ Assuming code works
❌ Skipping manual testing
❌ Ignoring console errors
🎨 2. UI / UX TESTING
🎯 PURPOSE

Ensure the app feels clean, usable, and consistent

✅ CHECKLIST
✔ Spacing follows design rules
✔ Touch targets ≥ 44px
✔ Text is readable
✔ No overlapping elements
✔ Loading states exist
✔ Error states exist
🚫 FORBIDDEN
❌ Broken layouts
❌ Tiny buttons
❌ No feedback on actions
📊 3. DATA TESTING
🎯 PURPOSE

Ensure correct backend interaction and sync

✅ CHECKLIST
✔ Data saves correctly
✔ Data fetches correctly
✔ No duplicate entries
✔ Realtime updates work
✔ Correct user data isolation (RLS working)
🚫 FORBIDDEN
❌ Wrong user seeing data
❌ Stale UI after update
❌ Missing realtime sync
🔄 FEATURE TEST FLOW (MANDATORY)

After building ANY feature:

Run the app
Use the feature manually
Test edge cases
Check console logs
Verify database changes

👉 ONLY proceed if ALL pass

🧠 ANTIGRAVITY TEST CHECKPOINTS

At key milestones, you MUST verify:

🔐 Auth
✔ Signup works
✔ Login works
✔ Session persists
🔥 Discovery Flow
✔ Link sharing works
✔ Guest access works
✔ Answers reveal correctly
🎴 Sessions
✔ Two users sync
✔ Answers appear in realtime
📓 Journal
✔ Entries save
✔ Entries display
🔔 Notifications
✔ Notifications trigger
✔ Notifications received
📦 Build
✔ APK installs
✔ App runs without crash
🧪 ERROR HANDLING TEST

You MUST simulate failures:

Disconnect internet
Submit empty inputs
Trigger API errors

Verify:

✔ App does not crash
✔ User sees helpful message
⚡ PERFORMANCE TEST

You MUST check:

No unnecessary re-renders
No lag during interactions
Smooth animations
Fast data loading
🧠 REGRESSION RULE

After adding a new feature:

👉 Re-test previous features

🚫 FORBIDDEN
❌ “It worked before, so it’s fine”
❌ Ignoring side effects
🔍 DEBUGGING RULE

When a bug appears:

Identify root cause
Reproduce issue
Fix properly (not patch)
Re-test fully
🚨 HARD FAILURE CONDITIONS

STOP if:

Feature not tested
Known bug exists
Console errors present
UI broken
Data inconsistent

👉 FIX before continuing

✅ SUCCESS STATE

The app should:

Work without crashes
Feel smooth and responsive
Sync data correctly
Handle errors gracefully