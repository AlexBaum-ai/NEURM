# Cookie Consent Components

GDPR-compliant cookie consent banner and preferences modal for Neurmatic platform.

## Components

### CookieConsentBanner

Main cookie consent banner that appears on first visit and when policy updates require reconsent.

**Features:**
- Displays on first visit or when consent version changes
- Three quick action buttons: Accept All, Reject All, Customize
- Automatically applies consent preferences to analytics and marketing scripts
- Persists consent in localStorage with version tracking
- Syncs with backend for authenticated users
- Fully accessible with keyboard navigation and ARIA labels

**Usage:**

```tsx
import { CookieConsentBanner } from '@/components/common/CookieConsent';

function App() {
  return (
    <>
      {/* Your app content */}
      <CookieConsentBanner />
    </>
  );
}
```

### ConsentPreferencesModal

Detailed modal for customizing cookie consent preferences by category.

**Features:**
- Four cookie categories: Necessary, Functional, Analytics, Marketing
- Detailed descriptions and examples for each category
- Toggle switches for optional categories (Necessary is always enabled)
- Accept All / Reject All quick actions
- Save Preferences button to apply custom settings
- Fully responsive and accessible

**Usage:**

```tsx
import { ConsentPreferencesModal } from '@/components/common/CookieConsent';

function CookieSettings() {
  const [showPreferences, setShowPreferences] = useState(false);

  const handleSavePreferences = (preferences: ConsentPreferences) => {
    console.log('Preferences saved:', preferences);
    setShowPreferences(false);
  };

  return (
    <>
      <button onClick={() => setShowPreferences(true)}>
        Manage Cookie Preferences
      </button>

      <ConsentPreferencesModal
        isOpen={showPreferences}
        onClose={() => setShowPreferences(false)}
        onSave={handleSavePreferences}
      />
    </>
  );
}
```

## Utility Functions

### hasConsentBeenGiven()

Check if user has given consent.

```tsx
import { hasConsentBeenGiven } from '@/components/common/CookieConsent';

if (hasConsentBeenGiven()) {
  // User has given consent
}
```

### getCurrentConsent()

Get current consent preferences.

```tsx
import { getCurrentConsent } from '@/components/common/CookieConsent';

const preferences = getCurrentConsent();
if (preferences?.analytics) {
  // Analytics is enabled
}
```

### triggerReconsent()

Force user to reconsent (e.g., after policy update).

```tsx
import { triggerReconsent } from '@/components/common/CookieConsent';

// After updating privacy policy
triggerReconsent();
```

## Cookie Categories

### Necessary (Always Enabled)
Essential cookies for website functionality:
- Authentication
- Security
- Session management
- Load balancing

### Functional (Optional)
Enhance user experience:
- Language preferences
- Theme selection
- UI preferences
- Font size

### Analytics (Optional)
Track usage patterns:
- Page views
- User behavior
- Traffic sources
- Performance metrics

**Integration:** Automatically enables/disables Google Analytics via gtag consent API.

### Marketing (Optional)
Personalized advertising:
- Ad targeting
- Campaign tracking
- Social media integration
- Retargeting

**Integration:** Automatically enables/disables marketing cookies via gtag consent API.

## Storage

Consent preferences are stored in localStorage with the following structure:

```typescript
{
  dismissed: boolean;
  preferences: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  version: string; // Policy version
  timestamp: string; // ISO date
}
```

**Key:** `neurmatic_cookie_consent`

## Version Control

The banner uses a version constant to track policy changes:

```typescript
const CONSENT_VERSION = '1.0.0';
```

When you update the privacy policy or cookie policy, increment this version to trigger reconsent from all users.

## Backend Integration

For authenticated users, consent preferences are automatically synced with the backend:

```typescript
POST /api/v1/gdpr/consent
{
  "consents": {
    "necessary": true,
    "functional": true,
    "analytics": true,
    "marketing": false
  }
}
```

