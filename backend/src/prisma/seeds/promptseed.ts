import { PrismaClient } from '@prisma/client';
import logger from '../../utils/logger';

const prisma = new PrismaClient();

/**
 * Sample prompts for different categories
 */
const samplePrompts = [
  {
    title: 'Technical Documentation Writer',
    content: `You are a technical documentation specialist. Create clear, comprehensive documentation for [TOPIC].

Include:
- Overview and purpose
- Step-by-step instructions
- Code examples with explanations
- Common pitfalls and troubleshooting
- Best practices

Format the documentation with proper markdown headings, code blocks, and bullet points.`,
    category: 'technical_writing',
    useCase: 'API documentation, developer guides, technical tutorials',
    model: 'gpt-4',
    tags: ['documentation', 'technical', 'developer', 'api'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 2000,
      systemPrompt: 'You are a technical documentation specialist with expertise in creating clear, comprehensive developer documentation.',
    },
  },
  {
    title: 'Code Review Assistant',
    content: `Review the following code and provide detailed feedback:

[PASTE CODE HERE]

Analyze for:
1. Code quality and readability
2. Potential bugs and edge cases
3. Performance optimization opportunities
4. Security vulnerabilities
5. Best practices and design patterns
6. Suggestions for improvement

Provide specific, actionable recommendations.`,
    category: 'code_generation',
    useCase: 'Code review, bug detection, optimization suggestions',
    model: 'gpt-4',
    tags: ['code-review', 'debugging', 'optimization', 'security'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.5,
      maxTokens: 1500,
      systemPrompt: 'You are an expert code reviewer with deep knowledge of software engineering best practices.',
    },
  },
  {
    title: 'Data Analysis Report Generator',
    content: `Analyze the following dataset and generate a comprehensive report:

Dataset: [DESCRIBE DATASET OR PASTE DATA]

Generate:
1. Executive Summary
2. Key Findings (top 5-7 insights)
3. Detailed Analysis with visualizations
4. Trends and Patterns
5. Actionable Recommendations
6. Methodology

Use clear, business-friendly language. Include statistical significance where relevant.`,
    category: 'data_analysis',
    useCase: 'Business intelligence, data insights, reporting',
    model: 'gpt-4',
    tags: ['data', 'analysis', 'reporting', 'business'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.4,
      maxTokens: 2500,
      systemPrompt: 'You are a data analyst with expertise in statistical analysis and business intelligence.',
    },
  },
  {
    title: 'Educational Content Creator',
    content: `Create an educational lesson on [TOPIC] for [AUDIENCE LEVEL].

Structure:
1. Learning Objectives (3-5 clear objectives)
2. Introduction (hook and context)
3. Core Concepts (break down into digestible sections)
4. Examples and Analogies
5. Practice Exercises (3-5 questions)
6. Summary and Key Takeaways
7. Additional Resources

Use engaging language appropriate for the audience level. Include real-world applications.`,
    category: 'education',
    useCase: 'Course creation, training materials, tutorials',
    model: 'gpt-4',
    tags: ['education', 'learning', 'teaching', 'tutorial'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 2000,
      systemPrompt: 'You are an experienced educator skilled at creating engaging, effective learning materials.',
    },
  },
  {
    title: 'Creative Story Generator',
    content: `Write a creative story based on these elements:

Genre: [GENRE]
Setting: [SETTING]
Main Character: [CHARACTER DESCRIPTION]
Conflict: [CENTRAL CONFLICT]
Tone: [TONE/MOOD]

Create a compelling narrative with:
- Vivid descriptions
- Engaging dialogue
- Character development
- Plot twists
- Satisfying resolution

Length: [SPECIFY LENGTH]`,
    category: 'creative_writing',
    useCase: 'Story writing, creative content, narrative development',
    model: 'gpt-4',
    tags: ['creative', 'story', 'fiction', 'writing'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.9,
      maxTokens: 3000,
      systemPrompt: 'You are a creative writer with a talent for crafting engaging, imaginative stories.',
    },
  },
  {
    title: 'Marketing Copy Optimizer',
    content: `Optimize this marketing copy for better conversion:

Original Copy:
[PASTE ORIGINAL COPY]

Target Audience: [DESCRIBE AUDIENCE]
Goal: [CONVERSION GOAL]

Provide:
1. Rewritten copy with improvements
2. Explanation of changes made
3. A/B testing suggestions
4. Alternative headlines (3 options)
5. Call-to-action variations (3 options)

Focus on:
- Clear value proposition
- Emotional triggers
- Urgency and scarcity
- Social proof opportunities
- Compelling CTAs`,
    category: 'content_creation',
    useCase: 'Marketing, copywriting, conversion optimization',
    model: 'gpt-4',
    tags: ['marketing', 'copywriting', 'conversion', 'sales'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.7,
      maxTokens: 1500,
      systemPrompt: 'You are a marketing copywriter specializing in high-converting content.',
    },
  },
  {
    title: 'Debugging Assistant',
    content: `I'm encountering an error in my code. Help me debug it:

Language/Framework: [SPECIFY]
Error Message: [PASTE ERROR]
Code Context: [PASTE RELEVANT CODE]
What I've tried: [DESCRIBE ATTEMPTS]

Please:
1. Identify the root cause
2. Explain why the error occurs
3. Provide a fix with explanation
4. Suggest preventive measures
5. Share related best practices`,
    category: 'debugging',
    useCase: 'Error resolution, troubleshooting, code fixing',
    model: 'gpt-4',
    tags: ['debugging', 'error', 'troubleshooting', 'code'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1500,
      systemPrompt: 'You are an expert debugger with deep knowledge of common programming errors and solutions.',
    },
  },
  {
    title: 'Research Paper Summarizer',
    content: `Summarize the following research paper:

[PASTE PAPER TEXT OR PROVIDE LINK]

Provide:
1. Executive Summary (2-3 sentences)
2. Research Question/Hypothesis
3. Methodology Overview
4. Key Findings (bullet points)
5. Limitations
6. Implications and Applications
7. Future Research Directions

Target audience: [SPECIFY: general public, researchers, industry professionals, etc.]

Use clear, accessible language while maintaining accuracy.`,
    category: 'summarization',
    useCase: 'Academic research, literature review, knowledge synthesis',
    model: 'gpt-4',
    tags: ['research', 'summarization', 'academic', 'analysis'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.4,
      maxTokens: 1500,
      systemPrompt: 'You are an academic researcher skilled at distilling complex research into clear summaries.',
    },
  },
  {
    title: 'Brainstorming Facilitator',
    content: `Let's brainstorm ideas for: [TOPIC/CHALLENGE]

Context: [PROVIDE CONTEXT]
Constraints: [ANY LIMITATIONS]
Goals: [DESIRED OUTCOMES]

Generate:
1. 10 diverse ideas (mix of safe and bold)
2. For each idea:
   - Brief description
   - Pros and cons
   - Implementation difficulty (1-5)
   - Potential impact (1-5)
3. Top 3 recommendations with reasoning
4. Combination possibilities

Think creatively and consider unconventional approaches.`,
    category: 'brainstorming',
    useCase: 'Idea generation, problem solving, innovation',
    model: 'gpt-4',
    tags: ['brainstorming', 'ideas', 'creativity', 'innovation'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.8,
      maxTokens: 2000,
      systemPrompt: 'You are a creative facilitator skilled at generating diverse, innovative ideas.',
    },
  },
  {
    title: 'SQL Query Generator',
    content: `Generate a SQL query for the following requirement:

Database: [DESCRIBE DATABASE/TABLES]
Requirement: [DESCRIBE WHAT YOU NEED]
Database Type: [PostgreSQL, MySQL, SQL Server, etc.]

Provide:
1. The SQL query
2. Explanation of the logic
3. Expected result structure
4. Performance considerations
5. Alternative approaches if applicable

Include proper formatting, indexing suggestions, and optimization tips.`,
    category: 'code_generation',
    useCase: 'Database queries, data retrieval, SQL optimization',
    model: 'gpt-4',
    tags: ['sql', 'database', 'query', 'data'],
    templateJson: {
      model: 'gpt-4',
      temperature: 0.3,
      maxTokens: 1000,
      systemPrompt: 'You are a database expert with deep knowledge of SQL optimization and best practices.',
    },
  },
];

