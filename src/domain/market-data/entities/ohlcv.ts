import { Price, Quantity, Symbol, Timestamp } from '../value-objects/index';

/**
 * Timeframe for candlestick data
 */
export type Timeframe = '1m' | '5m' | '15m' | '30m' | '1h' | '4h' | '1d' | '1w';

/**
 * OHLCV (Open, High, Low, Close, Volume) candlestick entity
 * Represents a single candlestick/bar in price data
 */
export class OHLCV {
  private readonly _symbol: Symbol;
  private readonly _timeframe: Timeframe;
  private readonly _timestamp: Timestamp;
  private readonly _open: Price;
  private readonly _high: Price;
  private readonly _low: Price;
  private readonly _close: Price;
  private readonly _volume: Quantity;

  constructor(params: {
    symbol: Symbol;
    timeframe: Timeframe;
    timestamp: Timestamp;
    open: Price;
    high: Price;
    low: Price;
    close: Price;
    volume: Quantity;
  }) {
    this._symbol = params.symbol;
    this._timeframe = params.timeframe;
    this._timestamp = params.timestamp;
    this._open = params.open;
    this._high = params.high;
    this._low = params.low;
    this._close = params.close;
    this._volume = params.volume;
  }

  /**
   * Factory method to create OHLCV from raw data
   */
  static fromRaw(params: {
    symbol: string;
    timeframe: Timeframe;
    timestamp: number;
    open: string | number;
    high: string | number;
    low: string | number;
    close: string | number;
    volume: string | number;
  }): OHLCV {
    return new OHLCV({
      symbol: Symbol.unsafe(params.symbol),
      timeframe: params.timeframe,
      timestamp: Timestamp.unsafe(params.timestamp),
      open: Price.unsafe(params.open),
      high: Price.unsafe(params.high),
      low: Price.unsafe(params.low),
      close: Price.unsafe(params.close),
      volume: Quantity.unsafe(params.volume)
    });
  }

  get symbol(): Symbol {
    return this._symbol;
  }

  get timeframe(): Timeframe {
    return this._timeframe;
  }

  get timestamp(): Timestamp {
    return this._timestamp;
  }

  get open(): Price {
    return this._open;
  }

  get high(): Price {
    return this._high;
  }

  get low(): Price {
    return this._low;
  }

  get close(): Price {
    return this._close;
  }

  get volume(): Quantity {
    return this._volume;
  }

  /**
   * Returns true if this is a bullish (green) candle
   */
  isBullish(): boolean {
    return this._close.greaterThan(this._open);
  }

  /**
   * Returns true if this is a bearish (red) candle
   */
  isBearish(): boolean {
    return this._close.lessThan(this._open);
  }

  /**
   * Returns the body size (absolute difference between open and close)
   */
  bodySize(): Price {
    if (this._close.greaterThan(this._open)) {
      return this._close.subtract(this._open);
    }
    return this._open.subtract(this._close);
  }

  /**
   * Returns the range (high - low)
   */
  range(): Price {
    return this._high.subtract(this._low);
  }

  /**
   * Returns the upper wick size
   */
  upperWick(): Price {
    if (this.isBullish()) {
      return this._high.subtract(this._close);
    }
    return this._high.subtract(this._open);
  }

  /**
   * Returns the lower wick size
   */
  lowerWick(): Price {
    if (this.isBullish()) {
      return this._open.subtract(this._low);
    }
    return this._close.subtract(this._low);
  }

  /**
   * Returns the typical price (high + low + close) / 3
   */
  typicalPrice(): Price {
    const sum = this._high.add(this._low).add(this._close);
    return sum.divide(3);
  }

  /**
   * Serializes to plain object
   */
  toJSON(): Record<string, unknown> {
    return {
      symbol: this._symbol.value,
      timeframe: this._timeframe,
      timestamp: this._timestamp.epochMs,
      open: this._open.toString(),
      high: this._high.toString(),
      low: this._low.toString(),
      close: this._close.toString(),
      volume: this._volume.toString()
    };
  }
}
