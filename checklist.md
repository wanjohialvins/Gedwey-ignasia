# GEDWEY IGNASIA — MASTER CHECKLIST

## 🛠️ PHASE 1 — ENVIRONMENT SETUP
- [x] Node.js installed (LTS)
- [x] npm working
- [x] Git installed
- [x] VS Code installed
- [x] Expo CLI installed
- [x] EAS CLI installed
- [x] Git configured (name + email)
- [ ] Expo account created
- [ ] Supabase account created

## 📱 PHASE 2 — PROJECT SETUP
- [x] Expo app created (gedwey-ignasia)
- [x] TypeScript selected
- [x] App runs successfully (Expo Go test)
- [x] Project cleaned (removed boilerplate)
- [x] Folder structure matches system rules
- [ ] Absolute imports configured (optional but recommended)

## 🧱 PHASE 3 — CORE STRUCTURE
- [x] app/ structure created
- [x] components/ structure created
- [x] lib/ structure created
- [x] constants/ created
- [x] types/ created
- [x] supabase/ folder created
- [x] assets/ folder created

## ☁️ PHASE 4 — SUPABASE SETUP
- [ ] Supabase project created
- [ ] Project URL added to .env
- [ ] Anon key added to .env
- [ ] Supabase client created (lib/supabase.ts)
- [ ] Database schema executed
- [ ] Tables created:
  - [ ] profiles
  - [ ] couples
  - [ ] sessions
  - [ ] cards
  - [ ] discovery_sessions
  - [ ] journal_entries
  - [ ] health_checkins
  - [ ] time_capsules

## 🔐 PHASE 5 — AUTH SYSTEM
- [ ] Sign-up screen created
- [ ] Sign-in screen created
- [ ] Supabase auth integrated
- [ ] Login working
- [ ] Signup working
- [ ] Session persistence working
- [ ] Auth state stored in Zustand
- [ ] Error handling implemented
- [ ] Loading states implemented

## 🧭 PHASE 6 — ONBOARDING
- [ ] Mode selection screen created
- [ ] Relationship stage screen created
- [ ] Invite screen created
- [ ] Data saved to profiles
- [ ] Navigation flow working
- [ ] UI follows design system

## 🔥 PHASE 7 — DISCOVERY MODE
- [ ] Discovery home screen created
- [ ] Question card UI built
- [ ] Answer submission working
- [ ] Token generation working
- [ ] Share link generated
- [ ] Guest access page ([token].tsx)
- [ ] Guest answer submission working
- [ ] Answer reveal logic implemented
- [ ] Data stored in discovery_sessions

## 🎴 PHASE 8 — SESSION SYSTEM
- [ ] Session start screen
- [ ] Mood selection screen
- [ ] Card display screen
- [ ] Answer submission working
- [ ] Waiting state implemented
- [ ] Reveal screen working
- [ ] Realtime sync implemented
- [ ] Partner responses sync correctly

## 📓 PHASE 9 — JOURNAL
- [ ] Journal unlock logic (after 5 sessions)
- [ ] Journal list screen
- [ ] Journal detail screen
- [ ] Entry creation working
- [ ] Image upload (optional)
- [ ] Entries stored in database
- [ ] Entries fetched correctly

## 🎯 PHASE 10 — MILESTONES & DECKS
- [ ] Session count tracking implemented
- [ ] Feature unlock system working
- [ ] Journal unlock confirmed
- [ ] Health unlock logic added
- [ ] Deck system (if applicable)

## ⏳ PHASE 11 — TIME CAPSULE
- [ ] Capsule creation screen
- [ ] Capsule list screen
- [ ] Open date logic implemented
- [ ] Countdown display working
- [ ] Reveal functionality working

## ❤️ PHASE 12 — HEALTH CHECK-IN
- [ ] Slider inputs created
- [ ] Submission working
- [ ] Data stored in health_checkins
- [ ] Partner data combined
- [ ] Radar chart displayed

## 🔔 PHASE 13 — NOTIFICATIONS
- [ ] Expo Notifications configured
- [ ] Permission request handled
- [ ] Notification triggers implemented:
  - [ ] Partner answered
  - [ ] Session reminder
  - [ ] Capsule ready
- [ ] Notifications received successfully

## 🎨 PHASE 14 — UI & ANIMATIONS
- [ ] Strict colors applied (Blue 600, Blue 500, Blue 100, Text colors)
- [ ] Spacing system enforced (16px screen padding, 24px sections, 12px components)
- [ ] Button specs met (height ≥ 44px, radius rounded-xl, correct standard classes)
- [ ] Input specs met (height ≥ 44px, padding px-4, correct border/focus behavior)
- [ ] Card specs met (rounded-2xl, background white, subtle shadow)
- [ ] Hard rule enforced: No spinners used (ONLY skeletons with shimmer)
- [ ] Animation presets built with Reanimated & Moti (Fade In, Slide Up, Card Flip)
- [ ] NativeWind system extended in Tailwind configuration
- [ ] Screen transitions smooth and clear layout hierarchy

## 📦 PHASE 15 — BUILD & DEPLOY
- [ ] EAS configured
- [ ] Android build created
- [ ] APK installs successfully
- [ ] App runs without crash
- [ ] Environment variables working in build

## 🧪 PHASE 16 — FINAL TESTING
### Functional
- [ ] All flows work end-to-end
- [ ] No runtime errors
- [ ] Navigation stable
### UI/UX
- [ ] Clean layout
- [ ] No broken screens
- [ ] Responsive interactions
### Data
- [ ] No incorrect data
- [ ] Realtime working
- [ ] RLS working correctly

## 🔐 BACKEND VALIDATION
- [ ] All tables use UUID
- [ ] RLS enabled on all tables
- [ ] Policies correctly restrict access
- [ ] No public data leaks
- [ ] Queries optimized
- [ ] Types generated and used

## 🧠 STATE MANAGEMENT VALIDATION
- [ ] React Query used for all server data
- [ ] Zustand used for global state only
- [ ] useState used for UI state only
- [ ] No mixed responsibilities

## 🧩 COMPONENT VALIDATION
- [ ] All components typed
- [ ] No any used
- [ ] Components reusable where needed
- [ ] No logic-heavy UI components
- [ ] Proper structure followed

## 📁 FILE SYSTEM VALIDATION
- [ ] No misplaced files
- [ ] No duplicate components
- [ ] Clean folder hierarchy
- [ ] Imports working correctly

## 🚨 FINAL SUCCESS CHECK
- [ ] App runs smoothly
- [ ] No crashes
- [ ] No console errors
- [ ] All features complete
- [ ] UX feels polished
- [ ] Codebase is clean and scalable
