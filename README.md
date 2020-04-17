# callbag-distribute

Callbag operator that broadcasts a single source to multiple sinks. Does reference counting on sinks and starts the source when the first sink gets connected, similar to RxJS [`.share()`](https://www.learnrxjs.io/operators/multicasting/share.html). Works on either pullable or listenable sources. Distributes on data requests one at a time.


## Usages
as depicted below, helpful for a Task Queue -> Task runner pattern.  when used with fromIter and array, it can be used to push each element into it's own task runner.  

`makeWorker` takes three arguments, a Promise (unit of work), a callback when the queue / worker is exhausted, and an optional Id for logging.

when ran as `NODE_ENV=dev` emits details of the queue processing.  

Each worker completes it's activity then asks for the 'next' available to work.  for the purposes of demonstration -- in the sample code below the task is an indeterminate SetTimeout.

This 'unit-of-work' could as well be driving a chrome browser or other computationally intensive tasks. 

note - if workers exceed amount of work to be done, workers will initialize with duplicate workloads.   recommend the pattern of setting the workers to length in that case


## installation

`npm install callbag-distribute`

## example


Share a pullable source to 5 pullers:

```js

import { distribute, makeWorker } from 'callbag-distribute'
import { fromIter } from 'callbag-from-iter';


function randomIntFromInterval(min: number, max: number): number {
    // min and max included
    return Math.floor(Math.random() * (max - min + 1) + min);
}
const MAX_WORKERS = 5;

// 1, 2, 3, ... 150
const arrayOfWork = Array.from(Array(150).keys());

const source = distribute(
    fromIter(arrayOfWork),
);

const DYNAMIC_WORKERS = arrayOfWork.length < MAX_WORKERS ? arrayOfWork.length : MAX_WORKERS;

for (let step = 0; step < DYNAMIC_WORKERS; step++) {
    source(
        0,
        makeWorker(
            data => { // argument one - what to do with 'each' data value from source.  this is your business logic.
                const randomTime = randomIntFromInterval(2000, 5000);
                console.log(`start ${data} expecting to take ${randomTime}`);
                console.time(`stop  ${data}`);
                return new Promise(resolve => {
                    const id = setTimeout(() => {
                        console.timeEnd(`stop  ${data}`);
                        clearTimeout(id);
                        resolve();
                    }, randomTime);
                });
            },
            () => console.log(`worker ${step} complete`), // upon completion, invoke this callback. this could resolve a promise in conjunction of Promise.all. 
        ),
    );
}

```
results in:
```
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'0,223164', event: 'handshake'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'0,2108004', event: 'handshake done...  asking for first '}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'0,2271832', event: 'starting', value:' 10'}
start 10 expecting to take 2442
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'0,3892', event: 'handshake'}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'0,60011', event: 'handshake done...  asking for first '}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'0,111226', event: 'starting', value:' 20'}
start 20 expecting to take 3607
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'0,3151', event: 'handshake'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'0,62442', event: 'handshake done...  asking for first '}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'0,103227', event: 'starting', value:' 30'}
start 30 expecting to take 2883
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'0,6640', event: 'handshake'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'0,52010', event: 'handshake done...  asking for first '}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'0,88967', event: 'starting', value:' 40'}
start 40 expecting to take 4497
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'0,2073', event: 'handshake'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'0,44151', event: 'handshake done...  asking for first '}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'0,82840', event: 'starting', value:' 50'}
start 50 expecting to take 3686
stop  10: 2442.566ms
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'2,445532320', event: 'ending/next', value:' 10'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'2,445671245', event: 'starting', value:' 60'}
start 60 expecting to take 4210
stop  30: 2883.590ms
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'2,885258026', event: 'ending/next', value:' 30'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'2,885691943', event: 'starting', value:' 70'}
start 70 expecting to take 4283
stop  20: 3611.561ms
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'3,612048365', event: 'ending/next', value:' 20'}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'3,612151050', event: 'starting', value:' 80'}
start 80 expecting to take 3960
stop  50: 3686.255ms
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'3,686604276', event: 'ending/next', value:' 50'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'3,686682518', event: 'starting', value:' 90'}
start 90 expecting to take 3349
stop  40: 4497.284ms
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'4,497598329', event: 'ending/next', value:' 40'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'4,497673581', event: 'starting', value:' 100'}
start 100 expecting to take 2215
stop  60: 4214.282ms
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'6,660369948', event: 'ending/next', value:' 60'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'6,660509683', event: 'starting', value:' 110'}
start 110 expecting to take 2133
stop  100: 2216.248ms
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'6,714199881', event: 'ending/next', value:' 100'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'6,714290982', event: 'starting', value:' 120'}
start 120 expecting to take 4390
stop  90: 3352.460ms
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'7,39403927', event: 'ending/next', value:' 90'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'7,39469828', event: 'starting', value:' 130'}
start 130 expecting to take 4979
stop  70: 4285.245ms
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'7,171343486', event: 'ending/next', value:' 70'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'7,171479174', event: 'starting', value:' 140'}
start 140 expecting to take 3710
stop  80: 3963.032ms
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'7,575604833', event: 'ending/next', value:' 80'}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'7,575750841', event: 'starting', value:' 150'}
start 150 expecting to take 2744
stop  110: 2133.248ms
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'8,794234102', event: 'ending/next', value:' 110'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'8,794378890', event: 'starting', value:' 160'}
start 160 expecting to take 4429
stop  150: 2746.237ms
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'10,322319219', event: 'ending/next', value:' 150'}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'10,322390166', event: 'starting', value:' 170'}
start 170 expecting to take 3706
stop  140: 3710.244ms
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'10,882026939', event: 'ending/next', value:' 140'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'10,882087033', event: 'starting', value:' 180'}
start 180 expecting to take 2475
stop  120: 4391.874ms
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'11,106455004', event: 'ending/next', value:' 120'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'11,106540831', event: 'starting', value:' 190'}
start 190 expecting to take 3592
stop  130: 4980.057ms
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'12,19704877', event: 'ending/next', value:' 130'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'12,19755390', event: 'starting', value:' 200'}
start 200 expecting to take 4229
stop  160: 4429.071ms
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'13,223731139', event: 'ending/next', value:' 160'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'13,223796726', event: 'tasks exhausted'}
{worker: 'dc464ce0-5d6b-11ea-9530-b78c45c386cc', time:'13,223846271', event: 'finished'}
worker 0 complete
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'13,221035639', event: 'tasks exhausted'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'13,220764960', event: 'tasks exhausted'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'13,220577889', event: 'tasks exhausted'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'13,220420585', event: 'tasks exhausted'}
stop  180: 2476.131ms
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'13,358533569', event: 'ending/next', value:' 180'}
{worker: 'dc46c211-5d6b-11ea-9530-b78c45c386cc', time:'13,358622798', event: 'finished', value:' 180'}
worker 2 complete
stop  170: 3707.192ms
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'14,29777617', event: 'ending/next', value:' 170'}
{worker: 'dc46c210-5d6b-11ea-9530-b78c45c386cc', time:'14,29829570', event: 'finished', value:' 170'}
worker 1 complete
stop  190: 3595.368ms
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'14,702740279', event: 'ending/next', value:' 190'}
{worker: 'dc46c212-5d6b-11ea-9530-b78c45c386cc', time:'14,702915802', event: 'finished', value:' 190'}
worker 3 complete
stop  200: 4230.908ms
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'16,250910924', event: 'ending/next', value:' 200'}
{worker: 'dc46c213-5d6b-11ea-9530-b78c45c386cc', time:'16,251002813', event: 'finished', value:' 200'}
worker 4 complete

```


### Thanks to
https://blog.krawaller.se/posts/explaining-callbags-via-typescript-definitions/