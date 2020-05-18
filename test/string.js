export const testConfig = {
    basic: {
        label: 'Basic',
        arg: 'abc',
        decl: { type: 'string' }
    },
    stringPattern: {
        label: 'String Pattern',
        arg: 'abc11',
        decl: {
            type: 'string',
            pattern: '%c%i%i'
        }
    },
    stringPatternInvalid: {
        label: 'String Pattern Mismatch',
        arg: 'abc111',
        shouldFail: true,
        decl: {
            type: 'string',
            pattern: '%c%i%i'
        }
    },
    stringPatternComplex: {
        label: 'Complex String Pattern',
        arg: 'abc 123.456 5......       \n',
        decl: {
            type: 'string',
            pattern: '%c %d %i*%w%n'
        }
    },
    regExpPattern: {
        label: 'RegExp Pattern',
        arg: '123@ a',
        decl: {
            type: 'string',
            pattern: /[0-9]{3}\@\s[a]/
        }
    },
    regExpPatternInvalid: {
        label: 'RegExp Pattern Mismatch',
        arg: '123@a',
        shouldFail: true,
        decl: {
            type: 'string',
            pattern: /[0-9]{3}\@\s[a]/
        }
    },
    patternRetain: {
        label: 'Retain Pattern',
        arg: 'abc123def456',
        expect: '123456',
        decl: {
            type: 'string',
            pattern: '%i',
            patternAction: 'retain'
        }
    },
    patternDiscard: {
        label: 'Discard Pattern',
        arg: 'abc123def456',
        expect: 'abcdef',
        decl: {
            type: 'string',
            pattern: '%i',
            patternAction: 'discard'
        }
    },
    patternReject: {
        label: 'Reject Pattern',
        arg: 'abc123def456',
        shouldFail: true,
        decl: {
            type: 'string',
            pattern: /\d+/g,
            patternAction: 'reject'
        }
    }
};
