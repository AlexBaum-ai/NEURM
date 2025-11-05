import { PrismaClient, CategoryVisibility } from '@prisma/client';

/**
 * Seed forum categories
 *
 * Creates 12 predefined forum categories organized hierarchically:
 * - 8 main categories (level 1)
 * - 4 subcategories (level 2)
 */

interface CategorySeedData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  displayOrder: number;
  guidelines: string;
  visibility: CategoryVisibility;
  children?: Omit<CategorySeedData, 'children'>[];
}

const categories: CategorySeedData[] = [
  {
    name: 'General Discussion',
    slug: 'general-discussion',
    description: 'General conversations about LLMs, AI, and related topics',
    icon: '💬',
    displayOrder: 0,
    guidelines: `Please keep discussions on-topic and respectful. This is a space for general LLM-related conversations that don't fit into other specific categories.

Guidelines:
- Be respectful and constructive
- Stay on topic (LLMs, AI, machine learning)
- No spam or self-promotion
- Search before posting to avoid duplicates`,
    visibility: 'public' as CategoryVisibility,
  },
  {
    name: 'Getting Started',
    slug: 'getting-started',
    description: 'New to LLMs? Start here! Beginner questions and resources',
    icon: '🚀',
    displayOrder: 1,
    guidelines: `This category is specifically for beginners. No question is too basic!

Guidelines:
- Be patient and encouraging with new members
- Provide links to learning resources when helpful
- Use simple language and explain technical terms
- Share your own learning journey`,
    visibility: 'public' as CategoryVisibility,
    children: [
      {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'Step-by-step guides and learning resources',
        icon: '📚',
        displayOrder: 0,
        guidelines: 'Share and discuss tutorials for learning LLMs. Include difficulty level and prerequisites.',
        visibility: 'public' as CategoryVisibility,
      },
    ],
  },
  {
    name: 'Prompt Engineering',
    slug: 'prompt-engineering',
    description: 'Discuss prompt techniques, strategies, and best practices',
    icon: '✨',
    displayOrder: 2,
    guidelines: `Share your prompting techniques and learn from others.

Guidelines:
- Include example prompts when discussing techniques
- Mention which LLM you tested with
- Share both successes and failures
- Discuss ethical considerations`,
    visibility: 'public' as CategoryVisibility,
  },
  {
    name: 'Development & Integration',
    slug: 'development',
    description: 'Technical discussions on building with LLMs - APIs, SDKs, frameworks',
    icon: '⚙️',
    displayOrder: 3,
    guidelines: `For developers building applications with LLMs.

Guidelines:
- Include code examples when relevant
- Specify frameworks/libraries used
- Mention versions and environment details
- Share error messages when debugging
- Follow code formatting best practices`,
    visibility: 'public' as CategoryVisibility,
    children: [
      {
        name: 'RAG & Vector DBs',
        slug: 'rag-vector-dbs',
        description: 'Retrieval Augmented Generation and vector database discussions',
        icon: '🔍',
        displayOrder: 0,
        guidelines: 'Discuss RAG implementations, vector databases (Pinecone, Weaviate, etc.), and retrieval strategies.',
        visibility: 'public' as CategoryVisibility,
      },
      {
        name: 'Fine-tuning',
        slug: 'fine-tuning',
        description: 'Model fine-tuning, training, and customization',
        icon: '🎯',
        displayOrder: 1,
        guidelines: 'Share experiences with fine-tuning models. Include dataset details, training parameters, and results.',
        visibility: 'public' as CategoryVisibility,
      },
    ],
  },
  {
    name: 'Model-Specific',
    slug: 'model-specific',
    description: 'Dedicated discussions for specific LLM models',
    icon: '🤖',
    displayOrder: 4,
    guidelines: `Discuss specific LLM models in depth.

Guidelines:
- Specify model version
- Share benchmarks and performance metrics
- Compare with other models when relevant
- Discuss use cases and limitations`,
    visibility: 'public' as CategoryVisibility,
    children: [
      {
        name: 'OpenAI Models',
        slug: 'openai-models',
        description: 'GPT-4, GPT-3.5, DALL-E, Whisper, and other OpenAI models',
        icon: '🟢',
        displayOrder: 0,
        guidelines: 'Discuss OpenAI models including GPT-4, ChatGPT, DALL-E, and Whisper.',
        visibility: 'public' as CategoryVisibility,
      },
    ],
  },
  {
    name: 'Use Cases & Applications',
    slug: 'use-cases',
    description: 'Share real-world applications, case studies, and success stories',
    icon: '💡',
    displayOrder: 5,
    guidelines: `Share how you're using LLMs in production or projects.

Guidelines:
- Describe the problem you solved
- Explain your approach and architecture
- Share metrics and results
- Mention challenges and lessons learned
- Include links to demos or write-ups`,
    visibility: 'public' as CategoryVisibility,
  },
  {
    name: 'Research & Papers',
    slug: 'research-papers',
    description: 'Discuss latest research papers, findings, and academic work',
    icon: '📄',
    displayOrder: 6,
    guidelines: `Discuss academic research and papers.

Guidelines:
- Link to the paper (arXiv, journal, etc.)
- Provide a brief summary
- Highlight key findings
- Discuss implications and applications
- Be respectful of different perspectives`,
    visibility: 'public' as CategoryVisibility,
  },
  {
    name: 'Community Showcase',
    slug: 'showcase',
    description: 'Show off your LLM-powered projects and experiments',
    icon: '🎨',
    displayOrder: 7,
    guidelines: `Share your creations with the community!

Guidelines:
- Include demo links or videos
- Explain what you built and why
- Share technical details (models used, architecture)
- Provide GitHub repo if open source
- Be open to feedback and questions`,
    visibility: 'public' as CategoryVisibility,
  },
];

export async function seedForumCategories(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding forum categories...');

  let totalCreated = 0;
  let totalUpdated = 0;

  for (const categoryData of categories) {
    const { children, ...mainCategoryData } = categoryData;

    // Create or update main category
    const mainCategory = await prisma.forumCategory.upsert({
      where: { slug: mainCategoryData.slug },
      update: {
        ...mainCategoryData,
        level: 1,
      },
      create: {
        ...mainCategoryData,
        level: 1,
      },
    });

    console.log(`  ✅ Category: ${mainCategory.name} (${mainCategory.slug})`);
    totalCreated++;

    // Create or update subcategories if any
    if (children && children.length > 0) {
      for (const childData of children) {
        const childCategory = await prisma.forumCategory.upsert({
          where: { slug: childData.slug },
          update: {
            ...childData,
            parentId: mainCategory.id,
            level: 2,
          },
          create: {
            ...childData,
            parentId: mainCategory.id,
            level: 2,
          },
        });

        console.log(`    ↳ Subcategory: ${childCategory.name} (${childCategory.slug})`);
        totalCreated++;
      }
    }
  }

  console.log(`✅ Forum categories seeded successfully!`);
  console.log(`   Total categories: ${totalCreated}`);
}

export default seedForumCategories;
