import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SEOController } from './seo.controller';
import { SitemapService } from './sitemap.service';
import { RobotsService } from './robots.service';
import { RSSService } from './rss.service';

const router = Router();
const prisma = new PrismaClient();

// Initialize services
const sitemapService = new SitemapService(prisma);
const robotsService = new RobotsService();
const rssService = new RSSService(prisma);

// Initialize controller
const seoController = new SEOController(sitemapService, robotsService, rssService);

/**
 * SEO Routes
 * Publicly accessible routes for search engine optimization
 */

// Sitemap.xml
router.get('/sitemap.xml', seoController.getSitemap);

// Robots.txt
router.get('/robots.txt', seoController.getRobotsTxt);

// RSS Feeds
router.get('/rss/news', seoController.getNewsRSS);
router.get('/rss/forum', seoController.getForumRSS);

export default router;
