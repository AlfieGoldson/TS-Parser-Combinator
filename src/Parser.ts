export type ParserResult<T> = T | ParserResult<T>[];

export interface IParserState<T> {
  targetString: string;
  index: number;
  result: ParserResult<T>;
  error: string;
  isError: boolean;
}

export type ParserTransformerFn<T, U> = (
  IParserState: IParserState<T>,
) => IParserState<U>;

export const updateParserState = <T, U>(
  state: IParserState<T>,
  index: number,
  result: ParserResult<U>,
): IParserState<U> => ({
  ...state,
  index,
  result,
});

export const updateParserResult = <T, U>(
  state: IParserState<T>,
  result: ParserResult<U>,
): IParserState<U> => ({
  ...state,
  result,
});

export const updateParserError = <T>(
  state: IParserState<T>,
  errorMsg: string,
): IParserState<T> => ({
  ...state,
  isError: true,
  error: errorMsg,
});

export class Parser<T, U> {
  parserStateTransformerFn: ParserTransformerFn<T, U>;
  constructor(parserStateTransformerFn: ParserTransformerFn<T, U>) {
    this.parserStateTransformerFn = parserStateTransformerFn;
  }

  run(targetString: string) {
    const initialState: IParserState<T> = {
      targetString,
      index: 0,
      result: [],
      error: "",
      isError: false,
    };
    return this.parserStateTransformerFn(initialState);
  }

  map<V>(fn: (result: ParserResult<U>) => ParserResult<V>): Parser<T, V> {
    return new Parser<T, V>((parserState: IParserState<T>) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) {
        return updateParserResult<U, V>(nextState, []);
      }

      return updateParserResult(
        nextState,
        fn(nextState.result),
      );
    });
  }

  chain<V>(fn: (result: ParserResult<U>) => Parser<U, V>): Parser<T, V> {
    return new Parser<T, V>((parserState: IParserState<T>) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (nextState.isError) {
        updateParserResult<U, V>(nextState, []);
      }

      const nextParser = fn(nextState.result);
      return nextParser.parserStateTransformerFn(nextState);
    });
  }

  errorMap(fn: (error: string, index: number) => string): Parser<T, U> {
    return new Parser((parserState: IParserState<T>) => {
      const nextState = this.parserStateTransformerFn(parserState);

      if (!nextState.isError) return nextState;

      return updateParserError(nextState, fn(nextState.error, nextState.index));
    });
  }
}
