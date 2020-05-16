import {
  Parser,
  updateParserError,
  updateParserResult,
  IParserState,
  ParserResult,
} from "../Parser.ts";

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

export const sepBy = <T, U>(separatorParser: Parser<U, T>) =>
  (valueParser: Parser<T, U>) =>
    new Parser<T, U>(matchSepBy(separatorParser, valueParser));

export const sepBy1 = <T, U>(separatorParser: Parser<U, T>) =>
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
