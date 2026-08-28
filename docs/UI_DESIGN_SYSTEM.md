Document the UI design patterns used consistently across the app:

### Design Language
- **Overall Style**: Clean, minimal, iOS-inspired with rounded corners and subtle shadows
- **Color Mode**: Light mode only (no dark mode currently)
- **Font**: System font stack (sans-serif)

### Color Tokens (CSS Variables)
| Token | Usage |
|-------|-------|
| --background | Page background |
| --foreground | Primary text |
| --card | Card backgrounds |
| --muted | Muted backgrounds (input fields, secondary cards) |
| --muted-foreground | Secondary text |
| --primary | Brand accent color (blue) |
| --border | Card and divider borders |
| --destructive | Delete/danger actions (red) |

### Component Patterns
- **Cards**: bg-card border border-border rounded-[20px] p-4 shadow-[0_2px_12px_rgba(0,0,0,0.03)]
- **Modals**: bg-card rounded-3xl p-6 w-full max-w-sm shadow-xl with backdrop blur
- **Section Cards**: bg-muted rounded-[28px] overflow-hidden border border-border shadow-sm
- **Input Bars**: Fixed to bottom, glass morphism effect, rounded-full
- **Chips**: rounded-full, small padding, border-transparent or border-primary/20
- **Lists**: space-y-4 with AnimatePresence + motion.div for stagger animations

### Animation Patterns
- **Page transitions**: AnimatePresence with mode="wait", opacity + y translation
- **List items**: staggered entry with delay based on index (delay: index * 0.05)
- **Modals**: scale 0.95 → 1 with opacity
- **Typing indicator**: Animated bouncing dots using framer motion
- **Hover/tap on cards**: whileHover={{ scale: 0.98 }}, whileTap={{ scale: 0.96 }}

### Layout Patterns
- **Desktop**: Sidebar (w-64, collapsible to w-20) + main content area
- **Mobile**: Top header (h-16) + hamburger menu → slide-in drawer from left
- **Content width**: max-w-3xl mx-auto for most pages, max-w-2xl for Home
- **Page padding**: px-4 md:px-6 for mobile, md:p-8 from MainLayout

### Loading States
- Use Skeleton component for loading placeholders
- Match approximate layout of loaded content
- Use animate-pulse class on skeletons
- Full-page spinner: centered div with border-spin animation

### Empty States
- Use EmptyState component with: icon, title, description, actionLabel, onAction
- Icon in rounded circle with primary/10 background
- Centered vertically in viewport
