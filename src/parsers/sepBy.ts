import {
  Parser,
  updateParserError,
  updateParserResult,
  IParserState,
  ParserResult,
  clearParserResult,
} from "../Parser.ts";

const matchSepBy = <V, W>(separatorParser: Parser<V, W>) =>
  <T, U>(valueParser: Parser<T, U>) =>
    (parserState: IParserState<T>) => {
      const results: ParserResult<U> = [];
      let nextState = parserState;

      while (true) {
        const thingWeWantState = valueParser.parserStateTransformerFn(
          nextState,
        );
        if (thingWeWantState.isError) break;
        results.push(thingWeWantState.result);

        nextState = clearParserResult<U, T>(thingWeWantState);
        const separatorState = separatorParser.parserStateTransformerFn(
          clearParserResult<U, V>(thingWeWantState),
        );

        if (separatorState.isError) break;
        nextState = clearParserResult<W, T>(separatorState);
      }

      return updateParserResult(nextState, results);
    };

export const sepBy = <V, W>(separatorParser: Parser<V, W>) =>
  <T, U>(valueParser: Parser<T, U>) =>
    new Parser<T, U>(matchSepBy(separatorParser)(valueParser));

export const sepBy1 = <V, W>(separatorParser: Parser<V, W>) =>
  <T, U>(valueParser: Parser<T, U>) =>
    new Parser<T, U>((parserState: IParserState<T>) => {
      const nextState = matchSepBy(separatorParser)(valueParser)(parserState);
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
