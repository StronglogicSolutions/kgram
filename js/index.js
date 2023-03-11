const GetMessage = require('bindings')('kgramIPC');
//----------------------------------
class IGClient {
    constructor() {
        this.name = "Instagram Client";
    }
    init() { return true; }
    info() { return true; }
    getName() { return this.name; }
    post(text, media) { return true; }
}
//----------------------------------
function run() {
    setInterval(() => GetMessage(msg => console.log(msg)), 300);
}
run();
//# sourceMappingURL=index.js.map