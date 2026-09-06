import { createDailyEntry, createListEntry, createList } from './EntryFactory';
import * as dateUtils from '../utils/dateUtils';

// Mock dateUtils
jest.mock('../utils/dateUtils', () => ({
  getFormattedDate: jest.fn(),
}));

describe('EntryFactory', () => {
  const MOCK_TIMESTAMP = 1625097600000;
  const originalDateNow = Date.now;

  beforeAll(() => {
    // Mock Date.now to return a predictable timestamp for generateId
    Date.now = jest.fn(() => MOCK_TIMESTAMP);
  });

  afterAll(() => {
    // Restore Date.now
    Date.now = originalDateNow;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDailyEntry', () => {
    it('creates a daily entry with correct structure and defaults', () => {
      dateUtils.getFormattedDate.mockReturnValue('2021-07-01');
      const text = '  My Daily Task  ';
      const type = 'task';
      const date = new Date('2021-07-01T12:00:00Z');
      const timezone = 'UTC';

      const entry = createDailyEntry(text, type, date, timezone);

      expect(entry).toEqual({
        id: '1625097600000',
        text: 'My Daily Task',
        type: 'task',
        status: 'open',
        date: '2021-07-01',
        completedAt: null,
        listId: null,
        order_index: 0, // default
      });
      expect(dateUtils.getFormattedDate).toHaveBeenCalledWith(date, timezone);
    });

    it('uses a new Date if no date is provided and handles custom orderIndex', () => {
      dateUtils.getFormattedDate.mockReturnValue('2021-07-01');
      const text = 'Another task';
      const type = 'event';

      const entry = createDailyEntry(text, type, null, 'America/New_York', 5);

      expect(entry.order_index).toBe(5);
      expect(entry.type).toBe('event');
      expect(entry.date).toBe('2021-07-01');

      // We expect getFormattedDate to be called with a Date object and the timezone
      expect(dateUtils.getFormattedDate).toHaveBeenCalledTimes(1);
      const callArgs = dateUtils.getFormattedDate.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBe('America/New_York');
    });
  });

  describe('createListEntry', () => {
    it('creates a list entry with correct structure and defaults', () => {
      dateUtils.getFormattedDate.mockReturnValue('2021-07-01');
      const text = '  Buy milk  ';
      const listId = 'list-123';
      const timezone = 'UTC';

      const entry = createListEntry(text, listId, timezone);

      expect(entry).toEqual({
        id: '1625097600000',
        text: 'Buy milk',
        type: 'task', // should always be task
        status: 'open',
        date: '2021-07-01',
        completedAt: null,
        listId: 'list-123',
        order_index: 0, // default
      });

      expect(dateUtils.getFormattedDate).toHaveBeenCalledTimes(1);
      expect(dateUtils.getFormattedDate.mock.calls[0][0]).toBeInstanceOf(Date);
      expect(dateUtils.getFormattedDate.mock.calls[0][1]).toBe(timezone);
    });

    it('handles custom orderIndex for list entry', () => {
      dateUtils.getFormattedDate.mockReturnValue('2021-07-01');

      const entry = createListEntry('Apples', 'list-456', 'UTC', 10);

      expect(entry.order_index).toBe(10);
    });
  });

  describe('createList', () => {
    it('creates a list with correct structure', () => {
      const title = '  Groceries  ';
      const orderIndex = 2;

      const list = createList(title, orderIndex);

      expect(list).toEqual({
        id: '1625097600000',
        title: 'Groceries',
        order_index: 2,
      });
    });
  });
});
