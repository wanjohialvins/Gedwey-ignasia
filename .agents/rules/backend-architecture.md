BACKEND ARCHITECTURE RULES (SUPABASE)
⚠️ PRIMARY RULE

The backend MUST be:

Secure
Predictable
Scalable
Strongly typed
Consistent

👉 No “quick SQL hacks” allowed

🧱 DATABASE DESIGN RULES
🧩 TABLE STRUCTURE PRINCIPLES

Every table MUST:

Have a primary key (id)
Use uuid (NOT integers)
Include timestamps:
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
🧠 NAMING CONVENTION
Tables → plural, lowercase
Columns → snake_case
✅ Examples
profiles
discovery_sessions
health_checkins
❌ Avoid
UserTable
sessionData
tbl_profiles
🔗 RELATIONSHIPS

You MUST:

Use foreign keys
Enforce constraints

Example:

user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
🔐 AUTH INTEGRATION RULE
🎯 SOURCE OF TRUTH

User identity ALWAYS comes from:

👉 auth.users

🧩 PROFILE LINKING

Every user MUST have a profile:

profiles.id = auth.users.id
🚫 FORBIDDEN
❌ Creating custom auth systems
❌ Storing passwords manually
❌ Duplicating user identity
🔒 ROW LEVEL SECURITY (RLS) — MANDATORY
⚠️ RULE

ALL tables MUST have:

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
🧠 POLICY PRINCIPLES

Users can ONLY:

Read their own data
Modify their own data
Access shared couple data
🧩 EXAMPLE POLICY
CREATE POLICY "Users can view own profile"
ON profiles
FOR SELECT
USING (auth.uid() = id);
🚫 FORBIDDEN
❌ Public access without restriction
❌ Missing RLS policies
❌ Overly broad permissions
🔄 REALTIME ARCHITECTURE
🎯 PURPOSE

Enable:

live session updates
answer syncing
partner interaction
⚙️ RULES
Enable realtime on required tables
Keep payloads minimal
Listen only where needed
🚫 FORBIDDEN
❌ Subscribing to entire database
❌ Unfiltered realtime streams
📦 QUERY ARCHITECTURE
⚠️ RULE

ALL database access MUST go through:

👉 React Query hooks in lib/queries/

🧱 PATTERN
One hook per query
One hook per mutation
No inline queries in components
✅ EXAMPLE FLOW
Component → React Query Hook → Supabase → DB
🚫 FORBIDDEN
❌ Direct Supabase calls in components
❌ Duplicate queries
❌ Uncached fetches
🧠 DATA ACCESS LAYER
📁 LOCATION
lib/queries/
lib/mutations/
🧩 RULES
Queries = read-only
Mutations = write operations
Always typed
🧾 TYPE SAFETY RULE
⚠️ MUST

You MUST generate database types:

npx supabase gen types typescript --project-id <id>
📁 STORE IN
types/database.ts
🚫 FORBIDDEN
❌ Using any
❌ Untyped responses
❌ Guessing schema
🔄 MIGRATION RULE
⚠️ NEVER EDIT TABLES DIRECTLY IN PROD

Instead:

Use SQL files
Track schema changes
📁 LOCATION
supabase/
  schema.sql
  migrations/
🧠 BUSINESS LOGIC RULE
⚠️ KEEP DB CLEAN
DB = data storage
Logic = app layer
🚫 FORBIDDEN
❌ Complex logic inside SQL
❌ Business rules in DB triggers (unless necessary)
🔔 EDGE FUNCTIONS RULE
🎯 USE FOR
Notifications
Secure operations
Background jobs
🚫 FORBIDDEN
❌ Moving full backend logic there
❌ Replacing frontend logic
🔍 VALIDATION RULE

Before finishing ANY backend work:

✔ Tables structured correctly
✔ RLS enabled
✔ Policies secure
✔ Queries follow pattern
✔ Types generated
✔ No direct DB calls in UI
🚨 HARD FAILURE CONDITIONS

STOP if:

RLS missing
Data exposed publicly
Queries duplicated
Types missing
Schema inconsistent

👉 FIX before continuing

✅ SUCCESS STATE

Backend should:

Be secure by default
Scale without breaking
Sync in realtime
Be fully typed
Be easy to extend
