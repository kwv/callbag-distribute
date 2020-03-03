import { START, DATA, END, Callbag } from './index';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const uuidv1 = require('uuid/v1');

function logger(val: string): void {
    process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'dev' ? console.log(val) : undefined;
}
export function makeWorker(
    workFunction: (arg0: any) => Promise<any>,
    callback: (arg0: string) => void,
    myId = uuidv1(),
): Callbag {
    let talkback;

    process.env.NODE_ENV && process.env.NODE_ENV.trim() === 'dev' ? myId++ : undefined;

    // hack city.  continue to ask for more until hasMore is false.
    // another worker could have requested one while this worker is busy
    // in that case we receive a type == 2 message while we're doing stuff.
    let hasMore = true;

    // hack city.  busy is wraps the external `workFunction` call.
    // if we're not busy, when a type == 2 message comes in, go ahead and shut down.
    // us sending talkback 1 could result in a type 2 message (only)
    let busy = false;
    const start = process.hrtime();
    return function sink(type: START | DATA | END, data: Callbag | unknown): void {
        if (type === 0) {
            logger(`{worker: '${myId}', time:'${process.hrtime(start)}', event: 'handshake'}`);
            talkback = data;
            //asking for first data
            // eslint-disable-next-line prettier/prettier
            logger(`{worker: '${myId}', time:'${process.hrtime(start)}', event: 'handshake done...  asking for first '}`);
            talkback(1);
        }
        if (type === 1) {
            logger(`{worker: '${myId}', time:'${process.hrtime(start)}', event: 'starting', value:' ${data}'}`);
            busy = true;
            workFunction(data)
                .then(() => {
                    busy = false;
                    logger(
                        `{worker: '${myId}', time:'${process.hrtime(start)}', event: 'ending/next', value:' ${data}'}`,
                    );
                })
                .catch()
                .finally(() => {
                    if (hasMore) {
                        talkback(1);
                    } else {
                        logger(
                            `{worker: '${myId}', time:'${process.hrtime(start)}', event: 'finished', value:' ${data}'}`,
                        );
                        callback('complete');
                    }
                });
        }
        if (type === 2) {
            logger(`{worker: '${myId}', time:'${process.hrtime(start)}', event: 'tasks exhausted'}`);
            hasMore = false;
            if (!busy) {
                logger(`{worker: '${myId}', time:'${process.hrtime(start)}', event: 'finished'}`);
                callback('complete');
            }
        }
    };
}
