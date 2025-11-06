import { Request, Response } from 'express';
import { SitemapService } from './sitemap.service';
import { RobotsService } from './robots.service';
import { RSSService } from './rss.service';
import * as Sentry from '@sentry/node';

/**
 * SEO Controller
 * Handles sitemap.xml, robots.txt, and RSS feed generation
 */
export class SEOController {
  constructor(
    private sitemapService: SitemapService,
    private robotsService: RobotsService,
    private rssService: RSSService
  ) {}

  /**
   * GET /sitemap.xml
   * Generate and serve XML sitemap
   */
  getSitemap = async (req: Request, res: Response): Promise<void> => {
    try {
      const sitemap = await this.sitemapService.generateSitemap();

      res.header('Content-Type', 'application/xml');
      res.header('Cache-Control', 'public, max-age=3600'); // Cache for 1 hour
      res.send(sitemap);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error generating sitemap:', error);
      res.status(500).send('Error generating sitemap');
    }
  };

  /**
   * GET /robots.txt
   * Generate and serve robots.txt file
   */
  getRobotsTxt = async (req: Request, res: Response): Promise<void> => {
    try {
      const robotsTxt = this.robotsService.generateRobotsTxt();

      res.header('Content-Type', 'text/plain');
      res.header('Cache-Control', 'public, max-age=86400'); // Cache for 24 hours
      res.send(robotsTxt);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error generating robots.txt:', error);
      res.status(500).send('Error generating robots.txt');
    }
  };

  /**
   * GET /rss/news
   * Generate RSS feed for news articles
   */
  getNewsRSS = async (req: Request, res: Response): Promise<void> => {
    try {
      const rssFeed = await this.rssService.generateNewsRSS();

      res.header('Content-Type', 'application/rss+xml');
      res.header('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
      res.send(rssFeed);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error generating news RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  };

  /**
   * GET /rss/forum
   * Generate RSS feed for forum topics
   */
  getForumRSS = async (req: Request, res: Response): Promise<void> => {
    try {
      const rssFeed = await this.rssService.generateForumRSS();

      res.header('Content-Type', 'application/rss+xml');
      res.header('Cache-Control', 'public, max-age=1800'); // Cache for 30 minutes
      res.send(rssFeed);
    } catch (error) {
      Sentry.captureException(error);
      console.error('Error generating forum RSS feed:', error);
      res.status(500).send('Error generating RSS feed');
    }
  };
}
