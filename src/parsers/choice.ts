import {
  Parser,
  updateParserError,
  clearParserResult,
} from "../Parser.ts";

export const choice = <T, U>(parsers: Parser<T, U>[]) =>
  new Parser<T, U>((parserState) => {
    if (parserState.isError) {
      return clearParserResult<T, U>(parserState);
    }

    for (let p of parsers) {
      const nextState = p.parserStateTransformerFn(parserState);
      if (!nextState.isError) return nextState;
    }

    return updateParserError<U>(
      clearParserResult<T, U>(parserState),
      `choice: Unable to match with any parser at index ${parserState.index}`,
    );
  });