This allows:
- Consent tracking and audit trail
- Cross-device consent synchronization
- Compliance reporting
- Legal requirements fulfillment

## Accessibility

All components are WCAG 2.1 Level AA compliant:

- **Keyboard Navigation:** Full keyboard support with tab navigation
- **ARIA Labels:** Proper ARIA attributes on all interactive elements
- **Screen Readers:** Descriptive labels and announcements
- **Focus Indicators:** Visible focus states on all focusable elements
- **Semantic HTML:** Proper heading hierarchy and landmarks
- **Role Attributes:** `role="dialog"`, `role="switch"`, etc.

## Responsive Design

Components are fully responsive:
- **Mobile:** Stacked layout, full-width buttons
- **Tablet:** Optimized spacing and layout
- **Desktop:** Horizontal layout with side-by-side actions

## Testing

### Manual Testing Checklist

1. **First Visit:**
   - [ ] Banner appears on first visit
   - [ ] Accept All works and dismisses banner
   - [ ] Reject All works and dismisses banner
   - [ ] Customize opens preferences modal

2. **Preferences Modal:**
   - [ ] All categories are displayed
   - [ ] Necessary category cannot be disabled
   - [ ] Toggle switches work correctly
   - [ ] Accept All enables all categories
   - [ ] Reject All disables optional categories
   - [ ] Save Preferences saves and dismisses modal
   - [ ] Cancel button closes modal without saving

3. **Legal Pages:**
   - [ ] Privacy Policy page loads at /privacy
   - [ ] Terms of Service page loads at /terms
   - [ ] Cookie Policy page loads at /cookies
   - [ ] Version and effective date are displayed
   - [ ] Manage Preferences button works on Cookie Policy page

4. **Persistence:**
   - [ ] Preferences persist after page reload
   - [ ] Banner doesn't show again after consent given
   - [ ] Preferences can be changed via Cookie Policy page

5. **Accessibility:**
   - [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
   - [ ] Focus indicators are visible
   - [ ] Screen reader announces all content correctly
   - [ ] ARIA labels are present

6. **Backend Sync:**
   - [ ] Consent is synced for authenticated users
   - [ ] Consent history is tracked
   - [ ] API errors are handled gracefully

### Automated Testing

```bash
# Run component tests
npm test CookieConsentBanner
npm test ConsentPreferencesModal

# Run accessibility audit
npm run test:a11y
```

## Integration with Analytics

The banner automatically integrates with Google Analytics consent mode:

```typescript
// Analytics enabled
window.gtag('consent', 'update', {
  analytics_storage: 'granted'
});

// Analytics disabled
window.gtag('consent', 'update', {
  analytics_storage: 'denied'
});
```

Make sure to initialize gtag consent mode before the banner loads:

```html
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}

  // Default consent to denied
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied'
  });
</script>
```

## Troubleshooting

### Banner doesn't appear

1. Check if consent has already been given: `localStorage.getItem('neurmatic_cookie_consent')`
2. Clear localStorage and reload page
3. Check browser console for errors

### Preferences not persisting

1. Verify localStorage is enabled in browser
2. Check for localStorage quota errors
3. Verify backend API is responding correctly

### Backend sync not working

1. Check network tab for failed API requests
2. Verify user is authenticated
3. Check CORS configuration
4. Verify API endpoint is correct

## Future Enhancements

- [ ] Add cookie scanning tool to detect third-party cookies
- [ ] Implement cookie audit trail
- [ ] Add multilingual support (i18n)
- [ ] Add visual cookie consent management dashboard
- [ ] Implement geo-based consent (different rules for EU/US/etc.)
- [ ] Add consent refresh reminder after X days
- [ ] Implement granular consent for specific services (e.g., YouTube embeds)

## License

This component is part of the Neurmatic platform.

## Support

For questions or issues, contact the development team or create an issue in the project repository.
