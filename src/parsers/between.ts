import { Parser } from "../Parser.ts";
import { sequenceOf } from "./sequenceOf.ts";

export const between = <T, U>(
  leftParser: Parser<T, U>,
  rightParser: Parser<T, U>,
) =>
  (contentParser: Parser<T, U>) =>
    sequenceOf([
      leftParser,
      contentParser,
      rightParser,
    ]).map((result) => {
      if (!(result instanceof Array)) return result;
      return result[1];
    });
