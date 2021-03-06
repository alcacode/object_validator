import {normalizeObject, validateObject} from './../index.js';
import {testConfig as tc_gen} from './general.js';
import {testConfig as tc_str} from './string.js';
import {testConfig as tc_arr} from './array.js';
import {testConfig as tc_arr_like} from './arraylike.js';
import {testConfig as tc_num} from './number.js';
import {testConfig as tc_obj} from './object.js';
import type {TestConfig, Schema, Options} from 'object_validator';

/**
 * If `true` logs exception error stack (if it exist). If `false` only print
 * error message thrown by exception.
 */
const LOG_ERROR_STACK = false;

/**
 * If `true`, display verbose output for all tests. If `false`, only display
 * verbose output for failed tests.
 */
const EXPAND_ALL = false;
const OUTPUT_MAX_LENGTH = 60;

const normalizationTests: { [key: string]: TestConfig } = {
	any: tc_gen,
	string: tc_str,
	array: tc_arr,
	arrayLike: tc_arr_like,
	number: tc_num,
	object: tc_obj,
};

function printDesc(desc: string, maxLength: number) {
	let buf = '';
	let lastBreakPoint = 0;
	for (let i = 0; i < desc.length; i++) {
		if (desc[i] === ' ' || desc[i] === '\n' || desc[i] === '\r' ||
		    desc[i] === '-') {
			lastBreakPoint = i;
		}

		buf += desc[i];
		if (buf.length >= maxLength) {
			const l = lastBreakPoint - i + buf.length;
			console.log(buf.slice(0, l).trimEnd());
			buf = buf.slice(l).trim();
		}
	}

	if (buf)
		console.log(buf);
}

function centerAndPad(str: string, fillString: string)
{
	const l1 = Math.floor((OUTPUT_MAX_LENGTH + str.length) / 2);

	return str.padStart(l1, fillString)
		.padEnd(OUTPUT_MAX_LENGTH, fillString);
}

function getPrototype<T extends any>(obj: T)
{
	if (obj === undefined || obj === null)
		return;

	return Object.getPrototypeOf(obj);
}

/**
 * Returns `true` if two objects `a` and `b`, contain identical sets of
 * properties and values therein.
 */
function partiallyEQ(a: any, b: any): boolean
{
	if (a === b)
		return true;

	const aType = typeof a;
	const bType = typeof b;
	if (a === undefined    || b === undefined    || aType === 'bigint' ||
	    bType === 'bigint' || aType === 'string' || bType === 'string' ||
	    aType === 'symbol' || bType === 'symbol')
		return a === b;

	// NaN is a special case as it's not equal to itself.
	if (aType === 'number' || bType === 'number') {
		if (aType === 'number' && bType === 'number' &&
		    Number.isNaN(a) && Number.isNaN(b))
			return true;

		return a === b;
	}

	// Get rid of null-values early or they'll cause problems later on.
	if (aType !== bType || (a === null && b !== null) ||
	    (a !== null && b === null))
		return false;

	const aProto = getPrototype(a);
	const bProto = getPrototype(b);

	// Treat null-prototype objects as ordinary object literals.
	if (aProto !== bProto && (aProto !== null && bProto !== Object.prototype) &&
	    (bProto !== null && aProto !== Object.prototype))
		return false;

	const aProps = Object.getOwnPropertyDescriptors(a);
	const bProps = Object.getOwnPropertyDescriptors(b);

	for (const k in aProps) {
		if (!aProps.hasOwnProperty(k))
			continue;

		if (!(k in bProps))
			return false;

		if (aProps[k].configurable !== bProps[k].configurable ||
		    aProps[k].enumerable   !== bProps[k].enumerable   ||
		    aProps[k].writable     !== bProps[k].writable     ||
		    aProps[k].get          !== bProps[k].get	      ||
		    aProps[k].set          !== bProps[k].set	      ||
		    !partiallyEQ(a[k], b[k]))
			return false;
	}

	// Check for additional properties in b.
	for (const k in bProps) {
		if (!(k in aProps))
			return false;
	}

	return true;
}

const O: Options = {
	throwOnCircularReference: true,
	throwOnReferenceError: true,
	throwOnUnrecognized: true,
	throwOnInvalid: false
};

