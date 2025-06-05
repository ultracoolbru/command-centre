import { MongoMemoryServer } from 'mongodb-memory-server';
import { MongoClient, Db } from 'mongodb';

let mongoServer: MongoMemoryServer;
let client: MongoClient;

const getUri = async (): Promise<string> => {
  mongoServer = await MongoMemoryServer.create();
  return mongoServer.getUri();
};

const connect = async (): Promise<MongoClient> => {
  const uri = await getUri();
  client = new MongoClient(uri);
  await client.connect();
  return client;
};

const close = async (): Promise<void> => {
  if (client) {
    await client.close();
  }
  if (mongoServer) {
    await mongoServer.stop();
  }
};

const getDb = async (): Promise<Db> => {
  if (!client) {
    await connect();
  }
  return client.db('test-db');
};

export { connect, close, getDb, getUri };

export default {
  connect,
  close,
  getDb,
  getUri,
};
