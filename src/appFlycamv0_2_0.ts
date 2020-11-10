let libFlycamController: any = Script.require("./lib/FlycamController.js?" + Date.now());

class Main {

    private flycam: any;

    constructor() {
        this.flycam = new libFlycamController();
        // this.flycam.audioFollowCamera(true);
    }
}

let entry: Main = new Main();
