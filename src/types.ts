export type START = 0;
export type DATA = 1;
export type END = 2;
export type Callbag = (type: START | DATA | END, payload?: unknown) => void;
