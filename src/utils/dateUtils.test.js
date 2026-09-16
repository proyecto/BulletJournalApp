import { getFormattedDate } from './dateUtils';

describe('dateUtils', () => {
  describe('getFormattedDate', () => {
    it('formats a Date object to YYYY-MM-DD using system timezone', () => {
      const date = new Date(2026, 4, 3); // May 3, 2026
      expect(getFormattedDate(date, 'system')).toBe('2026-05-03');
    });

    it('formats a timestamp number to YYYY-MM-DD using system timezone', () => {
      const date = new Date(2026, 11, 25); // Dec 25, 2026
      expect(getFormattedDate(date.getTime())).toBe('2026-12-25');
    });

    it('pads single-digit months and days with leading zeros', () => {
      const date = new Date(2026, 0, 5); // Jan 5, 2026
      expect(getFormattedDate(date, 'system')).toBe('2026-01-05');
    });

    it('formats accurately for specific IANA timezones', () => {
      // 2026-01-01 02:00:00 UTC -> in Tokyo (UTC+9) it is 2026-01-01 11:00
      // in New York (UTC-5) it is still 2025-12-31 21:00
      const utcDate = new Date('2026-01-01T02:00:00Z');
      expect(getFormattedDate(utcDate, 'Asia/Tokyo')).toBe('2026-01-01');
      expect(getFormattedDate(utcDate, 'America/New_York')).toBe('2025-12-31');
      expect(getFormattedDate(utcDate, 'UTC')).toBe('2026-01-01');
    });

    it('falls back safely to local Date if timezone throws or is invalid', () => {
      const date = new Date(2026, 8, 15);
      const result = getFormattedDate(date, 'Invalid/Timezone_Name');
      expect(result).toBe('2026-09-15');
    });
  });
});
