import type { TestConfig } from 'object_validator';

export const testConfig: TestConfig = {
	basic: {
		label: 'Basic',
		arg: [1, 2, 3],
		decl: {type: 'array'}
	},
	filter: {
		label: 'Filter',
		arg: [1, 2, 3],
		expect: [, 2, 3],
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true
		}
	},
	filter_fail: {
		label: 'Filter (invalid)',
		arg: [1, 2, 3],
		expect: [],
		shouldFail: true,
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true
		}
	},
	filter_cmpct: {
		label: 'Filter (compacted)',
		arg: [1, 2, 3],
		expect: [2, 3],
		decl: {
			type: 'array',
			passTest: (v) => v > 1,
			allowPartialPass: true,
			compactArrayLike: true
		}
	},
};