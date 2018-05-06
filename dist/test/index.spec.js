"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const unibeautify_1 = require("unibeautify");
const src_1 = require("../src");
test("should successfully install beautifier", () => {
    const unibeautify = unibeautify_1.newUnibeautify();
    unibeautify.loadBeautifier(src_1.default);
    expect(unibeautify.loadedBeautifiers.map(curr => curr.name)).toEqual([
        src_1.default.name,
    ]);
});
//# sourceMappingURL=index.spec.js.map