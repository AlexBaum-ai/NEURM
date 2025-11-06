import { Request, Response } from 'express';
import { BaseController } from '@/utils/baseController';
import DigestService from './digest.service';
import * as Sentry from '@sentry/node';
import {
  UpdateDigestPreferencesInput,
  PreviewDigestQuery,
  TrackOpenParams,
  TrackClickParams,
  TrackClickQuery,
  UnsubscribeQuery,
} from './digest.validation';

/**
 * DigestController
 * Handles email digest API endpoints
 */
export class DigestController extends BaseController {
  private service: DigestService;

  constructor() {
    super();
    this.service = new DigestService();
  }

  /**
   * GET /api/v1/notifications/digest/preferences
   * Get user's digest preferences
   */
  getPreferences = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;

    const preferences = await this.service.getPreferences(userId);

    this.sendSuccess(res, preferences, 200);
  });

  /**
   * PUT /api/v1/notifications/digest/preferences
   * Update digest preferences
   */
  updatePreferences = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const updates = req.body as UpdateDigestPreferencesInput;

    const preferences = await this.service.updatePreferences(userId, updates);

    this.sendSuccess(res, preferences, 200, 'Digest preferences updated successfully');
  });

  /**
   * GET /api/v1/notifications/digest/preview
   * Preview digest content without sending
   */
  previewDigest = this.asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.id;
    const { type } = req.query as unknown as PreviewDigestQuery;

    const preview = await this.service.previewDigest(userId, type);

    this.sendSuccess(res, preview, 200);
  });

  /**
   * GET /api/v1/notifications/digest/track/open/:trackingToken
   * Track email open (tracking pixel)
   */
  trackOpen = this.asyncHandler(async (req: Request, res: Response) => {
    const { trackingToken } = req.params as TrackOpenParams;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
      await this.service.trackOpen(trackingToken, ipAddress, userAgent);
    } catch (error) {
      // Don't fail - tracking shouldn't break user experience
      Sentry.captureException(error, {
        tags: { controller: 'DigestController', method: 'trackOpen' },
        extra: { trackingToken },
      });
    }

    // Return 1x1 transparent pixel
    const pixel = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=',
      'base64'
    );

    res.set('Content-Type', 'image/png');
    res.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.set('Pragma', 'no-cache');
    res.set('Expires', '0');
    res.send(pixel);
  });

  /**
   * GET /api/v1/notifications/digest/track/click/:trackingToken
   * Track link click and redirect
   */
  trackClick = this.asyncHandler(async (req: Request, res: Response) => {
    const { trackingToken } = req.params as TrackClickParams;
    const { url } = req.query as TrackClickQuery;
    const ipAddress = req.ip;
    const userAgent = req.get('user-agent');

    try {
      await this.service.trackClick(trackingToken, url, ipAddress, userAgent);
    } catch (error) {
      // Don't fail - tracking shouldn't break user experience
      Sentry.captureException(error, {
        tags: { controller: 'DigestController', method: 'trackClick' },
        extra: { trackingToken, url },
      });
    }

    // Redirect to the actual URL
    res.redirect(url);
  });

  /**
   * GET /api/v1/notifications/digest/unsubscribe
   * Unsubscribe from digests
   */
  unsubscribe = this.asyncHandler(async (req: Request, res: Response) => {
    const { token } = req.query as UnsubscribeQuery;

    await this.service.unsubscribe(token);

    // Return simple HTML page
    res.send(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Unsubscribed - Neurmatic</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background-color: #f3f4f6;
          }
          .container {
            background: white;
            padding: 48px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 500px;
          }
          h1 {
            color: #111827;
            font-size: 28px;
            margin-bottom: 16px;
          }
          p {
            color: #6b7280;
            font-size: 16px;
            line-height: 1.6;
            margin-bottom: 24px;
          }
          a {
            display: inline-block;
            background-color: #3b82f6;
            color: white;
            padding: 12px 24px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
          }
          a:hover {
            background-color: #2563eb;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>✓ Successfully Unsubscribed</h1>
          <p>
            You've been unsubscribed from all email digests.
            You'll no longer receive daily or weekly digest emails from Neurmatic.
          </p>
          <p>
            You can re-enable digests anytime in your notification settings.
          </p>
          <a href="${process.env.FRONTEND_URL || 'http://vps-1a707765.vps.ovh.net:5173'}/settings/notifications">
            Go to Settings
          </a>
        </div>
      </body>
      </html>
    `);
  });
}

export default DigestController;
