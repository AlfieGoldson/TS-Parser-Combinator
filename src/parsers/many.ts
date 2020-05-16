import {
  Parser,
  updateParserError,
  updateParserResult,
  IParserState,
  ParserResult,
  clearParserResult,
} from "../Parser.ts";

const matchMany = <T, U>(parser: Parser<T, U>) =>
  (parserState: IParserState<T>): IParserState<U> => {
    if (parserState.isError) return clearParserResult<T, U>(parserState);

    let nextState = parserState;
    const results: ParserResult<U> = [];

    while (true) {
      const testState = parser.parserStateTransformerFn(nextState);

      if (testState.isError) break;

      results.push(testState.result);
      nextState = clearParserResult<U, T>(testState);
    }
    return updateParserResult(nextState, results);
  };

export const many = <T, U>(parser: Parser<T, U>) =>
  new Parser(matchMany(parser));

export const many1 = <T, U>(parser: Parser<T, U>) =>
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
