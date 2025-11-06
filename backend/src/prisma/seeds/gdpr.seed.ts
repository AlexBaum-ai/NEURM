import { PrismaClient, LegalDocumentType } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed GDPR compliance data
 * - Legal documents (Privacy Policy, Terms of Service, Cookie Policy)
 * - Data retention policies
 * - DPO contact information
 */
export async function seedGDPRData() {
  console.log('Seeding GDPR compliance data...');

  // ============================================================================
  // LEGAL DOCUMENTS
  // ============================================================================

  // Privacy Policy
  const privacyPolicy = await prisma.legalDocument.upsert({
    where: {
      documentType_version: {
        documentType: LegalDocumentType.privacy_policy,
        version: '1.0',
      },
    },
    create: {
      documentType: LegalDocumentType.privacy_policy,
      version: '1.0',
      title: 'Privacy Policy',
      content: `# Privacy Policy

**Last Updated: ${new Date().toISOString().split('T')[0]}**

## 1. Introduction

Welcome to Neurmatic ("we," "our," or "us"). We respect your privacy and are committed to protecting your personal data. This privacy policy will inform you about how we handle your personal data when you visit our website and tell you about your privacy rights.

## 2. Data We Collect

We collect and process the following types of personal data:

### 2.1 Account Information
- Email address
- Username
- Password (encrypted)
- Profile information (name, bio, avatar, etc.)

### 2.2 Professional Information
- Skills and experience
- Work history
- Education
- Portfolio projects

### 2.3 Usage Data
- Log data (IP address, browser type, pages visited)
- Analytics data (how you interact with our platform)
- Cookies and tracking technologies

### 2.4 Content
- Forum posts and comments
- Articles and publications
- Messages and communications
- Job applications

## 3. How We Use Your Data

We use your personal data for the following purposes:

- **Provide Services**: To create and manage your account, provide platform features
- **Communication**: To send you notifications, updates, and marketing messages (with consent)
- **Improvement**: To analyze usage patterns and improve our platform
- **Security**: To detect and prevent fraud, abuse, and security incidents
- **Legal Compliance**: To comply with legal obligations and enforce our terms

## 4. Legal Basis for Processing

We process your personal data under the following legal bases:

- **Consent**: When you have given explicit consent (e.g., marketing emails)
- **Contract**: To perform our contract with you (providing services)
- **Legitimate Interests**: For analytics, security, and platform improvements
- **Legal Obligation**: To comply with legal requirements

## 5. Data Sharing and Disclosure

We may share your data with:

- **Service Providers**: Third-party services that help us operate (hosting, analytics, email)
- **Employers**: When you apply for jobs or make your profile visible to recruiters
- **Law Enforcement**: When required by law or to protect rights and safety
- **Business Transfers**: In connection with mergers, acquisitions, or asset sales

We do NOT sell your personal data to third parties.

## 6. Your Rights Under GDPR

You have the following rights regarding your personal data:

- **Right to Access**: Request a copy of your personal data
- **Right to Rectification**: Correct inaccurate or incomplete data
- **Right to Erasure**: Request deletion of your data ("right to be forgotten")
- **Right to Restriction**: Limit how we process your data
- **Right to Data Portability**: Receive your data in a structured, machine-readable format
- **Right to Object**: Object to processing based on legitimate interests
- **Right to Withdraw Consent**: Withdraw consent for marketing or optional processing

To exercise these rights, visit your account settings or contact our Data Protection Officer.

## 7. Data Retention

We retain your data for as long as necessary to provide services and comply with legal obligations:

- **Account Data**: Until you delete your account, plus 30 days grace period
- **Content**: Anonymized after account deletion to preserve community integrity
- **Analytics**: 365 days
- **Logs**: 90 days
- **Consent Records**: 2 years after withdrawal (for compliance)

## 8. Security

We implement industry-standard security measures to protect your data:

- Encryption in transit (HTTPS/TLS)
- Encryption at rest for sensitive data
- Access controls and authentication
- Regular security audits and monitoring
- Employee training on data protection

## 9. Cookies and Tracking

We use cookies and similar technologies for:

- **Necessary**: Essential for platform functionality
- **Functional**: Remember your preferences and settings
- **Analytics**: Understand usage patterns (with consent)
- **Marketing**: Personalized advertising (with consent)

You can manage cookie preferences in your account settings.

## 10. International Transfers

Your data may be transferred to and processed in countries outside the EU. We ensure appropriate safeguards are in place, such as:

- EU Standard Contractual Clauses
- Privacy Shield certification (where applicable)
- Adequacy decisions by the European Commission

## 11. Children's Privacy

Our platform is not intended for children under 16. We do not knowingly collect data from children. If you believe we have collected data from a child, please contact us immediately.

## 12. Changes to This Policy

We may update this privacy policy from time to time. We will notify you of significant changes via email or platform notification. The "Last Updated" date indicates when the policy was last revised.

## 13. Contact Us

If you have questions about this privacy policy or wish to exercise your rights:

**Data Protection Officer**
Email: dpo@neurmatic.com
Address: [Your Company Address]

You also have the right to lodge a complaint with your local data protection authority.
`,
      effectiveAt: new Date(),
      isActive: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  console.log('✓ Privacy Policy created');

  // Terms of Service
  const termsOfService = await prisma.legalDocument.upsert({
    where: {
      documentType_version: {
        documentType: LegalDocumentType.terms_of_service,
        version: '1.0',
      },
    },
    create: {
      documentType: LegalDocumentType.terms_of_service,
      version: '1.0',
      title: 'Terms of Service',
      content: `# Terms of Service

**Last Updated: ${new Date().toISOString().split('T')[0]}**

## 1. Acceptance of Terms

By accessing or using Neurmatic ("Platform"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, do not use the Platform.

## 2. Description of Service

Neurmatic is a community platform for the Large Language Model (LLM) community, providing:

- News and updates about LLMs and AI
- Discussion forums and Q&A
- Job board and recruitment services
- User profiles and networking
- Educational resources and guides

## 3. User Accounts

### 3.1 Registration
- You must provide accurate and complete information
- You must be at least 16 years old to create an account
- You are responsible for maintaining the confidentiality of your account credentials
- You are responsible for all activities under your account

### 3.2 Account Types
- **Individual Users**: Personal accounts for community members
- **Company Accounts**: For employers and recruiters
- **Admin Accounts**: Platform administrators (by invitation only)

## 4. User Conduct

You agree NOT to:

- Post false, misleading, or fraudulent content
- Harass, abuse, or harm other users
- Spam or send unsolicited commercial messages
- Violate intellectual property rights
- Attempt to hack, disrupt, or compromise platform security
- Use automated tools (bots, scrapers) without permission
- Impersonate others or create fake accounts
- Post illegal, obscene, or offensive content

## 5. Content and Intellectual Property

### 5.1 Your Content
- You retain ownership of content you post
- You grant us a non-exclusive, worldwide license to use, display, and distribute your content
- You represent that you have rights to post the content
- You are responsible for your content and its legality

### 5.2 Our Content
- The Platform and its original content are protected by copyright and trademark laws
- You may not copy, modify, or distribute our content without permission

## 6. Prohibited Content

The following types of content are prohibited:

- Spam, advertisements, or commercial solicitations (outside designated areas)
- Hate speech, discrimination, or harassment
- Violence, threats, or dangerous content
- Sexual or explicit content (outside age-appropriate contexts)
- Misinformation or fake news
- Pirated or stolen content
- Private information without consent (doxxing)

## 7. Job Postings and Recruitment

### 7.1 Job Postings
- Job postings must be legitimate and accurate
- Must comply with employment laws and anti-discrimination regulations
- Prohibited: scams, pyramid schemes, unpaid work (except legitimate internships)

### 7.2 Applications
- Applicants must provide truthful information
- Recruiters must handle applications confidentially and respectfully

## 8. Moderation and Enforcement

We reserve the right to:

- Remove content that violates these Terms
- Suspend or terminate accounts for violations
- Report illegal activity to law enforcement
- Modify or discontinue services at any time

## 9. Disclaimer of Warranties

THE PLATFORM IS PROVIDED "AS IS" WITHOUT WARRANTIES OF ANY KIND. WE DO NOT WARRANT THAT:

- The Platform will be uninterrupted or error-free
- Content is accurate, complete, or reliable
- Defects will be corrected
- The Platform is free of viruses or harmful components

## 10. Limitation of Liability

TO THE MAXIMUM EXTENT PERMITTED BY LAW:

- We are not liable for indirect, incidental, or consequential damages
- Our total liability is limited to the amount you paid us in the past 12 months (or €100, whichever is greater)
- We are not responsible for user-generated content or third-party services

## 11. Indemnification

You agree to indemnify and hold us harmless from claims arising from:

- Your use of the Platform
- Your content
- Your violation of these Terms
- Your violation of any rights of others

## 12. Dispute Resolution

### 12.1 Governing Law
These Terms are governed by the laws of [Your Jurisdiction], without regard to conflict of law principles.

### 12.2 Arbitration
Disputes will be resolved through binding arbitration, except for:
- Claims in small claims court
- Intellectual property disputes
- Injunctive relief

## 13. Changes to Terms

We may modify these Terms at any time. We will notify you of material changes. Continued use after changes constitutes acceptance.

## 14. Termination

### 14.1 By You
You may delete your account at any time through account settings.

### 14.2 By Us
We may suspend or terminate your account for:
- Violation of these Terms
- Illegal activity
- Prolonged inactivity
- At our discretion with or without cause

## 15. Contact

For questions about these Terms:

**Email**: legal@neurmatic.com
**Address**: [Your Company Address]

## 16. Miscellaneous

- **Severability**: If any provision is unenforceable, the rest remains in effect
- **Waiver**: Failure to enforce a provision does not waive our rights
- **Assignment**: We may assign these Terms; you may not without our consent
- **Entire Agreement**: These Terms constitute the entire agreement between us
`,
      effectiveAt: new Date(),
      isActive: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  console.log('✓ Terms of Service created');

  // Cookie Policy
  const cookiePolicy = await prisma.legalDocument.upsert({
    where: {
      documentType_version: {
        documentType: LegalDocumentType.cookie_policy,
        version: '1.0',
      },
    },
    create: {
      documentType: LegalDocumentType.cookie_policy,
      version: '1.0',
      title: 'Cookie Policy',
      content: `# Cookie Policy

**Last Updated: ${new Date().toISOString().split('T')[0]}**

## 1. What Are Cookies?

Cookies are small text files stored on your device when you visit a website. They help websites remember your preferences and improve your experience.

## 2. How We Use Cookies

We use cookies for the following purposes:

### 2.1 Necessary Cookies (Always Active)
These cookies are essential for the website to function:

- **Authentication**: Keep you logged in
- **Security**: Protect against CSRF attacks
- **Session Management**: Maintain your session state
- **Load Balancing**: Distribute traffic across servers

These cookies cannot be disabled as they are required for basic functionality.

### 2.2 Functional Cookies (Optional)
These cookies enhance your experience:

- **Preferences**: Remember your settings (theme, language)
- **Features**: Enable advanced features you've activated
- **Recent Searches**: Remember your recent searches
- **Form Data**: Remember form inputs to prevent data loss

### 2.3 Analytics Cookies (Optional, Requires Consent)
These cookies help us understand how you use the platform:

- **Google Analytics**: Track page views, sessions, and user behavior
- **Custom Analytics**: Track feature usage and engagement
- **Performance Monitoring**: Identify slow pages and errors

We use this data to improve the platform and user experience.

### 2.4 Marketing Cookies (Optional, Requires Consent)
These cookies enable personalized advertising:

- **Ad Targeting**: Show relevant ads based on your interests
- **Retargeting**: Show ads for Neurmatic on other websites
- **Conversion Tracking**: Measure effectiveness of ad campaigns
- **Social Media**: Enable social sharing and social login

## 3. Third-Party Cookies

We use the following third-party services that set cookies:

- **Google Analytics**: Web analytics (analytics cookies)
- **Cloudflare**: CDN and security (necessary cookies)
- **Sentry**: Error monitoring (necessary cookies)
- **Social Login Providers**: Google, LinkedIn, GitHub (necessary for login)

These third parties have their own privacy policies governing cookie use.

## 4. Managing Your Cookie Preferences

You can control cookies in several ways:

### 4.1 Cookie Consent Banner
On your first visit, you'll see a cookie consent banner with options to:
- Accept all cookies
- Reject optional cookies (necessary cookies remain)
- Customize preferences by category

### 4.2 Account Settings
Logged-in users can manage cookie preferences in Account Settings > Privacy & Cookies.

### 4.3 Browser Settings
You can configure your browser to:
- Block all cookies
- Block third-party cookies only
- Delete cookies when you close the browser
- Notify you when a cookie is set

**Note**: Blocking necessary cookies will prevent you from using the platform.

## 5. Do Not Track (DNT)

Some browsers support Do Not Track (DNT) signals. When we detect DNT, we:
- Do not set analytics or marketing cookies
- Disable cross-site tracking
- Respect your privacy preference

Note that DNT does not disable necessary cookies required for functionality.

## 6. Cookie Lifespan

Different cookies have different lifespans:

- **Session Cookies**: Deleted when you close your browser
- **Persistent Cookies**: Remain for a specified period:
  - Authentication: 30 days
  - Preferences: 365 days
  - Analytics: 24 months
  - Marketing: 90 days

## 7. Updates to This Policy

We may update this Cookie Policy from time to time. Changes will be reflected in the "Last Updated" date. Significant changes may require re-consent.

## 8. Contact Us

If you have questions about cookies:

**Email**: privacy@neurmatic.com
**Data Protection Officer**: dpo@neurmatic.com

You can also contact us to exercise your rights under GDPR, including:
- Right to access data collected via cookies
- Right to delete cookie data
- Right to object to cookie processing
`,
      effectiveAt: new Date(),
      isActive: true,
      publishedAt: new Date(),
    },
    update: {},
  });

  console.log('✓ Cookie Policy created');

  // ============================================================================
  // DATA RETENTION POLICIES
  // ============================================================================

  const retentionPolicies = [
    { dataType: 'sessions', retentionDays: 90, description: 'Active user sessions and authentication tokens' },
    { dataType: 'analytics', retentionDays: 365, description: 'Analytics events and usage tracking data' },
    { dataType: 'search_history', retentionDays: 90, description: 'User search queries and history' },
    { dataType: 'notifications', retentionDays: 90, description: 'Read user notifications (unread kept indefinitely)' },
    { dataType: 'consent_logs', retentionDays: 730, description: 'GDPR consent audit trail (2 years for compliance)' },
    { dataType: 'article_views', retentionDays: 180, description: 'Article view tracking data' },
    { dataType: 'logs', retentionDays: 90, description: 'System logs and error logs' },
  ];

  for (const policy of retentionPolicies) {
    await prisma.dataRetentionPolicy.upsert({
      where: { dataType: policy.dataType },
      create: policy,
      update: policy,
    });
  }

  console.log(`✓ Created ${retentionPolicies.length} data retention policies`);

  // ============================================================================
  // DPO CONTACT
  // ============================================================================

  await prisma.dPOContact.deleteMany({ where: { isActive: true } });

  const dpoContact = await prisma.dPOContact.create({
    data: {
      name: 'Data Protection Officer',
      email: process.env.DPO_EMAIL || 'dpo@neurmatic.com',
      phone: process.env.DPO_PHONE || '+31 20 123 4567',
      address: 'Neurmatic B.V.\nAmsterdam, Netherlands',
      isActive: true,
    },
  });

  console.log('✓ DPO contact information created');

  console.log('\n✅ GDPR compliance data seeded successfully');
}

// Run seed if called directly
if (require.main === module) {
  seedGDPRData()
    .catch((error) => {
      console.error('Error seeding GDPR data:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
