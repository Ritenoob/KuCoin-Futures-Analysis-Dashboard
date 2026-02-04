import {
  ok,
  err,
  isOk,
  isErr,
  unwrap,
  unwrapOr,
  map,
  mapErr,
  flatMap,
  Result
} from '../../../src/shared/result';

describe('Result Pattern', () => {
  describe('ok', () => {
    it('should create Ok result', () => {
      const result = ok(42);
      expect(result._tag).toBe('Ok');
      expect(result.value).toBe(42);
    });
  });

  describe('err', () => {
    it('should create Err result', () => {
      const error = new Error('Something went wrong');
      const result = err(error);
      expect(result._tag).toBe('Err');
      expect(result.error).toBe(error);
    });
  });

  describe('isOk', () => {
    it('should return true for Ok result', () => {
      const result = ok(42);
      expect(isOk(result)).toBe(true);
    });

    it('should return false for Err result', () => {
      const result = err(new Error('error'));
      expect(isOk(result)).toBe(false);
    });
  });

  describe('isErr', () => {
    it('should return true for Err result', () => {
      const result = err(new Error('error'));
      expect(isErr(result)).toBe(true);
    });

    it('should return false for Ok result', () => {
      const result = ok(42);
      expect(isErr(result)).toBe(false);
    });
  });

  describe('unwrap', () => {
    it('should return value for Ok result', () => {
      const result = ok(42);
      expect(unwrap(result)).toBe(42);
    });

    it('should throw for Err result', () => {
      const error = new Error('test error');
      const result = err(error);
      expect(() => unwrap(result)).toThrow(error);
    });
  });

  describe('unwrapOr', () => {
    it('should return value for Ok result', () => {
      const result = ok(42);
      expect(unwrapOr(result, 0)).toBe(42);
    });

    it('should return default for Err result', () => {
      const result = err(new Error('error'));
      expect(unwrapOr(result, 0)).toBe(0);
    });
  });

  describe('map', () => {
    it('should transform Ok value', () => {
      const result = ok(21);
      const mapped = map(result, (x) => x * 2);
      
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });

    it('should pass through Err unchanged', () => {
      const error = new Error('error');
      const result: Result<number, Error> = err(error);
      const mapped = map(result, (x: number) => x * 2);
      
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error).toBe(error);
      }
    });
  });

  describe('mapErr', () => {
    it('should transform Err value', () => {
      const result: Result<number, string> = err('original');
      const mapped = mapErr(result, (e: string) => new Error(e));
      
      expect(isErr(mapped)).toBe(true);
      if (isErr(mapped)) {
        expect(mapped.error.message).toBe('original');
      }
    });

    it('should pass through Ok unchanged', () => {
      const result: Result<number, string> = ok(42);
      const mapped = mapErr(result, (e: string) => new Error(e));
      
      expect(isOk(mapped)).toBe(true);
      if (isOk(mapped)) {
        expect(mapped.value).toBe(42);
      }
    });
  });

  describe('flatMap', () => {
    const parseNumber = (s: string): Result<number, Error> => {
      const n = parseInt(s, 10);
      if (isNaN(n)) {
        return err(new Error(`Cannot parse: ${s}`));
      }
      return ok(n);
    };

    const doubleIfPositive = (n: number): Result<number, Error> => {
      if (n <= 0) {
        return err(new Error('Not positive'));
      }
      return ok(n * 2);
    };

    it('should chain Ok results', () => {
      const result = flatMap(parseNumber('21'), doubleIfPositive);
      
      expect(isOk(result)).toBe(true);
      if (isOk(result)) {
        expect(result.value).toBe(42);
      }
    });

    it('should short-circuit on first Err', () => {
      const result = flatMap(parseNumber('invalid'), doubleIfPositive);
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toContain('Cannot parse');
      }
    });

    it('should return Err from second function', () => {
      const result = flatMap(parseNumber('-5'), doubleIfPositive);
      
      expect(isErr(result)).toBe(true);
      if (isErr(result)) {
        expect(result.error.message).toBe('Not positive');
      }
    });
  });
});
