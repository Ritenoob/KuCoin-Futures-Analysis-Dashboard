/**
 * Result type for error handling following the Result pattern.
 * Never throws in hot paths - returns Result instead.
 */
export type Result<T, E = Error> = Ok<T> | Err<E>;

export interface Ok<T> {
  readonly _tag: 'Ok';
  readonly value: T;
}

export interface Err<E> {
  readonly _tag: 'Err';
  readonly error: E;
}

/**
 * Creates a successful Result
 */
export function ok<T>(value: T): Ok<T> {
  return { _tag: 'Ok', value };
}

/**
 * Creates a failed Result
 */
export function err<E>(error: E): Err<E> {
  return { _tag: 'Err', error };
}

/**
 * Type guard to check if Result is Ok
 */
export function isOk<T, E>(result: Result<T, E>): result is Ok<T> {
  return result._tag === 'Ok';
}

/**
 * Type guard to check if Result is Err
 */
export function isErr<T, E>(result: Result<T, E>): result is Err<E> {
  return result._tag === 'Err';
}

/**
 * Unwraps the value from Ok, throws if Err.
 * Should only be used in non-hot paths or tests.
 */
export function unwrap<T, E>(result: Result<T, E>): T {
  if (isOk(result)) {
    return result.value;
  }
  throw result.error;
}

/**
 * Unwraps the value from Ok, returns default if Err.
 */
export function unwrapOr<T, E>(result: Result<T, E>, defaultValue: T): T {
  if (isOk(result)) {
    return result.value;
  }
  return defaultValue;
}

/**
 * Maps the value of Ok, passes through Err unchanged.
 */
export function map<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => U
): Result<U, E> {
  if (isOk(result)) {
    return ok(fn(result.value));
  }
  return result;
}

/**
 * Maps the error of Err, passes through Ok unchanged.
 */
export function mapErr<T, E, F>(
  result: Result<T, E>,
  fn: (error: E) => F
): Result<T, F> {
  if (isErr(result)) {
    return err(fn(result.error));
  }
  return result;
}

/**
 * Chains Result operations. Returns Err if initial result is Err,
 * otherwise applies fn and returns its Result.
 */
export function flatMap<T, U, E>(
  result: Result<T, E>,
  fn: (value: T) => Result<U, E>
): Result<U, E> {
  if (isOk(result)) {
    return fn(result.value);
  }
  return result;
}
