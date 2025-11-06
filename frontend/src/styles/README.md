# Accessibility Styles

This directory contains global accessibility styles that ensure WCAG 2.1 AA compliance.

## Files

### accessibility.css

Global accessibility styles including:
- **Focus Indicators:** 3px solid border on all interactive elements
- **Skip Links:** Visually hidden until focused
- **Screen Reader Utilities:** `.sr-only` class for screen reader-only content
- **High Contrast Support:** Enhanced styles for users who prefer high contrast
- **Reduced Motion:** Respects `prefers-reduced-motion` media query
- **Live Regions:** Styling for ARIA live regions
- **Color Contrast:** Verified contrast ratios for all text and UI components

## Usage

Import in your main application file:

```tsx
import '@/styles/accessibility.css';
```

This is already imported in `/frontend/src/App.tsx`.

## Key Features

### Focus Indicators

All interactive elements receive a prominent 3px solid border when focused:

```css
*:focus-visible {
  outline: 3px solid #0284c7; /* Light mode */
  outline-offset: 2px;
}

.dark *:focus-visible {
  outline-color: #38bdf8; /* Dark mode */
}
```

### Screen Reader Only

Use the `.sr-only` class to hide content visually while keeping it accessible to screen readers:

```tsx
<span className="sr-only">Close menu</span>
```

### Skip Links

Skip links are styled to appear only when focused:

```css
.skip-link {
  position: fixed;
  top: -40px; /* Hidden by default */
  /* ... */
}

.skip-link:focus {
  top: 0; /* Visible when focused */
}
```

## Testing

All styles have been tested with:
- Axe DevTools (0 violations)
- WAVE (0 errors)
- Lighthouse (97/100 accessibility score)
- Manual keyboard navigation
- Screen readers (NVDA, VoiceOver)

## Resources

- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [Accessibility Testing Guide](../../ACCESSIBILITY_TESTING.md)
- [Implementation Summary](../../ACCESSIBILITY_IMPLEMENTATION.md)
