import { PrismaClient, UserRole, UserStatus, AccountType, AvailabilityStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';

/**
 * Seed User Accounts
 *
 * Creates:
 * - 1 Admin account
 * - 2 Moderators
 * - 10 Test users with various roles and complete profiles
 */

interface UserSeedData {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  accountType: AccountType;
  profile: {
    displayName: string;
    headline: string;
    bio: string;
    location?: string;
    website?: string;
    availabilityStatus?: AvailabilityStatus;
    yearsExperience?: number;
  };
  skills?: Array<{
    skillName: string;
    skillType: string;
    proficiency: number;
  }>;
}

const users: UserSeedData[] = [
  // Admin Account
  {
    email: 'admin@neurmatic.com',
    username: 'admin',
    password: 'AdminPassword123!',
    role: 'admin',
    accountType: 'individual',
    profile: {
      displayName: 'Platform Admin',
      headline: 'Neurmatic Platform Administrator',
      bio: 'Managing and maintaining the Neurmatic platform for the LLM community.',
      location: 'Amsterdam, Netherlands',
    },
  },

  // Moderator Accounts
  {
    email: 'mod.alex@neurmatic.com',
    username: 'mod_alex',
    password: 'ModPassword123!',
    role: 'moderator',
    accountType: 'individual',
    profile: {
      displayName: 'Alex Chen',
      headline: 'Community Moderator & ML Engineer',
      bio: 'ML Engineer specializing in LLM applications. Helping maintain a healthy and productive community.',
      location: 'San Francisco, CA',
      website: 'https://alexchen.dev',
      yearsExperience: 5,
    },
    skills: [
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 5 },
      { skillName: 'Python', skillType: 'programming', proficiency: 5 },
      { skillName: 'LangChain', skillType: 'framework', proficiency: 4 },
    ],
  },
  {
    email: 'mod.sarah@neurmatic.com',
    username: 'mod_sarah',
    password: 'ModPassword123!',
    role: 'moderator',
    accountType: 'individual',
    profile: {
      displayName: 'Sarah Martinez',
      headline: 'Forum Moderator & AI Researcher',
      bio: 'PhD researcher in NLP and LLMs. Passionate about fostering knowledge sharing in the AI community.',
      location: 'London, UK',
      website: 'https://sarahmartinez.ai',
      yearsExperience: 7,
    },
    skills: [
      { skillName: 'Fine-tuning', skillType: 'fine_tuning', proficiency: 5 },
      { skillName: 'RAG Systems', skillType: 'rag', proficiency: 4 },
      { skillName: 'Research', skillType: 'research', proficiency: 5 },
    ],
  },

  // Test Users - Various roles and profiles
  {
    email: 'john.developer@example.com',
    username: 'johndeveloper',
    password: 'UserPassword123!',
    role: 'premium',
    accountType: 'individual',
    profile: {
      displayName: 'John Smith',
      headline: 'Senior Full-Stack Developer | LLM Integration Specialist',
      bio: 'Passionate about building production-ready LLM applications. 8+ years in web development, currently focused on integrating GPT-4 and Claude into enterprise SaaS products.',
      location: 'Austin, TX',
      website: 'https://johnsmith.dev',
      availabilityStatus: 'open',
      yearsExperience: 8,
    },
    skills: [
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 4 },
      { skillName: 'API Integration', skillType: 'development', proficiency: 5 },
      { skillName: 'TypeScript', skillType: 'programming', proficiency: 5 },
      { skillName: 'Vector Databases', skillType: 'infrastructure', proficiency: 3 },
    ],
  },
  {
    email: 'emily.researcher@example.com',
    username: 'emily_ai',
    password: 'UserPassword123!',
    role: 'premium',
    accountType: 'individual',
    profile: {
      displayName: 'Dr. Emily Johnson',
      headline: 'AI Research Scientist | NLP & LLM Specialist',
      bio: 'Research scientist working on improving LLM reasoning capabilities. Published papers on chain-of-thought prompting and model interpretability.',
      location: 'Boston, MA',
      website: 'https://emilyjohnson.research',
      availabilityStatus: 'not_looking',
      yearsExperience: 6,
    },
    skills: [
      { skillName: 'Research', skillType: 'research', proficiency: 5 },
      { skillName: 'Fine-tuning', skillType: 'fine_tuning', proficiency: 5 },
      { skillName: 'Model Evaluation', skillType: 'evaluation', proficiency: 5 },
      { skillName: 'Python', skillType: 'programming', proficiency: 5 },
    ],
  },
  {
    email: 'marcus.engineer@example.com',
    username: 'marcus_ml',
    password: 'UserPassword123!',
    role: 'user',
    accountType: 'individual',
    profile: {
      displayName: 'Marcus Williams',
      headline: 'Machine Learning Engineer building RAG systems',
      bio: 'ML Engineer specializing in retrieval-augmented generation. Love experimenting with different vector databases and embedding models.',
      location: 'Seattle, WA',
      availabilityStatus: 'actively_looking',
      yearsExperience: 4,
    },
    skills: [
      { skillName: 'RAG Systems', skillType: 'rag', proficiency: 4 },
      { skillName: 'Embeddings', skillType: 'embeddings', proficiency: 4 },
      { skillName: 'Python', skillType: 'programming', proficiency: 4 },
      { skillName: 'Pinecone', skillType: 'vector_db', proficiency: 4 },
    ],
  },
  {
    email: 'lisa.startup@example.com',
    username: 'lisafounder',
    password: 'UserPassword123!',
    role: 'user',
    accountType: 'individual',
    profile: {
      displayName: 'Lisa Chen',
      headline: 'AI Startup Founder | Product Leader',
      bio: 'Building an AI-powered customer support platform. Always looking to learn from the community and share our experiences.',
      location: 'San Francisco, CA',
      website: 'https://mystartup.ai',
      availabilityStatus: 'not_looking',
      yearsExperience: 10,
    },
    skills: [
      { skillName: 'Product Management', skillType: 'product', proficiency: 5 },
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 4 },
      { skillName: 'LLM APIs', skillType: 'api', proficiency: 4 },
    ],
  },
  {
    email: 'raj.beginner@example.com',
    username: 'raj_learning',
    password: 'UserPassword123!',
    role: 'user',
    accountType: 'individual',
    profile: {
      displayName: 'Raj Patel',
      headline: 'Junior Developer learning LLMs',
      bio: 'Recent CS graduate diving into the world of LLMs. Excited to learn from this amazing community!',
      location: 'Mumbai, India',
      availabilityStatus: 'actively_looking',
      yearsExperience: 1,
    },
    skills: [
      { skillName: 'Python', skillType: 'programming', proficiency: 3 },
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 2 },
    ],
  },
  {
    email: 'anna.consultant@example.com',
    username: 'anna_llm',
    password: 'UserPassword123!',
    role: 'premium',
    accountType: 'individual',
    profile: {
      displayName: 'Anna Kowalski',
      headline: 'AI Consultant | Helping businesses adopt LLMs',
      bio: 'Independent consultant helping companies integrate LLMs into their workflows. Specializing in cost optimization and prompt engineering.',
      location: 'Berlin, Germany',
      website: 'https://annakowalski.consulting',
      availabilityStatus: 'open',
      yearsExperience: 5,
    },
    skills: [
      { skillName: 'Consulting', skillType: 'consulting', proficiency: 5 },
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 5 },
      { skillName: 'Cost Optimization', skillType: 'optimization', proficiency: 4 },
    ],
  },
  {
    email: 'kevin.data@example.com',
    username: 'kevin_data',
    password: 'UserPassword123!',
    role: 'user',
    accountType: 'individual',
    profile: {
      displayName: 'Kevin Nguyen',
      headline: 'Data Scientist using LLMs for analytics',
      bio: 'Data scientist leveraging LLMs to extract insights from unstructured data. Exploring the intersection of traditional ML and LLMs.',
      location: 'Toronto, Canada',
      availabilityStatus: 'not_looking',
      yearsExperience: 6,
    },
    skills: [
      { skillName: 'Data Science', skillType: 'data_science', proficiency: 5 },
      { skillName: 'LLM APIs', skillType: 'api', proficiency: 3 },
      { skillName: 'Python', skillType: 'programming', proficiency: 5 },
    ],
  },
  {
    email: 'sofia.designer@example.com',
    username: 'sofia_ux',
    password: 'UserPassword123!',
    role: 'user',
    accountType: 'individual',
    profile: {
      displayName: 'Sofia Rodriguez',
      headline: 'UX Designer for AI Products',
      bio: 'Designing intuitive interfaces for LLM-powered applications. Passionate about making AI accessible to everyone.',
      location: 'Barcelona, Spain',
      website: 'https://sofiarodriguez.design',
      availabilityStatus: 'open',
      yearsExperience: 4,
    },
    skills: [
      { skillName: 'UX Design', skillType: 'design', proficiency: 5 },
      { skillName: 'Prompt Engineering', skillType: 'prompt_engineering', proficiency: 3 },
      { skillName: 'Product Design', skillType: 'design', proficiency: 4 },
    ],
  },
  {
    email: 'thomas.opensource@example.com',
    username: 'thomas_oss',
    password: 'UserPassword123!',
    role: 'premium',
    accountType: 'individual',
    profile: {
      displayName: 'Thomas Anderson',
      headline: 'Open Source Maintainer | LLaMA & Mistral enthusiast',
      bio: 'Maintaining popular open-source tools for LLM deployment. Big fan of open-source models and self-hosting.',
      location: 'Portland, OR',
      website: 'https://github.com/thomasoss',
      availabilityStatus: 'not_looking',
      yearsExperience: 7,
    },
    skills: [
      { skillName: 'Open Source', skillType: 'open_source', proficiency: 5 },
      { skillName: 'Model Deployment', skillType: 'deployment', proficiency: 5 },
      { skillName: 'DevOps', skillType: 'devops', proficiency: 4 },
      { skillName: 'Self-hosting', skillType: 'infrastructure', proficiency: 5 },
    ],
  },
  {
    email: 'maya.enterprise@example.com',
    username: 'maya_enterprise',
    password: 'UserPassword123!',
    role: 'premium',
    accountType: 'individual',
    profile: {
      displayName: 'Maya Patel',
      headline: 'Enterprise AI Architect | Fortune 500 Implementations',
      bio: 'Leading LLM implementations at scale for Fortune 500 companies. Focused on security, compliance, and production-grade deployments.',
      location: 'New York, NY',
      availabilityStatus: 'not_looking',
      yearsExperience: 12,
    },
    skills: [
      { skillName: 'Enterprise Architecture', skillType: 'architecture', proficiency: 5 },
      { skillName: 'Security', skillType: 'security', proficiency: 5 },
      { skillName: 'Scalability', skillType: 'scalability', proficiency: 5 },
      { skillName: 'Compliance', skillType: 'compliance', proficiency: 4 },
    ],
  },
];

