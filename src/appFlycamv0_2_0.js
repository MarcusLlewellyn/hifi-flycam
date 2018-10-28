var FlycamController = Script.require("./lib/FlycamController.js?" + Date.now());
var Main = /** @class */ (function () {
    function Main() {
        this.flycam = new FlycamController();
        this.flycam.audioFollowCamera(true);
    }
    return Main;
}());
var entry = new Main();
//# sourceMappingURL=appFlycamv0_2_0.js.map