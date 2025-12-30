import { OHLCV, Timeframe } from '../../../../src/domain/market-data/entities/ohlcv';
import { Price, Quantity, Symbol, Timestamp } from '../../../../src/domain/market-data/value-objects';

describe('OHLCV Entity', () => {
  const createTestCandle = (params?: Partial<{
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
  }>) => {
    return OHLCV.fromRaw({
      symbol: 'BTCUSDT',
      timeframe: '1h',
      timestamp: 1704067200000,
      open: params?.open ?? 100,
      high: params?.high ?? 110,
      low: params?.low ?? 95,
      close: params?.close ?? 105,
      volume: params?.volume ?? 1000
    });
  };

  describe('fromRaw', () => {
    it('should create OHLCV from raw data', () => {
      const candle = OHLCV.fromRaw({
        symbol: 'BTCUSDT',
        timeframe: '1h',
        timestamp: 1704067200000,
        open: '100.5',
        high: '110.25',
        low: '95.75',
        close: '105.00',
        volume: '1000.5'
      });

      expect(candle.symbol.value).toBe('BTCUSDT');
      expect(candle.timeframe).toBe('1h');
      expect(candle.timestamp.epochMs).toBe(1704067200000);
      expect(candle.open.toString()).toBe('100.5');
      expect(candle.high.toString()).toBe('110.25');
      expect(candle.low.toString()).toBe('95.75');
      expect(candle.close.toString()).toBe('105');
      expect(candle.volume.toString()).toBe('1000.5');
    });
  });

  describe('constructor', () => {
    it('should create OHLCV with value objects', () => {
      const candle = new OHLCV({
        symbol: Symbol.unsafe('ETHUSDT'),
        timeframe: '4h' as Timeframe,
        timestamp: Timestamp.unsafe(1704067200000),
        open: Price.unsafe(2000),
        high: Price.unsafe(2100),
        low: Price.unsafe(1950),
        close: Price.unsafe(2050),
        volume: Quantity.unsafe(500)
      });

      expect(candle.symbol.value).toBe('ETHUSDT');
      expect(candle.timeframe).toBe('4h');
    });
  });

  describe('isBullish / isBearish', () => {
    it('should identify bullish candle', () => {
      const candle = createTestCandle({ open: 100, close: 105 });
      expect(candle.isBullish()).toBe(true);
      expect(candle.isBearish()).toBe(false);
    });

    it('should identify bearish candle', () => {
      const candle = createTestCandle({ open: 105, close: 100 });
      expect(candle.isBullish()).toBe(false);
      expect(candle.isBearish()).toBe(true);
    });

    it('should handle doji (equal open/close)', () => {
      const candle = createTestCandle({ open: 100, close: 100 });
      expect(candle.isBullish()).toBe(false);
      expect(candle.isBearish()).toBe(false);
    });
  });

  describe('bodySize', () => {
    it('should calculate body size for bullish candle', () => {
      const candle = createTestCandle({ open: 100, close: 105 });
      expect(candle.bodySize().toNumber()).toBe(5);
    });

    it('should calculate body size for bearish candle', () => {
      const candle = createTestCandle({ open: 105, close: 100 });
      expect(candle.bodySize().toNumber()).toBe(5);
    });
  });

  describe('range', () => {
    it('should calculate range (high - low)', () => {
      const candle = createTestCandle({ high: 110, low: 95 });
      expect(candle.range().toNumber()).toBe(15);
    });
  });

  describe('upperWick', () => {
    it('should calculate upper wick for bullish candle', () => {
      const candle = createTestCandle({ open: 100, high: 110, close: 105 });
      expect(candle.upperWick().toNumber()).toBe(5); // 110 - 105
    });

    it('should calculate upper wick for bearish candle', () => {
      const candle = createTestCandle({ open: 105, high: 110, close: 100 });
      expect(candle.upperWick().toNumber()).toBe(5); // 110 - 105
    });
  });

  describe('lowerWick', () => {
    it('should calculate lower wick for bullish candle', () => {
      const candle = createTestCandle({ open: 100, low: 95, close: 105 });
      expect(candle.lowerWick().toNumber()).toBe(5); // 100 - 95
    });

    it('should calculate lower wick for bearish candle', () => {
      const candle = createTestCandle({ open: 105, low: 95, close: 100 });
      expect(candle.lowerWick().toNumber()).toBe(5); // 100 - 95
    });
  });

  describe('typicalPrice', () => {
    it('should calculate typical price', () => {
      const candle = createTestCandle({ high: 110, low: 100, close: 105 });
      const typical = candle.typicalPrice().toNumber();
      expect(typical).toBeCloseTo(105, 5); // (110 + 100 + 105) / 3 = 105
    });
  });

  describe('toJSON', () => {
    it('should serialize to plain object', () => {
      const candle = createTestCandle();
      const json = candle.toJSON();

      expect(json).toEqual({
        symbol: 'BTCUSDT',
        timeframe: '1h',
        timestamp: 1704067200000,
        open: '100',
        high: '110',
        low: '95',
        close: '105',
        volume: '1000'
      });
    });
  });
});
