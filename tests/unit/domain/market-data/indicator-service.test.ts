import Decimal from 'decimal.js';
import { SMA, EMA, RSI, MACD } from '../../../../src/domain/market-data/services/indicator-service';
import { OHLCV } from '../../../../src/domain/market-data/entities/ohlcv';

const createCandle = (close: number, timestamp: number = 1704067200000) => {
  return OHLCV.fromRaw({
    symbol: 'BTCUSDT',
    timeframe: '1h',
    timestamp,
    open: close,
    high: close + 1,
    low: close - 1,
    close,
    volume: 100
  });
};

describe('SMA (Simple Moving Average)', () => {
  describe('constructor', () => {
    it('should throw for period less than 1', () => {
      expect(() => new SMA(0)).toThrow('Period must be at least 1');
    });

    it('should accept valid period', () => {
      const sma = new SMA(14);
      expect(sma.period).toBe(14);
    });
  });

  describe('update', () => {
    it('should return undefined during warmup period', () => {
      const sma = new SMA(3);
      
      expect(sma.update(createCandle(100))).toBeUndefined();
      expect(sma.update(createCandle(102))).toBeUndefined();
      expect(sma.values.length).toBe(0);
    });

    it('should calculate SMA after warmup', () => {
      const sma = new SMA(3);
      
      sma.update(createCandle(100));
      sma.update(createCandle(102));
      const result = sma.update(createCandle(104));

      expect(result?.value.toNumber()).toBe(102); // (100 + 102 + 104) / 3
    });

    it('should slide the window correctly', () => {
      const sma = new SMA(3);
      
      sma.update(createCandle(100));
      sma.update(createCandle(102));
      sma.update(createCandle(104));
      const result = sma.update(createCandle(106));

      // New window: 102, 104, 106
      expect(result?.value.toNumber()).toBe(104); // (102 + 104 + 106) / 3
    });

    it('should maintain values history', () => {
      const sma = new SMA(2);
      
      sma.update(createCandle(100));
      sma.update(createCandle(102)); // SMA = 101
      sma.update(createCandle(104)); // SMA = 103

      expect(sma.values.length).toBe(2);
      expect(sma.values[0]?.value.toNumber()).toBe(101);
      expect(sma.values[1]?.value.toNumber()).toBe(103);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const sma = new SMA(2);
      
      sma.update(createCandle(100));
      sma.update(createCandle(102));
      
      sma.reset();

      expect(sma.values.length).toBe(0);
      expect(sma.current).toBeUndefined();
    });
  });
});

describe('EMA (Exponential Moving Average)', () => {
  describe('update', () => {
    it('should return undefined during warmup period', () => {
      const ema = new EMA(3);
      
      expect(ema.update(createCandle(100))).toBeUndefined();
      expect(ema.update(createCandle(102))).toBeUndefined();
    });

    it('should calculate initial EMA as SMA', () => {
      const ema = new EMA(3);
      
      ema.update(createCandle(100));
      ema.update(createCandle(102));
      const result = ema.update(createCandle(104));

      // Initial EMA = SMA = (100 + 102 + 104) / 3 = 102
      expect(result?.value.toNumber()).toBe(102);
    });

    it('should apply EMA formula after warmup', () => {
      const ema = new EMA(3);
      // Multiplier = 2 / (3 + 1) = 0.5

      ema.update(createCandle(100));
      ema.update(createCandle(102));
      ema.update(createCandle(104)); // Initial EMA = 102
      const result = ema.update(createCandle(110));

      // EMA = (110 - 102) * 0.5 + 102 = 4 + 102 = 106
      expect(result?.value.toNumber()).toBe(106);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const ema = new EMA(3);
      
      ema.update(createCandle(100));
      ema.update(createCandle(102));
      ema.update(createCandle(104));
      
      ema.reset();

      expect(ema.values.length).toBe(0);
      expect(ema.current).toBeUndefined();
    });
  });
});