/**
 * Seed prompts
 */
export async function seedPrompts() {
  try {
    logger.info('Starting prompt seeding...');

    // Get or create a seed user
    let seedUser = await prisma.user.findFirst({
      where: { email: 'admin@neurmatic.com' },
    });

    if (!seedUser) {
      seedUser = await prisma.user.create({
        data: {
          email: 'admin@neurmatic.com',
          username: 'neurmatic_admin',
          emailVerified: true,
          role: 'admin',
          profile: {
            create: {
              displayName: 'Neurmatic Admin',
              bio: 'Official Neurmatic account for curated prompts and resources',
            },
          },
        },
      });
      logger.info('Created seed user for prompts');
    }

    // Check if prompts already exist
    const existingPromptsCount = await prisma.prompt.count();

    if (existingPromptsCount > 0) {
      logger.info(`Prompts already seeded (${existingPromptsCount} prompts exist)`);
      return;
    }

    // Create sample prompts
    for (const promptData of samplePrompts) {
      await prisma.prompt.create({
        data: {
          ...promptData,
          userId: seedUser.id,
        },
      });
    }

    logger.info(`Successfully seeded ${samplePrompts.length} prompts`);
  } catch (error) {
    logger.error('Error seeding prompts:', error);
    throw error;
  }
}

// Run seed if called directly
if (require.main === module) {
  seedPrompts()
    .then(() => {
      logger.info('Prompt seeding completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Prompt seeding failed:', error);
      process.exit(1);
    })
    .finally(() => {
      prisma.$disconnect();
    });
}

export default seedPrompts;
