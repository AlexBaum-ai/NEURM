import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed data for news categories and tags
 * SPRINT-2-002
 */

async function seedNewsCategories() {
  console.log('🌱 Seeding news categories...');

  // Level 1: Root categories
  const llmNews = await prisma.newsCategory.upsert({
    where: { slug: 'llm-news' },
    update: {},
    create: {
      slug: 'llm-news',
      name: 'LLM News',
      description: 'Latest news and updates about Large Language Models',
      level: 1,
      displayOrder: 1,
      isActive: true,
      icon: '📰',
    },
  });

  const research = await prisma.newsCategory.upsert({
    where: { slug: 'research' },
    update: {},
    create: {
      slug: 'research',
      name: 'Research',
      description: 'AI and ML research papers, breakthroughs, and analysis',
      level: 1,
      displayOrder: 2,
      isActive: true,
      icon: '🔬',
    },
  });

  const industry = await prisma.newsCategory.upsert({
    where: { slug: 'industry' },
    update: {},
    create: {
      slug: 'industry',
      name: 'Industry',
      description: 'Business news, product launches, and industry trends',
      level: 1,
      displayOrder: 3,
      isActive: true,
      icon: '🏢',
    },
  });

  const tutorials = await prisma.newsCategory.upsert({
    where: { slug: 'tutorials' },
    update: {},
    create: {
      slug: 'tutorials',
      name: 'Tutorials',
      description: 'How-to guides, tutorials, and educational content',
      level: 1,
      displayOrder: 4,
      isActive: true,
      icon: '📚',
    },
  });

  // Level 2: LLM News subcategories
  await prisma.newsCategory.upsert({
    where: { slug: 'model-releases' },
    update: {},
    create: {
      slug: 'model-releases',
      name: 'Model Releases',
      description: 'New LLM model announcements and releases',
      parentId: llmNews.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.newsCategory.upsert({
    where: { slug: 'updates' },
    update: {},
    create: {
      slug: 'updates',
      name: 'Updates',
      description: 'Model updates, improvements, and new features',
      parentId: llmNews.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    },
  });

  // Level 2: Research subcategories
  await prisma.newsCategory.upsert({
    where: { slug: 'papers' },
    update: {},
    create: {
      slug: 'papers',
      name: 'Papers',
      description: 'Research papers and academic publications',
      parentId: research.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.newsCategory.upsert({
    where: { slug: 'breakthroughs' },
    update: {},
    create: {
      slug: 'breakthroughs',
      name: 'Breakthroughs',
      description: 'Major research breakthroughs and discoveries',
      parentId: research.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    },
  });

  // Level 2: Industry subcategories
  await prisma.newsCategory.upsert({
    where: { slug: 'startups' },
    update: {},
    create: {
      slug: 'startups',
      name: 'Startups',
      description: 'AI startup news, funding, and launches',
      parentId: industry.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.newsCategory.upsert({
    where: { slug: 'products' },
    update: {},
    create: {
      slug: 'products',
      name: 'Products',
      description: 'Product launches and announcements',
      parentId: industry.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    },
  });

  // Level 2: Tutorials subcategories
  await prisma.newsCategory.upsert({
    where: { slug: 'getting-started' },
    update: {},
    create: {
      slug: 'getting-started',
      name: 'Getting Started',
      description: 'Beginner-friendly tutorials and guides',
      parentId: tutorials.id,
      level: 2,
      displayOrder: 1,
      isActive: true,
    },
  });

  await prisma.newsCategory.upsert({
    where: { slug: 'advanced' },
    update: {},
    create: {
      slug: 'advanced',
      name: 'Advanced',
      description: 'Advanced tutorials and techniques',
      parentId: tutorials.id,
      level: 2,
      displayOrder: 2,
      isActive: true,
    },
  });

  console.log('✅ News categories seeded successfully');
}

async function seedNewsTags() {
  console.log('🌱 Seeding news tags...');

  const tags = [
    { name: 'GPT-4', slug: 'gpt-4', description: 'OpenAI GPT-4 model' },
    { name: 'Claude', slug: 'claude', description: 'Anthropic Claude model' },
    { name: 'Gemini', slug: 'gemini', description: 'Google Gemini model' },
    { name: 'LLaMA', slug: 'llama', description: 'Meta LLaMA model' },
    { name: 'Transformers', slug: 'transformers', description: 'Transformer architecture' },
    { name: 'Fine-tuning', slug: 'fine-tuning', description: 'Model fine-tuning techniques' },
    { name: 'Prompt Engineering', slug: 'prompt-engineering', description: 'Prompt design and optimization' },
    { name: 'RAG', slug: 'rag', description: 'Retrieval-Augmented Generation' },
    { name: 'Embeddings', slug: 'embeddings', description: 'Vector embeddings' },
    { name: 'Multimodal', slug: 'multimodal', description: 'Multimodal AI models' },
    { name: 'Open Source', slug: 'open-source', description: 'Open source models and tools' },
    { name: 'AI Safety', slug: 'ai-safety', description: 'AI safety and alignment' },
    { name: 'Benchmarks', slug: 'benchmarks', description: 'Model benchmarks and evaluations' },
    { name: 'API', slug: 'api', description: 'APIs and integrations' },
    { name: 'Agents', slug: 'agents', description: 'AI agents and autonomous systems' },
    { name: 'Computer Vision', slug: 'computer-vision', description: 'Computer vision models' },
    { name: 'NLP', slug: 'nlp', description: 'Natural Language Processing' },
    { name: 'Text Generation', slug: 'text-generation', description: 'Text generation techniques' },
    { name: 'Code Generation', slug: 'code-generation', description: 'Code generation models' },
    { name: 'Chatbots', slug: 'chatbots', description: 'Chatbot development' },
  ];

  for (const tag of tags) {
    await prisma.newsTag.upsert({
      where: { slug: tag.slug },
      update: {},
      create: {
        name: tag.name,
        slug: tag.slug,
        description: tag.description,
        usageCount: 0,
      },
    });
  }

  console.log('✅ News tags seeded successfully');
}

export async function seedNewsData() {
  try {
    await seedNewsCategories();
    await seedNewsTags();
  } catch (error) {
    console.error('Error seeding news data:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedNewsData()
    .catch((error) => {
      console.error(error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
