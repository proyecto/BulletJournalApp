import { getEntryIcon } from '../DailyLogService';

describe('DailyLogService - getEntryIcon', () => {
  it('returns "ellipse" when entry is null or undefined', () => {
    expect(getEntryIcon(null)).toBe('ellipse');
    expect(getEntryIcon(undefined)).toBe('ellipse');
  });

  it('returns "remove" when entry type is "note"', () => {
    const noteEntry = { type: 'note' };
    expect(getEntryIcon(noteEntry)).toBe('remove');
  });

  it('returns "close" when entry is completed (task)', () => {
    const completedTask = { type: 'task', status: 'completed' };
    expect(getEntryIcon(completedTask)).toBe('close');
  });

  it('returns "close" when entry is completed (event past date)', () => {
    const pastEvent = { type: 'event', date: '2023-01-01' };
    expect(getEntryIcon(pastEvent, '2023-01-02')).toBe('close');
  });

  it('returns "ellipse-outline" when entry is a pending event', () => {
    const futureEvent = { type: 'event', date: '2023-01-03' };
    expect(getEntryIcon(futureEvent, '2023-01-02')).toBe('ellipse-outline');
  });

  it('returns "ellipse" when entry is an open task', () => {
    const openTask = { type: 'task', status: 'pending' };
    expect(getEntryIcon(openTask)).toBe('ellipse');
  });
});
