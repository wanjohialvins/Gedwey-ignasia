STATE MANAGEMENT RULES (STRICT)
⚠️ PRIMARY RULE

You MUST separate state into three distinct types:

Server State → React Query
Global Client State → Zustand
Local UI State → useState

👉 NEVER mix these incorrectly

🧩 1. SERVER STATE (React Query)
🎯 PURPOSE

Handles:

Supabase data
API calls
Remote fetching
Caching
Sync
⚙️ RULES

You MUST:

Use React Query (@tanstack/react-query v5)
NEVER fetch directly inside components
ALWAYS wrap in hooks
📁 LOCATION
lib/queries/
🧱 STRUCTURE

Example:

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../supabase'

export const useUserProfile = (userId: string) => {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data
    },
  })
}
🔁 MUTATIONS

For writes:

import { useMutation } from '@tanstack/react-query'

export const useUpdateProfile = () => {
  return useMutation({
    mutationFn: async (payload) => {
      // supabase update
    },
  })
}
🚫 FORBIDDEN
❌ Fetching inside components
❌ Calling Supabase directly in UI
❌ Not using query keys
❌ Ignoring caching
🔄 INVALIDATION RULE

After mutation:

👉 MUST invalidate related queries

🧠 2. GLOBAL STATE (Zustand)
🎯 PURPOSE

Handles:

Auth user
Session state
UI global flags
Partner connection state
📁 LOCATION
lib/store/
🧱 STRUCTURE

Example:

import { create } from 'zustand'

type AuthState = {
  user: string | null
  setUser: (user: string | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}))
⚙️ RULES
Keep state minimal
Keep logic simple
No heavy computations
🚫 FORBIDDEN
❌ Storing server data here
❌ Replacing React Query
❌ Huge stores
🎨 3. LOCAL STATE (useState)
🎯 PURPOSE

Handles:

Input values
Toggles
Temporary UI state
✅ EXAMPLES
const [isOpen, setIsOpen] = useState(false)
🚫 FORBIDDEN
❌ Global data
❌ Server data
❌ Shared app state
🔄 REALTIME RULE (SUPABASE)
🎯 PURPOSE

Handle live updates between users

⚙️ RULES
Use Supabase subscriptions
Sync with React Query cache
Update UI instantly
🚫 FORBIDDEN
❌ Polling unnecessarily
❌ Ignoring realtime events
🧠 DATA FLOW RULE (CRITICAL)

Correct flow:

Supabase → React Query → Component
                ↓
             Zustand (only if needed)
❌ WRONG FLOW
Component → Supabase directly ❌
Zustand → holds API data ❌
🔍 STATE VALIDATION CHECK

Before finishing ANY feature:

✔ Server data via React Query
✔ Global state via Zustand
✔ UI state via useState
✔ No mixing responsibilities
⚡ PERFORMANCE RULES

You MUST:

Avoid unnecessary re-fetching
Use caching properly
Avoid large global states
Keep components lightweight
🧪 ERROR HANDLING

Every async operation MUST:

Use try/catch
Return clear errors
Show UI feedback
🚨 HARD FAILURE CONDITIONS

STOP if:

Server state stored in Zustand
Supabase called inside components
No query/mutation structure
State logic becomes messy

👉 FIX before continuing

✅ SUCCESS STATE

Your app should:

Sync smoothly
Update instantly
Avoid redundant calls
Stay predictable
💡 FINAL DIRECTIVE

State is the nervous system of your app.

If broken:

👉 Everything breaks

If clean:

👉 App feels fast, smooth, reliable

⚠️ REALITY CHECK

Most devs fail here because:

they mix state types
they overuse global state
they skip caching

This system prevents ALL of that.