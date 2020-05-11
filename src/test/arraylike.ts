import type { TestConfig } from 'object_validator';

const genericArrayLike: { [x: number]: any, length: number, [Symbol.iterator](): Iterator<any> } = {
        '0': 1,
        '1': 2,
        '2': 3,
        'length': 3,
        [Symbol.iterator]: function*(): Iterator<any> {
                for (const k in this) {
                        if (!Number.isNaN(+k))
                                yield this[k];
                }
        }
};

export const testConfig: TestConfig = {
	array: {
                label: 'Array',
		arg: [1, 2, 3],
		decl: { type: 'arraylike' }
        },
        typedArray: {
                label: 'Typed Array',
                arg: new Uint8Array([1,2,3]),
                decl: { type: 'arraylike' }
        },
        generic: {
                label: 'Array-like Object',
                arg: genericArrayLike,
                decl: { type: 'arraylike' }
        }
};