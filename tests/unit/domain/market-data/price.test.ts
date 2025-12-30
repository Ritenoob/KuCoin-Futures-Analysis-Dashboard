import Decimal from 'decimal.js';
import { Price, InvalidPriceError } from '../../../../src/domain/market-data/value-objects/price';
import { isOk, isErr } from '../../../../src/shared/result';

describe('Price Value Object', () => {
  describe('create', () => {
    it('should create a valid price from number', () => {
      const result = Price.create(100);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toNumber()).toBe(100);
      }
    });

    it('should create a valid price from string', () => {
      const result = Price.create('99.99');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toString()).toBe('99.99');
      }
    });

    it('should create a valid price from Decimal', () => {
      const decimal = new Decimal('123.456789');
      const result = Price.create(decimal);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toString()).toBe('123.456789');
      }
    });

    it('should return error for zero price', () => {
      const result = Price.create(0);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(InvalidPriceError);
      }
    });

    it('should return error for negative price', () => {
      const result = Price.create(-10);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(InvalidPriceError);
      }
    });

    it('should return error for invalid string', () => {
      const result = Price.create('invalid');
      expect(isErr(result)).toBe(true);
    });

    it('should return error for NaN', () => {
      const result = Price.create(NaN);
      expect(isErr(result)).toBe(true);
    });
  });

  describe('unsafe', () => {
    it('should create price without validation', () => {
      const price = Price.unsafe(100);
      expect(price.toNumber()).toBe(100);
    });
  });

  describe('arithmetic operations', () => {
    const price1 = Price.unsafe(100);
    const price2 = Price.unsafe(50);

    it('should add prices correctly', () => {
      const result = price1.add(price2);
      expect(result.toNumber()).toBe(150);
    });

    it('should subtract prices correctly', () => {
      const result = price1.subtract(price2);
      expect(result.toNumber()).toBe(50);
    });

    it('should multiply by factor', () => {
      const result = price1.multiply(2);
      expect(result.toNumber()).toBe(200);
    });

    it('should divide by factor', () => {
      const result = price1.divide(4);
      expect(result.toNumber()).toBe(25);
    });
  });

  describe('comparison operations', () => {
    const price100 = Price.unsafe(100);
    const price50 = Price.unsafe(50);
    const price100b = Price.unsafe(100);

    it('should check equality correctly', () => {
      expect(price100.equals(price100b)).toBe(true);
      expect(price100.equals(price50)).toBe(false);
    });

    it('should compare greater than correctly', () => {
      expect(price100.greaterThan(price50)).toBe(true);
      expect(price50.greaterThan(price100)).toBe(false);
    });

    it('should compare less than correctly', () => {
      expect(price50.lessThan(price100)).toBe(true);
      expect(price100.lessThan(price50)).toBe(false);
    });

    it('should compare greater than or equal correctly', () => {
      expect(price100.greaterThanOrEqual(price100b)).toBe(true);
      expect(price100.greaterThanOrEqual(price50)).toBe(true);
      expect(price50.greaterThanOrEqual(price100)).toBe(false);
    });

    it('should compare less than or equal correctly', () => {
      expect(price50.lessThanOrEqual(price100)).toBe(true);
      expect(price100.lessThanOrEqual(price100b)).toBe(true);
      expect(price100.lessThanOrEqual(price50)).toBe(false);
    });
  });

  describe('serialization', () => {
    it('should convert to string correctly', () => {
      const price = Price.unsafe('123.456');
      expect(price.toString()).toBe('123.456');
    });

    it('should convert to number correctly', () => {
      const price = Price.unsafe(100);
      expect(price.toNumber()).toBe(100);
    });

    it('should provide access to Decimal value', () => {
      const price = Price.unsafe(100);
      expect(price.value).toBeInstanceOf(Decimal);
    });
  });
});
