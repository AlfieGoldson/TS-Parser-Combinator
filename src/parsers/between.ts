import { Parser } from "../Parser.ts";
import { sequenceOf } from "./sequenceOf.ts";

export const between = (
  leftParser: Parser<unknown, unknown>,
  rightParser: Parser<unknown, unknown>,
) =>
  <T, U>(contentParser: Parser<T, U>): Parser<T, U> =>
    sequenceOf([
      leftParser,
      contentParser,
      rightParser,
    ]).map<U>((result) => {
      if (!(result instanceof Array)) return result;
      return result[1];
    });
