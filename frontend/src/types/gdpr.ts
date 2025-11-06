/**
 * GDPR and Legal Document Types
 * Types for cookie consent, legal documents, and GDPR compliance
 */

export type ConsentType = 'necessary' | 'functional' | 'analytics' | 'marketing';

export interface ConsentPreferences {
  necessary: boolean;
  functional: boolean;
  analytics: boolean;
  marketing: boolean;
}

export interface UserConsent {
  id: string;
  userId?: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  ipAddress?: string;
  userAgent?: string;
  grantedAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface ConsentLogEntry {
  id: string;
  userId?: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  ipAddress: string;
  userAgent: string;
  grantedAt: string;
  createdAt: string;
}

export type LegalDocumentType = 'privacy' | 'terms' | 'cookies';

export interface LegalDocument {
  id: string;
  type: LegalDocumentType;
  version: string;
  effectiveDate: string;
  content: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegalDocumentVersion {
  id: string;
  type: LegalDocumentType;
  version: string;
  effectiveDate: string;
  createdAt: string;
}

export interface UpdateConsentRequest {
  consents: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
}

export interface ConsentHistoryEntry {
  id: string;
  consentType: ConsentType;
  granted: boolean;
  policyVersion: string;
  grantedAt: string;
}

// Local storage type for consent banner state
export interface ConsentBannerState {
  dismissed: boolean;
  preferences: ConsentPreferences;
  version: string;
  timestamp: string;
}
