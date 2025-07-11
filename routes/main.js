import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config, isMercuryMode } from '../lib/config.js';
import { getAuthorizationUrl, getAccessToken, isUserAdmin } from '../lib/webexService.js';
import { requireAuth, requestLogger } from '../lib/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const router = express.Router();

// Apply request logging middleware
router.use(requestLogger);

// Home route with authentication
router.get('/', async (req, res) => {
  console.log("Cookies:", req.cookies);
  
  if (req.cookies?.access_token && req.cookies.access_token.length > 12) {
    try {
      res.cookie("mercury_mode", isMercuryMode(), config.cookie.options);
      const adminStatus = await isUserAdmin(req.cookies.access_token);
      res.cookie("is_admin", adminStatus, config.cookie.options);
      res.sendFile(path.join(__dirname, '..', 'static', 'main.html'));
    } catch (error) {
      console.error('Error setting cookies:', error);
      res.status(500).send('Internal server error');
    }
  } else {
    const redirectUri = getAuthorizationUrl(req.url);
    console.log('redirectUri:', redirectUri);
    res.redirect(redirectUri);
  }
});

// OAuth callback route
router.get('/oauth', async (req, res) => {
  console.log('/oauth req.query:', req.query);
  
  try {
    const tokenData = await getAccessToken(req.query.code);
    res.cookie("access_token", tokenData.access_token, config.cookie.options);
    res.redirect(req.query.state || '/');
  } catch (error) {
    console.error('OAuth error:', error);
    res.status(500).send('OAuth authentication failed');
  }
});

export default router;