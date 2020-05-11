import type { TestConfig } from 'object_validator';

export const testConfig: TestConfig = {
        basic: {
                label: 'Basic',
                description: "Tests if the returned value is the same as the input.",
                arg: 'abc',
                decl: { type: 'any' }
        },
        missing: {
                label: 'Optional missing',
                shouldFail: true,
                decl: { type: 'any' }
        },
        missingRequired: {
                label: 'Required missing',
                shouldFail: true,
                shouldThrow: true,
                decl: { type: 'any', required: true }
        },
        extension: {
                label: 'Extension',
                arg: 2,
                expect: 2,
                decl: { extends: '__numRefTarget' }
        },
        macro: {
                label: 'Macro',
                arg: 2,
                expect: 2,
                decl: { macro: '__numRefTarget' }
        },
        macroextends: {
                label: 'Reference to Macro',
                arg: 2,
                expect: 2,
                decl: { type: 'number', extends: '__numRefTargetMacro' }
        },
        circularSelfextends: {
                label: 'Circular Self-Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: 'circularSelfReference'
                }
        },
        circularReferenceToMacro: {
                label: 'Circular Reference to Macro',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: '__selfMacro'
                }
        },
        circularReferenceToextends: {
                label: 'Circular Reference to Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: '__selfReference'
                }
        },
        circularMacro: {
                label: 'Circular Macro',
                shouldThrow: true,
                decl: {
                        macro: 'circularMacro'
                }
        },
        referenceErrorextends: {
                label: 'Non-existent Reference',
                shouldThrow: true,
                decl: {
                        type: 'any',
                        extends: 'ruleThatDoesNotExist'
                }
        },
        referenceErrorMacro: {
                label: 'Non-existent Macro',
                shouldThrow: true,
                decl: {
                        macro: 'ruleThatDoesNotExist'
                }
        },
        mappedOption: {
                label: 'Mapped Option',
                arg: 123,
                decl: {
                        type: 'number',
                        mapTo: 'opt'
                }
        },
        inheritedValue: {
                label: 'Inherited Value',
                description: "Attempts to grab 'hasOwnProperty' from the input object's prototype.",
                expect: Object.prototype.hasOwnProperty,
                propKey: 'hasOwnProperty',
                decl: {
                        type: 'function',
                        allowInherited: true
                }
        },
        subRule: {
                label: 'Sub-rule',
                arg: { a: 1 },
                decl: {
                        type: 'object',
                        subRule: {
                                a: {
                                        type: 'any',
                                        required: true
                                }
                        }
                }
        },
        subSubRule: {
                label: 'Sub-rule inception',
                description: "Tests sub rules in sub rules.",
                arg: { a: { a: "a" } },
                decl: {
                        type: 'object',
                        subRule: {
                                a: {
                                        type: 'object',
                                        subRule: {
                                                a: {
                                                        type: 'string',
                                                        required: true
                                                }
                                        }
                                }
                        }
                }
        },
        subRuleReq: {
                label: 'Sub-rule required propagation',
                description: "Tests downward propagation of the 'required' rule.",
                shouldThrow: true,
                decl: {
                        type: 'object',
                        subRule: {
                                a: {
                                        type: 'any',
                                        required: true
                                }
                        }
                }
        },
        subRuleReqNoProp: {
                label: 'Sub-rule parent-dependant require',
                description: "Tests downward propagation prevention of the 'required' rule.",
                decl: {
                        type: 'object',
                        required: false,
                        subRule: {
                                a: {
                                        type: 'any',
                                        required: true
                                }
                        }
                }
        }
};