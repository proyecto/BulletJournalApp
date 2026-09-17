import {
  isEntryCompleted,
  filterEntriesForDay,
  filterEntriesForWeek,
  filterEntriesForMonth,
  filterEntriesForLogMode,
  getEntryIcon,
  isEntryTemporallyDisplaced,
} from './DailyLogService';

describe('DailyLogService', () => {
  const TODAY = '2026-09-16';
  const YESTERDAY = '2026-09-15';
  const TOMORROW = '2026-09-17';

  describe('isEntryCompleted', () => {
    it('returns false for null or undefined entry', () => {
      expect(isEntryCompleted(null, TODAY)).toBe(false);
      expect(isEntryCompleted(undefined, TODAY)).toBe(false);
    });

    it('returns false for notes regardless of dates or statuses', () => {
      expect(isEntryCompleted({ type: 'note', status: 'completed' }, TODAY)).toBe(false);
      expect(isEntryCompleted({ type: 'note', status: 'open' }, TODAY)).toBe(false);
    });

    it('returns true for tasks that are completed or have completedAt', () => {
      expect(isEntryCompleted({ type: 'task', status: 'completed' }, TODAY)).toBe(true);
      expect(isEntryCompleted({ type: 'task', status: 'open', completedAt: '2026-09-15' }, TODAY)).toBe(true);
    });

    it('returns false for open tasks', () => {
      expect(isEntryCompleted({ type: 'task', status: 'open', completedAt: null }, TODAY)).toBe(false);
    });

    it('returns true for past events (< todayStr)', () => {
      expect(isEntryCompleted({ type: 'event', date: YESTERDAY, status: 'open' }, TODAY)).toBe(true);
    });

    it('returns false for today or future open events', () => {
      expect(isEntryCompleted({ type: 'event', date: TODAY, status: 'open' }, TODAY)).toBe(false);
      expect(isEntryCompleted({ type: 'event', date: TOMORROW, status: 'open' }, TODAY)).toBe(false);
    });
  });

  describe('filterEntriesForDay', () => {
    it('returns empty array for unknown entry type', () => {
      expect(filterEntriesForDay([{ id: '99', type: 'unknown' }], TODAY, TODAY)).toHaveLength(0);
    });

    it('handles backward compatibility isEntryTemporallyDisplaced', () => {
      expect(isEntryTemporallyDisplaced()).toBe(false);
    });

    it('returns empty array when entries is not an array', () => {
      expect(filterEntriesForDay(null, TODAY, TODAY)).toEqual([]);
      expect(filterEntriesForDay(undefined, TODAY, TODAY)).toEqual([]);
    });

    it('excludes entries belonging to custom lists (listId present)', () => {
      const entries = [
        { id: '1', type: 'task', status: 'open', date: TODAY, listId: 'list-1', order_index: 0 },
        { id: '2', type: 'task', status: 'open', date: TODAY, listId: null, order_index: 1 },
      ];
      const result = filterEntriesForDay(entries, TODAY, TODAY);
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('rolls over open tasks from the past exclusively to TODAY', () => {
      const pastOpenTask = { id: 't1', type: 'task', status: 'open', date: YESTERDAY, order_index: 0 };
      
      // Should show when viewing TODAY
      const todayResult = filterEntriesForDay([pastOpenTask], TODAY, TODAY);
      expect(todayResult).toHaveLength(1);
      expect(todayResult[0].id).toBe('t1');

      // Should NOT show when viewing yesterday
      const yesterdayResult = filterEntriesForDay([pastOpenTask], YESTERDAY, TODAY);
      expect(yesterdayResult).toHaveLength(0);
    });

    it('displays completed tasks only on their completedAt date', () => {
      const task = {
        id: 't2',
        type: 'task',
        status: 'completed',
        date: YESTERDAY,
        completedAt: YESTERDAY,
        order_index: 0,
      };

      // Shows on completedAt
      expect(filterEntriesForDay([task], YESTERDAY, TODAY)).toHaveLength(1);
      // Does NOT roll over to today once completed
      expect(filterEntriesForDay([task], TODAY, TODAY)).toHaveLength(0);
    });

    it('displays future scheduled tasks only on their future date', () => {
      const futureTask = { id: 't3', type: 'task', status: 'open', date: TOMORROW, order_index: 0 };

      expect(filterEntriesForDay([futureTask], TODAY, TODAY)).toHaveLength(0);
      expect(filterEntriesForDay([futureTask], TOMORROW, TODAY)).toHaveLength(1);
    });

    it('displays events and notes on their assigned date', () => {
      const event = { id: 'e1', type: 'event', date: TODAY, order_index: 0 };
      const note = { id: 'n1', type: 'note', date: TODAY, order_index: 1 };

      const result = filterEntriesForDay([event, note], TODAY, TODAY);
      expect(result).toHaveLength(2);
      expect(filterEntriesForDay([event, note], YESTERDAY, TODAY)).toHaveLength(0);
    });

    it('guarantees deterministic ascending sorting by order_index', () => {
      const entries = [
        { id: '3', type: 'task', status: 'open', date: TODAY, order_index: 5 },
        { id: '1', type: 'task', status: 'open', date: TODAY, order_index: 0 },
        { id: '2', type: 'task', status: 'open', date: TODAY, order_index: 2 },
      ];

      const result = filterEntriesForDay(entries, TODAY, TODAY);
      expect(result.map(e => e.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('filterEntriesForWeek', () => {
    it('returns empty array when entries is invalid', () => {
      expect(filterEntriesForWeek(null, TODAY, TODAY)).toEqual([]);
    });

    it('filters entries that fall in the week range of the viewing date', () => {
      const entries = [
        { id: 'w1', type: 'task', status: 'open', date: TODAY, order_index: 0 }, // 2026-09-16 (Wed, in week 14-20)
        { id: 'w2', type: 'task', status: 'open', date: '2026-09-14', order_index: 1 }, // Mon
        { id: 'w3', type: 'task', status: 'open', date: '2026-09-21', order_index: 2 }, // Next Mon (out of week)
      ];
      const result = filterEntriesForWeek(entries, TODAY, TODAY);
      expect(result.map(e => e.id)).toEqual(['w2', 'w1']);
    });

    it('respects firstDayOfWeek when set to sunday', () => {
      const entries = [
        { id: 'wSun', type: 'event', date: '2026-09-13', order_index: 0 }, // Sunday
        { id: 'wSat', type: 'event', date: '2026-09-19', order_index: 1 }, // Saturday
        { id: 'wNextSun', type: 'event', date: '2026-09-20', order_index: 2 }, // Next Sunday
      ];
      const resultMonday = filterEntriesForWeek(entries, TODAY, TODAY, 'monday');
      expect(resultMonday.map(e => e.id)).toEqual(['wSat', 'wNextSun']); // Mon 14 to Sun 20

      const resultSunday = filterEntriesForWeek(entries, TODAY, TODAY, 'sunday');
      expect(resultSunday.map(e => e.id)).toEqual(['wSun', 'wSat']); // Sun 13 to Sat 19
    });
  });

  describe('filterEntriesForMonth', () => {
    it('returns empty array when entries is invalid', () => {
      expect(filterEntriesForMonth(null, TODAY, TODAY)).toEqual([]);
    });

    it('filters entries that fall in the month of viewing date', () => {
      const entries = [
        { id: 'm1', type: 'task', status: 'open', date: TODAY, order_index: 0 }, // 2026-09-16
        { id: 'm2', type: 'event', date: '2026-09-01', order_index: 1 },
        { id: 'm3', type: 'task', status: 'open', date: '2026-10-01', order_index: 2 }, // Next month
      ];
      const result = filterEntriesForMonth(entries, TODAY, TODAY);
      expect(result.map(e => e.id)).toEqual(['m2', 'm1']);
    });
  });

  describe('filterEntriesForLogMode', () => {
    it('delegates to day, week or month filter depending on mode', () => {
      const entries = [{ id: '1', type: 'task', status: 'open', date: TODAY, order_index: 0 }];
      expect(filterEntriesForLogMode(entries, TODAY, TODAY, 'daily')).toHaveLength(1);
      expect(filterEntriesForLogMode(entries, TODAY, TODAY, 'week')).toHaveLength(1);
      expect(filterEntriesForLogMode(entries, TODAY, TODAY, 'month')).toHaveLength(1);
    });
  });

  describe('getEntryIcon', () => {
    it('returns ellipse for null or default entries', () => {
      expect(getEntryIcon(null)).toBe('ellipse');
    });

    it('returns close (X) for completed tasks and past events', () => {
      expect(getEntryIcon({ type: 'task', status: 'completed' }, TODAY)).toBe('close');
      expect(getEntryIcon({ type: 'event', date: YESTERDAY, status: 'open' }, TODAY)).toBe('close');
    });

    it('returns ellipse for open tasks', () => {
      expect(getEntryIcon({ type: 'task', status: 'open' }, TODAY)).toBe('ellipse');
    });

    it('returns ellipse-outline for open today or future events', () => {
      expect(getEntryIcon({ type: 'event', date: TODAY, status: 'open' }, TODAY)).toBe('ellipse-outline');
      expect(getEntryIcon({ type: 'event', date: TOMORROW, status: 'open' }, TODAY)).toBe('ellipse-outline');
    });

    it('returns remove for notes', () => {
      expect(getEntryIcon({ type: 'note' }, TODAY)).toBe('remove');
    });
  });
});
