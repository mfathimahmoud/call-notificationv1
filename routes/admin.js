import express from 'express';
import cors from 'cors';
import { getAllQueues, insertQueue, updateQueue, deleteQueue, ObjectId } from '../lib/database.js';
import { requireAdmin } from '../lib/auth.js';

const router = express.Router();

// Get all queue data (admin only)
router.get('/admin', requireAdmin, async (req, res) => {
  console.log('GET /admin');
  
  try {
    const returnData = await getAllQueues();
    console.log(returnData);
    res.json(returnData);
  } catch (error) {
    console.error('Admin GET error:', error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Create, update, or delete queue entries (admin only)
router.post('/admin', cors(), requireAdmin, async (req, res) => {
  console.log('POST /admin body:', req.body);
  
  const body = req.body;
  let response = {};
  
  try {
    if (body.command === "delete") {
      if (!body._id) {
        return res.status(400).json({ error: "_id required to delete an entry." });
      }
      
      const deleted = await deleteQueue(body._id);
      console.log("entry deleted:", deleted);
      
      if (deleted.deletedCount === 0) {
        response = { error: "Document was not deleted. Contact Administrator." };
      } else {
        response = { success: "Document deleted successfully." };
      }
    } else if (body.company) {
      if (!body.number) {
        return res.status(400).json({ error: "'Main Number' is a required field." });
      }
      
      if (body._id) {
        // Update existing entry
        const docId = body._id;
        delete body._id;
        
        const update = await updateQueue(docId, body);
        console.log("entry updated:", update);
        
        if (update.modifiedCount === 0 && update.matchedCount === 0) {
          response = { error: "Document was not updated. Contact Administrator." };
        } else {
          response = { success: "Document updated successfully." };
        }
      } else {
        // Insert new entry
        const insert = await insertQueue(body);
        console.log("entry inserted:", insert);
        
        if (insert.insertedId) {
          response = { _id: insert.insertedId };
        } else {
          response = { error: "Document was not inserted. Contact Administrator." };
        }
      }
    } else {
      return res.status(400).json({ error: "'Company' is a required field." });
    }
  } catch (error) {
    console.error('/admin Error:', error);
    
    if (error.code === 11000) {
      response = { error: `${JSON.stringify(error.keyValue)} already exists for a different profile.` };
    } else {
      response = { error: "An unknown error occurred." };
    }
  }
  
  console.log('/admin response:', response);
  res.json(response);
});

export default router;