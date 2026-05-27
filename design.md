# 🎨 GEDWEY IGNASIA — DESIGN SYSTEM (ADVANCED)

---

## 🎯 DESIGN PHILOSOPHY

- Calm
- Premium
- Minimal
- Emotion-driven
- Soft interactions

---

## 🎨 COLOR SYSTEM (STRICT)

### Primary
- Blue 600: #2563EB
- Blue 500: #3B82F6
- Blue 100: #DBEAFE

### Neutral
- White: #FFFFFF
- Background: #F8FAFC
- Border: #E5E7EB

### Text
- Primary: #0F172A
- Secondary: #475569
- Muted: #94A3B8

---

## 🚫 HARD RULES

- No spinners (ONLY skeletons)
- No random colors
- No inconsistent spacing

---

## 🧱 SPACING SYSTEM

- Screen padding: 16px
- Section spacing: 24px
- Component spacing: 12px

---

# 🧩 COMPONENT DESIGN SPECS

## 🔘 Button

- Height: ≥ 44px
- Padding: px-4 py-3
- Radius: rounded-xl
- Style:
  - Primary → bg-blue-600 text-white
  - Secondary → bg-blue-100 text-blue-600

---

## 🧾 Input

- Height: 44px+
- Border: border-gray-300
- Focus: border-blue-500
- Padding: px-4

---

## 🃏 Card

- Background: white
- Padding: p-4
- Radius: rounded-2xl
- Shadow: subtle

---

## 🧊 Skeleton

- Background: gray-200 / blue-100
- Animated shimmer
- Matches layout exactly

---

# ⚡ ANIMATION SYSTEM

## Tools

- Reanimated
- Moti

---

## RULES

- Duration: 150ms–300ms
- Easing: ease-in-out
- No bounce unless intentional

---

## PRESETS

- Fade In: opacity 0 -> 1, duration 200ms
- Slide Up: translateY 10 -> 0, opacity 0 -> 1
- Card Flip: rotateY animation, smooth transition

---

# 🎨 NATIVEWIND SYSTEM

## Colors

```ts
theme: {
  extend: {
    colors: {
      primary: '#2563EB',
      secondary: '#3B82F6',
      background: '#F8FAFC',
    }
  }
}
```

---

## Standard Classes

- Screen → flex-1 bg-background p-4
- Card → bg-white p-4 rounded-2xl
- Button → bg-primary py-4 rounded-xl items-center

---

# 📱 SCREEN RULES

- Clear hierarchy
- No clutter
- Always loading state (skeleton)
- Always error state

---

# 🔍 VALIDATION CHECK

Before finishing UI:

- Uses correct colors
- Uses skeleton loading
- Proper spacing
- Smooth animation
- Clean layout

---

# ✅ SUCCESS STATE

App feels:

- Smooth
- Premium
- Consistent
- Calm
