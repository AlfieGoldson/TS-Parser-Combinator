import { Parser, IParserState } from "../Parser.ts";

export const lazy = <T, U>(parserThunk: () => Parser<T, U>) =>
  new Parser((parserState: IParserState<T>) => {
    const parser = parserThunk();
    return parser.parserStateTransformerFn(parserState);
  });
