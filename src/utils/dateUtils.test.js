import { getFormattedDate } from './dateUtils';

describe('dateUtils - getFormattedDate', () => {
  it('formats date correctly without timezone (defaults to system)', () => {
    const date = new Date('2023-10-15T12:00:00Z');
    const result = getFormattedDate(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('formats date correctly with a valid timezone', () => {
    const date = new Date('2023-10-15T12:00:00Z');
    const result = getFormattedDate(date, 'America/New_York');
    expect(result).toBe('2023-10-15');
  });

  it('falls back to manual formatting when an invalid timezone is provided', () => {
    const date = new Date('2023-10-15T12:00:00Z');
    const result = getFormattedDate(date, 'Invalid/Timezone');

    const d = new Date(date);
    const expectedYear = d.getFullYear();
    const expectedMonth = String(d.getMonth() + 1).padStart(2, '0');
    const expectedDay = String(d.getDate()).padStart(2, '0');
    const expectedResult = `${expectedYear}-${expectedMonth}-${expectedDay}`;

    expect(result).toBe(expectedResult);
  });
});
