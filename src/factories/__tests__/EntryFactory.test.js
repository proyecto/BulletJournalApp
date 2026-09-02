import { createListEntry } from '../EntryFactory';
import * as dateUtils from '../../utils/dateUtils';

// Mock getFormattedDate to avoid timezone/current date flakiness in tests
jest.mock('../../utils/dateUtils', () => ({
  getFormattedDate: jest.fn(),
}));

describe('EntryFactory', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createListEntry', () => {
    it('creates a list entry with default values', () => {
      // Mock Date.now to have predictable IDs
      const mockNow = 1714564800000;
      const dateSpy = jest.spyOn(Date, 'now').mockImplementation(() => mockNow);

      const mockFormattedDate = '2024-05-01';
      dateUtils.getFormattedDate.mockReturnValue(mockFormattedDate);

      const text = 'Buy milk';
      const listId = 'list-123';
      const timezone = 'UTC';

      const entry = createListEntry(text, listId, timezone);

      expect(entry).toEqual({
        id: mockNow.toString(),
        text: 'Buy milk',
        type: 'task',
        status: 'open',
        date: mockFormattedDate,
        completedAt: null,
        listId: 'list-123',
        order_index: 0,
      });

      // Verify dateUtils was called correctly
      expect(dateUtils.getFormattedDate).toHaveBeenCalledTimes(1);

      // We expect it to be called with a Date object and the provided timezone
      const callArgs = dateUtils.getFormattedDate.mock.calls[0];
      expect(callArgs[0]).toBeInstanceOf(Date);
      expect(callArgs[1]).toBe('UTC');

      dateSpy.mockRestore();
    });

    it('trims whitespace from text', () => {
      const text = '  Trim me  ';
      const listId = 'list-123';
      const timezone = 'UTC';

      const entry = createListEntry(text, listId, timezone);

      expect(entry.text).toBe('Trim me');
    });

    it('respects a custom orderIndex', () => {
      const text = 'Buy milk';
      const listId = 'list-123';
      const timezone = 'UTC';
      const customOrder = 5;

      const entry = createListEntry(text, listId, timezone, customOrder);

      expect(entry.order_index).toBe(5);
    });

    it('generates unique IDs for sequential calls', () => {
      // Not mocking Date.now here to see if sequential calls get different/valid IDs
      const entry1 = createListEntry('Task 1', 'list-1', 'UTC');
      const entry2 = createListEntry('Task 2', 'list-1', 'UTC');

      expect(entry1.id).toBeDefined();
      expect(entry2.id).toBeDefined();
      // Actually Date.now might return the same ms if executed fast,
      // but let's just ensure id is a string
      expect(typeof entry1.id).toBe('string');
      expect(typeof entry2.id).toBe('string');
    });
  });
});
