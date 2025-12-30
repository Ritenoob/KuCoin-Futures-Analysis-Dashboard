import { Price, Quantity, Symbol, Timestamp } from '../value-objects/index';

/**
 * Trade side - market buy or market sell
 */
export type TradeSide = 'buy' | 'sell';

/**
 * Trade entity - represents a single executed trade
 */
export class Trade {
  private readonly _id: string;
  private readonly _symbol: Symbol;
  private readonly _timestamp: Timestamp;
  private readonly _price: Price;
  private readonly _quantity: Quantity;
  private readonly _side: TradeSide;

  constructor(params: {
    id: string;
    symbol: Symbol;
    timestamp: Timestamp;
    price: Price;
    quantity: Quantity;
    side: TradeSide;
  }) {
    this._id = params.id;
    this._symbol = params.symbol;
    this._timestamp = params.timestamp;
    this._price = params.price;
    this._quantity = params.quantity;
    this._side = params.side;
  }

  /**
   * Factory method to create Trade from raw data
   */
  static fromRaw(params: {
    id: string;
    symbol: string;
    timestamp: number;
    price: string | number;
    quantity: string | number;
    side: TradeSide;
  }): Trade {
    return new Trade({
      id: params.id,
      symbol: Symbol.unsafe(params.symbol),
      timestamp: Timestamp.unsafe(params.timestamp),
      price: Price.unsafe(params.price),
      quantity: Quantity.unsafe(params.quantity),
      side: params.side
    });
  }

  get id(): string {
    return this._id;
  }

  get symbol(): Symbol {
    return this._symbol;
  }

  get timestamp(): Timestamp {
    return this._timestamp;
  }

  get price(): Price {
    return this._price;
  }

  get quantity(): Quantity {
    return this._quantity;
  }

  get side(): TradeSide {
    return this._side;
  }

  /**
   * Returns the notional value of the trade (price * quantity)
   */
  notionalValue(): Price {
    return this._price.multiply(this._quantity.value);
  }

  /**
   * Returns true if this is a buy trade
   */
  isBuy(): boolean {
    return this._side === 'buy';
  }

  /**
   * Returns true if this is a sell trade
   */
  isSell(): boolean {
    return this._side === 'sell';
  }

  /**
   * Serializes to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      id: this._id,
      symbol: this._symbol.value,
      timestamp: this._timestamp.epochMs,
      price: this._price.toString(),
      quantity: this._quantity.toString(),
      side: this._side
    };
  }
}
