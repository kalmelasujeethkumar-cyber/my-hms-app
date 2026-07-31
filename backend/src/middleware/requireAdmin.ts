/* ============================================================
   VPC-HMS — requireAdmin RBAC Middleware
   Verifies the JWT and checks that the caller has the 'admin'
   role before allowing access to protected admin-only routes.
   ============================================================ */

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'vpc_hms_super_secret_jwt_key_2026';

/** Extend Express Request to carry the decoded JWT payload */
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    role: string;
    branch?: string;
  };
}

/**
 * RBAC middleware — Admin only.
 * Reads Authorization: Bearer <token>, verifies it, and confirms
 * role === 'admin'. Returns 401 if no/invalid token, 403 if wrong role.
 */
export const requireAdmin = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  let token = '';
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  } else if (req.query.token && typeof req.query.token === 'string') {
    token = req.query.token;
  }

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'A valid Bearer token or token query parameter is required to access this resource.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      username: string;
      role: string;
      branch?: string;
    };

    if (decoded.role !== 'admin') {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access denied. This resource is restricted to Admin users only.',
      });
      return;
    }

    // Attach decoded payload to request for downstream use
    req.user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Token is invalid or has expired. Please log in again.',
    });
  }
};
