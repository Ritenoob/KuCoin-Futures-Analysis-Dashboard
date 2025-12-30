import { Timestamp, InvalidTimestampError } from '../../../../src/domain/market-data/value-objects/timestamp';
import { isOk, isErr } from '../../../../src/shared/result';

describe('Timestamp Value Object', () => {
  describe('create', () => {
    it('should create from milliseconds timestamp', () => {
      const ms = 1704067200000; // 2024-01-01 00:00:00 UTC
      const result = Timestamp.create(ms);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.epochMs).toBe(ms);
      }
    });

    it('should create from seconds timestamp and convert to ms', () => {
      const seconds = 1704067200; // 2024-01-01 00:00:00 UTC
      const result = Timestamp.create(seconds);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.epochMs).toBe(seconds * 1000);
      }
    });

    it('should create from ISO string', () => {
      const iso = '2024-01-01T00:00:00.000Z';
      const result = Timestamp.create(iso);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.epochMs).toBe(1704067200000);
      }
    });

    it('should create from Date object', () => {
      const date = new Date('2024-01-01T00:00:00.000Z');
      const result = Timestamp.create(date);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.epochMs).toBe(1704067200000);
      }
    });

    it('should return error for invalid string', () => {
      const result = Timestamp.create('invalid date');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(InvalidTimestampError);
      }
    });

    it('should return error for negative timestamp', () => {
      const result = Timestamp.create(-1);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('now', () => {
    it('should create timestamp for current time', () => {
      const before = Date.now();
      const timestamp = Timestamp.now();
      const after = Date.now();
      
      expect(timestamp.epochMs).toBeGreaterThanOrEqual(before);
      expect(timestamp.epochMs).toBeLessThanOrEqual(after);
    });
  });

  describe('unsafe', () => {
    it('should create timestamp without validation', () => {
      const ts = Timestamp.unsafe(1704067200000);
      expect(ts.epochMs).toBe(1704067200000);
    });

    it('should convert seconds to milliseconds', () => {
      const ts = Timestamp.unsafe(1704067200);
      expect(ts.epochMs).toBe(1704067200000);
    });
  });

  describe('epochSeconds', () => {
    it('should return timestamp in seconds', () => {
      const ts = Timestamp.unsafe(1704067200000);
      expect(ts.epochSeconds).toBe(1704067200);
    });
  });

  describe('toDate', () => {
    it('should return a Date object', () => {
      const ts = Timestamp.unsafe(1704067200000);
      const date = ts.toDate();
      expect(date).toBeInstanceOf(Date);
      expect(date.getTime()).toBe(1704067200000);
    });
  });

  describe('toISO', () => {
    it('should return ISO string', () => {
      const ts = Timestamp.unsafe(1704067200000);
      expect(ts.toISO()).toBe('2024-01-01T00:00:00.000Z');
    });
  });

  describe('comparison', () => {
    const ts1 = Timestamp.unsafe(1704067200000);
    const ts2 = Timestamp.unsafe(1704153600000); // +1 day

    it('should compare isBefore correctly', () => {
      expect(ts1.isBefore(ts2)).toBe(true);
      expect(ts2.isBefore(ts1)).toBe(false);
    });

    it('should compare isAfter correctly', () => {
      expect(ts2.isAfter(ts1)).toBe(true);
      expect(ts1.isAfter(ts2)).toBe(false);
    });

    it('should check equality correctly', () => {
      const ts1b = Timestamp.unsafe(1704067200000);
      expect(ts1.equals(ts1b)).toBe(true);
      expect(ts1.equals(ts2)).toBe(false);
    });
  });

  describe('diff', () => {
    it('should calculate difference in milliseconds', () => {
      const ts1 = Timestamp.unsafe(1704067200000);
      const ts2 = Timestamp.unsafe(1704067260000); // +60 seconds
      expect(ts1.diff(ts2)).toBe(60000);
      expect(ts2.diff(ts1)).toBe(60000);
    });
  });

  describe('time arithmetic', () => {
    const ts = Timestamp.unsafe(1704067200000);

    it('should add milliseconds', () => {
      const result = ts.addMs(1000);
      expect(result.epochMs).toBe(1704067201000);
    });

    it('should add seconds', () => {
      const result = ts.addSeconds(60);
      expect(result.epochMs).toBe(1704067260000);
    });

    it('should add minutes', () => {
      const result = ts.addMinutes(5);
      expect(result.epochMs).toBe(1704067500000);
    });
  });
});
