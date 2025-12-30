import Decimal from 'decimal.js';
import { OHLCV } from '../entities/index';

/**
 * Indicator calculation result
 */
export interface IndicatorValue {
  readonly value: Decimal;
  readonly timestamp: number;
}

/**
 * Abstract base class for streaming indicators
 * Implements incremental calculations for efficiency
 */
export abstract class StreamingIndicator {
  protected readonly _period: number;
  protected readonly _values: IndicatorValue[] = [];

  constructor(period: number) {
    if (period < 1) {
      throw new Error('Period must be at least 1');
    }
    this._period = period;
  }

  get period(): number {
    return this._period;
  }

  get values(): ReadonlyArray<IndicatorValue> {
    return this._values;
  }

  get current(): IndicatorValue | undefined {
    return this._values[this._values.length - 1];
  }

  abstract update(candle: OHLCV): IndicatorValue | undefined;
  abstract reset(): void;
}

/**
 * Simple Moving Average (SMA) - streaming implementation
 */
export class SMA extends StreamingIndicator {
  private _sum: Decimal = new Decimal(0);
  private _buffer: Decimal[] = [];

  override update(candle: OHLCV): IndicatorValue | undefined {
    const closeValue = candle.close.value;
    
    this._buffer.push(closeValue);
    this._sum = this._sum.plus(closeValue);

    if (this._buffer.length > this._period) {
      const removed = this._buffer.shift();
      if (removed !== undefined) {
        this._sum = this._sum.minus(removed);
      }
    }

    if (this._buffer.length < this._period) {
      return undefined;
    }

    const value: IndicatorValue = {
      value: this._sum.dividedBy(this._period),
      timestamp: candle.timestamp.epochMs
    };

    this._values.push(value);
    return value;
  }

  override reset(): void {
    this._sum = new Decimal(0);
    this._buffer = [];
    this._values.length = 0;
  }
}

/**
 * Exponential Moving Average (EMA) - streaming implementation
 */
export class EMA extends StreamingIndicator {
  private _multiplier: Decimal;
  private _previousEma: Decimal | undefined;
  private _warmupBuffer: Decimal[] = [];

  constructor(period: number) {
    super(period);
    // EMA multiplier: 2 / (period + 1)
    this._multiplier = new Decimal(2).dividedBy(period + 1);
  }

  override update(candle: OHLCV): IndicatorValue | undefined {
    const closeValue = candle.close.value;

    // Warm-up period: collect values for initial SMA
    if (this._previousEma === undefined) {
      this._warmupBuffer.push(closeValue);
      
      if (this._warmupBuffer.length < this._period) {
        return undefined;
      }

      // Calculate initial SMA as starting EMA
      let sum = new Decimal(0);
      for (const val of this._warmupBuffer) {
        sum = sum.plus(val);
      }
      this._previousEma = sum.dividedBy(this._period);
      this._warmupBuffer = [];

      const value: IndicatorValue = {
        value: this._previousEma,
        timestamp: candle.timestamp.epochMs
      };
      this._values.push(value);
      return value;
    }

    // EMA = (close - previous EMA) * multiplier + previous EMA
    const ema = closeValue
      .minus(this._previousEma)
      .times(this._multiplier)
      .plus(this._previousEma);

    this._previousEma = ema;

    const value: IndicatorValue = {
      value: ema,
      timestamp: candle.timestamp.epochMs
    };
    this._values.push(value);
    return value;
  }

  override reset(): void {
    this._previousEma = undefined;
    this._warmupBuffer = [];
    this._values.length = 0;
  }
}

/**
 * Relative Strength Index (RSI) - streaming implementation
 */
export class RSI extends StreamingIndicator {
  private _avgGain: Decimal | undefined;
  private _avgLoss: Decimal | undefined;
  private _previousClose: Decimal | undefined;
  private _warmupGains: Decimal[] = [];
  private _warmupLosses: Decimal[] = [];

