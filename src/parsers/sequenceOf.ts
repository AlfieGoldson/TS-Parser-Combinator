import {
  Parser,
  updateParserResult,
  IParserState,
  ParserResult,
  clearParserResult,
} from "../Parser.ts";

export const sequenceOf = <T>(
  parsers: Parser<any, any>[],
): Parser<any, T> =>
  new Parser<any, T>((parserState: IParserState<any>) => {
    if (parserState.isError) {
      return parserState;
    }
    const results: T[] = [];
    let nextState = parserState;

    for (let p of parsers) {
      nextState = p.parserStateTransformerFn(nextState);

      results.push(nextState.result as T);
    }

    return updateParserResult<any, T>(nextState, results);
  });
