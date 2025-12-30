import { Quantity, InvalidQuantityError } from '../../../../src/domain/market-data/value-objects/quantity';
import { isOk, isErr } from '../../../../src/shared/result';

describe('Quantity Value Object', () => {
  describe('create', () => {
    it('should create a valid quantity from number', () => {
      const result = Quantity.create(100);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toNumber()).toBe(100);
      }
    });

    it('should create a valid quantity from string', () => {
      const result = Quantity.create('50.5');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toString()).toBe('50.5');
      }
    });

    it('should allow zero quantity', () => {
      const result = Quantity.create(0);
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.toNumber()).toBe(0);
      }
    });

    it('should return error for negative quantity', () => {
      const result = Quantity.create(-10);
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(InvalidQuantityError);
      }
    });

    it('should return error for invalid string', () => {
      const result = Quantity.create('invalid');
      expect(isErr(result)).toBe(true);
    });
  });

  describe('zero', () => {
    it('should create a zero quantity', () => {
      const qty = Quantity.zero();
      expect(qty.isZero()).toBe(true);
      expect(qty.toNumber()).toBe(0);
    });
  });

  describe('arithmetic operations', () => {
    const qty1 = Quantity.unsafe(100);
    const qty2 = Quantity.unsafe(30);

    it('should add quantities correctly', () => {
      const result = qty1.add(qty2);
      expect(result.toNumber()).toBe(130);
    });

    it('should subtract quantities correctly', () => {
      const result = qty1.subtract(qty2);
      expect(result.toNumber()).toBe(70);
    });

    it('should return zero when subtracting more than available', () => {
      const result = qty2.subtract(qty1);
      expect(result.toNumber()).toBe(0);
    });

    it('should multiply by factor', () => {
      const result = qty1.multiply(2);
      expect(result.toNumber()).toBe(200);
    });

    it('should divide by factor', () => {
      const result = qty1.divide(4);
      expect(result.toNumber()).toBe(25);
    });
  });

  describe('comparison operations', () => {
    const qty100 = Quantity.unsafe(100);
    const qty50 = Quantity.unsafe(50);
    const qty100b = Quantity.unsafe(100);

    it('should check equality correctly', () => {
      expect(qty100.equals(qty100b)).toBe(true);
      expect(qty100.equals(qty50)).toBe(false);
    });

    it('should compare greater than correctly', () => {
      expect(qty100.greaterThan(qty50)).toBe(true);
      expect(qty50.greaterThan(qty100)).toBe(false);
    });

    it('should compare less than correctly', () => {
      expect(qty50.lessThan(qty100)).toBe(true);
      expect(qty100.lessThan(qty50)).toBe(false);
    });
  });

  describe('isZero', () => {
    it('should return true for zero quantity', () => {
      expect(Quantity.zero().isZero()).toBe(true);
    });

    it('should return false for non-zero quantity', () => {
      expect(Quantity.unsafe(1).isZero()).toBe(false);
    });
  });
});
