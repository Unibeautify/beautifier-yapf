"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const src_1 = require("../src");
test("should successfully load package.json into pkg property of Beautifier", () => {
    const name = "@unibeautify/beautifier-yapf";
    expect(src_1.default.package).toHaveProperty("name", name);
});
//# sourceMappingURL=pkg.spec.js.map