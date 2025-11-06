# GDPR Compliance Module

This module implements comprehensive GDPR (General Data Protection Regulation) compliance features for Neurmatic, ensuring users' data privacy rights are respected and protected.

## Features

### 1. Cookie Consent Management
- **Categorized Consent**: Users can grant/deny consent for:
  - Necessary cookies (always active)
  - Functional cookies
  - Analytics cookies
  - Marketing cookies
- **Consent Tracking**: Full audit trail of consent changes
- **Version Control**: Track policy version with each consent
- **IP & User Agent Logging**: Record context for compliance

### 2. Legal Documents
- **Privacy Policy**: Comprehensive data protection notice
- **Terms of Service**: Platform usage terms and conditions
- **Cookie Policy**: Detailed cookie usage information
- **Version Management**: Multiple versions with effective dates
- **Public Access**: No authentication required to view legal docs

### 3. Data Export (Right to Data Portability)
- **Comprehensive Export**: All user data in JSON format
  - Account information
  - Profile data
  - Content (articles, forum posts, comments)
  - Activity history
  - Applications and bookmarks
  - Consent records
- **On-Demand**: Users can request export anytime
- **Downloadable**: Served as downloadable JSON file

### 4. Data Deletion (Right to Be Forgotten)
- **User-Initiated Requests**: Users can request account deletion
- **Email Confirmation**: Requires email verification
- **30-Day Processing**: GDPR-compliant processing timeline
- **Anonymization**: Replaces PII with anonymized values
  - Email → `deleted_user_[id]@anonymized.local`
  - Username → `deleted_user_[id]`
  - Deletes: Profile, work history, education, skills
  - Preserves: Forum posts (anonymized) for data integrity
- **Admin Workflow**: Admins process and approve deletion requests

### 5. Email Unsubscribe
- **Token-Based**: Secure unsubscribe links in all emails
- **Granular Control**: Unsubscribe from specific types:
  - All emails
  - Marketing emails
  - Notification emails
  - Email digests
- **One-Click**: No login required
- **Persistent**: Applies even if user deletes account

### 6. Data Retention Policies
- **Configurable Policies**: Per data type retention periods
- **Default Policies**:
  - Sessions: 90 days
  - Analytics: 365 days
  - Search history: 90 days
  - Notifications (read): 90 days
  - Consent logs: 730 days (compliance requirement)
  - Article views: 180 days
- **Automated Cleanup**: Daily scheduled job at 2 AM UTC
- **Admin Management**: Admins can update retention periods

### 7. DPO (Data Protection Officer) Contact
- **Public Contact Information**: Email, phone, address
- **Contact Form**: Users can message DPO directly
- **Rights Requests**: Facilitates GDPR rights exercise
- **Admin Management**: Update DPO information

## API Endpoints

### Public Endpoints (No Authentication)

```
GET  /api/v1/gdpr/legal/:type              # Get legal document (privacy_policy, terms_of_service, cookie_policy)
GET  /api/v1/gdpr/legal/:type/versions     # Get all versions of a document
GET  /api/v1/gdpr/unsubscribe?token=xxx    # Get unsubscribe info by token
POST /api/v1/gdpr/unsubscribe              # Process unsubscribe
GET  /api/v1/gdpr/dpo                      # Get DPO contact
POST /api/v1/gdpr/dpo/contact              # Send message to DPO
```

### Authenticated User Endpoints

```
GET  /api/v1/gdpr/consents                 # Get user's consent preferences
PUT  /api/v1/gdpr/consents                 # Update consent preferences
GET  /api/v1/gdpr/consents/history         # Get consent change history
POST /api/v1/gdpr/data-export              # Request data export (download JSON)
POST /api/v1/gdpr/data-deletion            # Request account deletion
GET  /api/v1/gdpr/data-deletion            # Get deletion request status
GET  /api/v1/gdpr/retention-policies       # View data retention policies
```

### Admin Endpoints

```
POST  /api/v1/gdpr/admin/legal                     # Create/publish legal document
PUT   /api/v1/gdpr/admin/retention-policies        # Update retention policy
PATCH /api/v1/gdpr/admin/data-deletion/:requestId  # Process deletion request
PUT   /api/v1/gdpr/admin/dpo                       # Update DPO contact
```

## Database Schema

### Tables

- **user_consents**: User consent preferences (current state)
- **consent_logs**: Audit trail of all consent changes
- **email_unsubscribes**: Email unsubscribe records
- **data_deletion_requests**: Account deletion requests
- **legal_documents**: Privacy policy, terms, cookie policy
- **data_retention_policies**: Retention periods by data type
- **dpo_contacts**: Data Protection Officer contact info

### Enums

- **ConsentType**: `necessary`, `functional`, `analytics`, `marketing`
- **ConsentStatus**: `granted`, `denied`, `withdrawn`
- **LegalDocumentType**: `privacy_policy`, `terms_of_service`, `cookie_policy`, `data_processing_agreement`
- **DataDeletionStatus**: `requested`, `processing`, `completed`, `cancelled`

## Usage Examples

### Update User Consent

```typescript
PUT /api/v1/gdpr/consents
{
  "consents": [
    { "consentType": "analytics", "granted": true },
    { "consentType": "marketing", "granted": false }
  ]
}
```

### Request Data Export

