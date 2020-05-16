import {
  between,
  str,
  sepBy,
  lazy,
  choice,
  letters,
  digits,
} from "../../mod.ts";

const btwSB = between(str("["), str("]"));
const commaSep = sepBy(str(","));

const value = lazy(() => choice([parser, letters, digits]));
const parser = btwSB(commaSep(value));

console.log(JSON.stringify(
  parser.run("[2,[123,abc],qwerty,[deno,land,3]]"),
  null,
  2,
));
