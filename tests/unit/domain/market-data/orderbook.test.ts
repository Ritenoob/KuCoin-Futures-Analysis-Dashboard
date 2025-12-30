import { OrderBook } from '../../../../src/domain/market-data/entities/orderbook';
import { Price, Quantity, Symbol, Timestamp } from '../../../../src/domain/market-data/value-objects';

describe('OrderBook Entity', () => {
  const createTestOrderBook = (params?: Partial<{
    bids: Array<[number, number]>;
    asks: Array<[number, number]>;
  }>) => {
    return OrderBook.fromRaw({
      symbol: 'BTCUSDT',
      timestamp: 1704067200000,
      bids: params?.bids ?? [[100, 10], [99, 20], [98, 30]],
      asks: params?.asks ?? [[101, 15], [102, 25], [103, 35]],
      sequence: 12345
    });
  };

  describe('fromRaw', () => {
    it('should create OrderBook from raw arrays', () => {
      const orderBook = createTestOrderBook();

      expect(orderBook.symbol.value).toBe('BTCUSDT');
      expect(orderBook.timestamp.epochMs).toBe(1704067200000);
      expect(orderBook.sequence).toBe(12345);
      expect(orderBook.bids.length).toBe(3);
      expect(orderBook.asks.length).toBe(3);
    });

    it('should sort bids in descending order', () => {
      const orderBook = OrderBook.fromRaw({
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        bids: [[98, 10], [100, 20], [99, 15]],
        asks: [],
        sequence: 1
      });

      expect(orderBook.bids[0]?.price.toNumber()).toBe(100);
      expect(orderBook.bids[1]?.price.toNumber()).toBe(99);
      expect(orderBook.bids[2]?.price.toNumber()).toBe(98);
    });

    it('should sort asks in ascending order', () => {
      const orderBook = OrderBook.fromRaw({
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        bids: [],
        asks: [[103, 10], [101, 20], [102, 15]],
        sequence: 1
      });

      expect(orderBook.asks[0]?.price.toNumber()).toBe(101);
      expect(orderBook.asks[1]?.price.toNumber()).toBe(102);
      expect(orderBook.asks[2]?.price.toNumber()).toBe(103);
    });
  });

  describe('constructor', () => {
    it('should create OrderBook with value objects', () => {
      const orderBook = new OrderBook({
        symbol: Symbol.unsafe('ETHUSDT'),
        timestamp: Timestamp.unsafe(1704067200000),
        bids: [{ price: Price.unsafe(2000), quantity: Quantity.unsafe(5) }],
        asks: [{ price: Price.unsafe(2001), quantity: Quantity.unsafe(5) }]
      });

      expect(orderBook.symbol.value).toBe('ETHUSDT');
      expect(orderBook.sequence).toBe(0);
    });
  });

  describe('bestBid / bestAsk', () => {
    it('should return best bid (highest)', () => {
      const orderBook = createTestOrderBook();
      const bestBid = orderBook.bestBid();
      expect(bestBid?.price.toNumber()).toBe(100);
      expect(bestBid?.quantity.toNumber()).toBe(10);
    });

    it('should return best ask (lowest)', () => {
      const orderBook = createTestOrderBook();
      const bestAsk = orderBook.bestAsk();
      expect(bestAsk?.price.toNumber()).toBe(101);
      expect(bestAsk?.quantity.toNumber()).toBe(15);
    });

    it('should return undefined for empty book', () => {
      const orderBook = OrderBook.fromRaw({
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        bids: [],
        asks: []
      });

      expect(orderBook.bestBid()).toBeUndefined();
      expect(orderBook.bestAsk()).toBeUndefined();
    });
  });

  describe('spread', () => {
    it('should calculate spread', () => {
      const orderBook = createTestOrderBook();
      const spread = orderBook.spread();
      expect(spread?.toNumber()).toBe(1); // 101 - 100
    });

    it('should return undefined for empty book', () => {
      const orderBook = OrderBook.fromRaw({
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        bids: [],
        asks: []
      });
      expect(orderBook.spread()).toBeUndefined();
    });
  });

  describe('spreadPercentage', () => {
    it('should calculate spread percentage', () => {
      const orderBook = createTestOrderBook();
      const pct = orderBook.spreadPercentage();
      // Spread = 1, mid = 100.5, percentage = 1/100.5 * 100 ≈ 0.995%
      expect(pct).toBeCloseTo(0.995, 2);
    });
  });

  describe('midPrice', () => {
    it('should calculate mid price', () => {
      const orderBook = createTestOrderBook();
      const mid = orderBook.midPrice();
      expect(mid?.toNumber()).toBe(100.5); // (100 + 101) / 2
    });
  });

  describe('bidLiquidity / askLiquidity', () => {
    it('should calculate total bid liquidity', () => {
      const orderBook = createTestOrderBook();
      const liquidity = orderBook.bidLiquidity();
      expect(liquidity.toNumber()).toBe(60); // 10 + 20 + 30
    });

    it('should calculate bid liquidity up to depth', () => {
      const orderBook = createTestOrderBook();
      const liquidity = orderBook.bidLiquidity(2);
      expect(liquidity.toNumber()).toBe(30); // 10 + 20
    });

    it('should calculate total ask liquidity', () => {
      const orderBook = createTestOrderBook();
      const liquidity = orderBook.askLiquidity();
      expect(liquidity.toNumber()).toBe(75); // 15 + 25 + 35
    });

    it('should calculate ask liquidity up to depth', () => {
      const orderBook = createTestOrderBook();
      const liquidity = orderBook.askLiquidity(2);
      expect(liquidity.toNumber()).toBe(40); // 15 + 25
    });
  });

  describe('imbalanceRatio', () => {
    it('should calculate imbalance ratio', () => {
      const orderBook = createTestOrderBook();
      const ratio = orderBook.imbalanceRatio();
      // bid = 60, ask = 75, ratio = 60/75 = 0.8
      expect(ratio).toBeCloseTo(0.8, 5);
    });

    it('should calculate imbalance ratio with depth', () => {
      const orderBook = createTestOrderBook();
      const ratio = orderBook.imbalanceRatio(1);
      // bid[0] = 10, ask[0] = 15, ratio = 10/15 ≈ 0.667
      expect(ratio).toBeCloseTo(0.667, 2);
    });

    it('should return undefined when ask is empty', () => {
      const orderBook = OrderBook.fromRaw({
        symbol: 'BTCUSDT',
        timestamp: 1704067200000,
        bids: [[100, 10]],
        asks: []
      });
      expect(orderBook.imbalanceRatio()).toBeUndefined();
    });
  });

  describe('toJSON', () => {
    it('should serialize to plain object', () => {
      const orderBook = createTestOrderBook();
      const json = orderBook.toJSON();

      expect(json['symbol']).toBe('BTCUSDT');
      expect(json['timestamp']).toBe(1704067200000);
      expect(json['sequence']).toBe(12345);
      expect(json['bids']).toEqual([['100', '10'], ['99', '20'], ['98', '30']]);
      expect(json['asks']).toEqual([['101', '15'], ['102', '25'], ['103', '35']]);
    });
  });
});
