import { Parser, updateParserError, updateParserState } from "../Parser.ts";

export const matchRegex = (regex: RegExp) =>
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

export const letters = matchRegex(/^[A-Za-z]+/);
export const digits = matchRegex(/^[0-9]+/);
