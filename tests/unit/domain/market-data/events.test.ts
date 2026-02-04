import {
  generateEventId,
  createTradeExecutedEvent,
  createOrderBookUpdatedEvent,
  createCandleCreatedEvent
} from '../../../../src/domain/market-data/events/market-data-events';

describe('Market Data Events', () => {
  describe('generateEventId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateEventId();
      const id2 = generateEventId();
      expect(id1).not.toBe(id2);
    });

    it('should include timestamp component', () => {
      const id = generateEventId();
      const parts = id.split('-');
      expect(parts.length).toBe(2);
      expect(parseInt(parts[0] ?? '0', 10)).toBeGreaterThan(0);
    });
  });

  describe('createTradeExecutedEvent', () => {
    it('should create TradeExecutedEvent with correct structure', () => {
      const event = createTradeExecutedEvent({
        symbol: 'BTCUSDT',
        price: '42000.50',
        quantity: '0.5',
        side: 'buy',
        tradeId: 'trade-123'
      });

      expect(event.eventType).toBe('TradeExecuted');
      expect(event.aggregateId).toBe('BTCUSDT');
      expect(event.version).toBe(1);
      expect(event.eventId).toBeDefined();
      expect(event.timestamp).toBeDefined();
      expect(event.payload).toEqual({
        symbol: 'BTCUSDT',
        price: '42000.50',
        quantity: '0.5',
        side: 'buy',
        tradeId: 'trade-123'
      });
    });
  });

  describe('createOrderBookUpdatedEvent', () => {
    it('should create OrderBookUpdatedEvent with correct structure', () => {
      const event = createOrderBookUpdatedEvent({
        symbol: 'ETHUSDT',
        bestBid: '2500.00',
        bestAsk: '2500.50',
        spread: '0.50',
        sequence: 12345
      });

      expect(event.eventType).toBe('OrderBookUpdated');
      expect(event.aggregateId).toBe('ETHUSDT');
      expect(event.version).toBe(1);
      expect(event.payload).toEqual({
        symbol: 'ETHUSDT',
        bestBid: '2500.00',
        bestAsk: '2500.50',
        spread: '0.50',
        sequence: 12345
      });
    });
  });

  describe('createCandleCreatedEvent', () => {
    it('should create CandleCreatedEvent with correct structure', () => {
      const event = createCandleCreatedEvent({
        symbol: 'BTCUSDT',
        timeframe: '1h',
        open: '41000',
        high: '42500',
        low: '40800',
        close: '42000',
        volume: '1000',
        candleTimestamp: 1704067200000
      });

      expect(event.eventType).toBe('CandleCreated');
      expect(event.aggregateId).toBe('BTCUSDT');
      expect(event.version).toBe(1);
      expect(event.payload).toEqual({
        symbol: 'BTCUSDT',
        timeframe: '1h',
        open: '41000',
        high: '42500',
        low: '40800',
        close: '42000',
        volume: '1000',
        candleTimestamp: 1704067200000
      });
    });
  });
});