const vTestDecl: Schema = {
	a: { type: 'number', required: true },
	b: { extends: 'a', required: false }
};
const miscTests = {
	getPrototype_objLit() {
		return getPrototype({}) === Object.prototype;
	},
	getPrototype_objNullProto() {
		return getPrototype(Object.create(null)) === null;
	},
	getPrototype_arrLit() {
		return getPrototype([]) === Array.prototype;
	},
	getPrototype_class() {
		class _b extends Array {
		};
		return getPrototype(new _b()) === _b.prototype;
	},
	partiallyEQ_eqArrLit() {
		return partiallyEQ([1,2,3], [1,2,3]) === true;
	},
	partiallyEQ_neqArrLit() {
		return partiallyEQ([1,2,3], [3,2,1]) === false;
	},
	partiallyEQ_eqObj() {
		return partiallyEQ({a: 1}, {a: 1}) === true;
	},
	partiallyEQ_neqObj() {
		return partiallyEQ({a: 1}, {a: 2}) === false;
	},
	partiallyEQ_objLitAndNullObj() {
		return partiallyEQ({ a: 1 }, Object.create(null, {
			       a: {
				       value: 1,
				       enumerable: true,
				       writable: true,
				       configurable: true
			       }
		       })) === true;
	},
	partiallyEQ_objLitDifDescriptor() {
		const o = {a: 1};
		Object.defineProperty(o, 'a', { writable: false });
		return partiallyEQ({a: 1}, o) === false;
	},
	validateValidObject() {
		return validateObject(vTestDecl, { a: 1 }) === true;
	},
	validateInvalidObject() {
		return validateObject(vTestDecl, { b: 1 }) === false
	}
};

/** [passed, failed] */
let resCount = [0, 0];

console.log(); // New line.
console.groupCollapsed(centerAndPad(` MISC `, '='));
for (const [key, test] of Object.entries(miscTests)) {
	const res = test();
	console.log(`${key.padEnd(49, ' ')} [${res ? 'PASS' : 'FAIL'}]`);
	resCount[res ? 0 : 1]++;
}
console.groupEnd();

for (const ck in normalizationTests) {
	console.log(); // New line.
	console.groupCollapsed(centerAndPad(` ${ck.toUpperCase()} `, '='));

	for (const tk in normalizationTests[ck]) {
		const pKey = (normalizationTests[ck][tk].propKey || tk) as string;
		const t = normalizationTests[ck][tk];
		const decl: Schema = {
			[pKey]: t.decl,
			__numRefTarget: {
				type: 'number',
				min: 1,
				max: 2,
				defaultValue: 1,
			},
			__numRefTargetMacro: {
				macro: '__numRefTarget'
			},
			__selfMacro: {
				macro: pKey
			},
			__selfReference: {
				type: t.decl.type!,
				extends: pKey,
				required: false
			},
		};
		const expect = t.shouldFail || t.shouldThrow ?
				       undefined :
				       'expect' in t ? t.expect : t.arg;
		const inputObj: { [x: string]: any } = {};

		if ('arg' in t)
			inputObj[pKey] = t.arg;

		let _label = (t.label || pKey).substring(0, 48);
		if (t.label && t.label.length >= 48)
			_label += '…'; // <- One character.

		let res: Schema<any> = Object.create(null);
		let didParse = false;
		let errMsg: string = '';

		// parseOptions might throw if 'required' is set.
		try {
			res = normalizeObject(decl, inputObj, O);
			didParse = true;
		} catch (err) {
			errMsg = err instanceof Error ?
					 (LOG_ERROR_STACK && err.stack ?
						  err.stack :
						  err.message) :
					 'unknown error';
		}

		const propKey = ((decl[pKey].macro ?? decl[pKey].mapTo) ?? pKey) as string;
		const gotExpected = partiallyEQ(res[propKey], expect);
		let didPass = didParse && gotExpected;

		if (t.shouldThrow)
			didPass = !didParse;

		if (t.shouldFail && !didPass)
			didPass = true;

		resCount[didPass ? 0 : 1] += 1;

		if (!didPass || EXPAND_ALL) {
			console.log(`\n> ${_label.padEnd(47, ' ')} [%c${didPass ? 'PASS' : 'FAIL'}]`, `color:${didPass ? 'green' : 'red'};font-weight:600;`);
			if (t.description)
				printDesc(t.description + '\n', 56);

			console.log('Input:          ', (inputObj ? inputObj : '<no argument>'));
			console.log('Output:         ', didParse ? res[propKey] : '<no return value>');
			console.log('Property Key:   ', didParse ? propKey : '<no return value>');
			console.log('Expected Value: ', t.shouldThrow ? '<exception>' : expect ? expect : '<no return value>');
			console.log('Should Fail:    ', t.shouldFail ?  'Yes' : 'No');
			console.log('Should Throw:   ', t.shouldThrow ? 'Yes' : 'No');

			if (didParse)
				console.log('Full Output:    ', res);

			let resStr = `Result:          %c${didPass ? 'PASS' : 'FAIL'}%c`;
			if (!didParse)
				resStr += `, exception${errMsg ? ` %c(${errMsg})` : ''}`;
			else if (!(propKey in res))
				resStr += ', option discarded';
			else if (!gotExpected)
				resStr += `, unexpected value. Expected '${expect ?? 'no return value'}', got '${res[propKey] ?? 'no return value'}'.`;

			console.log(resStr + '\n', `color:${didPass ? 'green' : 'red'};font-weight:600;`, '', '');
		} else {
			console.log(`${_label.padEnd(49, ' ')} [PASS]`);
		}
	}

	console.groupEnd();
}

console.log(`\nPassed: ${resCount[0]} / ${resCount[0] + resCount[1]}`);