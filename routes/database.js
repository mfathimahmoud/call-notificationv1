import express from 'express';
import { getUser, getQueue } from '../lib/database.js';
import { requireAuth } from '../lib/auth.js';

const router = express.Router();

// Get database records (user or queue)
router.get('/db', requireAuth, async (req, res) => {
  console.log('/db req.query:', req.query);
  
  try {
    let returnData;
    
    if (req.query.queueNumber) {
      returnData = await getQueue(req.query.queueNumber);
      console.log('queue dbResult', returnData);
      if (returnData) {
        returnData = { queue: returnData };
      }
    }
    
    if (!returnData && req.query.remoteNumber) {
      returnData = await getUser(req.query.remoteNumber);
      console.log('user dbResult', returnData);
      if (returnData?.data) {
        returnData = { customer: returnData };
      } else {
        returnData = null;
      }
    }
    
    if (!returnData) {
      return res.status(400).json({ error: "No data found" });
    }
    
    res.json(returnData);
  } catch (error) {
    console.error('Database query error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

export default router;