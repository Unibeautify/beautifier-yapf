import * as fs from "fs";
import * as path from "path";
import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "../../src";
import { raw } from "../utils";
jest.mock("tmp", () => ({
  file(options: any, callback: any) {
    return callback(new Error("Create file failed"));
  }
}));
// tslint:disable:mocha-no-side-effect-code
test(`should error creating tmp file`, () => {
  const text: string = fs
    .readFileSync(path.resolve(__dirname, `../fixtures/test1.py`))
    .toString();
  const unibeautify = newUnibeautify();
  unibeautify.loadBeautifier(beautifier);
  return expect(
    unibeautify
    .beautify({
      languageName: "Python",
      options: {
        Python: {},
      },
      text,
    })
  ).rejects.toThrowError("Create file failed");
});
