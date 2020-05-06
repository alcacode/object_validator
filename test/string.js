export const testConfig = {
    basic: {
        description: 'Basic',
        arg: 'abc',
        decl: { type: 'string' }
    },
    stringPattern: {
        description: 'String Pattern',
        arg: 'abc11',
        decl: {
            type: 'string',
            pattern: '%c%i%i'
        }
    },
    stringPatternInvalid: {
        description: 'String Pattern Mismatch',
        arg: 'abc111',
        shouldFail: true,
        decl: {
            type: 'string',
            pattern: '%c%i%i'
        }
    },
    stringPatternComplex: {
        description: 'Complex String Pattern',
        arg: 'abc 123.456 5......       \n',
        decl: {
            type: 'string',
            pattern: '%c %d %i*%w%n'
        }
    },
    regExpPattern: {
        description: 'RegExp Pattern',
        arg: '123@ a',
        decl: {
            type: 'string',
            pattern: /[0-9]{3}\@\s[a]/
        }
    },
    regExpPatternInvalid: {
        description: 'RegExp Pattern Mismatch',
        arg: '123@a',
        shouldFail: true,
        decl: {
            type: 'string',
            pattern: /[0-9]{3}\@\s[a]/
        }
    }
};
