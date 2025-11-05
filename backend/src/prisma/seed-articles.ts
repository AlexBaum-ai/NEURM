import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seedArticles() {
  console.log('🌱 Seeding test articles...');

  // Get existing categories and tags
  const categories = await prisma.newsCategory.findMany();
  const tags = await prisma.newsTag.findMany();

  if (categories.length === 0 || tags.length === 0) {
    console.log('⚠️  No categories or tags found. Please run news-categories-tags.seed.ts first');
    return;
  }

  // Create a test user for authorship
  let testUser = await prisma.user.findFirst({
    where: { email: 'test@neurmatic.com' },
  });

  if (!testUser) {
    testUser = await prisma.user.create({
      data: {
        email: 'test@neurmatic.com',
        username: 'testauthor',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5lE7nO.yXq7h6', // "password123"
        emailVerified: true,
        profile: {
          create: {
            displayName: 'Test Author',
            bio: 'Test author for seeding articles',
          },
        },
      },
    });
    console.log('✅ Created test user: test@neurmatic.com');
  }

  // Sample articles
  const articles = [
    {
      title: 'Introduction to GPT-4: What You Need to Know',
      slug: 'introduction-to-gpt-4-what-you-need-to-know',
      summary: 'Explore the capabilities and applications of OpenAI\'s GPT-4, the latest breakthrough in large language models.',
      content: `# Introduction to GPT-4

GPT-4 represents a significant leap forward in AI language models. In this comprehensive guide, we'll explore its key features, capabilities, and practical applications.

## Key Features

1. **Enhanced Reasoning**: GPT-4 demonstrates improved logical reasoning and problem-solving abilities
2. **Multimodal Capabilities**: Can process both text and images
3. **Longer Context Window**: Supports up to 128K tokens in some variants

## Practical Applications

GPT-4 is being used in:
- Code generation and debugging
- Content creation and editing
- Educational tutoring
- Data analysis and insights

## Getting Started

To start using GPT-4:
\`\`\`python
import openai

response = openai.ChatCompletion.create(
  model="gpt-4",
  messages=[{"role": "user", "content": "Hello!"}]
)
\`\`\`

This is just the beginning of what's possible with GPT-4!`,
      difficultyLevel: 'beginner',
      readingTimeMinutes: 5,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2025-11-01'),
      categorySlug: 'llm-news',
      tagSlugs: ['gpt-4', 'prompt-engineering'],
    },
    {
      title: 'Claude 3: Anthropic\'s Latest AI Assistant',
      slug: 'claude-3-anthropics-latest-ai-assistant',
      summary: 'Deep dive into Claude 3\'s architecture, safety features, and how it compares to other leading language models.',
      content: `# Claude 3: Anthropic's Latest AI Assistant

Claude 3 represents Anthropic's commitment to building safe and helpful AI systems. This article explores its unique features and capabilities.

## What Makes Claude Different?

Claude is designed with a focus on:
- Constitutional AI principles
- Enhanced safety and alignment
- Nuanced understanding of context

## Technical Capabilities

Claude 3 excels at:
- Long-form content analysis
- Complex reasoning tasks
- Maintaining consistent personality

## Use Cases

Organizations are using Claude for:
1. Customer support automation
2. Research assistance
3. Content moderation
4. Code review and documentation

## Comparison with GPT-4

While both are powerful, Claude offers:
- Different training approaches
- Alternative safety mechanisms
- Unique personality traits`,
      difficultyLevel: 'intermediate',
      readingTimeMinutes: 7,
      isTrending: true,
      status: 'published',
      publishedAt: new Date('2025-11-02'),
      categorySlug: 'research',
      tagSlugs: ['claude', 'ai-safety'],
    },
    {
      title: 'Mastering Prompt Engineering: Advanced Techniques',
      slug: 'mastering-prompt-engineering-advanced-techniques',
      summary: 'Learn advanced prompt engineering strategies to get better results from your LLM applications.',
      content: `# Mastering Prompt Engineering

Prompt engineering is the art and science of crafting effective inputs for language models. This guide covers advanced techniques.

## Core Principles

1. **Be Specific**: Clear instructions yield better results
2. **Provide Context**: Background information improves accuracy
3. **Use Examples**: Few-shot learning enhances performance

## Advanced Techniques

### Chain-of-Thought Prompting
Ask the model to think step-by-step:
\`\`\`
Let's solve this step by step:
1. First, identify the key variables
2. Then, analyze the relationships
3. Finally, draw conclusions
\`\`\`

### Role-Based Prompting
Assign the model a specific role:
\`\`\`
You are an expert data scientist. Analyze this dataset...
\`\`\`

## Best Practices

- Iterate and refine your prompts
- Test with diverse inputs
- Monitor for biases and errors`,
      difficultyLevel: 'advanced',
      readingTimeMinutes: 10,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2025-11-03'),
      categorySlug: 'tutorials',
      tagSlugs: ['prompt-engineering', 'transformers'],
    },
    {
      title: 'Building RAG Systems: A Complete Guide',
      slug: 'building-rag-systems-complete-guide',
      summary: 'Step-by-step tutorial on building Retrieval-Augmented Generation systems for enterprise applications.',
      content: `# Building RAG Systems

Retrieval-Augmented Generation (RAG) combines the power of LLMs with external knowledge bases. Learn how to build production-ready RAG systems.

## What is RAG?

RAG enhances LLMs by:
- Retrieving relevant documents
- Augmenting prompts with context
- Generating informed responses

## Architecture

A typical RAG system includes:
1. **Document Store**: Vector database for embeddings
2. **Retriever**: Finds relevant documents
3. **Generator**: LLM that produces responses

## Implementation

\`\`\`python
from langchain import VectorStore, LLM

# Load documents
docs = load_documents()

# Create embeddings
vectorstore = VectorStore.from_documents(docs)

# Query
results = vectorstore.similarity_search(query)
response = llm.generate(context=results)
\`\`\`

## Best Practices

- Chunk documents appropriately
- Use quality embeddings
- Implement relevance scoring`,
      difficultyLevel: 'advanced',
      readingTimeMinutes: 15,
      isTrending: true,
      status: 'published',
      publishedAt: new Date('2025-11-04'),
      categorySlug: 'tutorials',
      tagSlugs: ['rag', 'embeddings', 'api'],
    },
    {
      title: 'Open Source LLMs: LLaMA 2 vs Mistral',
      slug: 'open-source-llms-llama-2-vs-mistral',
      summary: 'Compare the leading open-source language models and learn which one is right for your project.',
      content: `# Open Source LLMs Comparison

The open-source LLM landscape is evolving rapidly. This comparison helps you choose between LLaMA 2 and Mistral.

## LLaMA 2

Meta's LLaMA 2 offers:
- Multiple model sizes (7B, 13B, 70B)
- Commercial-friendly license
- Strong community support

## Mistral 7B

Mistral's flagship model provides:
- Excellent performance-to-size ratio
- Apache 2.0 license
- Efficient architecture

## Performance Benchmarks

| Benchmark | LLaMA 2 7B | Mistral 7B |
|-----------|-----------|------------|
| MMLU      | 45.3      | 60.1       |
| HellaSwag | 77.2      | 83.3       |
| BBH       | 38.9      | 56.8       |

## Deployment Considerations

- Hardware requirements
- Inference speed
- Fine-tuning capabilities`,
      difficultyLevel: 'intermediate',
      readingTimeMinutes: 8,
      status: 'published',
      publishedAt: new Date('2025-11-05'),
      categorySlug: 'llm-news',
      tagSlugs: ['llama', 'open-source', 'benchmarks'],
    },
  ];

  // Create articles
  for (const articleData of articles) {
    const { tagSlugs, categorySlug, ...articleFields } = articleData;

    // Find the category by slug
    const category = await prisma.newsCategory.findUnique({
      where: { slug: categorySlug },
    });

    if (!category) {
      console.error(`⚠️  Category with slug '${categorySlug}' not found. Skipping article: ${articleData.title}`);
      continue;
    }

    // Find tags by slugs
    const tagsToConnect = await prisma.newsTag.findMany({
      where: { slug: { in: tagSlugs } },
    });

    if (tagsToConnect.length === 0) {
      console.warn(`⚠️  No tags found for article: ${articleData.title}`);
    }

    // Create the article with proper relations
    const article = await prisma.article.create({
      data: {
        ...articleFields,
        authorId: testUser.id,
        categoryId: category.id,
        createdById: testUser.id,
        updatedById: testUser.id,
        tags: {
          create: tagsToConnect.map((tag) => ({
            tag: {
              connect: { id: tag.id },
            },
          })),
        },
      },
      include: {
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
      },
    });

    console.log(`✅ Created article: ${article.title} (${article.tags.length} tags)`);
  }

  console.log('✨ Article seeding completed!');
}

seedArticles()
  .catch((e) => {
    console.error('❌ Error seeding articles:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
