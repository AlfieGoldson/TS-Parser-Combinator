import { assertEquals } from "https://deno.land/std/testing/asserts.ts";
import { str } from "./str.ts";
import { IParserState } from "../../mod.ts";

Deno.test({
  name: "Str Test OK",
  fn(): void {
    const strings = ["a", "abc", "azerty"];
    strings.forEach((s) => {
      assertEquals(
        str(s).run(s),
        {
          targetString: s,
          index: s.length,
          result: s,
          error: "",
          isError: false,
        } as IParserState<string>,
      );
    });
  },
});

Deno.test({
  name: "Str Test Fail",
  fn(): void {
    const strings = ["a", "abc", "azerty"];
    strings.forEach((s) => {
      assertEquals(
        str(s).run("deno"),
        {
          targetString: "deno",
          index: 0,
          result: [],
          error: `str: Tried to match ${s}, but got deno`,
          isError: true,
        } as IParserState<string>,
      );
    });
  },
});

Deno.test({
  name: "Str Test Empty",
  fn(): void {
    const strings = ["a", "abc", "azerty"];
    strings.forEach((s) => {
      assertEquals(
        str(s).run(""),
        {
          targetString: "",
          index: 0,
          result: [],
          error: `str: Tried to match ${s}, but got Unexpected end of input`,
          isError: true,
        } as IParserState<string>,
      );
    });
  },
});