describe('RSI (Relative Strength Index)', () => {
  describe('update', () => {
    it('should return undefined during warmup period', () => {
      const rsi = new RSI(3);
      
      // Need period + 1 candles to get first RSI
      expect(rsi.update(createCandle(100))).toBeUndefined();
      expect(rsi.update(createCandle(102))).toBeUndefined();
      expect(rsi.update(createCandle(104))).toBeUndefined();
    });

    it('should calculate RSI after warmup', () => {
      const rsi = new RSI(3);
      
      // Increasing prices = 100% gains
      rsi.update(createCandle(100));
      rsi.update(createCandle(102)); // +2
      rsi.update(createCandle(104)); // +2
      const result = rsi.update(createCandle(106)); // +2

      // All gains, no losses: RS = avgGain / avgLoss = infinity => RSI = 100
      expect(result?.value.toNumber()).toBe(100);
    });

    it('should calculate RSI for declining prices', () => {
      const rsi = new RSI(3);
      
      // Decreasing prices = 100% losses
      rsi.update(createCandle(106));
      rsi.update(createCandle(104)); // -2
      rsi.update(createCandle(102)); // -2
      const result = rsi.update(createCandle(100)); // -2

      // All losses, no gains: RS = 0 => RSI = 0
      expect(result?.value.toNumber()).toBe(0);
    });

    it('should calculate RSI for mixed price changes', () => {
      const rsi = new RSI(2);
      
      rsi.update(createCandle(100));
      rsi.update(createCandle(104)); // +4 gain
      const result = rsi.update(createCandle(102)); // -2 loss

      // avgGain = 4/2 = 2, avgLoss = 2/2 = 1
      // RS = 2/1 = 2
      // RSI = 100 - (100 / (1 + 2)) = 100 - 33.33 = 66.67
      expect(result?.value.toNumber()).toBeCloseTo(66.67, 1);
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const rsi = new RSI(3);
      
      rsi.update(createCandle(100));
      rsi.update(createCandle(102));
      rsi.update(createCandle(104));
      rsi.update(createCandle(106));
      
      rsi.reset();

      expect(rsi.values.length).toBe(0);
      expect(rsi.current).toBeUndefined();
    });
  });
});

describe('MACD', () => {
  describe('constructor', () => {
    it('should use default periods', () => {
      const macd = new MACD();
      expect(macd).toBeDefined();
    });

    it('should accept custom periods', () => {
      const macd = new MACD(8, 17, 9);
      expect(macd).toBeDefined();
    });
  });

  describe('update', () => {
    it('should return undefined during warmup period', () => {
      const macd = new MACD(3, 5, 3);
      
      // Need slow period (5) + signal period (3) - 1 = 7 candles minimum
      for (let i = 0; i < 5; i++) {
        expect(macd.update(createCandle(100 + i))).toBeUndefined();
      }
    });

    it('should calculate MACD after warmup', () => {
      const macd = new MACD(2, 3, 2);
      
      // Generate enough data
      for (let i = 0; i < 10; i++) {
        macd.update(createCandle(100 + i * 2, 1704067200000 + i * 3600000));
      }

      const current = macd.current;
      expect(current).toBeDefined();
      expect(current?.macd).toBeInstanceOf(Decimal);
      expect(current?.signal).toBeInstanceOf(Decimal);
      expect(current?.histogram).toBeInstanceOf(Decimal);
    });

    it('should calculate histogram as MACD minus signal', () => {
      const macd = new MACD(2, 3, 2);
      
      // Generate trending data
      for (let i = 0; i < 10; i++) {
        macd.update(createCandle(100 + i * 5, 1704067200000 + i * 3600000));
      }

      const current = macd.current;
      if (current) {
        const expectedHistogram = current.macd.minus(current.signal);
        expect(current.histogram.equals(expectedHistogram)).toBe(true);
      }
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      const macd = new MACD(2, 3, 2);
      
      for (let i = 0; i < 10; i++) {
        macd.update(createCandle(100 + i));
      }
      
      macd.reset();

      expect(macd.values.length).toBe(0);
      expect(macd.current).toBeUndefined();
    });
  });
});
