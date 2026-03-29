# CoParent Design System
## Apple Human Interface Guidelines Inspired

> Principal Designer: Apple HIG Standards
> Brand: Professional / Luxury
> Primary Emotion: Trust
> Target: Co-parents (25-50), professionals managing shared custody

---

## Design Principles

### 1. Clarity First
Every element serves a purpose. Typography is legible at every size. Icons are precise and clear. Adornments are subtle and never compete with content. Whitespace is generous — it communicates calm, which is critical for an app used during high-stress parenting transitions.

**Do:** Use clear labels, generous padding, readable type sizes.
**Don't:** Crowd elements, use decorative icons, sacrifice legibility for aesthetics.

### 2. Deference to Content
The interface stays out of the way. Translucent materials, soft backgrounds, and minimal chrome let the user's data — their children's schedules, shared expenses, messages — be the focus. The UI supports the content, never competes with it.

**Do:** Use glass materials, subtle borders, muted backgrounds.
**Don't:** Use heavy borders, saturated backgrounds, or competing visual elements.

### 3. Depth Through Meaning
Visual layers create hierarchy. Cards float above backgrounds. Modals dim the world behind them. Active states elevate. Every shadow, blur, and layer communicates relationship and importance.

**Do:** Use consistent elevation (shadow) system, meaningful transitions.
**Don't:** Mix shadow intensities randomly, use flat design where depth aids understanding.

---

## 1. FOUNDATIONS

### Color System

#### Primary Palette

| Token | Name | Hex | RGB | HSL | WCAG AA (on white) | Usage |
|-------|------|-----|-----|-----|---------------------|-------|
| `--color-primary` | Teal 500 | `#3A9E8F` | `58, 158, 143` | `170 45% 42%` | 3.4:1 (large text) | Primary actions, active states, key CTAs |
| `--color-primary-600` | Teal 600 | `#2D7D71` | `45, 125, 113` | `171 47% 33%` | 4.8:1 AA | Hover states, text links, emphasis |
| `--color-primary-100` | Teal 100 | `#E6F5F2` | `230, 245, 242` | `168 35% 93%` | — | Subtle backgrounds, selected rows |
| `--color-secondary` | Sand 200 | `#F0E6D6` | `240, 230, 214` | `37 45% 89%` | — | Secondary backgrounds, warmth accents |
| `--color-parent-a` | Sage 400 | `#7ABF8E` | `122, 191, 142` | `137 33% 61%` | 2.5:1 | Parent A indicator, badges |
| `--color-parent-b` | Terra 400 | `#CC8B6E` | `204, 139, 110` | `19 47% 62%` | 2.8:1 | Parent B indicator, badges |

#### Semantic Colors

| Token | Light | Dark | Usage |
|-------|-------|------|-------|
| `--color-success` | `hsl(152 55% 42%)` | `hsl(152 55% 52%)` | Confirmations, approved states |
| `--color-warning` | `hsl(38 92% 55%)` | `hsl(38 92% 60%)` | Pending, needs attention |
| `--color-error` | `hsl(0 72% 55%)` | `hsl(0 72% 62%)` | Errors, destructive actions |
| `--color-info` | `hsl(210 75% 55%)` | `hsl(210 75% 62%)` | Informational, tips |

#### Dark Mode

All colors shift: backgrounds darken to `hsl(220 20% 10-15%)`, text lightens to `hsl(220 10% 90-95%)`, primary brightens +8% lightness for contrast. Minimum contrast ratio: 4.5:1 for body text, 3:1 for large text (18px+).

### Typography

#### Font Stack
- **Display/Headlines:** SF Pro Display (system), fallback: Nunito
- **Body:** SF Pro Text (system), fallback: DM Sans
- **Mono:** SF Mono, fallback: JetBrains Mono

#### Type Scale (Apple HIG aligned)

