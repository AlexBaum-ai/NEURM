/**
 * Cookie Consent Banner
 * GDPR-compliant cookie consent banner with categorized consent options
 */

import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button/Button';
import { ConsentPreferencesModal } from './ConsentPreferencesModal';
import { useUpdateConsents } from '@/hooks/useGDPR';
import type { ConsentPreferences, ConsentBannerState } from '@/types/gdpr';

const CONSENT_STORAGE_KEY = 'neurmatic_cookie_consent';
const CONSENT_VERSION = '1.0.0';

interface CookieConsentBannerProps {
  onAccept?: (preferences: ConsentPreferences) => void;
  onReject?: () => void;
}

export const CookieConsentBanner: React.FC<CookieConsentBannerProps> = ({
  onAccept,
  onReject,
}) => {
  const [visible, setVisible] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);
  const updateConsents = useUpdateConsents();

  useEffect(() => {
    // Check if consent has already been given
    const storedConsent = getStoredConsent();

    if (!storedConsent || storedConsent.version !== CONSENT_VERSION) {
      // Show banner if no consent or version mismatch (policy updated)
      setVisible(true);
    } else {
      // Apply stored preferences
      applyConsent(storedConsent.preferences);
    }
  }, []);

  const getStoredConsent = (): ConsentBannerState | null => {
    try {
      const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const saveConsent = (preferences: ConsentPreferences) => {
    const consentState: ConsentBannerState = {
      dismissed: true,
      preferences,
      version: CONSENT_VERSION,
      timestamp: new Date().toISOString(),
    };

    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consentState));

    // Sync with backend if user is authenticated
    updateConsents.mutate({
      consents: preferences,
    });

    applyConsent(preferences);
  };

  const applyConsent = (preferences: ConsentPreferences) => {
    // Apply consent preferences to analytics and marketing scripts
    if (preferences.analytics) {
      enableAnalytics();
    } else {
      disableAnalytics();
    }

    if (preferences.marketing) {
      enableMarketing();
    } else {
      disableMarketing();
    }
  };

  const enableAnalytics = () => {
    // Enable Google Analytics or other analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'granted',
      });
    }
  };

  const disableAnalytics = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        analytics_storage: 'denied',
      });
    }
  };

  const enableMarketing = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'granted',
        ad_user_data: 'granted',
        ad_personalization: 'granted',
      });
    }
  };

  const disableMarketing = () => {
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('consent', 'update', {
        ad_storage: 'denied',
        ad_user_data: 'denied',
        ad_personalization: 'denied',
      });
    }
  };

  const handleAcceptAll = () => {
    const preferences: ConsentPreferences = {
      necessary: true,
      functional: true,
      analytics: true,
      marketing: true,
    };

    saveConsent(preferences);
    setVisible(false);
    onAccept?.(preferences);
  };

  const handleRejectAll = () => {
    const preferences: ConsentPreferences = {
      necessary: true, // Always true
      functional: false,
      analytics: false,
      marketing: false,
    };

    saveConsent(preferences);
    setVisible(false);
    onReject?.();
  };

  const handleCustomize = () => {
    setShowPreferences(true);
  };

  const handleSavePreferences = (preferences: ConsentPreferences) => {
    saveConsent(preferences);
    setShowPreferences(false);
    setVisible(false);
    onAccept?.(preferences);
  };

  if (!visible && !showPreferences) {
    return null;
  }

  return (
    <>
      {visible && (
        <div
          className="fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg"
          role="dialog"
          aria-labelledby="cookie-consent-title"
          aria-describedby="cookie-consent-description"
        >
          <div className="container-custom py-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              {/* Content */}
              <div className="flex-1">
                <h2
                  id="cookie-consent-title"
                  className="text-lg font-semibold text-gray-900 dark:text-white mb-2"
                >
                  We value your privacy
                </h2>
                <p
                  id="cookie-consent-description"
                  className="text-sm text-gray-600 dark:text-gray-400"
                >
                  We use cookies to enhance your browsing experience, serve personalized content,
                  and analyze our traffic. By clicking "Accept All", you consent to our use of
                  cookies.{' '}
                  <Link
                    to="/cookies"
                    className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300 underline"
                  >
                    Learn more
                  </Link>
                </p>
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 sm:flex-row lg:flex-shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleRejectAll}
                  aria-label="Reject all cookies except necessary"
                >
                  Reject All
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCustomize}
                  aria-label="Customize cookie preferences"
                >
                  Customize
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleAcceptAll}
                  aria-label="Accept all cookies"
                >
                  Accept All
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showPreferences && (
        <ConsentPreferencesModal
          isOpen={showPreferences}
          onClose={() => {
            setShowPreferences(false);
            setVisible(true);
          }}
          onSave={handleSavePreferences}
        />
      )}
    </>
  );
};

// Export utility function to check if consent has been given
export const hasConsentBeenGiven = (): boolean => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return false;

    const consent: ConsentBannerState = JSON.parse(stored);
    return consent.dismissed && consent.version === CONSENT_VERSION;
  } catch {
    return false;
  }
};

// Export utility function to get current consent preferences
export const getCurrentConsent = (): ConsentPreferences | null => {
  try {
    const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!stored) return null;

    const consent: ConsentBannerState = JSON.parse(stored);
    return consent.preferences;
  } catch {
    return null;
  }
};

// Export utility to trigger reconsent (e.g., when policy updates)
export const triggerReconsent = () => {
  localStorage.removeItem(CONSENT_STORAGE_KEY);
  window.location.reload();
};
