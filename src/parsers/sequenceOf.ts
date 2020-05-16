import {
  Parser,
  updateParserResult,
  IParserState,
  ParserResult,
  clearParserResult,
} from "../Parser.ts";

export const sequenceOf = <T, U>(parsers: Parser<T, U>[]): Parser<T, U> =>
  new Parser<T, U>((parserState: IParserState<T>) => {
    if (parserState.isError) return clearParserResult<T, U>(parserState);
    const results: ParserResult<U> = [];
    let nextState = clearParserResult<T, U>(parserState);

    for (let p of parsers) {
      nextState = p.parserStateTransformerFn(
        clearParserResult<U, T>(nextState),
      );
      results.push(nextState.result);
    }

    return updateParserResult(nextState, results);
  });