| Style | Size (mobile) | Size (desktop) | Weight | Line Height | Letter Spacing | Usage |
|-------|---------------|----------------|--------|-------------|----------------|-------|
| Large Title | 34px | 40px | 700 | 1.15 | -0.4px | Page headers |
| Title 1 | 28px | 32px | 700 | 1.2 | -0.3px | Section headers |
| Title 2 | 22px | 26px | 600 | 1.25 | -0.2px | Card titles |
| Title 3 | 20px | 22px | 600 | 1.3 | -0.1px | Sub-sections |
| Headline | 17px | 17px | 600 | 1.35 | -0.2px | List headers, bold labels |
| Body | 17px | 16px | 400 | 1.5 | 0 | Primary reading text |
| Callout | 16px | 15px | 400 | 1.45 | 0 | Secondary info, descriptions |
| Subheadline | 15px | 14px | 400 | 1.4 | 0 | Meta info, timestamps |
| Footnote | 13px | 13px | 400 | 1.35 | 0 | Helper text, captions |
| Caption 1 | 12px | 12px | 400 | 1.3 | 0.1px | Badges, labels |
| Caption 2 | 11px | 11px | 500 | 1.3 | 0.3px | Overlines, micro-labels |

### Layout Grid

| Breakpoint | Width | Columns | Gutter | Margin | Content Max |
|------------|-------|---------|--------|--------|-------------|
| Mobile | 375px | 4 | 16px | 20px | 335px |
| Mobile L | 428px | 4 | 16px | 20px | 388px |
| Tablet | 768px | 8 | 20px | 32px | 704px |
| Desktop | 1024px | 12 | 24px | 40px | 944px |
| Wide | 1440px | 12 | 24px | 80px | 1280px |

Safe areas: `env(safe-area-inset-*)` on all edges. Bottom tab bar: 83px (49px bar + 34px home indicator).

### Spacing System (8px base)

| Token | Value | Usage |
|-------|-------|-------|
| `--space-0` | 0px | Reset |
| `--space-1` | 4px | Tight inline gaps, icon-to-text |
| `--space-2` | 8px | Between related elements |
| `--space-3` | 12px | Small component padding |
| `--space-4` | 16px | Default component padding, list item spacing |
| `--space-5` | 20px | Card padding (mobile) |
| `--space-6` | 24px | Card padding (desktop), section gaps |
| `--space-8` | 32px | Between cards/sections |
| `--space-10` | 40px | Page margins (desktop) |
| `--space-12` | 48px | Section separators |
| `--space-16` | 64px | Major layout gaps |
| `--space-20` | 80px | Hero spacing |
| `--space-24` | 96px | Page top padding |

### Elevation System

| Level | Shadow | Usage |
|-------|--------|-------|
| 0 | none | Flat elements, backgrounds |
| 1 | `0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)` | Cards at rest |
| 2 | `0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)` | Cards on hover, floating buttons |
| 3 | `0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)` | Dropdowns, popovers |
| 4 | `0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)` | Modals, sheets |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | 8px | Buttons, inputs, small elements |
| `--radius-md` | 12px | Cards, badges |
| `--radius-lg` | 16px | Large cards, containers |
| `--radius-xl` | 20px | Modal sheets, hero cards |
| `--radius-2xl` | 24px | Full-bleed cards, bottom sheets |
| `--radius-full` | 9999px | Avatars, pills, toggles |

### Motion

| Type | Duration | Easing | Usage |
|------|----------|--------|-------|
| Micro | 100ms | `ease-out` | Button press, toggle flip |
| Fast | 200ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Hover states, focus rings |
| Normal | 300ms | `cubic-bezier(0.25, 0.1, 0.25, 1)` | Panel slides, card transitions |
| Slow | 500ms | `cubic-bezier(0.16, 1, 0.3, 1)` | Page transitions, modals |
| Spring | 600ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Bouncy feedback, success states |

---

## 2. COMPONENTS

### Buttons

| Variant | Background | Text | Border | Usage |
|---------|-----------|------|--------|-------|
| Primary | `primary` | white | none | Main CTA, 1 per screen max |
| Secondary | `secondary` | `secondary-foreground` | none | Supporting actions |
| Outline | transparent | `foreground` | `border` | Tertiary actions |
| Ghost | transparent | `muted-foreground` | none | Inline/subtle actions |
| Destructive | `error` | white | none | Delete, remove actions |
| Link | transparent | `primary` | none | Navigation, inline text actions |

