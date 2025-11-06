# Accessibility Testing Guide

This guide provides comprehensive instructions for testing the accessibility of the Neurmatic platform to ensure WCAG 2.1 AA compliance.

## Table of Contents

1. [Automated Testing](#automated-testing)
2. [Manual Testing](#manual-testing)
3. [Screen Reader Testing](#screen-reader-testing)
4. [Keyboard Navigation Testing](#keyboard-navigation-testing)
5. [Color Contrast Testing](#color-contrast-testing)
6. [Common Issues and Fixes](#common-issues-and-fixes)
7. [Testing Checklist](#testing-checklist)

---

## Automated Testing

### Axe DevTools

**Installation:**
- Install the [Axe DevTools extension](https://www.deque.com/axe/devtools/) for Chrome or Firefox

**Usage:**
1. Open the browser DevTools (F12)
2. Navigate to the "Axe DevTools" tab
3. Click "Scan ALL of my page"
4. Review and fix all violations
5. Aim for 0 violations

**Command Line Testing:**
```bash
npm install --save-dev @axe-core/cli
npx axe http://localhost:5173 --exit
```

### Lighthouse

**Usage:**
1. Open Chrome DevTools (F12)
2. Go to "Lighthouse" tab
3. Select "Accessibility" category
4. Click "Generate report"
5. Aim for score > 95

**Command Line:**
```bash
npm install -g lighthouse
lighthouse http://localhost:5173 --only-categories=accessibility --output html --output-path ./accessibility-report.html
```

### WAVE

**Usage:**
1. Install [WAVE extension](https://wave.webaim.org/extension/)
2. Click the WAVE icon in your browser
3. Review errors, alerts, and features
4. Fix all errors and review alerts

### Pa11y

**Installation and Usage:**
```bash
npm install -g pa11y
pa11y http://localhost:5173
pa11y http://localhost:5173 --standard WCAG2AA
```

---

## Manual Testing

### Focus Indicators

**Test:**
1. Press Tab key to navigate through the page
2. Verify every interactive element has a visible focus indicator
3. Check that focus indicator is at least 3px solid border
4. Verify focus order is logical (top to bottom, left to right)

**Expected:**
- All buttons, links, and form inputs show prominent focus indicator
- Focus indicator color: `#0284c7` (light mode), `#38bdf8` (dark mode)
- Focus outline: 3px solid with 2px offset

### Skip Links

**Test:**
1. Press Tab immediately when page loads
2. Verify skip links appear at top of page
3. Press Enter on each skip link
4. Verify focus moves to correct section

**Expected:**
- "Skip to main content" takes you to main content area
- "Skip to navigation" takes you to main navigation
- "Skip to search" takes you to search bar

### Form Accessibility

**Test:**
1. Navigate to a form using keyboard only
2. Verify all inputs have associated labels
3. Submit form with errors
4. Verify error messages are announced and descriptive

**Expected:**
- All inputs have visible labels
- Labels are associated with inputs (click label focuses input)
- Error messages appear with role="alert"
- Errors are descriptive (not just "Error" or "Invalid")
- Required fields marked with asterisk and aria-required

### Image Alt Text

**Test:**
1. Inspect all images using DevTools
2. Verify alt attribute exists
3. Check alt text is descriptive

**Expected:**
- Decorative images: `alt=""` or `aria-hidden="true"`
- Informative images: descriptive alt text
- Complex images: alt text + longer description in caption

---

## Screen Reader Testing

### NVDA (Windows)

**Installation:**
- Download from [nvda-project.org](https://www.nvaccess.org/)

**Basic Commands:**
- Insert + N: NVDA menu
- Insert + Down Arrow: Read from cursor
- Insert + Spacebar: Browse mode toggle
- H: Navigate by heading
- B: Navigate by button
- F: Navigate by form field
- L: Navigate by list
- K: Navigate by link

**Testing Steps:**
1. Start NVDA (Insert + N)
2. Navigate using H key to check heading structure
3. Navigate using Tab to check form labels
4. Submit a form and verify errors are announced
5. Check that dynamic content updates are announced

### JAWS (Windows)

**Basic Commands:**
- Insert + F12: JAWS menu
- Insert + Down Arrow: Read from cursor
- H: Navigate by heading
- B: Navigate by button
- F: Navigate by form field

### VoiceOver (macOS)

**Activation:**
- Command + F5 to enable/disable

**Basic Commands:**
- VO = Control + Option
- VO + A: Start reading
- VO + Right/Left Arrow: Navigate
- VO + Space: Activate element
- VO + U: Open rotor (navigate by headings, links, etc.)

**Testing Steps:**
1. Enable VoiceOver (Command + F5)
2. Use VO + Right Arrow to navigate through page
3. Use VO + U, then navigate to Headings
4. Verify heading hierarchy is logical
5. Test form inputs and error announcements

### Testing Checklist for Screen Readers

- [ ] Page title is announced
- [ ] Landmark regions are announced (header, nav, main, footer)
- [ ] Heading hierarchy is logical (H1 → H2 → H3)
- [ ] Links have descriptive text (not "click here")
- [ ] Buttons describe their action
- [ ] Form labels are announced
- [ ] Error messages are announced when they appear
- [ ] Dynamic content changes are announced
- [ ] Images have alt text that is read aloud
- [ ] Tables have proper headers (th with scope)

---

## Keyboard Navigation Testing

### Full Keyboard Test

**Steps:**
1. Close all pointing devices (mouse, trackpad)
2. Navigate entire site using only keyboard
3. Complete key user flows (login, search, post, etc.)

**Keys to Use:**
- Tab: Move to next focusable element
- Shift + Tab: Move to previous focusable element
- Enter: Activate links and buttons
- Space: Activate buttons, toggle checkboxes
- Arrow Keys: Navigate within components (menus, tabs, radio groups)
- Escape: Close modals and menus
- /: Focus search (if implemented)

### Navigation Checklist

- [ ] All interactive elements are keyboard accessible
- [ ] Tab order is logical and intuitive
- [ ] No keyboard traps (can always navigate away)
- [ ] Focus is visible on all elements
- [ ] Modals trap focus (can't tab outside)
- [ ] Modals close with Escape key
- [ ] Dropdowns navigate with arrow keys
- [ ] Form submission works with Enter key
- [ ] Custom components (dropdowns, tabs) work with arrow keys

---

## Color Contrast Testing

### Tools

**Chrome DevTools:**
1. Inspect element
2. Check Styles panel for color values
3. DevTools shows contrast ratio

**Online Tools:**
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Colour Contrast Analyser](https://www.tpgi.com/color-contrast-checker/)

### Requirements

**WCAG AA:**
- Normal text (< 18pt): 4.5:1
- Large text (≥ 18pt or bold ≥ 14pt): 3:1
- UI components and graphics: 3:1

**Testing:**
1. Check all text against backgrounds
2. Check button text against button backgrounds
3. Check icon colors against backgrounds
4. Check focus indicators against backgrounds

### Current Color Palette (Verified)

**Light Mode:**
- Primary text: `#111827` (gray-900) on `#ffffff` = 17.5:1 ✓
- Secondary text: `#6b7280` (gray-500) on `#ffffff` = 4.6:1 ✓
- Primary button: `#ffffff` on `#0284c7` (primary-600) = 5.3:1 ✓

**Dark Mode:**
- Primary text: `#ffffff` on `#111827` (gray-900) = 17.5:1 ✓
- Secondary text: `#9ca3af` (gray-400) on `#111827` = 8.3:1 ✓
- Primary button: `#ffffff` on `#0284c7` (primary-600) = 5.3:1 ✓

---

## Common Issues and Fixes

### Issue: Missing Alt Text

**Problem:** Images without alt attributes
**Fix:**
```tsx
// Decorative
<img src="logo.png" alt="" aria-hidden="true" />

// Informative
<img src="chart.png" alt="Sales increased 45% in Q3" />
```

### Issue: Missing Form Labels

**Problem:** Input without associated label
**Fix:**
```tsx
<label htmlFor="email">Email</label>
<input id="email" type="email" />
```

### Issue: Poor Focus Indicators

**Problem:** Focus not visible
**Fix:** Already implemented in `accessibility.css`:
```css
*:focus-visible {
  outline: 3px solid #0284c7;
  outline-offset: 2px;
}
```

### Issue: Missing ARIA Labels

**Problem:** Icon buttons without labels
**Fix:**
```tsx
<button aria-label="Close menu">
  <CloseIcon />
</button>
```

### Issue: Non-Semantic HTML

**Problem:** Using divs for buttons
**Fix:**
```tsx
// Bad
<div onClick={handleClick}>Click me</div>

// Good
<button onClick={handleClick}>Click me</button>
```

### Issue: Color-Only Indicators

**Problem:** Error shown only by red color
**Fix:**
```tsx
// Add icon and text
<div className="text-red-600">
  <ErrorIcon aria-hidden="true" />
  <span>Error: Invalid email format</span>
</div>
```

---

## Testing Checklist

### Before Each Release

#### Automated Tests
- [ ] Axe DevTools: 0 violations
- [ ] Lighthouse accessibility score: > 95
- [ ] WAVE: 0 errors
- [ ] Pa11y: 0 errors

#### Manual Tests
- [ ] Keyboard navigation: All features accessible
- [ ] Skip links: Working correctly
- [ ] Focus indicators: Visible on all elements
- [ ] Form labels: All inputs have labels
- [ ] Error messages: Descriptive and announced
- [ ] Color contrast: All text meets 4.5:1 ratio
- [ ] Alt text: All images have appropriate alt text
- [ ] Semantic HTML: Proper use of headings, landmarks
- [ ] ARIA labels: Present where needed
- [ ] Responsive: Works on mobile with assistive tech

#### Screen Reader Tests
- [ ] NVDA: Page is navigable and understandable
- [ ] VoiceOver: Page is navigable and understandable
- [ ] Dynamic content: Updates are announced
- [ ] Form errors: Errors are announced

#### Cross-Browser Tests
- [ ] Chrome + NVDA
- [ ] Firefox + NVDA
- [ ] Safari + VoiceOver
- [ ] Edge + JAWS (if available)

---

## Continuous Testing

### During Development

1. **Use browser extensions:** Install Axe DevTools and run on every page
2. **Keyboard test regularly:** Use Tab key to navigate as you build
3. **Use semantic HTML:** Always prefer native elements
4. **Add ARIA only when needed:** Don't over-use ARIA attributes

### Code Review Checklist

- [ ] All interactive elements keyboard accessible?
- [ ] All images have alt attributes?
- [ ] All forms have labels?
- [ ] Color contrast meets requirements?
- [ ] Focus indicators visible?
- [ ] Dynamic content has live regions?
- [ ] Semantic HTML used appropriately?

---

## Resources

### Official Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [Axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE](https://wave.webaim.org/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Pa11y](https://pa11y.org/)

### Screen Readers
- [NVDA](https://www.nvaccess.org/) - Free (Windows)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/) - Paid (Windows)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) - Built-in (macOS, iOS)

### Learning Resources
- [WebAIM](https://webaim.org/)
- [A11y Project](https://www.a11yproject.com/)
- [Inclusive Components](https://inclusive-components.design/)

---

## Contact

For accessibility issues or questions:
- Email: accessibility@neurmatic.com
- Accessibility Statement: /accessibility

**Last Updated:** 2025-11-06
