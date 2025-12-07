import { START, DATA, END, Callbag } from './index';

type Sink = (t: START | DATA | END, d: unknown) => void;

export const distribute = (source: Callbag): Callbag => {
    let sinks: Array<Sink> = [];
    let sourceTalkback: Callbag | undefined;
    let invoke = 0;
    return (start: START | DATA | END, sink: unknown): void => {
        if (start !== 0) return;
        const actualSink = sink as Sink;
        sinks.push(actualSink);
        const sinkId = sinks.length - 1;

        // this handles connectivity from sink
        const talkback: Sink = (t: START | DATA | END, d: unknown): void => {
            if (t === 2) {
                const i = sinks.indexOf(actualSink);
                if (i > -1) sinks.splice(i, 1);
                if (!sinks.length && sourceTalkback) sourceTalkback(2);
            } else {
                // most recent request is this sinkId
                invoke = sinkId;
                if (sourceTalkback) sourceTalkback(t, d);
            }
        };
        // method that retains scope.
        const proxy: Sink = (t: START | DATA | END, d: unknown): void => {
            const targetSink = sinks[invoke];
            if (targetSink) {
                targetSink(t, d);
            }
        };
        // on first sink - make connection to source
        if (sinks.length === 1) {
            source(0, (t: START | DATA | END, d: unknown) => {
                if (t === 0) {
                    sourceTalkback = d as Callbag;
                    actualSink(0, talkback);
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
        actualSink(0, talkback);
    };
};
