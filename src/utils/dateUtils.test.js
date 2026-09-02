import { getFormattedDate } from './dateUtils';

describe('getFormattedDate', () => {
  // Use a fixed timestamp to ensure deterministic tests.
  // 2023-12-31T23:30:00.000Z is Dec 31 2023 23:30 in UTC.
  const timestamp = Date.parse('2023-12-31T23:30:00.000Z');

  describe('when timezone is system or not provided', () => {
    it('formats Date object using local system time', () => {
      // Since local timezone is unknown, we calculate expected local date manually
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;

      expect(getFormattedDate(date)).toBe(expected);
      expect(getFormattedDate(date, 'system')).toBe(expected);
    });

    it('formats timestamp using local system time', () => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;

      expect(getFormattedDate(timestamp)).toBe(expected);
    });
  });

  describe('when a specific timezone is provided', () => {
    it('formats correctly for a timezone that shifts the date forward (e.g. Asia/Tokyo)', () => {
      // 2023-12-31T23:30:00.000Z in Asia/Tokyo is 2024-01-01T08:30:00
      expect(getFormattedDate(timestamp, 'Asia/Tokyo')).toBe('2024-01-01');
    });

    it('formats correctly for a timezone that shifts the date backward (e.g. America/Los_Angeles)', () => {
      // 2023-12-31T23:30:00.000Z in America/Los_Angeles is 2023-12-31T15:30:00
      expect(getFormattedDate(timestamp, 'America/Los_Angeles')).toBe('2023-12-31');
    });

    it('formats correctly for UTC timezone', () => {
      expect(getFormattedDate(timestamp, 'UTC')).toBe('2023-12-31');
    });
  });

  describe('when an invalid timezone is provided', () => {
    it('falls back to local system time', () => {
      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const expected = `${year}-${month}-${day}`;

      // This will throw an error internally and hit the catch block
      expect(getFormattedDate(timestamp, 'Invalid/Timezone')).toBe(expected);
    });
  });
});
