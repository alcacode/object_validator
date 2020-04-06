import type { TestConfig } from 'object_validator';

export const testConfig: TestConfig = {
        basic: {
                description: 'Basic',
                arg: 'abc',
                decl: { type: 'any' }
        },
        missing: {
                description: 'Optional missing',
                shouldFail: true,
                decl: { type: 'any' }
        },
        missingRequired: {
                description: 'Required missing',
                shouldFail: true,
                shouldThrow: true,
                decl: { type: 'any', required: true }
        },
        extension: {
                description: 'Extension',
                arg: 2,
                expect: 2,
                decl: { type: 'number', extends: '__numRefTarget' }
        },
        macro: {
                description: 'Macro',
                arg: 2,
                expect: 2,
                decl: { macro: '__numRefTarget' }
        },
        macroextends: {
                description: 'Reference to Macro',
                arg: 2,
                expect: 2,
                decl: { type: 'number', extends: '__numRefTargetMacro' }
        },
        circularSelfextends: {
                description: 'Circular Self-Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: 'circularSelfReference'
                }
        },
        circularReferenceToMacro: {
                description: 'Circular Reference to Macro',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: '__selfMacro'
                }
        },
        circularReferenceToextends: {
                description: 'Circular Reference to Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: '__selfReference'
                }
        },
        circularMacro: {
                description: 'Circular Macro',
                shouldThrow: true,
                decl: {
                        macro: 'circularMacro'
                }
        },
        referenceErrorextends: {
                description: 'Non-existent Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: 'ruleThatDoesNotExist'
                }
        },
        referenceErrorMacro: {
                description: 'Non-existent Macro',
                shouldThrow: true,
                decl: {
                        macro: 'ruleThatDoesNotExist'
                }
        },
        mappedOption: {
                description: 'Mapped Option',
                arg: 123,
                decl: {
                        type: 'number',
                        mapTo: 'opt'
                }
        }
};