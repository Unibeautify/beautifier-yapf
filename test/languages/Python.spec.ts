import * as fs from "fs";
import * as path from "path";

import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";
import { raw } from "../utils";

// tslint:disable:mocha-no-side-effect-code
describe("should successfully beautify Python files", () => {
  test(`should successfully beautify file test1.py`, () => {
    const text: string = fs
      .readFileSync(path.resolve(__dirname, `../fixtures/test1.py`))
      .toString();
    const unibeautify = newUnibeautify();
    unibeautify.loadBeautifier(beautifier);
    return unibeautify
      .beautify({
        languageName: "Python",
        options: {
          Python: {},
        },
        text,
      })
      .then(results => {
        expect(raw(results)).toMatchSnapshot();
      });
  });
});
