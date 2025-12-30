import Decimal from 'decimal.js';
import { Result, ok, err } from '../../../shared/result';
import { ValueObjectError } from './price';

export class InvalidQuantityError extends ValueObjectError {
  constructor(value: string | number) {
    super(`Invalid quantity: ${value}. Quantity must be a non-negative number.`);
    this.name = 'InvalidQuantityError';
  }
}

/**
 * Quantity value object - immutable, validated quantity using decimal.js
 * Represents amount of an asset (can be zero, cannot be negative)
 */
export class Quantity {
  private readonly _value: Decimal;

  private constructor(value: Decimal) {
    this._value = value;
  }

  /**
   * Creates a Quantity from a string or number value.
   * Returns Result to avoid throwing in hot paths.
   */
  static create(value: string | number | Decimal): Result<Quantity, InvalidQuantityError> {
    try {
      const decimal = new Decimal(value);
      if (decimal.isNaN() || decimal.isNegative()) {
        return err(new InvalidQuantityError(String(value)));
      }
      return ok(new Quantity(decimal));
    } catch {
      return err(new InvalidQuantityError(String(value)));
    }
  }

  /**
   * Creates a zero quantity
   */
  static zero(): Quantity {
    return new Quantity(new Decimal(0));
  }

  /**
   * Creates a Quantity without validation - use only when value is guaranteed valid.
   */
  static unsafe(value: string | number | Decimal): Quantity {
    return new Quantity(new Decimal(value));
  }

  get value(): Decimal {
    return this._value;
  }

  toString(): string {
    return this._value.toString();
  }

  toNumber(): number {
    return this._value.toNumber();
  }

  isZero(): boolean {
    return this._value.isZero();
  }

  add(other: Quantity): Quantity {
    return new Quantity(this._value.plus(other._value));
  }

  subtract(other: Quantity): Quantity {
    const result = this._value.minus(other._value);
    if (result.isNegative()) {
      return Quantity.zero();
    }
    return new Quantity(result);
  }

  multiply(factor: Decimal | number | string): Quantity {
    return new Quantity(this._value.times(factor));
  }

  divide(factor: Decimal | number | string): Quantity {
    return new Quantity(this._value.dividedBy(factor));
  }

  equals(other: Quantity): boolean {
    return this._value.equals(other._value);
  }

  greaterThan(other: Quantity): boolean {
    return this._value.greaterThan(other._value);
  }

  lessThan(other: Quantity): boolean {
    return this._value.lessThan(other._value);
  }

  greaterThanOrEqual(other: Quantity): boolean {
    return this._value.greaterThanOrEqualTo(other._value);
  }

  lessThanOrEqual(other: Quantity): boolean {
    return this._value.lessThanOrEqualTo(other._value);
  }
}
