import { isNull } from "util";

export = class Utility {

    public isDebug = false;

    private noop = 0;

    public toString(): string {
        return "[Utility isDebug=" + this.isDebug + "]";
    }

    public sleep(milliseconds: number): void {
        const now: number = Date.now();
        const then: number = now + milliseconds;
        while (Date.now() <= then) { this.noop = 0; }
        console.log("slept " + milliseconds.toString());
    }

    public clamp(value: number, min: number, max: number): number {
        return Math.min(Math.max(min, value), max);
    }

    public lerp(vector1: any, vector2: any , factor: number): any {
        let result: any = { x: 0, y: 0, z: 0 };
        result.x = vector1.x + (vector2.x - vector1.x) * factor;
        result.y = vector1.y + (vector2.y - vector1.y) * factor;
        result.z = vector1.z + (vector2.z - vector1.z) * factor;
        return result;
      }

    public debugLog(text: string): void {
        if (this.isDebug) {
            console.log(text);
        }
    }

    public debugVariable(label: string, variable: any): void {
        if (this.isDebug) {
            console.info(label, variable, typeof variable, JSON.stringify(variable));
        }
    }
};
