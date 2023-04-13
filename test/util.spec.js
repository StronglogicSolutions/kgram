"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const assert_1 = __importDefault(require("assert"));
const util_1 = require("../js/util");
describe('Utils tests', () => {
    it('Landscape is chosen', () => {
        const size = { width: 800, height: 500 };
        const style = (0, util_1.FindBestSize)(size);
        (0, assert_1.default)(style.type == util_1.image_type.landscape);
        (0, assert_1.default)(style.size.height == 566);
    });
    it('Porrait is chosen', () => {
        const size = { width: 200, height: 450 };
        const style = (0, util_1.FindBestSize)(size);
        (0, assert_1.default)(style.type == util_1.image_type.portrait);
        (0, assert_1.default)(style.size.height == 1350);
    });
    it('Square is chosen', () => {
        const size = { width: 50, height: 50 };
        const style = (0, util_1.FindBestSize)(size);
        (0, assert_1.default)(style.type == util_1.image_type.square);
        (0, assert_1.default)(style.size.height == 1080);
    });
});
//# sourceMappingURL=util.spec.js.map