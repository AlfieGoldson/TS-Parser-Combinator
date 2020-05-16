import {
  Parser,
  updateParserResult,
  IParserState,
  ParserResult,
} from "../Parser.ts";

// Transform this to be recursive to accept multiple types
export const sequenceOf = <T>(parsers: Parser<T, T>[]): Parser<T, T> =>
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