export async function seedUsers(prisma: PrismaClient): Promise<void> {
  console.log('🌱 Seeding user accounts...');

  let createdCount = 0;
  let updatedCount = 0;

  for (const userData of users) {
    try {
      // Hash password
      const hashedPassword = await bcrypt.hash(userData.password, 12);

      // Check if user exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      let user;
      if (existingUser) {
        // Update existing user
        user = await prisma.user.update({
          where: { email: userData.email },
          data: {
            username: userData.username,
            passwordHash: hashedPassword,
            role: userData.role,
            accountType: userData.accountType,
            emailVerified: true,
            status: 'active',
          },
        });
        updatedCount++;
        console.log(`  ✅ Updated user: ${userData.username} (${userData.role})`);
      } else {
        // Create new user
        user = await prisma.user.create({
          data: {
            email: userData.email,
            username: userData.username,
            passwordHash: hashedPassword,
            role: userData.role,
            accountType: userData.accountType,
            emailVerified: true,
            status: 'active',
          },
        });
        createdCount++;
        console.log(`  ✅ Created user: ${userData.username} (${userData.role})`);
      }

      // Create or update profile
      await prisma.profile.upsert({
        where: { userId: user.id },
        update: userData.profile,
        create: {
          userId: user.id,
          ...userData.profile,
        },
      });

      // Create skills if provided
      if (userData.skills && userData.skills.length > 0) {
        for (const skill of userData.skills) {
          await prisma.userSkill.upsert({
            where: {
              userId_skillName: {
                userId: user.id,
                skillName: skill.skillName,
              },
            },
            update: {
              skillType: skill.skillType,
              proficiency: skill.proficiency,
            },
            create: {
              userId: user.id,
              skillName: skill.skillName,
              skillType: skill.skillType,
              proficiency: skill.proficiency,
            },
          });
        }
        console.log(`    ↳ Added ${userData.skills.length} skills`);
      }

      // Initialize reputation for forum users
      await prisma.userReputation.upsert({
        where: { userId: user.id },
        update: {},
        create: {
          userId: user.id,
          totalPoints: 0,
          level: 'newcomer',
        },
      });
    } catch (error) {
      console.error(`❌ Error processing user ${userData.username}:`, error);
    }
  }

  console.log('\n✅ User accounts seeding complete!');
  console.log(`   Created: ${createdCount}`);
  console.log(`   Updated: ${updatedCount}`);
  console.log('\nDefault Login Credentials:');
  console.log('   Admin: admin@neurmatic.com / AdminPassword123!');
  console.log('   Moderator 1: mod.alex@neurmatic.com / ModPassword123!');
  console.log('   Moderator 2: mod.sarah@neurmatic.com / ModPassword123!');
  console.log('   Test Users: Use email with password UserPassword123!');
}

export default seedUsers;
