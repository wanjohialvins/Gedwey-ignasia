COMPONENT ARCHITECTURE RULES (STRICT)
⚠️ PRIMARY RULE

Every component MUST be:

Reusable
Predictable
Typed
Cleanly structured

👉 No “quick hack” components allowed

🧩 COMPONENT TYPES

You MUST classify every component BEFORE creating it:

1. UI COMPONENT (DUMB)
Purely visual
No business logic
Reusable across app

Examples:

Button
Input
Card
Loader
2. FEATURE COMPONENT (SMART)
Contains UI + light logic
Used within a specific feature

Examples:

SessionCard
DiscoveryPrompt
JournalEntry
3. SCREEN (ROUTE)
Lives in app/
Handles:
data fetching
state orchestration
navigation
🧱 COMPONENT STRUCTURE (MANDATORY)

Every component MUST follow this exact structure:

import React from 'react'
import { View, Text } from 'react-native'

type Props = {
  // typed props here
}

export const ComponentName = ({ ...props }: Props) => {
  // hooks

  // handlers

  return (
    <View>
      <Text>Component</Text>
    </View>
  )
}
🧠 STRUCTURE ORDER (STRICT)

Inside every component:

Imports
Types / Props
Component function
Hooks
Handlers
Render (return)

👉 NEVER mix order

🔷 PROPS RULE
MUST be typed
MUST be explicit
NO any

Example:

type Props = {
  title: string
  onPress: () => void
}
🎯 SINGLE RESPONSIBILITY RULE

Each component MUST:

👉 Do ONE thing well

❌ Bad:

Handles UI + API + navigation + validation

✅ Good:

UI handles display
Screen handles logic
🔁 REUSABILITY RULE

Before creating a component:

Ask:

Can this be reused?
Will it appear in multiple places?

If YES → put in components/

🧠 LOGIC SEPARATION RULE
NEVER put inside components:
API calls
Supabase queries
heavy business logic

👉 Move to lib/

🔄 STATE MANAGEMENT RULE
Use:
Local state → small UI state
Zustand → global state
React Query → server state
🎨 STYLING RULE

Use:

NativeWind (Tailwind)

Example:

<View className="p-4 bg-white rounded-xl">
🚫 FORBIDDEN PATTERNS
❌ Inline complex logic in JSX
❌ Huge components (200+ lines)
❌ Duplicated UI blocks
❌ Anonymous functions everywhere
❌ Mixing styles randomly
🧩 COMPONENT SPLITTING RULE

If a component grows too large:

👉 Split it into smaller components

Example:

components/session/
  SessionCard.tsx
  SessionHeader.tsx
  SessionActions.tsx
⚡ PERFORMANCE RULE

You MUST:

Avoid unnecessary re-renders
Use useCallback when needed
Use useMemo for expensive calculations
🧪 ERROR HANDLING RULE

If component interacts with async logic:

Show loading state
Show error state
Never leave blank UI
🔍 VALIDATION CHECK (MANDATORY)

Before finishing a component:

✔ Props typed
✔ No any
✔ Clean structure
✔ No mixed responsibilities
✔ Reusable if needed
🧠 NAMING RULE
Components → PascalCase
Clear, descriptive names

Examples:

PrimaryButton ✅
SessionCard ✅
CoolThing ❌
🔄 REFACTOR RULE

If you notice:

repeated UI
repeated logic

👉 Extract into reusable component

🚨 HARD FAILURE CONDITIONS

STOP if:

Component has multiple responsibilities
Logic is mixed with UI improperly
Types are missing
Code becomes messy

👉 FIX before continuing

✅ SUCCESS STATE

A good component:

Is easy to read
Is easy to reuse
Has clear responsibility
Has predictable behavior
💡 FINAL DIRECTIVE

Components are the building blocks of your app.

If they are messy:

👉 the entire app becomes unstable

If they are clean:

👉 everything scales smoothly

⚠️ REALITY CHECK

Most AI-generated apps fail because:

components are bloated
logic is mixed everywhere
no structure exists

This system eliminates that completely.