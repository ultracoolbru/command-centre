import { MongoClient } from 'mongodb';
import { MongoMemoryServer } from 'mongodb-memory-server';

let mongoServer: MongoMemoryServer;
let client: MongoClient;

export async function setupTestDb() {
  mongoServer = await MongoMemoryServer.create();
  const uri = mongoServer.getUri();
  client = new MongoClient(uri);
  await client.connect();
  return client.db('test-db');
}

export async function teardownTestDb() {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
}

export async function clearCollections(db: any) {
  const collections = await db.collections();
  for (const collection of collections) {
    await collection.deleteMany({});
  }
}
