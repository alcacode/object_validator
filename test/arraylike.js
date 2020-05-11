const genericArrayLike = {
    '0': 1,
    '1': 2,
    '2': 3,
    'length': 3,
    [Symbol.iterator]: function* () {
        for (const k in this) {
            if (!Number.isNaN(+k))
                yield this[k];
        }
    }
};
export const testConfig = {
    array: {
        label: 'Array',
        arg: [1, 2, 3],
        decl: { type: 'arraylike' }
    },
    typedArray: {
        label: 'Typed Array',
        arg: new Uint8Array([1, 2, 3]),
        decl: { type: 'arraylike' }
    },
    generic: {
        label: 'Array-like Object',
        arg: genericArrayLike,
        decl: { type: 'arraylike' }
    }
};
