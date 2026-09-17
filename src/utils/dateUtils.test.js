import {
  getFormattedDate,
  getWeekRange,
  getFormattedWeekSubtitle,
  getFormattedMonthSubtitle,
} from './dateUtils';

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

  describe('getWeekRange', () => {
    it('calculates correct Monday to Sunday date range for a Wednesday', () => {
      const wednesday = new Date(2026, 8, 16); // Sep 16, 2026 (Wednesday)
      const range = getWeekRange(wednesday, 'system');
      expect(range.startStr).toBe('2026-09-14'); // Monday
      expect(range.endStr).toBe('2026-09-20');   // Sunday
    });

    it('calculates correct Sunday to Saturday date range when firstDayOfWeek is sunday', () => {
      const wednesday = new Date(2026, 8, 16); // Sep 16, 2026 (Wednesday)
      const range = getWeekRange(wednesday, 'system', 'sunday');
      expect(range.startStr).toBe('2026-09-13'); // Sunday
      expect(range.endStr).toBe('2026-09-19');   // Saturday
    });

    it('calculates correct Monday to Sunday date range when given a Sunday', () => {
      const sunday = new Date(2026, 8, 20); // Sep 20, 2026 (Sunday)
      const range = getWeekRange(sunday, 'system', 'monday');
      expect(range.startStr).toBe('2026-09-14');
      expect(range.endStr).toBe('2026-09-20');
    });
  });

  describe('getFormattedWeekSubtitle', () => {
    it('formats week range subtitle in Spanish', () => {
      const date = new Date(2026, 8, 16);
      const subtitle = getFormattedWeekSubtitle(date, 'es');
      expect(subtitle).toContain('14');
      expect(subtitle).toContain('20');
      expect(subtitle).toContain('2026');
    });

    it('formats week range subtitle in English', () => {
      const date = new Date(2026, 8, 16);
      const subtitle = getFormattedWeekSubtitle(date, 'en');
      expect(subtitle).toContain('14');
      expect(subtitle).toContain('20');
      expect(subtitle).toContain('2026');
    });
  });

  describe('getFormattedMonthSubtitle', () => {
    it('formats month subtitle in Spanish', () => {
      const date = new Date(2026, 8, 16);
      expect(getFormattedMonthSubtitle(date, 'es')).toContain('Septiembre 2026');
    });

    it('formats month subtitle in English', () => {
      const date = new Date(2026, 8, 16);
      expect(getFormattedMonthSubtitle(date, 'en')).toContain('September 2026');
    });
  });
});
