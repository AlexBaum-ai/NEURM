import { PrismaClient } from '@prisma/client';
import { seedForumCategories } from './seeds/forumCategories.seed';
import { seedSpamKeywords } from './seeds/spamKeywords.seed';
import { seedBadges } from './seeds/badges.seed';
import { seedUsers } from './seeds/users.seed';
import { seedArticles } from './seeds/articles.seed';
import { seedGlossary } from './seeds/glossary.seed';
import { seedForumContent } from './seeds/forum-content.seed';
import { seedUseCases } from './seeds/use-cases.seed';
import { seedCompaniesAndJobs } from './seeds/companies-jobs.seed';

/**
 * Main Seed Script
 *
 * Seeds the database with comprehensive initial data for development and testing.
 * Run with: npm run seed or npx prisma db seed
 *
 * Seed Order (important for foreign key relationships):
 * 1. Platform data (categories, badges, spam keywords)
 * 2. Users (required by most other seeds)
 * 3. Content (articles, glossary, forum topics)
 * 4. Use cases
 * 5. Companies and jobs
 */

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting comprehensive database seeding...\n');
  console.log('═══════════════════════════════════════════════════════\n');

  try {
    // Phase 1: Platform Data
    console.log('📦 Phase 1: Platform Data\n');

    await seedForumCategories(prisma);
    console.log('');

    await seedSpamKeywords(prisma);
    console.log('');

    await seedBadges(prisma);
    console.log('');

    // Phase 2: Users
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('👥 Phase 2: User Accounts\n');

    await seedUsers(prisma);
    console.log('');

    // Phase 3: Content
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('📝 Phase 3: Content Creation\n');

    await seedGlossary(prisma);
    console.log('');

    await seedArticles(prisma);
    console.log('');

    await seedForumContent(prisma);
    console.log('');

    // Phase 4: Use Cases
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('💡 Phase 4: Use Cases\n');

    await seedUseCases(prisma);
    console.log('');

    // Phase 5: Companies & Jobs
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('💼 Phase 5: Companies & Jobs\n');

    await seedCompaniesAndJobs(prisma);
    console.log('');

    // Summary
    console.log('═══════════════════════════════════════════════════════\n');
    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('   • Forum categories and badges');
    console.log('   • 10+ user accounts (admin, moderators, test users)');
    console.log('   • 60+ glossary terms');
    console.log('   • 15+ high-quality articles');
    console.log('   • 8 forum topics with replies');
    console.log('   • 5 comprehensive use cases');
    console.log('   • 3 company profiles');
    console.log('   • 8 job postings');
    console.log('\n🎉 Your Neurmatic platform is ready!\n');
    console.log('Default credentials:');
    console.log('   Admin: admin@neurmatic.com / AdminPassword123!');
    console.log('   Test: john.developer@example.com / UserPassword123!\n');
  } catch (error) {
    console.error('❌ Error during seeding:', error);
    throw error;
  }
}

main()
  .catch((error) => {
    console.error('Fatal error during seeding:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
