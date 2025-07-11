import { isUserAdmin } from './webexService.js';

export function requireAuth(req, res, next) {
  if (!req.cookies?.access_token || req.cookies.access_token.length <= 12) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

export async function requireAdmin(req, res, next) {
  const accessToken = req.get("accessToken");
  
  if (!accessToken || accessToken.length <= 12) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  
  try {
    const adminStatus = await isUserAdmin(accessToken);
    if (adminStatus !== "true") {
      return res.status(403).json({ error: "User is not an admin" });
    }
    next();
  } catch (error) {
    console.error('Error checking admin status:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export function requestLogger(req, res, next) {
  if (req.url !== "/status") {
    console.log('%s %s', req.method, req.url);
  }
  next();
}