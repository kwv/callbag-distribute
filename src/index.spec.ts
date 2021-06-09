import { distribute, makeWorker } from './index';
import fromIter from 'callbag-from-iter';

import assert from 'assert';
function randomIntFromInterval(min: number, max: number): number {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}

const MAX_WORKERS = 20;
const arrayOfWork = Array.from(Array(21).keys());
const source = distribute(fromIter(arrayOfWork));
const workComplete: Array<Promise<string>> = [];

const DYNAMIC_WORKERS = arrayOfWork.length < MAX_WORKERS ? arrayOfWork.length : MAX_WORKERS;

const processed: Array<number> = [];
console.log(arrayOfWork);
console.time(`test ${arrayOfWork.length} across ${DYNAMIC_WORKERS} workers`);
for (let step = 0; step < DYNAMIC_WORKERS; step++) {
    workComplete.push(
        new Promise(resolve => {
            source(
                0,
                makeWorker(
                    data => {
                        // argument one - what to do with 'each' data value from source.  this is your business logic.
                        const randomTime = randomIntFromInterval(100, 2000);
                        // console.log(`start ${data} expecting to take ${randomTime}`);
                        // console.time(`stop  ${data}`);
                        return new Promise(resolve => {
                            const id = setTimeout(() => {
                                // console.timeEnd(`stop  ${data}`);
                                clearTimeout(id);
                                process.stdout.write('.');
                                processed.push(data);
                                resolve();
                            }, randomTime);
                        });
                    },
                    () => {
                        console.log(`worker ${step} complete`);
                        resolve(`worker ${step} complete`);
                    }, // upon completion, invoke this callback. this could resolve a promise in conjunction of Promise.all.
                ),
            );
        }),
    );
}
Promise.all(workComplete).then(() => {
    console.timeEnd(`test ${arrayOfWork.length} across ${DYNAMIC_WORKERS} workers`);
    console.log(`\nfinal result\n`, processed);
    const original = arrayOfWork.slice().sort((a, b) => a - b);
    const result = processed.slice().sort((a, b) => a - b);
    assert.deepEqual(original, result);
});
