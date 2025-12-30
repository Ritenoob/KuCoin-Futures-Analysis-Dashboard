import Decimal from 'decimal.js';
import { Result, ok, err } from '../../../shared/result';

/**
 * Domain error types for value objects
 */
export class ValueObjectError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValueObjectError';
  }
}

export class InvalidPriceError extends ValueObjectError {
  constructor(value: string | number) {
    super(`Invalid price: ${value}. Price must be a positive number.`);
    this.name = 'InvalidPriceError';
  }
}

/**
 * Price value object - immutable, validated price using decimal.js
 * All financial calculations must use this to avoid floating-point errors
 */
export class Price {
  private readonly _value: Decimal;

  private constructor(value: Decimal) {
    this._value = value;
  }

  /**
   * Creates a Price from a string or number value.
   * Returns Result to avoid throwing in hot paths.
   */
  static create(value: string | number | Decimal): Result<Price, InvalidPriceError> {
    try {
      const decimal = new Decimal(value);
      if (decimal.isNaN() || decimal.isNegative() || decimal.isZero()) {
        return err(new InvalidPriceError(String(value)));
      }
      return ok(new Price(decimal));
    } catch {
      return err(new InvalidPriceError(String(value)));
    }
  }

  /**
   * Creates a Price without validation - use only when value is guaranteed valid.
   * Marked unsafe for hot paths where validation overhead is unacceptable.
   */
  static unsafe(value: string | number | Decimal): Price {
    return new Price(new Decimal(value));
  }

  get value(): Decimal {
    return this._value;
  }

  /**
   * Returns the price as a string for serialization
   */
  toString(): string {
    return this._value.toString();
  }

  /**
   * Returns the price as a number (use with caution for display only)
   */
  toNumber(): number {
    return this._value.toNumber();
  }

  /**
   * Adds another price, returning a new Price
   */
  add(other: Price): Price {
    return new Price(this._value.plus(other._value));
  }

  /**
   * Subtracts another price, returning a new Price
   */
  subtract(other: Price): Price {
    return new Price(this._value.minus(other._value));
  }

  /**
   * Multiplies by a factor (for quantity calculations)
   */
  multiply(factor: Decimal | number | string): Price {
    return new Price(this._value.times(factor));
  }

  /**
   * Divides by a factor
   */
  divide(factor: Decimal | number | string): Price {
    return new Price(this._value.dividedBy(factor));
  }

  /**
   * Compares two prices
   */
  equals(other: Price): boolean {
    return this._value.equals(other._value);
  }

  /**
   * Returns true if this price is greater than the other
   */
  greaterThan(other: Price): boolean {
    return this._value.greaterThan(other._value);
  }

  /**
   * Returns true if this price is less than the other
   */
  lessThan(other: Price): boolean {
    return this._value.lessThan(other._value);
  }

  /**
   * Returns true if this price is greater than or equal to the other
   */
  greaterThanOrEqual(other: Price): boolean {
    return this._value.greaterThanOrEqualTo(other._value);
  }

  /**
   * Returns true if this price is less than or equal to the other
   */
  lessThanOrEqual(other: Price): boolean {
    return this._value.lessThanOrEqualTo(other._value);
  }
}
