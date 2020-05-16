type ParserResult<T> = T | ParserResult<T>[];

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

const updateParserState = <T, U>(
  state: IParserState<T>,
  index: number,
  result: ParserResult<U>,
): IParserState<U> => ({
  ...state,
  index,
  result,
});

const updateParserResult = <T, U>(
  state: IParserState<T>,
  result: ParserResult<U>,
): IParserState<U> => ({
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
      s,
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
        `regex: Couldn't match regex at index ${index}`,
      );
    }

    return updateParserState(
      parserState,
      index + regexMatch[0].length,
      regexMatch[0],
    );
  });

const letters = regexMatcher(/^[A-Za-z]+/);
const digits = regexMatcher(/^[0-9]+/);

// Transform this to be recursive to accept multiple types
const sequenceOf = <T>(parsers: Parser<T, T>[]): Parser<T, T> =>
  new Parser<T, T>((parserState: IParserState<T>) => {
    if (parserState.isError) return parserState;
    const results: ParserResult<T> = [];
    let nextState = parserState;

    for (let p of parsers) {
      nextState = p.parserStateTransformerFn(nextState);
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });

const choice = <T, U>(parsers: Parser<T, U>[]): Parser<T, U> =>
  new Parser<T, U>((parserState: IParserState<T>) => {
    if (parserState.isError) {
      return updateParserResult<T, U>(parserState, []);
    }

    for (let p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) return nextState;
    }

    return updateParserError<U>(
      updateParserResult<T, U>(parserState, []),
      `choice: Unable to match with any parser at index ${parserState.index}`,
    );
  });

const matchMany = <T, U>(parser: Parser<T, U>) =>
  (parserState: IParserState<T>): IParserState<U> => {
    if (parserState.isError) return updateParserResult<T, U>(parserState, []);

    let nextState = parserState;
    const results: ParserResult<U> = [];

    while (true) {
      const testState = parser.parserStateTransformerFn(nextState);

      if (testState.isError) break;

      results.push(testState.result);
      nextState = updateParserResult<U, T>(testState, []);
    }
    return updateParserResult(nextState, results);
  };

const many = <T, U>(parser: Parser<T, U>) => new Parser(matchMany(parser));

const many1 = <T, U>(parser: Parser<T, U>) =>
  new Parser((parserState: IParserState<T>) => {
    const nextState = matchMany(parser)(parserState);
    if (!(nextState.result instanceof Array)) {
      return updateParserError(
        nextState,
        `many1: 500`,
      );
    }
    if (nextState.result.length <= 0) {
      return updateParserError(
        nextState,
        `many1: Unable to match any input using parser @ index ${nextState.index}`,
      );
    }

    return nextState;
  });

const matchSepBy = <T, U>(
  separatorParser: Parser<U, T>,
  valueParser: Parser<T, U>,
) =>
  (parserState: IParserState<T>) => {
    const results: ParserResult<U> = [];
    let nextState = parserState;

    while (true) {
      const thingWeWantState = valueParser.parserStateTransformerFn(
        nextState,
      );
      if (thingWeWantState.isError) break;
      results.push(thingWeWantState.result);
      nextState = updateParserResult<U, T>(thingWeWantState, []);
      const separatorState = separatorParser.parserStateTransformerFn(
        thingWeWantState,
      );

      if (separatorState.isError) break;
      nextState = separatorState;
    }

    return updateParserResult(nextState, results);
  };

const sepBy = <T, U>(separatorParser: Parser<U, T>) =>
  (valueParser: Parser<T, U>) =>
    new Parser<T, U>(matchSepBy(separatorParser, valueParser));

const sepBy1 = <T, U>(separatorParser: Parser<U, T>) =>
  (valueParser: Parser<T, U>) =>
    new Parser<T, U>((parserState: IParserState<T>) => {
      const nextState = matchSepBy(separatorParser, valueParser)(parserState);
      if (!(nextState.result instanceof Array)) {
        return updateParserError(
          nextState,
          `many1: 500`,
        );
      }
      if (nextState.result.length <= 0) {
        return updateParserError(
          nextState,
          `sepBy1: Unable to match any input using parser @ index ${nextState.index}`,
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
    ]).map((result) => {
      if (!(result instanceof Array)) return result;
      return result[1];
    });

const lazy = <T, U>(parserThunk: () => Parser<T, U>) =>
  new Parser((parserState: IParserState<T>) => {
    const parser = parserThunk();
    return parser.parserStateTransformerFn(parserState);
  });

const btwSB = between(str("["), str("]"));
const commaSep = sepBy(str(","));

const value = lazy(() => choice([parser, letters, digits]));
const parser = btwSB(commaSep(value));

console.log(JSON.stringify(
  parser.run("[1,[1,abc],xd,[awe,lol,2]]"),
  null,
  2,
));
