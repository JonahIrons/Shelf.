import { verifyToken } from '../utils/jwt.js';
import { pool } from '../config/db.js';

/**
 * Middleware to authenticate requests using JWT tokens
 * Adds req.user with user information if token is valid
 */
export const authenticate = async (req, res, next) => {
    try {
        // Get token from Authorization header
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ 
                success: false, 
                message: 'No token provided. Please log in.' 
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix
        
        // Verify token
        const decoded = verifyToken(token);
        
        if (!decoded) {
            return res.status(401).json({ 
                success: false, 
                message: 'Invalid or expired token. Please log in again.' 
            });
        }

        // Verify user still exists in database
        const [users] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                success: false, 
                message: 'User not found.' 
            });
        }

        // Attach user info to request object
        req.user = users[0];
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ 
            success: false, 
            message: 'Authentication failed.' 
        });
    }
};

/**
 * Optional authentication - doesn't fail if no token, but adds req.user if valid token exists
 */
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            const decoded = verifyToken(token);
            
            if (decoded) {
                const [users] = await pool.query('SELECT id, username, email FROM users WHERE id = ?', [decoded.id]);
                if (users.length > 0) {
                    req.user = users[0];
                }
            }
        }
        
        next();
    } catch (error) {
        // Don't fail on optional auth errors
        next();
    }
};

