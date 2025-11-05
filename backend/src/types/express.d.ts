/**
 * Express type extensions
 * This file augments the Express Request interface with custom properties
 */
import { Request as ExpressRequest } from 'express';
import { UserRole } from '@prisma/client';

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        username: string;
        role: UserRole;
      };
      requestId?: string;
      sessionId?: string;
    }
  }
}

// Export the extended Request type for direct imports
export interface Request extends ExpressRequest {
  user?: {
    id: string;
    email: string;
    username: string;
    role: UserRole;
  };
  requestId?: string;
  sessionId?: string;
}