  override update(candle: OHLCV): IndicatorValue | undefined {
    const closeValue = candle.close.value;

    if (this._previousClose === undefined) {
      this._previousClose = closeValue;
      return undefined;
    }

    const change = closeValue.minus(this._previousClose);
    const gain = change.isPositive() ? change : new Decimal(0);
    const loss = change.isNegative() ? change.abs() : new Decimal(0);

    this._previousClose = closeValue;

    // Warm-up period
    if (this._avgGain === undefined) {
      this._warmupGains.push(gain);
      this._warmupLosses.push(loss);

      if (this._warmupGains.length < this._period) {
        return undefined;
      }

      // Calculate initial averages
      let sumGain = new Decimal(0);
      let sumLoss = new Decimal(0);
      for (let i = 0; i < this._period; i++) {
        sumGain = sumGain.plus(this._warmupGains[i] ?? new Decimal(0));
        sumLoss = sumLoss.plus(this._warmupLosses[i] ?? new Decimal(0));
      }

      this._avgGain = sumGain.dividedBy(this._period);
      this._avgLoss = sumLoss.dividedBy(this._period);
      this._warmupGains = [];
      this._warmupLosses = [];
    } else {
      // Smoothed average: ((previous avg * (period - 1)) + current) / period
      // Note: _avgLoss is guaranteed to be defined when _avgGain is defined
      const avgLoss = this._avgLoss!;
      this._avgGain = this._avgGain
        .times(this._period - 1)
        .plus(gain)
        .dividedBy(this._period);
      this._avgLoss = avgLoss
        .times(this._period - 1)
        .plus(loss)
        .dividedBy(this._period);
    }

    // Calculate RSI
    let rsi: Decimal;
    if (this._avgLoss.isZero()) {
      rsi = new Decimal(100);
    } else {
      const rs = this._avgGain.dividedBy(this._avgLoss);
      rsi = new Decimal(100).minus(new Decimal(100).dividedBy(rs.plus(1)));
    }

    const value: IndicatorValue = {
      value: rsi,
      timestamp: candle.timestamp.epochMs
    };
    this._values.push(value);
    return value;
  }

  override reset(): void {
    this._avgGain = undefined;
    this._avgLoss = undefined;
    this._previousClose = undefined;
    this._warmupGains = [];
    this._warmupLosses = [];
    this._values.length = 0;
  }
}

/**
 * MACD (Moving Average Convergence Divergence) result
 */
export interface MACDValue {
  readonly macd: Decimal;
  readonly signal: Decimal;
  readonly histogram: Decimal;
  readonly timestamp: number;
}

/**
 * MACD - streaming implementation
 */
export class MACD {
  private readonly _fastEma: EMA;
  private readonly _slowEma: EMA;
  private readonly _signalEma: EMA;
  private readonly _values: MACDValue[] = [];

  constructor(
    fastPeriod: number = 12,
    slowPeriod: number = 26,
    signalPeriod: number = 9
  ) {
    this._fastEma = new EMA(fastPeriod);
    this._slowEma = new EMA(slowPeriod);
    this._signalEma = new EMA(signalPeriod);
  }

  get values(): ReadonlyArray<MACDValue> {
    return this._values;
  }

  get current(): MACDValue | undefined {
    return this._values[this._values.length - 1];
  }

  update(candle: OHLCV): MACDValue | undefined {
    const fastValue = this._fastEma.update(candle);
    const slowValue = this._slowEma.update(candle);

    if (!fastValue || !slowValue) {
      return undefined;
    }

    // MACD line = fast EMA - slow EMA
    const macdLine = fastValue.value.minus(slowValue.value);

    // Create a synthetic candle with MACD value as close for signal line EMA
    const macdCandle = OHLCV.fromRaw({
      symbol: candle.symbol.value,
      timeframe: candle.timeframe,
      timestamp: candle.timestamp.epochMs,
      open: macdLine.toString(),
      high: macdLine.toString(),
      low: macdLine.toString(),
      close: macdLine.toString(),
      volume: '0'
    });

    const signalValue = this._signalEma.update(macdCandle);

    if (!signalValue) {
      return undefined;
    }

    const value: MACDValue = {
      macd: macdLine,
      signal: signalValue.value,
      histogram: macdLine.minus(signalValue.value),
      timestamp: candle.timestamp.epochMs
    };

    this._values.push(value);
    return value;
  }

  reset(): void {
    this._fastEma.reset();
    this._slowEma.reset();
    this._signalEma.reset();
    this._values.length = 0;
  }
}
