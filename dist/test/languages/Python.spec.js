"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const unibeautify_1 = require("unibeautify");
const src_1 = require("../../src");
const utils_1 = require("../utils");
// tslint:disable:mocha-no-side-effect-code
describe("should successfully beautify Python files", () => {
    test(`should successfully beautify file test1.py`, () => {
        const text = fs
            .readFileSync(path.resolve(__dirname, `../fixtures/test1.py`))
            .toString();
        const unibeautify = unibeautify_1.newUnibeautify();
        unibeautify.loadBeautifier(src_1.default);
        return unibeautify
            .beautify({
            languageName: "Python",
            options: {
                Python: {},
            },
            text,
        })
            .then(results => {
            expect(utils_1.raw(results)).toMatchSnapshot();
        });
    });
});
//# sourceMappingURL=Python.spec.js.map