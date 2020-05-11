import {normalizeObject, validateObject} from './../index.js';
import {testConfig as tc_gen} from './general.js';
import {testConfig as tc_str} from './string.js';
import {testConfig as tc_arr} from './array.js';
import {testConfig as tc_arr_like} from './arraylike.js';
import {testConfig as tc_num} from './number.js';
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

const tests: { [key: string]: TestConfig } = {
	any: tc_gen,
	string: tc_str,
	array: tc_arr,
	arrayLike: tc_arr_like,
	number: tc_num,
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

	if (typeof obj === 'number')
		return Number;
	if (typeof obj === 'bigint')
		return BigInt;

	if ('prototype' in obj)
		return obj.prototype;

	if ('__proto__' in obj)
		return obj.__proto__;

	// Likely is Object created by Object.create(null).
	if (typeof obj === 'object')
		return null;
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
let resCount = [0, 0];

const validate_test_1 = validateObject(vTestDecl, { a: 1 }) === true;
const validate_test_2 = validateObject(vTestDecl, { b: 1 }) === false;

resCount[validate_test_1 ? 0 : 1]++;
resCount[validate_test_2 ? 0 : 1]++;

console.log(`Passed validateObject returns true: `, validate_test_1);
console.log(`Failed validateObject returns false:`, validate_test_2);

for (const ck in tests) {
	console.log();
	console.groupCollapsed(centerAndPad(` ${ck.toUpperCase()} `, '='));

	for (const tk in tests[ck]) {
		const pKey = (tests[ck][tk].propKey || tk) as string;
		const t = tests[ck][tk];
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

		let descStr = (t.description || pKey).substring(0, 48);
		if (t.description && t.description.length >= 48)
			descStr += '…'; // <- One character.

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
			console.log(`\n> ${descStr.padEnd(46, ' ')} [%c${didPass ? 'PASSED' : 'FAILED'}]`, `color:${didPass ? 'green' : 'red'};font-weight:600;`);
			console.log('Input:          ', (inputObj ? inputObj : '<no argument>'));
			console.log('Output:         ', didParse ? res[propKey] : '<no return value>');
			console.log('Property Key:   ', didParse ? propKey : '<no return value>');
			console.log('Expected Value: ', t.shouldThrow ? 'N/A' : expect ? expect : '<no return value>');
			console.log('Should Fail:    ', t.shouldFail ? 'Yes' : 'No');
			console.log('Should Throw:   ', t.shouldThrow ? 'Yes' : 'No');

			if (didParse)
				console.log('Full Output:    ', res);

			let resStr = `Result:          %c${didPass ? 'PASSED' : 'FAILED'}%c`;
			if (!didParse)
				resStr += `, exception${errMsg ? ` %c(${errMsg})` : ''}`;
			else if (!(propKey in res))
				resStr += ', option discarded';
			else if (!gotExpected)
				resStr += `, unexpected value. Expected ${t.expect ? t.expect : 'no return value'}, got ${res[propKey] ? t.expect : 'no return value'}.`;

			console.log(resStr + '\n', `color:${didPass ? 'green' : 'red'};font-weight:600;`, '', '');
		} else {
			console.log(`${descStr.padEnd(48, ' ')} [PASSED]`);
		}
	}

	console.groupEnd();
}

const totalRes = resCount[0] + resCount[1];
console.log(`Passed: ${resCount[0]} / ${totalRes}`);
console.log(`\nFinal result: ${resCount[0] === totalRes ? 'PASS' : 'FAIL'}`);