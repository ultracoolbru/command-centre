import { renderHook, act } from '@testing-library/react-hooks';
import { useMongoData } from '../hooks';
import { setupTestDb, teardownTestDb, clearCollections } from './test-utils';

describe('useMongoData', () => {
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

  it('should fetch data from MongoDB', async () => {
    const testCollection = db.collection('tasks');
    await testCollection.insertOne({ name: 'Test Item', value: 42 });

    const { result, waitForNextUpdate } = renderHook(() =>
      useMongoData('tasks', {})
    );

    expect(result.current.isLoading).toBe(true);

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBeNull();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Test Item');
  });

  it('should handle errors', async () => {
    const { result, waitForNextUpdate } = renderHook(() =>
      useMongoData('tasks', {})
    );

    await waitForNextUpdate();

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).not.toBeNull();
    expect(result.current.data).toHaveLength(0);
  });

  it('should update data when query changes', async () => {
    const testCollection = db.collection('tasks');
    await testCollection.insertMany([
      { name: 'Item 1', category: 'A' },
      { name: 'Item 2', category: 'B' },
    ]);

    const { result, waitForNextUpdate, rerender } = renderHook(
      ({ query }) => useMongoData('tasks', query),
      {
        initialProps: { query: { category: 'A' } },
      }
    );

    await waitForNextUpdate();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Item 1');

    // Update the query
    rerender({ query: { category: 'B' } });

    await waitForNextUpdate();
    expect(result.current.data).toHaveLength(1);
    expect(result.current.data[0].name).toBe('Item 2');
  });
});
