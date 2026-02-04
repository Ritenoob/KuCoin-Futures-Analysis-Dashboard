import { Timestamp } from '../value-objects/index';

/**
 * Base interface for all domain events
 */
export interface DomainEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly aggregateId: string;
  readonly timestamp: Timestamp;
  readonly version: number;
}

/**
 * Generates a unique event ID
 */
export function generateEventId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Event emitted when a new trade is executed
 */
export interface TradeExecutedEvent extends DomainEvent {
  readonly eventType: 'TradeExecuted';
  readonly payload: {
    readonly symbol: string;
    readonly price: string;
    readonly quantity: string;
    readonly side: 'buy' | 'sell';
    readonly tradeId: string;
  };
}

/**
 * Creates a TradeExecutedEvent
 */
export function createTradeExecutedEvent(params: {
  symbol: string;
  price: string;
  quantity: string;
  side: 'buy' | 'sell';
  tradeId: string;
}): TradeExecutedEvent {
  return {
    eventId: generateEventId(),
    eventType: 'TradeExecuted',
    aggregateId: params.symbol,
    timestamp: Timestamp.now(),
    version: 1,
    payload: params
  };
}

/**
 * Event emitted when the order book is updated
 */
export interface OrderBookUpdatedEvent extends DomainEvent {
  readonly eventType: 'OrderBookUpdated';
  readonly payload: {
    readonly symbol: string;
    readonly bestBid: string;
    readonly bestAsk: string;
    readonly spread: string;
    readonly sequence: number;
  };
}

/**
 * Creates an OrderBookUpdatedEvent
 */
export function createOrderBookUpdatedEvent(params: {
  symbol: string;
  bestBid: string;
  bestAsk: string;
  spread: string;
  sequence: number;
}): OrderBookUpdatedEvent {
  return {
    eventId: generateEventId(),
    eventType: 'OrderBookUpdated',
    aggregateId: params.symbol,
    timestamp: Timestamp.now(),
    version: 1,
    payload: params
  };
}

/**
 * Event emitted when a new candle is created or updated
 */
export interface CandleCreatedEvent extends DomainEvent {
  readonly eventType: 'CandleCreated';
  readonly payload: {
    readonly symbol: string;
    readonly timeframe: string;
    readonly open: string;
    readonly high: string;
    readonly low: string;
    readonly close: string;
    readonly volume: string;
    readonly candleTimestamp: number;
  };
}

/**
 * Creates a CandleCreatedEvent
 */
export function createCandleCreatedEvent(params: {
  symbol: string;
  timeframe: string;
  open: string;
  high: string;
  low: string;
  close: string;
  volume: string;
  candleTimestamp: number;
}): CandleCreatedEvent {
  return {
    eventId: generateEventId(),
    eventType: 'CandleCreated',
    aggregateId: params.symbol,
    timestamp: Timestamp.now(),
    version: 1,
    payload: params
  };
}

/**
 * Union type of all market data events
 */
export type MarketDataEvent = 
  | TradeExecutedEvent 
  | OrderBookUpdatedEvent 
  | CandleCreatedEvent;
