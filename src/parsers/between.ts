import { Parser } from "../Parser.ts";
import { sequenceOf } from "./sequenceOf.ts";

export const between = <T>(
  leftParser: Parser<T, T>,
  rightParser: Parser<T, T>,
) =>
  (contentParser: Parser<T, T>) =>
    sequenceOf([
      leftParser,
      contentParser,
      rightParser,
    ]).map((result) => {
      if (!(result instanceof Array)) return result;
      return result[1];
    });
