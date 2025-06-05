export const useMongoData = jest.fn((collectionName: string) => ({
  data: [],
  isLoading: false,
  error: null,
  refresh: jest.fn(),
  createItem: jest.fn().mockResolvedValue({}),
  updateItem: jest.fn().mockResolvedValue({}),
  deleteItem: jest.fn().mockResolvedValue({}),
  fetchData: jest.fn().mockResolvedValue([]),
}));
