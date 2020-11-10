declare const _default: {
    new (): {
        isDebug: boolean;
        noop: number;
        toString(): string;
        sleep(milliseconds: number): void;
        clamp(value: number, min: number, max: number): number;
        lerp(vector1: any, vector2: any, factor: number): any;
        debugLog(text: string): void;
        debugVariable(label: string, variable: any): void;
    };
};
export = _default;
