import { setupTestDb, teardownTestDb, clearCollections } from './test-utils';
import { MongoClient } from 'mongodb';

describe('MongoDB Connection', () => {
  let db: any;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  afterEach(async () => {
    await clearCollections(db);
  });

  it('should connect to the in-memory database', async () => {
    expect(db).toBeDefined();
    const collections = await db.collections();
    expect(Array.isArray(collections)).toBe(true);
  });

  it('should be able to insert and find documents', async () => {
    const testCollection = db.collection('test');
    
    const mockTask = {
      title: 'Test Task',
      completed: false,
      createdAt: new Date()
    };

    // Insert a document
    const result = await testCollection.insertOne(mockTask);
    expect(result.insertedId).toBeDefined();

    // Find the document
    const found = await testCollection.findOne({ _id: result.insertedId });
    expect(found).toMatchObject(mockTask);
  });
});
