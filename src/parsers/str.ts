import { Parser, updateParserError, updateParserState } from "../Parser.ts";

export const str = (s: string) =>
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