**Sizes:** sm (32px h, 12px px), default (40px h, 16px px), lg (48px h, 24px px)
**States:** default → hover (darken 8%) → active (darken 12%, scale 0.98) → disabled (opacity 0.5) → loading (spinner replaces text)
**Radius:** `--radius-sm` (8px) — NO pill buttons except tags/badges

### Cards

**Anatomy:** Container > Header (optional) > Content > Footer (optional)
- **Padding:** 20px mobile, 24px desktop
- **Background:** `--color-card` with `--elevation-1`
- **Border:** `1px solid var(--color-border)` at 0.5 opacity OR borderless with shadow
- **Radius:** `--radius-lg` (16px)
- **Hover:** Elevate to `--elevation-2`, translate-y -1px
- **Transition:** `all 200ms cubic-bezier(0.25, 0.1, 0.25, 1)`

### Inputs

- **Height:** 44px (Apple minimum touch target)
- **Padding:** 12px 16px
- **Border:** `1px solid var(--color-border)`
- **Radius:** `--radius-sm` (8px)
- **Focus:** `0 0 0 3px var(--color-primary / 0.15)` ring + border becomes `--color-primary`
- **Label:** Above, Footnote style, 4px gap to input
- **Error:** Border `--color-error`, helper text below in error color

### Avatars

- **Sizes:** xs (24px), sm (32px), md (40px), lg (48px), xl (64px)
- **Shape:** Full circle (`--radius-full`)
- **Border:** 2px solid white (creates depth on any background)
- **Fallback:** Initials on gradient background (Primary → Primary-600)
- **Status dot:** 10px circle, positioned bottom-right, bordered with 2px white

### Navigation — Tab Bar (Mobile)

- **Height:** 49px + safe area
- **Items:** 5 max (icon + label)
- **Active:** Primary color, slightly larger icon (24px → 26px)
- **Inactive:** `--color-muted-foreground`
- **Background:** Frosted glass (`backdrop-blur-xl`, `bg-background/80`)

### Badges

- **Sizes:** sm (20px h), default (24px h)
- **Padding:** 2px 8px (sm), 4px 10px (default)
- **Radius:** `--radius-full`
- **Variants:** default (muted bg), primary, success, warning, error, outline

### Modals / Sheets

- **Overlay:** `rgba(0, 0, 0, 0.4)` with `backdrop-blur-sm`
- **Container:** `--color-card`, `--radius-xl`, `--elevation-4`
- **Padding:** 24px
- **Max width:** 480px (dialogs), 640px (forms), 90vw (mobile)
- **Animation:** Scale from 0.95 + fade in, 300ms

### Progress / Skeleton

- **Skeleton:** `--color-muted` background, shimmer animation (1.5s infinite)
- **Progress bar:** 4px height, `--radius-full`, `--color-primary` fill
- **Circular:** 2px stroke, 20px diameter default

---

## 3. PATTERNS

### Empty States
- Illustration (optional, subtle)
- Title (Title 3)
- Description (Body, muted)
- Primary CTA button
- Center-aligned, 48px above center

### Loading States
- Skeleton screens that match layout (NOT spinners for page loads)
- Spinners only for inline actions (button loading, pull-to-refresh)
- Minimum display time: 300ms (prevent flash)

### Error States
- Inline errors below inputs (never alerts for field validation)
- Toast for API errors (auto-dismiss 5s)
- Full-page error for catastrophic failures (retry CTA)

### Success Feedback
- Inline confirmation (checkmark replaces button text, 1.5s)
- Toast for background completions
- NEVER block the user with a success modal

---

## 4. DESIGN TOKENS (JSON)

