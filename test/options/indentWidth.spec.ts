import { newUnibeautify, Beautifier } from "unibeautify";
import beautifier from "@src";

testWithTabWidth(0, true);
testWithTabWidth(1, true);
testWithTabWidth(2, true);

testWithTabWidth(0, false);
testWithTabWidth(2, false);
testWithTabWidth(4, false);

function testWithTabWidth(indentWidth: number, useTabs: boolean = false) {
  test(`should successfully beautify Python text with useTabs=${useTabs} and indentWidth=${indentWidth}`, () => {
    const unibeautify = newUnibeautify();
    unibeautify.loadBeautifier(beautifier);

    const indentChar = useTabs ? "\t" : " ";
    const indentation = useTabs ? "\t" : indentChar.repeat(indentWidth);
    const indentArg = useTabs ? "tab" : "space";

    const text = `def test(n):\n return n + 1\n`;
    const beautifierResult = `def test(n):\n${indentation}return n + 1\n`;

    return unibeautify
      .beautify({
        languageName: "Python",
        options: {
          Python: {
            indent_style: indentArg,
            indent_size: indentWidth,
          },
        },
        text,
      })
      .then(results => {
        expect(results).toBe(beautifierResult);
      });
  });
}
