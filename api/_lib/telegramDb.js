import { MongoClient } from 'mongodb';
import dns from 'dns';

// Ensure resilient DNS resolution for mongodb+srv across all network environments
try {
  dns.setServers(['1.1.1.1', '8.8.8.8']);
} catch {
  // Fallback if environment doesn't allow setting DNS servers
}

// Fallback is used here so the user doesn't have to manually configure Vercel env var right away
const uri = process.env.MONGODB_URI || "mongodb+srv://weirdxx2_db_user:03cXYaSrUa92bo8d@cluster0.4oo5epz.mongodb.net/?retryWrites=true&w=majority";

const client = new MongoClient(uri, {
  serverSelectionTimeoutMS: 15000,
});

let dbInstance = null;

export async function connectDB() {
  if (dbInstance) return dbInstance;
  
  try {
    await client.connect();
    // Gunakan database bernama "apicos"
    dbInstance = client.db("apicos");
    return dbInstance;
  } catch (error) {
    console.error("MongoDB Connection Error:", error);
    throw error;
  }
}
