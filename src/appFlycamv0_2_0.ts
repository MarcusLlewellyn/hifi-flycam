let FlycamController: any = Script.require("./lib/FlycamController.js?" + Date.now());

class Main {

    private flycam: any;

    constructor() {
        this.flycam = new FlycamController();
        this.flycam.audioFollowCamera(true);
    }
}

let entry: Main = new Main();
