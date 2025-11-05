import { PrismaClient } from '@prisma/client';
import { seedForumCategories } from './seeds/forumCategories.seed';
import { seedSpamKeywords } from './seeds/spamKeywords.seed';

/**
 * Main Seed Script
 *
 * Seeds the database with initial data for development and testing.
 * Run with: npm run seed or npx prisma db seed
 */

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...\n');

  try {
    // Seed forum categories
    await seedForumCategories(prisma);
    console.log('');

    // Seed spam keywords
    await seedSpamKeywords(prisma);
    console.log('');

    console.log('✅ Database seeding completed successfully!\n');
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
