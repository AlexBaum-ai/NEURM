import { PrismaClient } from '@prisma/client';

/**
 * Spam Keywords Seed
 *
 * Seeds the database with common spam keywords for content filtering.
 * Severity levels:
 * - 1: Low severity (flag for review)
 * - 3: Medium severity (likely spam)
 * - 5: High severity (definite spam)
 */

const spamKeywords = [
  // High severity - definite spam
  { keyword: 'buy followers', severity: 5 },
  { keyword: 'click here now', severity: 5 },
  { keyword: 'earn money fast', severity: 5 },
  { keyword: 'make money online', severity: 5 },
  { keyword: 'work from home', severity: 5 },
  { keyword: 'free bitcoin', severity: 5 },
  { keyword: 'get rich quick', severity: 5 },
  { keyword: 'limited time offer', severity: 5 },
  { keyword: 'act now', severity: 5 },
  { keyword: 'casino', severity: 5 },
  { keyword: 'viagra', severity: 5 },
  { keyword: 'cialis', severity: 5 },
  { keyword: 'weight loss pill', severity: 5 },

  // Medium severity - likely spam
  { keyword: 'check my profile', severity: 3 },
  { keyword: 'visit my website', severity: 3 },
  { keyword: 'follow me on', severity: 3 },
  { keyword: 'subscribe to my channel', severity: 3 },
  { keyword: 'click my link', severity: 3 },
  { keyword: 'check out this deal', severity: 3 },
  { keyword: 'limited spots available', severity: 3 },
  { keyword: 'instant approval', severity: 3 },
  { keyword: 'guaranteed results', severity: 3 },

  // Low severity - flag for review
  { keyword: 'discount code', severity: 1 },
  { keyword: 'special offer', severity: 1 },
  { keyword: 'free trial', severity: 1 },
  { keyword: 'download here', severity: 1 },
];

export async function seedSpamKeywords(prisma: PrismaClient): Promise<void> {
  console.log('🔍 Seeding spam keywords...');

  try {
    // Delete existing spam keywords
    await prisma.spamKeyword.deleteMany({});

    // Create spam keywords
    await prisma.spamKeyword.createMany({
      data: spamKeywords.map((kw) => ({
        ...kw,
        isActive: true,
      })),
    });

    console.log(`✅ Created ${spamKeywords.length} spam keywords`);
  } catch (error) {
    console.error('❌ Error seeding spam keywords:', error);
    throw error;
  }
}

export default seedSpamKeywords;
