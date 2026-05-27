Critical Instructions:

1. Build Only One Feature At A Time

Do not try to build everything at once. Start with one feature and test it thoroughly before moving to the next.

2. Test After Every Step

After each change, test it immediately. If it doesn't work, fix it before proceeding.

3. No XAMPP or PHP

We are using a cloud-first architecture. No local server software.

4. Read Everything First

Understand the entire plan before starting implementation.

🧠 GEDWEY IGNASIA — DEVELOPMENT SYSTEM 
🧭 0. OVERALL STRATEGY 

You are building:

📱 Mobile App — React Native (Expo)
☁️ Backend — Supabase
🔄 Real-time Sync — Supabase Realtime
📦 Build System — Expo EAS
🧪 Testing — Antigravity checklist
⚠️ CORE RULES
❌ No XAMPP
❌ No PHP / MySQL
✅ Cloud-first architecture
✅ Mobile-first development
✅ Build in small working pieces
✅ Test after EVERY step
🛠️ 1. ENVIRONMENT SETUP
1.1 Install Required Software
Node.js (LTS)
VS Code
Git
1.2 Install Global Tools
npm install -g expo-cli
npm install -g eas-cli
1.3 Configure Git
git config --global user.name "Your Name"
git config --global user.email "your@email.com"
1.4 Create Accounts
Supabase
Expo
📱 2. PROJECT SETUP
2.1 Create App
npx create-expo-app gedwey-ignasia
cd gedwey-ignasia

👉 Select: TypeScript

2.2 Run App (FIRST TEST)
npx expo start
Open with Expo Go
Confirm app runs successfully
2.3 Clean Project Structure

Keep only:

app/
components/
lib/
constants/
☁️ 3. SUPABASE SETUP (CRITICAL)
3.1 Create Project
Go to Supabase dashboard
Create a new project
3.2 Get Keys

Copy:

Project URL
Anon Key
3.3 Create Client

📁 lib/supabase.ts

import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.EXPO_PUBLIC_SUPABASE_URL!,
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!
)
3.4 Environment Variables

📁 .env

EXPO_PUBLIC_SUPABASE_URL=your_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_key
3.5 Database Setup
Open Supabase SQL Editor
Run full schema from project spec

Creates:

profiles
couples
sessions
cards
etc.
🔐 4. AUTH SYSTEM (FIRST FEATURE)
Build Screens
app/(auth)/
  sign-in.tsx
  sign-up.tsx
Implement
Email + password signup
Login
Session persistence
✅ TEST CHECKPOINT
✔ User can sign up
✔ User can log in
✔ Session persists
🧭 5. ONBOARDING FLOW
Screens
mode-select.tsx
stage.tsx
invite.tsx
Logic

User selects:

Discovery
Early Dating
Couples

Save to:

profiles.app_mode
profiles.relationship_stage
✅ TEST
✔ Onboarding completes
✔ Data saved in Supabase
🔥 6. DISCOVERY MODE (CORE FEATURE)
Flow
Show card
User answers
Generate share link
Guest opens link
Guest answers
Reveal both answers
Files
app/discovery/
  index.tsx
  [token].tsx
Backend
Use discovery_sessions table
✅ CRITICAL TEST
✔ Link opens in browser
✔ Guest submits answer
✔ Both answers display
🎴 7. CORE SESSION SYSTEM
Flow
Start session
Show card
Answer
Wait for partner
Reveal
Files
session/
  mood.tsx
  card.tsx
  reveal.tsx
Realtime
Supabase subscriptions
✅ TEST
✔ Users sync in real-time
✔ Answers appear instantly
📓 8. JOURNAL FEATURE
Unlock Condition

After 5 sessions

Files
journal/
  index.tsx
  [id].tsx
Features
Save memory
View entries
Add photos
✅ TEST
✔ Entry saves
✔ Appears in list
🎯 9. DECKS & MILESTONES
Logic
if (session_count === 5) unlock('journal')
if (session_count === 10) unlock('health')
✅ TEST
✔ Features unlock correctly
⏳ 10. TIME CAPSULE
Files
capsule/
  create.tsx
  index.tsx
Features
Create capsule
Set open date
Reveal later
✅ TEST
✔ Countdown works
✔ Opens correctly
❤️ 11. HEALTH CHECK-IN
Features
Slider inputs
Radar chart
Data
health_checkins table
✅ TEST
✔ Both users submit
✔ Chart renders
🔔 12. PUSH NOTIFICATIONS
Tools
Expo Notifications
Supabase Edge Functions
Triggers
Partner answers
Session reminder
Capsule ready
✅ TEST
✔ Notifications received
🎨 13. UI & ANIMATIONS
Add
Card flip animation
Smooth transitions
Loading skeletons
Tools
Reanimated
Moti
📦 14. BUILD APK
Setup
eas build:configure
Build
eas build --platform android --profile preview
✅ TEST
✔ APK installs
✔ App runs correctly
🧪 15. FINAL TESTING (ANTIGRAVITY)

Must pass:

✔ Discovery flow
✔ Pairing
✔ Sessions
✔ Journal
✔ Notifications
✔ Build success
🔄 DAILY WORKFLOW

Every day:

Pick ONE feature
Build a small part
Test immediately
Fix bugs
Move forward
⚠️ REALITY CHECK

This is an advanced project.

Expect:

Bugs
Confusion
Iteration
🚀 EXECUTION COMMAND

Start with:

start step 1 (project setup)
💡 FINAL NOTE

Build slowly and correctly.

Do NOT:

Rush
Skip validation
Ignore errors