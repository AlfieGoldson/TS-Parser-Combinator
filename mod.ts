type ParserResult<T> = (T | ParserResult<T>)[];

interface IParserState<T> {
  targetString: string;
  index: number;
  result: ParserResult<T>;
  error: string;
  isError: boolean;
}

type ParserTransformerFn<T, U> = (
  IParserState: IParserState<T>,
) => IParserState<U>;

const updateParserState = <T>(
  state: IParserState<T>,
  index: number,
  result: ParserResult<T>,
): IParserState<T> => ({
  ...state,
  index,
  result,
});

const updateParserResult = <T>(
  state: IParserState<T>,
  result: ParserResult<T>,
): IParserState<T> => ({
  ...state,
  result,
});

const updateParserError = <T>(
  state: IParserState<T>,
  errorMsg: string,
): IParserState<T> => ({
  ...state,
  isError: true,
  error: errorMsg,
});

class Parser<T, U> {
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

      if (nextState.isError) return { ...nextState, result: [] };

      return updateParserResult<V>(
        { ...nextState, result: [] },
        fn(nextState.result),
      );
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

const str = (s: string) =>
  new Parser<string, string>((parserState) => {
    const { targetString, index, isError } = parserState;

    if (isError) return parserState;

    const slicedTarget = targetString.slice(index);
    if (slicedTarget.length === 0) {
      return updateParserError(
        parserState,
        `str: Tried to match ${s}, but got Unexpected end of input`,
      );
    }

    if (!targetString.slice(index).startsWith(s)) {
      return updateParserError(
        parserState,
        `str: Tried to match ${s}, but got ${
          targetString.slice(index, index + 10)
        }`,
      );
    }

    return updateParserState(
      parserState,
      index + s.length,
      [s],
    );
  });

const regexMatcher = (regex: RegExp) =>
  new Parser<string, string>((parserState) => {
    const { targetString, index, isError } = parserState;

    if (isError) return parserState;

    const slicedTarget = targetString.slice(index);
    if (slicedTarget.length === 0) {
      return updateParserError(
        parserState,
        `letters: Got Unexpected end of input`,
      );
    }
    const regexMatch = slicedTarget.match(regex);

    if (!regexMatch) {
      return updateParserError(
        parserState,
        `str: Couldn't match letters at index ${index}`,
      );
    }

    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      [regexMatch[0]],
    );
  });

const letters = regexMatcher(/^[A-Za-z]+/);
const digits = regexMatcher(/^[0-9]+/);

// Transform this to be recursive to accept multiple types
const sequenceOf = <T>(parsers: Parser<T, T>[]): Parser<T, T> =>
  new Parser<T, T>((parserState: IParserState<T>) => {
    if (parserState.isError) return { ...parserState, result: [] };
    const results: ParserResult<T> = [];
    let nextState: IParserState<T> = {
      ...parserState,
      result: [],
    };

    for (let p of parsers) {
      nextState = p.parserStateTransformerFn(nextState);
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });

const choice = <T, U>(parsers: Parser<T, U>[]): Parser<T, U> =>
  new Parser<T, U>((parserState: IParserState<T>) => {
    if (parserState.isError) return { ...parserState, result: [] };

    for (let p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) {
        return nextState;
      }
    }

    return updateParserError<U>(
      { ...parserState, result: [] },
      `choice: Unable to match with any parser at index ${parserState.index}`,
    );
  });

const matchMany = <T>(parser: Parser<T, T>) =>
  (parserState: IParserState<T>): IParserState<T> => {
    if (parserState.isError) return parserState;

    let nextState = parserState;
    const results: ParserResult<T> = [];

    while (true) {
      const testState = parser.parserStateTransformerFn(nextState);

      if (testState.isError) break;

      nextState = testState;
      results.push(nextState.result);
    }
    return updateParserResult(nextState, results);
  };

const many = <T>(parser: Parser<T, T>) => new Parser(matchMany(parser));

const many1 = <T>(parser: Parser<T, T>) =>
  new Parser((parserState: IParserState<T>) => {
    const nextState = matchMany(parser)(parserState);
    if (nextState.result.length <= 0) {
      return updateParserError(
        nextState,
        `many1: Unable to match any input using parser @ index ${nextState.index}`,
      );
    }

    return nextState;
  });

const between = <T>(
  leftParser: Parser<T, T>,
  rightParser: Parser<T, T>,
) =>
  (contentParser: Parser<T, T>) =>
    sequenceOf([
      leftParser,
      contentParser,
      rightParser,
    ]).map((result) => [result[1]]);

const parser = between(str("("), str(")"))(
  many(choice([letters, digits])).map((result) => [result.join("")]),
);

console.log(JSON.stringify(
  parser.run("(awecho123xd)"),
  null,
  2,
));
