import { MongoClient, ObjectId } from 'mongodb';
import { config } from './config.js';

let client;
let db;

export async function connectDatabase() {
  try {
    client = new MongoClient(config.mongodb.uri);
    await client.connect();
    db = client.db(config.mongodb.database);
    
    // Create indexes
    await db.collection(config.mongodb.collections.queue)
      .createIndex({ "company": 1 }, { unique: true });
    await db.collection(config.mongodb.collections.queue)
      .createIndex({ "number": 1 }, { unique: true });
    
    console.log('Database connected successfully');
    return db;
  } catch (error) {
    console.error('Database connection error:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!db) {
    throw new Error('Database not connected. Call connectDatabase() first.');
  }
  return db;
}

export async function getUser(callerId) {
  const normalizedCallerId = callerId.replace("+", "");
  const data = await db.collection(config.mongodb.collections.user)
    .findOne({ number: normalizedCallerId });
  return { data };
}

export async function getQueue(number) {
  const normalizedNumber = number.replace("+", "");
  const data = await db.collection(config.mongodb.collections.queue)
    .findOne({ number: normalizedNumber });
  return data;
}

export async function getAllQueues() {
  return await db.collection(config.mongodb.collections.queue)
    .find({})
    .toArray();
}

export async function insertQueue(data) {
  return await db.collection(config.mongodb.collections.queue)
    .insertOne(data);
}

export async function updateQueue(id, data) {
  return await db.collection(config.mongodb.collections.queue)
    .updateOne({ "_id": new ObjectId(id) }, { "$set": data });
}

export async function deleteQueue(id) {
  return await db.collection(config.mongodb.collections.queue)
    .deleteOne({ "_id": new ObjectId(id) });
}

export { ObjectId };