import express from 'express';
import { getUser, getQueue } from '../lib/database.js';
import { isMercuryMode } from '../lib/config.js';

const router = express.Router();

// Webhook handler for agent calls
router.post('/agent_webhook', async (req, res) => {
  if (!isMercuryMode()) {
    try {
      if (req.body.data.eventType === "received") {
        console.log('POST /agent_webhook req.body:', req.body);
        
        const remoteNumber = req.body?.data?.remoteParty?.number;
        const remoteName = req.body?.data?.remoteParty?.name;
        
        console.log('POST /agent_webhook redirections:', req.body?.data?.redirections);
        
        let queueNumber;
        let queueData;
        
        if (req.body?.data?.redirections?.length > 0) {
          const redirection = req.body.data.redirections[0];
          if (redirection.reason === "callQueue") {
            queueNumber = redirection.redirectingParty.number;
            queueData = await getQueue(queueNumber);
            console.log('queue dbResult', queueData);
          }
        }
        
        let dbData;
        if (!queueData) {
          dbData = await getUser(remoteNumber);
          console.log('user dbResult', dbData);
        }
        
        const data = {
          name: remoteName,
          number: remoteNumber,
          customer: dbData,
          queue: queueData
        };
        
        console.log("Emitting message to:", req.body.actorId);
        
        // Note: This requires the io instance to be passed in or made available
        // You'll need to import this or pass it as a parameter
        // req.app.get('io').to(req.body.actorId).emit('message', data);
      }
    } catch (error) {
      console.log('/agent_webhook exception:', error);
    }
  } else {
    console.log("Running in Socket Mode. Ignoring Webhook.");
  }
  
  res.send('OK');
});

export default router;