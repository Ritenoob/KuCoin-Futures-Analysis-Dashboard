import { Result, ok, err } from '../../../shared/result';
import { ValueObjectError } from './price';

export class InvalidSymbolError extends ValueObjectError {
  constructor(value: string) {
    super(`Invalid symbol: ${value}. Symbol must be a non-empty uppercase string.`);
    this.name = 'InvalidSymbolError';
  }
}

/**
 * Valid symbol format: Uppercase letters and numbers, optionally with separators
 * Examples: BTCUSDT, BTC-USDT, BTC_USDT, XBTUSDTM
 */
const SYMBOL_PATTERN = /^[A-Z0-9]+(?:[-_][A-Z0-9]+)*M?$/;

/**
 * Symbol value object - represents a trading pair symbol
 */
export class Symbol {
  private readonly _value: string;
  private readonly _base: string;
  private readonly _quote: string;

  private constructor(value: string, base: string, quote: string) {
    this._value = value;
    this._base = base;
    this._quote = quote;
  }

  /**
   * Creates a Symbol from a string value.
   * Returns Result to avoid throwing in hot paths.
   */
  static create(value: string): Result<Symbol, InvalidSymbolError> {
    if (!value || typeof value !== 'string') {
      return err(new InvalidSymbolError(String(value)));
    }

    const normalized = value.trim().toUpperCase();
    
    if (!SYMBOL_PATTERN.test(normalized)) {
      return err(new InvalidSymbolError(value));
    }

    // Parse base and quote currencies
    const { base, quote } = parseSymbol(normalized);

    return ok(new Symbol(normalized, base, quote));
  }

  /**
   * Creates a Symbol without validation
   */
  static unsafe(value: string): Symbol {
    const normalized = value.trim().toUpperCase();
    const { base, quote } = parseSymbol(normalized);
    return new Symbol(normalized, base, quote);
  }

  get value(): string {
    return this._value;
  }

  get base(): string {
    return this._base;
  }

  get quote(): string {
    return this._quote;
  }

  toString(): string {
    return this._value;
  }

  equals(other: Symbol): boolean {
    return this._value === other._value;
  }
}

/**
 * Parses a symbol string to extract base and quote currencies
 */
function parseSymbol(symbol: string): { base: string; quote: string } {
  // Remove trailing 'M' for futures symbols
  const normalized = symbol.endsWith('M') ? symbol.slice(0, -1) : symbol;

  // Check for separator
  if (normalized.includes('-')) {
    const [base, quote] = normalized.split('-');
    return { base: base ?? '', quote: quote ?? '' };
  }
  if (normalized.includes('_')) {
    const [base, quote] = normalized.split('_');
    return { base: base ?? '', quote: quote ?? '' };
  }

  // Common quote currencies to try to match
  const quoteCurrencies = ['USDT', 'USDC', 'USD', 'BTC', 'ETH', 'BUSD', 'DAI'];
  
  for (const quote of quoteCurrencies) {
    if (normalized.endsWith(quote)) {
      return {
        base: normalized.slice(0, -quote.length),
        quote
      };
    }
  }

  // Default: assume last 4 chars are quote
  return {
    base: normalized.slice(0, -4),
    quote: normalized.slice(-4)
  };
}
