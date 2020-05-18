import type { TestConfig } from 'object_validator';

export const testConfig: TestConfig = {
	mapMacro: {
                label: 'Map Macro',
                arg: new Map([['a', 1]]),
                decl: { type: 'map' }
        },
	setMacro: {
                label: 'Set Macro',
                arg: new Set(['a']),
                decl: { type: 'set' }
        },
};