```json
{
  "color": {
    "primary": { "50": "#E6F5F2", "100": "#C2E8E1", "200": "#99D9CE", "300": "#6FCABB", "400": "#4FBBAA", "500": "#3A9E8F", "600": "#2D7D71", "700": "#225E55", "800": "#173F39", "900": "#0C201D" },
    "sand": { "50": "#FBF8F3", "100": "#F5EDE0", "200": "#F0E6D6", "300": "#E5D5BD", "400": "#D4BC9A", "500": "#C3A377" },
    "sage": { "400": "#7ABF8E", "500": "#5DAF75", "600": "#4A9360" },
    "terra": { "400": "#CC8B6E", "500": "#B8744F", "600": "#A06040" },
    "success": "#2DB86A",
    "warning": "#F0A030",
    "error": "#E04848",
    "info": "#3B82F6"
  },
  "typography": {
    "fontFamily": { "display": "'Nunito', system-ui, sans-serif", "body": "'DM Sans', system-ui, sans-serif", "mono": "'SF Mono', 'JetBrains Mono', monospace" },
    "fontSize": { "largeTitle": "34px", "title1": "28px", "title2": "22px", "title3": "20px", "headline": "17px", "body": "17px", "callout": "16px", "subheadline": "15px", "footnote": "13px", "caption1": "12px", "caption2": "11px" },
    "fontWeight": { "regular": 400, "medium": 500, "semibold": 600, "bold": 700 },
    "lineHeight": { "tight": 1.15, "snug": 1.25, "normal": 1.5, "relaxed": 1.65 },
    "letterSpacing": { "tight": "-0.4px", "snug": "-0.2px", "normal": "0px", "wide": "0.1px", "wider": "0.3px" }
  },
  "spacing": { "0": "0", "1": "4px", "2": "8px", "3": "12px", "4": "16px", "5": "20px", "6": "24px", "8": "32px", "10": "40px", "12": "48px", "16": "64px", "20": "80px", "24": "96px" },
  "radius": { "sm": "8px", "md": "12px", "lg": "16px", "xl": "20px", "2xl": "24px", "full": "9999px" },
  "shadow": {
    "1": "0 1px 3px rgba(0,0,0,0.04), 0 1px 2px rgba(0,0,0,0.06)",
    "2": "0 4px 12px rgba(0,0,0,0.06), 0 1px 4px rgba(0,0,0,0.04)",
    "3": "0 8px 24px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
    "4": "0 16px 48px rgba(0,0,0,0.12), 0 4px 16px rgba(0,0,0,0.06)"
  },
  "motion": {
    "micro": "100ms ease-out",
    "fast": "200ms cubic-bezier(0.25, 0.1, 0.25, 1)",
    "normal": "300ms cubic-bezier(0.25, 0.1, 0.25, 1)",
    "slow": "500ms cubic-bezier(0.16, 1, 0.3, 1)",
    "spring": "600ms cubic-bezier(0.34, 1.56, 0.64, 1)"
  }
}
```

---

## 5. DO'S AND DON'TS

| # | Do | Don't |
|---|-----|-------|
| 1 | Use 44px minimum touch targets on mobile | Make buttons smaller than 44px height |
| 2 | One primary CTA per screen | Multiple competing primary buttons |
| 3 | Use skeleton loading for page content | Show spinners for initial page load |
| 4 | Inline validation as user types | Only show errors on submit |
| 5 | Generous whitespace between sections (32-48px) | Cram cards together with 8px gaps |
| 6 | Use the elevation system consistently | Apply random shadows to elements |
| 7 | Muted backgrounds with white cards for depth | Flat white-on-white with no hierarchy |
| 8 | Animate meaningful state changes (300ms) | Animate everything or use jarring instant switches |
| 9 | Use semantic colors for status (green=good, amber=pending) | Use brand colors for status indicators |
| 10 | Keep navigation visible and predictable | Hide core navigation behind hamburger menus |

---

## Implementation Notes

- All colors use HSL for easy programmatic manipulation
- Dark mode: swap via `.dark` class on `<html>`, tokens auto-cascade
- Spacing uses 8px grid — every measurement is a multiple of 4 or 8
- Type scale follows Apple Dynamic Type categories
- All interactive elements must have `:focus-visible` styles for keyboard nav
- Touch targets: 44x44px minimum (Apple HIG requirement)
- Safe areas: Always respect `env(safe-area-inset-*)` on mobile
