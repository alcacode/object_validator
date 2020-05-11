export const testConfig = {
    basic: {
        label: 'Basic',
        arg: 123,
        decl: { type: 'number' }
    },
    minValValid: {
        label: 'Minimum value',
        arg: 2,
        decl: {
            type: 'number',
            min: 2
        }
    },
    minValInvalid: {
        label: 'Minimum value (invalid)',
        arg: 2,
        shouldFail: true,
        decl: {
            type: 'number',
            min: 3
        }
    },
    maxValValid: {
        label: 'Maximum value',
        arg: 2,
        decl: {
            type: 'number',
            max: 2
        }
    },
    maxValInvalid: {
        label: 'Maximum value (invalid)',
        arg: 2,
        shouldFail: true,
        decl: {
            type: 'number',
            max: 1
        }
    },
    minMaxValValid: {
        label: 'Minimum & Maximum value',
        arg: 2,
        decl: {
            type: 'number',
            min: 1,
            max: 3
        }
    },
    minMaxValInvalid: {
        label: 'Minimum & Maximum value (invalid)',
        arg: 0,
        shouldFail: true,
        decl: {
            type: 'number',
            min: 1,
            max: 3
        }
    },
    numFromString: {
        label: 'String to Number',
        arg: '123',
        expect: 123,
        decl: {
            type: 'number',
            coerceType: true
        }
    },
    numFromStringInvalid: {
        label: 'String to Number (invalid)',
        arg: 'aaa',
        shouldFail: true,
        decl: {
            type: 'number',
            coerceType: true
        }
    },
    numFromBigInt: {
        label: 'BigInt to Number',
        arg: BigInt(123),
        expect: 123,
        decl: {
            type: 'number',
            coerceType: true
        }
    },
    numFromBoolean: {
        label: 'Boolean to Number',
        description: "f: [false, true] -> [0, 1]",
        arg: true,
        expect: 1,
        decl: {
            type: 'number',
            coerceType: true
        }
    }
};
