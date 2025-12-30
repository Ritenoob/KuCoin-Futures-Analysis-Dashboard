import { Trade } from '../../../../src/domain/market-data/entities/trade';
import { Price, Quantity, Symbol, Timestamp } from '../../../../src/domain/market-data/value-objects';

describe('Trade Entity', () => {
  describe('fromRaw', () => {
    it('should create Trade from raw data', () => {
      const trade = Trade.fromRaw({
        id: 'trade-123',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: '42000.50',
        quantity: '0.5',
        side: 'buy'
      });

      expect(trade.id).toBe('trade-123');
      expect(trade.symbol.value).toBe('BTCUSDT');
      expect(trade.timestamp.epochMs).toBe(1704067200000);
      expect(trade.price.toString()).toBe('42000.5');
      expect(trade.quantity.toString()).toBe('0.5');
      expect(trade.side).toBe('buy');
    });
  });

  describe('constructor', () => {
    it('should create Trade with value objects', () => {
      const trade = new Trade({
        id: 'trade-456',
        symbol: Symbol.unsafe('ETHUSDT'),
        timestamp: Timestamp.unsafe(1704067200000),
        price: Price.unsafe(2500),
        quantity: Quantity.unsafe(1.5),
        side: 'sell'
      });

      expect(trade.id).toBe('trade-456');
      expect(trade.symbol.value).toBe('ETHUSDT');
      expect(trade.side).toBe('sell');
    });
  });

  describe('isBuy / isSell', () => {
    it('should identify buy trade', () => {
      const trade = Trade.fromRaw({
        id: '1',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: 100,
        quantity: 1,
        side: 'buy'
      });

      expect(trade.isBuy()).toBe(true);
      expect(trade.isSell()).toBe(false);
    });

    it('should identify sell trade', () => {
      const trade = Trade.fromRaw({
        id: '1',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: 100,
        quantity: 1,
        side: 'sell'
      });

      expect(trade.isBuy()).toBe(false);
      expect(trade.isSell()).toBe(true);
    });
  });

  describe('notionalValue', () => {
    it('should calculate notional value (price * quantity)', () => {
      const trade = Trade.fromRaw({
        id: '1',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: 42000,
        quantity: 0.5,
        side: 'buy'
      });

      const notional = trade.notionalValue();
      expect(notional.toNumber()).toBe(21000); // 42000 * 0.5
    });

    it('should handle decimal precision', () => {
      const trade = Trade.fromRaw({
        id: '1',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: '0.123456789',
        quantity: '100.123456789',
        side: 'buy'
      });

      const notional = trade.notionalValue();
      // Using decimal.js should maintain precision
      // 0.123456789 * 100.123456789 = 12.360920478750190521
      expect(notional.toString()).toBe('12.360920478750190521');
    });
  });

  describe('toJSON', () => {
    it('should serialize to plain object', () => {
      const trade = Trade.fromRaw({
        id: 'trade-789',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: 42000,
        quantity: 1.5,
        side: 'buy'
      });

      const json = trade.toJSON();

      expect(json).toEqual({
        id: 'trade-789',
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        price: '42000',
        quantity: '1.5',
        side: 'buy'
      });
    });
  });
});
