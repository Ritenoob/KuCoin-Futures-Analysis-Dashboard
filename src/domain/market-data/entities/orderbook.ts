import { Price, Quantity, Symbol, Timestamp } from '../value-objects/index';

/**
 * Represents a single level in the order book
 */
export interface OrderBookLevel {
  readonly price: Price;
  readonly quantity: Quantity;
}

/**
 * Order Book entity - represents the current state of bids and asks
 * Maintains sorted order for efficient access to best bid/ask
 */
export class OrderBook {
  private readonly _symbol: Symbol;
  private readonly _timestamp: Timestamp;
  private readonly _bids: ReadonlyArray<OrderBookLevel>;
  private readonly _asks: ReadonlyArray<OrderBookLevel>;
  private readonly _sequence: number;

  constructor(params: {
    symbol: Symbol;
    timestamp: Timestamp;
    bids: ReadonlyArray<OrderBookLevel>;
    asks: ReadonlyArray<OrderBookLevel>;
    sequence?: number;
  }) {
    this._symbol = params.symbol;
    this._timestamp = params.timestamp;
    this._bids = params.bids;
    this._asks = params.asks;
    this._sequence = params.sequence ?? 0;
  }

  /**
   * Factory method to create OrderBook from raw arrays
   */
  static fromRaw(params: {
    symbol: string;
    timestamp: number;
    bids: Array<[string | number, string | number]>;
    asks: Array<[string | number, string | number]>;
    sequence?: number;
  }): OrderBook {
    const bids: OrderBookLevel[] = params.bids.map(([price, quantity]) => ({
      price: Price.unsafe(price),
      quantity: Quantity.unsafe(quantity)
    }));

    const asks: OrderBookLevel[] = params.asks.map(([price, quantity]) => ({
      price: Price.unsafe(price),
      quantity: Quantity.unsafe(quantity)
    }));

    // Sort bids descending (highest first) and asks ascending (lowest first)
    bids.sort((a, b) => b.price.value.minus(a.price.value).toNumber());
    asks.sort((a, b) => a.price.value.minus(b.price.value).toNumber());

    return new OrderBook({
      symbol: Symbol.unsafe(params.symbol),
      timestamp: Timestamp.unsafe(params.timestamp),
      bids,
      asks,
      ...(params.sequence !== undefined && { sequence: params.sequence })
    });
  }

  get symbol(): Symbol {
    return this._symbol;
  }

  get timestamp(): Timestamp {
    return this._timestamp;
  }

  get bids(): ReadonlyArray<OrderBookLevel> {
    return this._bids;
  }

  get asks(): ReadonlyArray<OrderBookLevel> {
    return this._asks;
  }

  get sequence(): number {
    return this._sequence;
  }

  /**
   * Returns the best (highest) bid
   */
  bestBid(): OrderBookLevel | undefined {
    return this._bids[0];
  }

  /**
   * Returns the best (lowest) ask
   */
  bestAsk(): OrderBookLevel | undefined {
    return this._asks[0];
  }

  /**
   * Returns the spread (best ask - best bid)
   */
  spread(): Price | undefined {
    const bid = this.bestBid();
    const ask = this.bestAsk();
    if (!bid || !ask) {
      return undefined;
    }
    return ask.price.subtract(bid.price);
  }

  /**
   * Returns the spread as a percentage of the mid price
   */
  spreadPercentage(): number | undefined {
    const spreadPrice = this.spread();
    const midP = this.midPrice();
    if (!spreadPrice || !midP) {
      return undefined;
    }
    return spreadPrice.value.dividedBy(midP.value).times(100).toNumber();
  }

  /**
   * Returns the mid price (average of best bid and ask)
   */
  midPrice(): Price | undefined {
    const bid = this.bestBid();
    const ask = this.bestAsk();
    if (!bid || !ask) {
      return undefined;
    }
    return bid.price.add(ask.price).divide(2);
  }

  /**
   * Returns the total bid liquidity up to a given depth
   */
  bidLiquidity(depth: number = this._bids.length): Quantity {
    let total = Quantity.zero();
    const limit = Math.min(depth, this._bids.length);
    for (let i = 0; i < limit; i++) {
      const level = this._bids[i];
      if (level) {
        total = total.add(level.quantity);
      }
    }
    return total;
  }

  /**
   * Returns the total ask liquidity up to a given depth
   */
  askLiquidity(depth: number = this._asks.length): Quantity {
    let total = Quantity.zero();
    const limit = Math.min(depth, this._asks.length);
    for (let i = 0; i < limit; i++) {
      const level = this._asks[i];
      if (level) {
        total = total.add(level.quantity);
      }
    }
    return total;
  }

  /**
   * Returns the bid/ask imbalance ratio
   * > 1 means more bids (buying pressure)
   * < 1 means more asks (selling pressure)
   */
  imbalanceRatio(depth: number = 10): number | undefined {
    const bidLiq = this.bidLiquidity(depth);
    const askLiq = this.askLiquidity(depth);
    if (askLiq.isZero()) {
      return undefined;
    }
    return bidLiq.value.dividedBy(askLiq.value).toNumber();
  }

  /**
   * Serializes to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      symbol: this._symbol.value,
      timestamp: this._timestamp.epochMs,
      sequence: this._sequence,
      bids: this._bids.map(b => [b.price.toString(), b.quantity.toString()]),
      asks: this._asks.map(a => [a.price.toString(), a.quantity.toString()])
    };
  }
}