```typescript
POST /api/v1/gdpr/data-export
{
  "format": "json",
  "includeContent": true
}

Response: Downloadable JSON file with all user data
```

### Request Data Deletion

```typescript
POST /api/v1/gdpr/data-deletion
{
  "confirmEmail": "user@example.com",
  "reason": "I no longer want to use the platform"
}

Response:
{
  "message": "Your data deletion request has been submitted...",
  "requestId": "uuid",
  "requestedAt": "2025-11-06T..."
}
```

### Get Legal Document

```typescript
GET /api/v1/gdpr/legal/privacy_policy
// or
GET /api/v1/gdpr/legal/terms_of_service?version=1.0

Response:
{
  "document": {
    "id": "uuid",
    "documentType": "privacy_policy",
    "version": "1.0",
    "title": "Privacy Policy",
    "content": "# Privacy Policy\n\n...",
    "effectiveAt": "2025-11-06T...",
    "isActive": true
  }
}
```

## Data Retention Cleanup

Automated cleanup runs daily at 2 AM UTC via cron job:

```typescript
import { scheduleDataRetentionCleanup } from '@/jobs/schedulers/dataRetention.scheduler';

// In server.ts or main startup file
scheduleDataRetentionCleanup();
```

Manual cleanup:

```typescript
import { runDataRetentionCleanup } from '@/jobs/schedulers/dataRetention.scheduler';

await runDataRetentionCleanup();
```

## Frontend Integration

### Cookie Consent Banner

Display on first visit:

```javascript
// Check if user has consents
const response = await fetch('/api/v1/gdpr/consents', {
  credentials: 'include'
});

const { consents } = await response.json();

// If no consents, show banner
if (!consents.some(c => c.status !== 'denied')) {
  showCookieConsentBanner();
}
```

### Data Export Button

```javascript
const handleExport = async () => {
  const response = await fetch('/api/v1/gdpr/data-export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ format: 'json', includeContent: true })
  });

  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `user-data-${Date.now()}.json`;
  a.click();
};
```

### Email Unsubscribe Page

```javascript
// Extract token from URL
const params = new URLSearchParams(window.location.search);
const token = params.get('token');

// Process unsubscribe
const response = await fetch('/api/v1/gdpr/unsubscribe', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token })
});

const { message } = await response.json();
```

## Compliance Notes

### GDPR Requirements Met

✅ **Consent Management**: Granular, freely given, specific, informed
✅ **Right to Access**: Data export in machine-readable format
✅ **Right to Erasure**: Account deletion with anonymization
✅ **Right to Rectification**: Users can edit profile data
✅ **Right to Restrict Processing**: Email unsubscribe
✅ **Right to Data Portability**: JSON export
✅ **Right to Object**: Cookie consent management
✅ **Transparency**: Clear legal documents
✅ **Data Minimization**: Only collect necessary data
✅ **Storage Limitation**: Retention policies and automated cleanup
✅ **Security**: Encryption, access controls, audit logs
✅ **Accountability**: Consent logs, DPO contact

### Legal Basis for Processing

- **Consent**: Analytics, marketing, optional features
- **Contract**: Platform services, account management
- **Legitimate Interests**: Security, fraud prevention, platform improvement
- **Legal Obligation**: Compliance with laws, court orders

### Data Processor Agreements

Ensure Data Processing Agreements (DPAs) are in place with:
- Cloud hosting provider (AWS, GCP, Azure)
- Email service provider (SendGrid, AWS SES)
- Analytics provider (if using third-party)
- CDN provider (Cloudflare, CloudFront)

## Security Considerations

- **Consent Logs**: Immutable audit trail
- **Secure Tokens**: Cryptographically secure random tokens
- **IP Logging**: Records context for consent verification
- **Anonymization**: Irreversible data removal
- **Admin Controls**: Role-based access for sensitive operations
- **Rate Limiting**: Prevent abuse of export/deletion requests

## Maintenance

### Adding New Legal Documents

```typescript
POST /api/v1/gdpr/admin/legal
{
  "documentType": "privacy_policy",
  "version": "2.0",
  "title": "Privacy Policy",
  "content": "# Privacy Policy (Updated)\n\n...",
  "effectiveAt": "2025-12-01T00:00:00Z",
  "isActive": true
}
```

### Updating Retention Policies

```typescript
PUT /api/v1/gdpr/admin/retention-policies
{
  "dataType": "analytics",
  "retentionDays": 730,
  "description": "Extended retention for analytics data"
}
```

### Processing Deletion Requests

```typescript
PATCH /api/v1/gdpr/admin/data-deletion/:requestId
{
  "status": "completed",
  "notes": "User data anonymized successfully"
}
```

## Testing

Run tests:

```bash
npm test -- gdpr
```

Test coverage includes:
- Consent management
- Data export
- Data deletion/anonymization
- Email unsubscribe
- Legal document retrieval
- Retention policy enforcement

## Future Enhancements

- [ ] Automated email for data export (instead of immediate download)
- [ ] Data portability to other platforms (export to competitor format)
- [ ] Consent renewal on policy update
- [ ] Age verification for underage users
- [ ] Multi-language legal documents
- [ ] Blockchain-based consent records (immutable proof)
- [ ] Automated DPIA (Data Protection Impact Assessment)
