import { DateFormatter } from './date-formatter';

describe('DateFormatter', () => {
  describe('toAFIPFormat', () => {
    it('should format date to YYYYMMDD', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = DateFormatter.toAFIPFormat(date);

      expect(formatted).toMatch(/^\d{8}$/);
      expect(formatted.length).toBe(8);
    });

    it('should format current date when no argument provided', () => {
      const formatted = DateFormatter.toAFIPFormat();

      expect(formatted).toMatch(/^\d{8}$/);
      expect(formatted.length).toBe(8);

      // Should be a valid date
      const year = parseInt(formatted.substring(0, 4));
      const month = parseInt(formatted.substring(4, 6));
      const day = parseInt(formatted.substring(6, 8));

      expect(year).toBeGreaterThan(2020);
      expect(month).toBeGreaterThanOrEqual(1);
      expect(month).toBeLessThanOrEqual(12);
      expect(day).toBeGreaterThanOrEqual(1);
      expect(day).toBeLessThanOrEqual(31);
    });

    it('should pad single digit months and days', () => {
      const date = new Date('2025-01-05T10:30:00Z');
      const formatted = DateFormatter.toAFIPFormat(date);

      // Month and day should be zero-padded
      expect(formatted.substring(4, 6)).toMatch(/^\d{2}$/);
      expect(formatted.substring(6, 8)).toMatch(/^\d{2}$/);
    });
  });

  describe('toWSAAFormat', () => {
    it('should format date to ISO with T separator', () => {
      const date = new Date('2025-01-15T10:30:00Z');
      const formatted = DateFormatter.toWSAAFormat(date);

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
      expect(formatted).toContain('T');
      expect(formatted.split('T')).toHaveLength(2);
    });

    it('should format current date when no argument provided', () => {
      const formatted = DateFormatter.toWSAAFormat();

      expect(formatted).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/);
    });

    it('should include time component', () => {
      const date = new Date('2025-01-15T14:30:45Z');
      const formatted = DateFormatter.toWSAAFormat(date);

      expect(formatted).toContain(':');

      const timePart = formatted.split('T')[1];
      expect(timePart).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });
  });

  describe('fromAFIPFormat', () => {
    it('should parse AFIP date string to Date', () => {
      const afipDate = '20250115';
      const parsed = DateFormatter.fromAFIPFormat(afipDate);

      expect(parsed).toBeInstanceOf(Date);
      expect(parsed.getFullYear()).toBe(2025);
      expect(parsed.getMonth()).toBe(0); // January (0-indexed)
      expect(parsed.getDate()).toBe(15);
    });

    it('should handle dates with single digit months', () => {
      const afipDate = '20250105';
      const parsed = DateFormatter.fromAFIPFormat(afipDate);

      expect(parsed.getFullYear()).toBe(2025);
      expect(parsed.getMonth()).toBe(0); // January
      expect(parsed.getDate()).toBe(5);
    });

    it('should handle end of year dates', () => {
      const afipDate = '20241231';
      const parsed = DateFormatter.fromAFIPFormat(afipDate);

      expect(parsed.getFullYear()).toBe(2024);
      expect(parsed.getMonth()).toBe(11); // December
      expect(parsed.getDate()).toBe(31);
    });
  });

  describe('getCAEExpirationDate', () => {
    it('should return date 10 days in the future', () => {
      const invoiceDate = new Date('2025-01-15');
      const expiration = DateFormatter.getCAEExpirationDate(invoiceDate);

      expect(expiration).toMatch(/^\d{8}$/);

      // Parse and verify it's 10 days later
      const expirationDate = DateFormatter.fromAFIPFormat(expiration);
      const invoiceTime = invoiceDate.getTime();
      const expirationTime = expirationDate.getTime();

      const daysDiff = Math.round((expirationTime - invoiceTime) / (1000 * 60 * 60 * 24));
      expect(daysDiff).toBe(10);
    });

    it('should use current date when no argument provided', () => {
      const expiration = DateFormatter.getCAEExpirationDate();

      expect(expiration).toMatch(/^\d{8}$/);
      expect(expiration.length).toBe(8);
    });

    it('should handle month transitions', () => {
      const invoiceDate = new Date('2025-01-25');
      const expiration = DateFormatter.getCAEExpirationDate(invoiceDate);

      const expirationDate = DateFormatter.fromAFIPFormat(expiration);

      // Should be in February
      expect(expirationDate.getMonth()).toBe(1); // February
      expect(expirationDate.getDate()).toBe(4); // 25 + 10 = 4 Feb
    });
  });

  describe('now', () => {
    it('should return current date in Argentina timezone', () => {
      const now = DateFormatter.now();

      expect(now).toBeInstanceOf(Date);
      expect(now.getTime()).toBeLessThanOrEqual(Date.now());
      expect(now.getTime()).toBeGreaterThan(Date.now() - 1000); // Within last second
    });
  });

  describe('round-trip conversion', () => {
    it('should convert date to AFIP format and back', () => {
      const originalDate = new Date('2025-01-15');
      const afipFormat = DateFormatter.toAFIPFormat(originalDate);
      const parsedDate = DateFormatter.fromAFIPFormat(afipFormat);

      expect(parsedDate.getFullYear()).toBe(originalDate.getFullYear());
      expect(parsedDate.getMonth()).toBe(originalDate.getMonth());
      expect(parsedDate.getDate()).toBe(originalDate.getDate());
    });
  });
});
