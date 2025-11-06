import { PrismaClient, CompanySize, JobType, WorkLocation, ExperienceLevel, JobStatus } from '@prisma/client';

/**
 * Seed Companies and Job Postings
 *
 * Creates 3 sample company profiles with 8 job postings
 */

interface CompanySeedData {
  name: string;
  slug: string;
  description: string;
  about: string;
  industry: string;
  companySize: CompanySize;
  foundedYear: number;
  location: string;
  website: string;
  logoUrl?: string;
  benefits: string[];
  techStack: string[];
  ownerUsername: string;
  jobs: JobSeedData[];
}

interface JobSeedData {
  title: string;
  slug: string;
  description: string;
  requirements: string[];
  responsibilities: string[];
  niceToHave: string[];
  jobType: JobType;
  workLocation: WorkLocation;
  experienceLevel: ExperienceLevel;
  salaryMin: number;
  salaryMax: number;
  salaryCurrency: string;
  location: string;
  requiredModels: string[]; // model slugs
  requiredSkills: string[];
}

const companies: CompanySeedData[] = [
  {
    name: 'AI Innovations Lab',
    slug: 'ai-innovations-lab',
    description: 'Building the future of AI-powered enterprise software. We help Fortune 500 companies integrate LLMs into their workflows.',
    about: `AI Innovations Lab is a rapidly growing startup focused on enterprise AI solutions. Founded in 2022, we've helped over 50 companies successfully deploy LLM-powered applications at scale.

## Our Mission
Make enterprise AI accessible, reliable, and impactful. We believe every company should harness the power of LLMs while maintaining security, compliance, and control.

## Our Culture
- **Remote-first**: Work from anywhere
- **Learning-focused**: $5,000/year education budget
- **Impact-driven**: Your work affects millions of users
- **Collaborative**: Weekly team knowledge sharing
- **Transparent**: Open books, shared equity

## Our Tech
We work with cutting-edge LLM technology including GPT-4, Claude, and open-source models. Our stack includes Python, TypeScript, React, and modern cloud infrastructure.`,
    industry: 'AI/ML',
    companySize: 'small',
    foundedYear: 2022,
    location: 'San Francisco, CA (Remote)',
    website: 'https://aiinnovationslab.ai',
    benefits: [
      'Competitive salary + equity',
      'Full health, dental, vision insurance',
      '$5,000 annual learning budget',
      'Unlimited PTO (minimum 4 weeks)',
      'Remote-first culture',
      'Latest hardware (MacBook Pro M3, monitors)',
      'Co-working space stipend ($500/mo)',
      'Home office setup ($3,000 one-time)',
      'Team retreats (2x per year)',
    ],
    techStack: [
      'Python', 'TypeScript', 'React', 'FastAPI', 'PostgreSQL', 'Redis',
      'LangChain', 'OpenAI API', 'Anthropic API', 'AWS', 'Docker', 'Kubernetes'
    ],
    ownerUsername: 'maya_enterprise',
    jobs: [
      {
        title: 'Senior LLM Engineer',
        slug: 'senior-llm-engineer',
        description: `Join our core AI team building production-grade LLM applications for enterprise customers. You'll work on challenging problems like RAG systems, fine-tuning, prompt optimization, and scaling LLM applications.

## What You'll Do
- Design and implement RAG systems processing millions of documents
- Build fine-tuning pipelines for customer-specific models
- Optimize prompts and LLM workflows for cost and quality
- Collaborate with customers on complex AI integrations
- Contribute to our open-source tools and libraries

## The Impact
Your work will power AI applications used by millions of end users at Fortune 500 companies. You'll tackle unique challenges at the intersection of cutting-edge AI and production systems.`,
        requirements: [
          '5+ years software engineering experience',
          'Deep experience with LLMs (GPT-4, Claude, Llama, etc.)',
          'Production experience with RAG or similar systems',
          'Strong Python skills',
          'Experience with prompt engineering',
          'Understanding of embeddings and vector databases',
        ],
        responsibilities: [
          'Design and implement LLM-powered features',
          'Build and maintain RAG pipelines',
          'Optimize model performance and costs',
          'Collaborate with customers on integrations',
          'Mentor junior engineers',
          'Contribute to architecture decisions',
        ],
        niceToHave: [
          'Experience fine-tuning models',
          'ML/AI background or education',
          'Open-source contributions',
          'Experience with LangChain or similar frameworks',
          'Previous startup experience',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'senior',
        salaryMin: 160000,
        salaryMax: 220000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-4', 'claude-3-5-sonnet'],
        requiredSkills: ['Python', 'RAG', 'Prompt Engineering', 'Vector Databases', 'LangChain'],
      },
      {
        title: 'AI Product Manager',
        slug: 'ai-product-manager',
        description: `Lead product strategy for our enterprise AI platform. You'll define what we build, work closely with customers, and shape the future of enterprise LLM applications.

## What You'll Do
- Define product roadmap based on customer needs and market trends
- Work with engineering to design AI features
- Conduct user research and gather feedback
- Own product metrics and success criteria
- Collaborate with sales on customer requirements
- Create product documentation and specs

## The Opportunity
Shape how enterprises use LLMs. Be at the forefront of the AI revolution in a role that combines technical depth with product vision.`,
        requirements: [
          '4+ years product management experience',
          'Deep understanding of LLMs and AI capabilities',
          'Experience with B2B/enterprise products',
          'Technical background (can read code)',
          'Strong communication skills',
          'Data-driven decision making',
        ],
        responsibilities: [
          'Own product roadmap and vision',
          'Define features and requirements',
          'Work with customers on feedback',
          'Collaborate with engineering',
          'Analyze product metrics',
          'Present to stakeholders',
        ],
        niceToHave: [
          'AI/ML technical background',
          'Experience at AI company',
          'Enterprise SaaS experience',
          'Engineering or data science background',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        salaryMin: 140000,
        salaryMax: 180000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-4', 'claude-3-5-sonnet'],
        requiredSkills: ['Product Management', 'LLM Knowledge', 'Enterprise Software', 'B2B'],
      },
      {
        title: 'Machine Learning Engineer - Fine-tuning',
        slug: 'ml-engineer-fine-tuning',
        description: `Join our ML team focused on model customization and fine-tuning. Help customers create specialized models that outperform general-purpose LLMs for their specific use cases.

## What You'll Do
- Design fine-tuning strategies for customer datasets
- Build training pipelines and infrastructure
- Evaluate model performance and quality
- Research new fine-tuning techniques
- Optimize training costs and speed
- Create tools for dataset preparation

## The Challenge
Work on the cutting edge of LLM customization. Every project is unique and requires creative problem-solving.`,
        requirements: [
          '3+ years ML/AI experience',
          'Experience fine-tuning language models',
          'Strong Python and PyTorch/TensorFlow',
          'Understanding of transformer architectures',
          'Experience with distributed training',
          'Solid statistics and ML fundamentals',
        ],
        responsibilities: [
          'Fine-tune models for customers',
          'Build training infrastructure',
          'Evaluate and benchmark models',
          'Research fine-tuning techniques',
          'Create tooling and automation',
          'Document best practices',
        ],
        niceToHave: [
          'PhD or MS in ML/CS',
          'Published research papers',
          'Experience with RLHF',
          'Open-source contributions',
          'Experience with Hugging Face ecosystem',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-3-5-turbo', 'llama-3-2-70b'],
        requiredSkills: ['Machine Learning', 'Fine-tuning', 'Python', 'PyTorch', 'Transformers'],
      },
    ],
  },
  {
    name: 'DataSense Analytics',
    slug: 'datasense-analytics',
    description: 'Enterprise data analytics platform powered by AI. We help companies extract insights from their data using natural language.',
    about: `DataSense Analytics is transforming how businesses interact with their data. Our platform uses LLMs to let anyone ask questions in natural language and get instant, accurate answers.

## What We Do
We've built an AI-powered analytics platform that connects to your data warehouse and lets you ask questions like "What were our top products last quarter?" and get instant SQL queries, visualizations, and insights.

## Our Customers
Over 200 companies use DataSense, from startups to Fortune 100. We process over 1 billion data points daily and answer 50,000+ natural language queries.

## Why Join Us
- Series B funded ($30M raised)
- Proven product-market fit
- Growing 200% YoY
- Collaborative, diverse team
- Work on real user problems`,
    industry: 'Data Analytics',
    companySize: 'medium',
    foundedYear: 2021,
    location: 'New York, NY',
    website: 'https://datasense.ai',
    benefits: [
      'Competitive salary + equity',
      'Premium health benefits',
      'Unlimited PTO',
      'Hybrid work (3 days office)',
      'Learning & development budget',
      '401k with 4% match',
      'Gym membership',
      'Catered lunches',
    ],
    techStack: [
      'Python', 'TypeScript', 'React', 'Node.js', 'PostgreSQL', 'Snowflake',
      'GPT-4', 'LangChain', 'dbt', 'Airflow', 'AWS', 'Terraform'
    ],
    ownerUsername: 'kevin_data',
    jobs: [
      {
        title: 'Senior Full-Stack Engineer (AI Features)',
        slug: 'senior-fullstack-engineer-ai',
        description: `Build the frontend and backend for our AI-powered analytics platform. You'll work on features like natural language query interface, AI-generated visualizations, and real-time data exploration.

## What You'll Build
- Natural language query interface
- AI-powered data visualization recommendations
- Real-time collaboration features
- Dashboard builder with AI suggestions
- SQL generation and validation

## The Stack
- Frontend: React, TypeScript, TanStack Query, Tailwind
- Backend: Node.js, Python, FastAPI
- AI: GPT-4, LangChain, custom prompts
- Data: PostgreSQL, Snowflake, dbt`,
        requirements: [
          '5+ years full-stack development',
          'Expert in React and TypeScript',
          'Strong backend skills (Node.js or Python)',
          'Experience with data visualization',
          'SQL knowledge',
          'API design experience',
        ],
        responsibilities: [
          'Build AI-powered features end-to-end',
          'Design and implement APIs',
          'Optimize query performance',
          'Collaborate with data team',
          'Code review and mentoring',
          'Contribute to architecture',
        ],
        niceToHave: [
          'Experience with LLMs',
          'Data analytics background',
          'Experience with data visualization libraries (D3, Plotly)',
          'SQL optimization skills',
        ],
        jobType: 'full_time',
        workLocation: 'hybrid',
        experienceLevel: 'senior',
        salaryMin: 150000,
        salaryMax: 200000,
        salaryCurrency: 'USD',
        location: 'New York, NY',
        requiredModels: ['gpt-4'],
        requiredSkills: ['React', 'TypeScript', 'Node.js', 'Python', 'SQL', 'Data Visualization'],
      },
      {
        title: 'AI/ML Engineer - NLP',
        slug: 'ai-ml-engineer-nlp',
        description: `Focus on NLP and LLM integration for our data analytics platform. Build systems that understand natural language questions and convert them to accurate SQL queries.

## Key Projects
- Text-to-SQL generation
- Query intent classification
- Ambiguity detection and clarification
- Context management for conversations
- Query result summarization

## The Challenge
Make data accessible to everyone through natural language. Handle ambiguous queries, complex joins, and maintain conversation context.`,
        requirements: [
          '3+ years NLP/ML experience',
          'Strong Python skills',
          'Experience with LLMs',
          'Deep SQL knowledge',
          'Understanding of data modeling',
        ],
        responsibilities: [
          'Build text-to-SQL systems',
          'Improve query accuracy',
          'Handle edge cases',
          'Optimize prompt engineering',
          'Evaluate model performance',
        ],
        niceToHave: [
          'Experience with semantic parsing',
          'Database internals knowledge',
          'Published NLP research',
          'Experience with data warehouses',
        ],
        jobType: 'full_time',
        workLocation: 'hybrid',
        experienceLevel: 'mid',
        salaryMin: 140000,
        salaryMax: 180000,
        salaryCurrency: 'USD',
        location: 'New York, NY',
        requiredModels: ['gpt-4', 'gpt-3-5-turbo'],
        requiredSkills: ['NLP', 'Machine Learning', 'Python', 'SQL', 'LLM Integration'],
      },
    ],
  },
  {
    name: 'CodeCraft AI',
    slug: 'codecraft-ai',
    description: 'AI-powered developer tools that make coding 10x faster. From code generation to review to documentation.',
    about: `CodeCraft AI builds tools that amplify developer productivity. Our flagship product is an AI code assistant that integrates with your IDE and helps with code generation, review, debugging, and documentation.

## Our Products
- **CodeCraft IDE Extension**: AI code completion and generation
- **CodeReview AI**: Automated code review with security scanning
- **DocGen**: Automatic documentation generation
- **DebugHelper**: AI-powered debugging assistant

## Growth
- 50,000+ active developers
- Used at 500+ companies
- Seed funded ($5M)
- Team of 15 (growing to 30)

## Culture
Small, focused team where everyone has impact. We move fast, ship often, and learn from users. Remote-friendly with optional office in Seattle.`,
    industry: 'Developer Tools',
    companySize: 'startup',
    foundedYear: 2023,
    location: 'Seattle, WA',
    website: 'https://codecraft.ai',
    benefits: [
      'Competitive salary + meaningful equity',
      'Health, dental, vision',
      'Flexible PTO',
      'Remote or hybrid',
      'Latest dev tools and hardware',
      'Conference budget',
      'Team offsites',
    ],
    techStack: [
      'TypeScript', 'Python', 'React', 'Electron', 'VSCode API',
      'GPT-4', 'Claude', 'FastAPI', 'PostgreSQL', 'Supabase', 'Vercel'
    ],
    ownerUsername: 'thomas_oss',
    jobs: [
      {
        title: 'Founding Engineer - IDE Extensions',
        slug: 'founding-engineer-ide',
        description: `Join as an early engineer building our IDE extensions (VSCode, IntelliJ, etc.). You'll own the entire extension experience and shape how developers interact with AI.

## What You'll Build
- Code completion engine
- Context gathering system
- Code analysis and suggestions
- Integration with version control
- Performance optimization

## The Opportunity
Ground floor of a rocket ship. Own large parts of the product and directly impact thousands of developers. Your code will run in IDEs everywhere.`,
        requirements: [
          '3+ years software engineering',
          'Experience with IDE extensions or dev tools',
          'Strong TypeScript skills',
          'Understanding of language servers and AST',
          'Product mindset',
        ],
        responsibilities: [
          'Build and own IDE extensions',
          'Design AI integration features',
          'Optimize performance',
          'Gather user feedback',
          'Iterate rapidly on features',
        ],
        niceToHave: [
          'Experience with VSCode extension API',
          'Understanding of compilers/parsers',
          'Open-source contributions',
          'Previous startup experience',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        salaryMin: 130000,
        salaryMax: 170000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-4', 'claude-3-5-sonnet'],
        requiredSkills: ['TypeScript', 'IDE Extensions', 'VSCode API', 'Developer Tools'],
      },
      {
        title: 'LLM Prompt Engineer',
        slug: 'llm-prompt-engineer',
        description: `Own the prompts that power our AI code assistant. You'll craft prompts for code generation, review, debugging, and documentation - used by 50,000+ developers.

## What You'll Do
- Design prompts for various coding tasks
- A/B test different prompt strategies
- Analyze failure cases and improve
- Build prompt testing infrastructure
- Document best practices

## The Impact
Your prompts directly affect developer productivity. Small improvements scale to millions of code generations.`,
        requirements: [
          '2+ years working with LLMs',
          'Strong prompt engineering skills',
          'Programming background (any language)',
          'Analytical mindset',
          'Excellent communication',
        ],
        responsibilities: [
          'Design and optimize prompts',
          'Test and evaluate prompt quality',
          'Analyze user feedback',
          'Build prompt versioning system',
          'Train team on best practices',
        ],
        niceToHave: [
          'Software engineering background',
          'Experience with code generation',
          'Data analysis skills',
          'Technical writing experience',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        salaryMin: 110000,
        salaryMax: 150000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-4', 'claude-3-5-sonnet', 'codellama-70b'],
        requiredSkills: ['Prompt Engineering', 'LLMs', 'Code Generation', 'Testing', 'Analytics'],
      },
      {
        title: 'Developer Advocate',
        slug: 'developer-advocate',
        description: `Be the voice of CodeCraft AI in the developer community. Create content, speak at conferences, build demos, and gather feedback from users.

## What You'll Do
- Create tutorials and documentation
- Build demo projects and examples
- Speak at conferences and meetups
- Engage with community on social media
- Gather user feedback and feature requests
- Advocate internally for user needs

## The Role
Bridge between users and product team. Help developers get the most out of our tools while bringing their insights back to shape our roadmap.`,
        requirements: [
          '3+ years as a developer',
          'Strong communication skills',
          'Public speaking experience',
          'Technical writing ability',
          'Social media presence',
        ],
        responsibilities: [
          'Create technical content',
          'Speak at events',
          'Engage with community',
          'Gather user feedback',
          'Build demo projects',
          'Support users',
        ],
        niceToHave: [
          'Experience with AI/LLMs',
          'YouTube or blog presence',
          'Open-source maintainer',
          'Previous DevRel experience',
        ],
        jobType: 'full_time',
        workLocation: 'remote',
        experienceLevel: 'mid',
        salaryMin: 120000,
        salaryMax: 160000,
        salaryCurrency: 'USD',
        location: 'Remote (US)',
        requiredModels: ['gpt-4'],
        requiredSkills: ['Developer Relations', 'Technical Writing', 'Public Speaking', 'Community'],
      },
    ],
  },
];

export async function seedCompaniesAndJobs(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding companies and jobs...');

  let companiesCreated = 0;
  let jobsCreated = 0;

  for (const companyData of companies) {
    try {
      // Get owner user
      const owner = await prisma.user.findFirst({
        where: { username: companyData.ownerUsername },
      });

      if (!owner) {
        console.log(`⚠️  User ${companyData.ownerUsername} not found, skipping company`);
        continue;
      }

      // Create or update company
      const existingCompany = await prisma.company.findFirst({
        where: { slug: companyData.slug },
      });

      let company;
      if (existingCompany) {
        company = await prisma.company.update({
          where: { id: existingCompany.id },
          data: {
            name: companyData.name,
            description: companyData.description,
            about: companyData.about,
            industry: companyData.industry,
            companySize: companyData.companySize,
            foundedYear: companyData.foundedYear,
            location: companyData.location,
            website: companyData.website,
            benefits: companyData.benefits,
            techStack: companyData.techStack,
          },
        });
        console.log(`  ✅ Updated company: ${companyData.name}`);
      } else {
        company = await prisma.company.create({
          data: {
            name: companyData.name,
            slug: companyData.slug,
            description: companyData.description,
            about: companyData.about,
            industry: companyData.industry,
            companySize: companyData.companySize,
            foundedYear: companyData.foundedYear,
            location: companyData.location,
            website: companyData.website,
            benefits: companyData.benefits,
            techStack: companyData.techStack,
            ownerId: owner.id,
            isVerified: true,
          },
        });
        companiesCreated++;
        console.log(`  ✅ Created company: ${companyData.name}`);
      }

      // Create jobs for this company
      for (const jobData of companyData.jobs) {
        const existingJob = await prisma.job.findFirst({
          where: { slug: jobData.slug, companyId: company.id },
        });

        let job;
        if (existingJob) {
          job = await prisma.job.update({
            where: { id: existingJob.id },
            data: {
              title: jobData.title,
              description: jobData.description,
              requirements: jobData.requirements,
              responsibilities: jobData.responsibilities,
              niceToHave: jobData.niceToHave,
              jobType: jobData.jobType,
              workLocation: jobData.workLocation,
              experienceLevel: jobData.experienceLevel,
              salaryMin: jobData.salaryMin,
              salaryMax: jobData.salaryMax,
              salaryCurrency: jobData.salaryCurrency,
              location: jobData.location,
              requiredSkills: jobData.requiredSkills,
              status: 'active',
            },
          });
          console.log(`    ↳ Updated job: ${jobData.title}`);
        } else {
          job = await prisma.job.create({
            data: {
              title: jobData.title,
              slug: jobData.slug,
              description: jobData.description,
              requirements: jobData.requirements,
              responsibilities: jobData.responsibilities,
              niceToHave: jobData.niceToHave,
              jobType: jobData.jobType,
              workLocation: jobData.workLocation,
              experienceLevel: jobData.experienceLevel,
              salaryMin: jobData.salaryMin,
              salaryMax: jobData.salaryMax,
              salaryCurrency: jobData.salaryCurrency,
              location: jobData.location,
              requiredSkills: jobData.requiredSkills,
              companyId: company.id,
              status: 'active',
              viewCount: Math.floor(Math.random() * 500) + 50,
            },
          });
          jobsCreated++;
          console.log(`    ↳ Created job: ${jobData.title}`);
        }

        // Link required models
        for (const modelSlug of jobData.requiredModels) {
          const model = await prisma.lLMModel.findUnique({
            where: { slug: modelSlug },
          });

          if (model) {
            await prisma.jobModel.upsert({
              where: {
                jobId_modelId: {
                  jobId: job.id,
                  modelId: model.id,
                },
              },
              update: {},
              create: {
                jobId: job.id,
                modelId: model.id,
              },
            });
          }
        }
      }
    } catch (error) {
      console.error(`❌ Error processing company ${companyData.name}:`, error);
    }
  }

  console.log('\n✅ Companies and jobs seeding complete!');
  console.log(`   Companies created: ${companiesCreated}`);
  console.log(`   Jobs created: ${jobsCreated}`);
}

export default seedCompaniesAndJobs;
