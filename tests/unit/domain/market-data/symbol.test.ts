import { Symbol, InvalidSymbolError } from '../../../../src/domain/market-data/value-objects/symbol';
import { isOk, isErr } from '../../../../src/shared/result';

describe('Symbol Value Object', () => {
  describe('create', () => {
    it('should create a valid symbol from standard format', () => {
      const result = Symbol.create('BTCUSDT');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('BTCUSDT');
        expect(result.value.base).toBe('BTC');
        expect(result.value.quote).toBe('USDT');
      }
    });

    it('should create a valid symbol with dash separator', () => {
      const result = Symbol.create('BTC-USDT');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('BTC-USDT');
        expect(result.value.base).toBe('BTC');
        expect(result.value.quote).toBe('USDT');
      }
    });

    it('should create a valid symbol with underscore separator', () => {
      const result = Symbol.create('ETH_USDT');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('ETH_USDT');
        expect(result.value.base).toBe('ETH');
        expect(result.value.quote).toBe('USDT');
      }
    });

    it('should create a valid futures symbol ending with M', () => {
      const result = Symbol.create('XBTUSDTM');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('XBTUSDTM');
        expect(result.value.base).toBe('XBT');
        expect(result.value.quote).toBe('USDT');
      }
    });

    it('should normalize lowercase to uppercase', () => {
      const result = Symbol.create('btcusdt');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('BTCUSDT');
      }
    });

    it('should trim whitespace', () => {
      const result = Symbol.create('  BTCUSDT  ');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.value).toBe('BTCUSDT');
      }
    });

    it('should return error for empty string', () => {
      const result = Symbol.create('');
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error).toBeInstanceOf(InvalidSymbolError);
      }
    });

    it('should return error for invalid characters', () => {
      const result = Symbol.create('BTC@USDT');
      expect(isErr(result)).toBe(true);
    });
  });

  describe('unsafe', () => {
    it('should create symbol without validation', () => {
      const symbol = Symbol.unsafe('ETHUSDT');
      expect(symbol.value).toBe('ETHUSDT');
    });
  });

  describe('equality', () => {
    it('should consider same symbols equal', () => {
      const symbol1 = Symbol.unsafe('BTCUSDT');
      const symbol2 = Symbol.unsafe('BTCUSDT');
      expect(symbol1.equals(symbol2)).toBe(true);
    });

    it('should consider different symbols not equal', () => {
      const symbol1 = Symbol.unsafe('BTCUSDT');
      const symbol2 = Symbol.unsafe('ETHUSDT');
      expect(symbol1.equals(symbol2)).toBe(false);
    });
  });

  describe('toString', () => {
    it('should return the symbol value', () => {
      const symbol = Symbol.unsafe('BTCUSDT');
      expect(symbol.toString()).toBe('BTCUSDT');
    });
  });

  describe('base and quote parsing', () => {
    it('should parse USDC quote correctly', () => {
      const result = Symbol.create('ETHUSDC');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.base).toBe('ETH');
        expect(result.value.quote).toBe('USDC');
      }
    });

    it('should parse BTC quote correctly', () => {
      const result = Symbol.create('ETHBTC');
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value.base).toBe('ETH');
        expect(result.value.quote).toBe('BTC');
      }
    });
  });
});
