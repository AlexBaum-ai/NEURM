import { PrismaClient, Company, Prisma } from '@prisma/client';
import prisma from '@/config/database';
import { slugify } from '@/utils/slugify';

export class CompanyRepository {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = prisma;
  }

  /**
   * Find company by ID with optional relations
   */
  async findById(
    id: string,
    includeRelations = false
  ): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { id },
      include: includeRelations
        ? {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
            jobs: {
              where: { status: 'active' },
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                workLocation: true,
                salaryMin: true,
                salaryMax: true,
                salaryCurrency: true,
                experienceLevel: true,
                publishedAt: true,
              },
              orderBy: { publishedAt: 'desc' },
            },
            _count: {
              select: {
                jobs: true,
                follows: true,
              },
            },
          }
        : undefined,
    });
  }

  /**
   * Find company by slug
   */
  async findBySlug(
    slug: string,
    includeRelations = false
  ): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { slug },
      include: includeRelations
        ? {
            owner: {
              select: {
                id: true,
                username: true,
                email: true,
                role: true,
              },
            },
            jobs: {
              where: { status: 'active' },
              select: {
                id: true,
                title: true,
                slug: true,
                location: true,
                workLocation: true,
                salaryMin: true,
                salaryMax: true,
                salaryCurrency: true,
                experienceLevel: true,
                publishedAt: true,
              },
              orderBy: { publishedAt: 'desc' },
            },
            _count: {
              select: {
                jobs: true,
                follows: true,
              },
            },
          }
        : undefined,
    });
  }

  /**
   * Find company by owner user ID
   */
  async findByOwnerId(ownerUserId: string): Promise<Company | null> {
    return this.prisma.company.findUnique({
      where: { ownerUserId },
    });
  }

  /**
   * Create a new company with auto-generated slug
   */
  async create(data: Prisma.CompanyCreateInput): Promise<Company> {
    // Generate slug from company name
    let slug = slugify(data.name);
    let slugSuffix = 1;

    // Ensure slug uniqueness
    while (await this.prisma.company.findUnique({ where: { slug } })) {
      slug = `${slugify(data.name)}-${slugSuffix}`;
      slugSuffix++;
    }

    return this.prisma.company.create({
      data: {
        ...data,
        slug,
      },
    });
  }

  /**
   * Update company profile
   */
  async update(
    id: string,
    data: Prisma.CompanyUpdateInput
  ): Promise<Company> {
    // If name is being updated, regenerate slug
    if (data.name && typeof data.name === 'string') {
      let slug = slugify(data.name);
      let slugSuffix = 1;

      // Ensure slug uniqueness (excluding current company)
      while (
        await this.prisma.company.findFirst({
          where: { slug, NOT: { id } },
        })
      ) {
        slug = `${slugify(data.name)}-${slugSuffix}`;
        slugSuffix++;
      }

      data.slug = slug;
    }

    return this.prisma.company.update({
      where: { id },
      data,
    });
  }

  /**
   * Delete company
   */
  async delete(id: string): Promise<Company> {
    return this.prisma.company.delete({
      where: { id },
    });
  }

  /**
   * Get company's active jobs
   */
  async getCompanyJobs(companyId: string, includeDetails = false) {
    return this.prisma.job.findMany({
      where: {
        companyId,
        status: 'active',
      },
      select: {
        id: true,
        title: true,
        slug: true,
        description: includeDetails,
        requirements: includeDetails,
        jobType: true,
        workLocation: true,
        experienceLevel: true,
        location: true,
        salaryMin: true,
        salaryMax: true,
        salaryCurrency: true,
        salaryIsPublic: true,
        hasVisaSponsorship: true,
        primaryLlms: includeDetails,
        frameworks: includeDetails,
        vectorDatabases: includeDetails,
        infrastructure: includeDetails,
        programmingLanguages: includeDetails,
        publishedAt: true,
        viewCount: includeDetails,
        applicationCount: includeDetails,
        createdAt: true,
      },
      orderBy: { publishedAt: 'desc' },
    });
  }

  /**
   * Increment view count
   */
  async incrementViewCount(id: string): Promise<void> {
    await this.prisma.company.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });
  }

  /**
   * Check if user follows company
   */
  async isUserFollowing(
    companyId: string,
    userId: string
  ): Promise<boolean> {
    const follow = await this.prisma.companyFollow.findUnique({
      where: {
        companyId_userId: {
          companyId,
          userId,
        },
      },
    });
    return !!follow;
  }

  /**
   * Follow company
   */
  async followCompany(companyId: string, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.companyFollow.create({
        data: {
          companyId,
          userId,
        },
      }),
      this.prisma.company.update({
        where: { id: companyId },
        data: { followerCount: { increment: 1 } },
      }),
    ]);
  }

  /**
   * Unfollow company
   */
  async unfollowCompany(companyId: string, userId: string): Promise<void> {
    await this.prisma.$transaction([
      this.prisma.companyFollow.delete({
        where: {
          companyId_userId: {
            companyId,
            userId,
          },
        },
      }),
      this.prisma.company.update({
        where: { id: companyId },
        data: { followerCount: { decrement: 1 } },
      }),
    ]);
  }

  /**
   * List companies with pagination and filters
   */
  async list(params: {
    skip?: number;
    take?: number;
    where?: Prisma.CompanyWhereInput;
    orderBy?: Prisma.CompanyOrderByWithRelationInput;
  }) {
    const { skip = 0, take = 20, where, orderBy } = params;

    const [companies, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        skip,
        take,
        where,
        orderBy,
        include: {
          _count: {
            select: {
              jobs: true,
              follows: true,
            },
          },
        },
      }),
      this.prisma.company.count({ where }),
    ]);

    return {
      companies,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }
}

export default new CompanyRepository();
