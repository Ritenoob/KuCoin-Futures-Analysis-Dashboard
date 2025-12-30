import { Result, ok, err } from '../../../shared/result';
import { ValueObjectError } from './price';

export class InvalidTimestampError extends ValueObjectError {
  constructor(value: number | string | Date) {
    super(`Invalid timestamp: ${value}. Timestamp must be a valid date/time.`);
    this.name = 'InvalidTimestampError';
  }
}

/**
 * Timestamp value object - represents a point in time
 * Uses milliseconds since Unix epoch internally
 */
export class Timestamp {
  private readonly _value: number;

  private constructor(value: number) {
    this._value = value;
  }

  /**
   * Creates a Timestamp from a millisecond epoch value, Date, or ISO string.
   * Returns Result to avoid throwing in hot paths.
   */
  static create(value: number | string | Date): Result<Timestamp, InvalidTimestampError> {
    let epoch: number;

    if (value instanceof Date) {
      epoch = value.getTime();
    } else if (typeof value === 'string') {
      epoch = Date.parse(value);
    } else if (typeof value === 'number') {
      // Detect if value is in seconds (< 10^12) and convert to milliseconds
      epoch = value < 1e12 ? value * 1000 : value;
    } else {
      return err(new InvalidTimestampError(String(value)));
    }

    if (isNaN(epoch) || epoch < 0) {
      return err(new InvalidTimestampError(String(value)));
    }

    return ok(new Timestamp(epoch));
  }

  /**
   * Creates a Timestamp for the current time
   */
  static now(): Timestamp {
    return new Timestamp(Date.now());
  }

  /**
   * Creates a Timestamp without validation
   */
  static unsafe(value: number): Timestamp {
    return new Timestamp(value < 1e12 ? value * 1000 : value);
  }

  /**
   * Returns the timestamp as milliseconds since epoch
   */
  get epochMs(): number {
    return this._value;
  }

  /**
   * Returns the timestamp as seconds since epoch
   */
  get epochSeconds(): number {
    return Math.floor(this._value / 1000);
  }

  /**
   * Returns the timestamp as a Date object
   */
  toDate(): Date {
    return new Date(this._value);
  }

  /**
   * Returns the timestamp as an ISO string
   */
  toISO(): string {
    return new Date(this._value).toISOString();
  }

  /**
   * Returns true if this timestamp is before the other
   */
  isBefore(other: Timestamp): boolean {
    return this._value < other._value;
  }

  /**
   * Returns true if this timestamp is after the other
   */
  isAfter(other: Timestamp): boolean {
    return this._value > other._value;
  }

  /**
   * Returns the difference in milliseconds between timestamps
   */
  diff(other: Timestamp): number {
    return Math.abs(this._value - other._value);
  }

  /**
   * Adds milliseconds to the timestamp
   */
  addMs(ms: number): Timestamp {
    return new Timestamp(this._value + ms);
  }

  /**
   * Adds seconds to the timestamp
   */
  addSeconds(seconds: number): Timestamp {
    return this.addMs(seconds * 1000);
  }

  /**
   * Adds minutes to the timestamp
   */
  addMinutes(minutes: number): Timestamp {
    return this.addMs(minutes * 60 * 1000);
  }

  equals(other: Timestamp): boolean {
    return this._value === other._value;
  }

  toString(): string {
    return this._value.toString();
  }
}
