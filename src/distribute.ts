import { START, DATA, END, Callbag } from './index';

export const distribute = (source: Callbag): Callbag => {
    let sinks: Array<{ (t: START | DATA | END, d: unknown): void }> = [];
    let sourceTalkback;
    let invoke = 0;
    return (start: START | DATA | END, sink: { (t: START | DATA | END, d: unknown): void }): void => {
        if (start !== 0) return;
        sinks.push(sink);
        const sinkId = sinks.length - 1;

        // this handles connectivity from sink
        const talkback = (t: START | DATA | END, d: unknown): void => {
            if (t === 2) {
                const i = sinks.indexOf(sink);
                if (i > -1) sinks.splice(i, 1);
                if (!sinks.length) sourceTalkback(2);
            } else {
                // most recent request is this sinkId
                invoke = sinkId;
                sourceTalkback(t, d);
            }
        };
        // method that retains scope.
        const proxy = (t: START | DATA | END, d: unknown): void => {
            sinks[invoke](t, d);
        };
        // on first sink - make connection to source
        if (sinks.length === 1) {
            source(0, (t: START | DATA | END, d: unknown) => {
                if (t === 0) {
                    sourceTalkback = d;
                    sink(0, talkback);
                } else if (t === 1) {
                    // console.log(`forwarding data for last request ${d}`);
                    proxy(t, d);
                }
                if (t === 2) {
                    for (const s of sinks.slice(0)) s(t, d);
                    sinks = [];
                }
            });
            return;
        }
        sink(0, talkback);
    };
};
