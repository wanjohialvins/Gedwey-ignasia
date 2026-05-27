FILE SYSTEM RULES (STRICT)
⚠️ PRIMARY RULE

You MUST:

Follow this structure EXACTLY
NEVER create random folders
NEVER place files arbitrarily
NEVER duplicate logic across folders
🧱 ROOT STRUCTURE (LOCKED)
app/
components/
lib/
constants/
types/
supabase/
assets/
📁 DIRECTORY RESPONSIBILITIES
📱 app/ — SCREENS & ROUTES ONLY
Contains ALL screens (Expo Router)
Organized by feature
NO reusable components here
Structure:
app/
  (auth)/
  (app)/
  discovery/
  session/
  journal/
  capsule/
Rules:
Each file = one screen
Use lowercase + kebab or simple naming
Dynamic routes use [param].tsx
🧩 components/ — REUSABLE UI ONLY
Shared across multiple screens
MUST be reusable
MUST be presentational (minimal logic)
Examples:
components/
  Button.tsx
  Card.tsx
  Input.tsx
  Loader.tsx
Rules:
No screen-level logic
No API calls
No navigation logic
🧠 lib/ — CORE LOGIC & HELPERS
Business logic
API wrappers
utilities
Examples:
lib/
  supabase.ts
  auth.ts
  utils.ts
Rules:
No UI
No JSX
Pure logic only
📊 constants/ — STATIC VALUES
App-wide constants
Examples:
constants/
  colors.ts
  spacing.ts
  config.ts
Rules:
No functions
No side effects
🧾 types/ — TYPE DEFINITIONS
All TypeScript interfaces/types
Examples:
types/
  user.ts
  session.ts
  database.ts
Rules:
NO logic
ONLY types/interfaces
☁️ supabase/ — DATABASE & SCHEMA
SQL files
migrations
policies
Examples:
supabase/
  schema.sql
  policies.sql
🖼️ assets/ — STATIC FILES
Images
icons
fonts
🧠 FILE CREATION RULE

Before creating ANY file:

Identify its purpose
Map it to the correct folder
VERIFY it does not already exist

👉 If duplicate → reuse instead

🔁 IMPORT RULE (CRITICAL)

You MUST:

Use absolute imports if configured
Otherwise use clean relative paths
Avoid deep nesting like ../../../../
🚫 FORBIDDEN ACTIONS
❌ Creating “utils” folders outside lib/
❌ Mixing UI + logic in same file (unless screen)
❌ Duplicating components
❌ Putting API logic inside components
❌ Putting types inside components
🧩 NAMING CONVENTIONS
Files
Components → PascalCase.tsx
Screens → kebab-case.tsx OR simple names
Utils → camelCase.ts
Types → camelCase.ts
Examples
Button.tsx ✅
sign-in.tsx ✅
auth.ts ✅
user.ts ✅
🔍 STRUCTURE VALIDATION RULE

Before finishing ANY step:

You MUST check:

File is in correct folder
Naming is correct
No duplication
Imports resolve correctly
🧠 SCALABILITY RULE

If a feature grows:

👉 Create subfolders inside its domain

Example:

components/session/
  SessionCard.tsx
  SessionHeader.tsx
🔄 REFACTOR RULE

If code becomes messy:

You MUST:

Extract reusable parts → components/
Extract logic → lib/
Extract types → types/
🚨 HARD FAILURE CONDITIONS

STOP if:

File placed in wrong directory
Duplicate logic detected
Imports break
Folder structure violated

👉 FIX before continuing

✅ SUCCESS STATE

The project should:

Be easy to navigate
Have clear separation of concerns
Have reusable components
Have predictable file locations
💡 FINAL DIRECTIVE

A clean file system =

faster development
fewer bugs
easier debugging
scalable architecture