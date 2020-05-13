/// <reference path="index.d.ts" />

import {
	RULE_ERROR,
	ERRNO,
	OptionRule,
	Schema,
	OptionRuleNumber,
	OptionRuleBigint,
	OptionRuleObject,
	OptionRuleString,
	BaseTypes,
	Options,
	typeRetVal,
	CoercableOptionRuleType,
	CoercableTypes,
	OptCoerceType,
	InputObject
} from 'object_validator';

const MAX_REFERENCE_DEPTH = 16;
const SIMPLE_PATTERN_REGEX = /^\(([^()]+)(?:\+|\*)(?=\))\)$/;

function isObject<T extends object>(arg: any): arg is T
{
	return arg !== null && (typeof arg === 'object' || arg instanceof Object);
}

function _hasOwnProperty<P extends PropertyKey>(obj: object, p: P): obj is { [k in P]: any } {
	return Object.prototype.hasOwnProperty.call(obj, p);
}

function hasProperty<T extends object>(obj: T, prop: PropertyKey, allowInherited?: boolean): prop is keyof T {
	if (!isObject(obj))
		return false;

	if (allowInherited !== true)
		return _hasOwnProperty(obj, prop);

	return prop in obj;
}

function isTypedArray(val: any): val is TypedArrayInstance {
	return val instanceof Uint8Array.prototype.__proto__.constructor;
}

function isIterable<T extends any, U extends IterableIterator<T>>(val: any): val is U
{
	if (!(val[Symbol.iterator] instanceof Function))
		return false;

	const itr = val[Symbol.iterator]();
	if (!(itr[Symbol.iterator] instanceof Function))
		return false;

	let tmp;
	return isObject<Iterator<any>>(itr)  &&
	       'next' in itr		     &&
	       itr.next instanceof Function  &&
	       isObject(tmp = itr.next())    &&
	       typeof tmp.done === 'boolean' &&
	       'value' in tmp;
}

function isArrayLike<T>(val: any): val is ArrayLike<T>
{
	if (!isObject(val) || !_hasOwnProperty(val, 'length') || typeof val.length !== 'number')
		return false;

	return Array.isArray(val) || isTypedArray(val) || isIterable(val);
}

function shouldCoerceType(rule: OptionRule&OptCoerceType): rule is CoercableOptionRuleType {
	return rule.coerceType === true &&
		(rule.type === 'number' || rule.type === 'boolean' ||
		 rule.type === 'string' || rule.type === 'bigint');
}

function isConstructor(arg: any): arg is new (...args: any[]) => any
{
	return arg instanceof Object && typeof arg.constructor === 'function';
}

function ToNumber(val: any): number {
	if (typeof val === 'number')
		return val;

	if (typeof val === 'bigint')
		return Number(val);

	// Converting a Symbol to Number is not allowed.
	if (typeof val === 'symbol')
		return NaN;

	return +val;
}

function coerceType(value: any, toType: CoercableTypes) {
	if (toType === 'bigint') {
		let v: BigInt | null = null;
		try {
			v = BigInt(ToNumber(value));
		} catch(err) { /* Intentionally left empty. */
		}

		return v;
	}

	if (toType === 'boolean')
		return !!value;

	if (toType === 'number')
		return ToNumber(value);

	if (toType === 'string') {
		// String concatenation with a Symbol is not allowed.
		if (typeof value === 'symbol')
			return String(value);

		return '' + (value);
	}

	throw TypeError("invalid destination type");
}

function getSpecies<T extends any>(O: T): (new (...args: any) => any) | void
{
	if (!isObject(O))
		return;

	let S: (new (...args: any[]) => any)|undefined = undefined;

	try {
		S = O[Symbol.species];
	} finally { /* Intentionally left blank. */
	}

	if (S === undefined) {
		if (O.prototype)
			S = O.prototype;
		else
			S = O.__proto__;
	}

	return S;
}

function SpeciesConstructor<T extends any>(
	O: T, defaultConstructor: new (...args: any[]) => any)
{
	const C = O.constructor;
	if (C === undefined)
		return defaultConstructor;

	if (isObject(C)) {
		const S = getSpecies(C);
		if (S === undefined || S === null)
			return defaultConstructor;

		if (isConstructor(S))
			return S;
	}

	throw new TypeError(C + ' is not a valid constructor');
}

function createMatchRegExp(arg: string | RegExp): RegExp {
        if (typeof arg !== 'string') {
                if (arg instanceof RegExp)
                        return arg;

                throw TypeError(`'${arg}' is not a valid pattern`);
        }

        let out: string[] = [];
        /** Flag used to indicate that the next character might be part of a spcial sequence. */
        let specialCharFlag = 0;
        /** Indicates that the current character is escaped. */
        let escapeFlag = 0;

        for (let i = 0, cc = 0; i < arg.length; i++) {
                cc = arg.charCodeAt(i);

                if (specialCharFlag) {
                        specialCharFlag = 0;

                        switch (cc) {
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_C:
                                out.push(PATTERN_REGEXP.LATIN_ALPHABET);
                                continue;
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_D:
                                out.push(PATTERN_REGEXP.NUMBER_AND_FRACTION);
                                continue;
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_I:
                                out.push(PATTERN_REGEXP.WHOLE_NUMBER);
                                continue;
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_N:
                                out.push(PATTERN_REGEXP.NEWLINE);
                                continue;
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_S:
                                out.push(PATTERN_REGEXP.NON_WHITESPACE);
                                continue;
                        case PATTERN_CHARS.LATIN_SMALL_LETTER_W:
                                out.push(PATTERN_REGEXP.WHITESPACE);
                                continue;
                        }
                }

                if (!escapeFlag && cc === PATTERN_CHARS.PERCENT_SIGN) {
                        specialCharFlag = 1;
                } else if (!escapeFlag && cc === PATTERN_CHARS.ASTERISK) {
                        out.push(PATTERN_REGEXP.ANY);
                } else {
                        out.push(`\\${cc > 0xFF ? `u{${cc.toString(16)}}` : `x${cc.toString(16)}`}`);
                }

                if (cc === PATTERN_CHARS.REVERSE_SOLIDUS)
                        escapeFlag = 1;
                else
                        escapeFlag = 0;
        }

        for (let i = out.length - 1, c = 0; i >= 0; i--) {
                if (out[i] !== out[i - 1] || i === 0) {
                        if (c > 0) {
				out.splice(i, c);
				// Strip outer parentheses and quantifier.
				if (SIMPLE_PATTERN_REGEX.test(out[i]))
					out[i] = out[i].replace(SIMPLE_PATTERN_REGEX, '$1');

				out[i] = `(${out[i]}{${c + 1}})`;
				c = 0;
                        }
                        continue;
                }

		c++;
        }

        return new RegExp(`^${out.join('')}$`, 'u');
}

function handleRuleError(type: RULE_ERROR.CIRCULAR_REFERENCE, opts: Options, ruleName: PropertyKey, lastNonCirc?: PropertyKey, circRef?: any): void;
function handleRuleError(type: RULE_ERROR.REFERENCE_ERROR, opts: Options, ruleName: PropertyKey, faultRefName?: PropertyKey): void;
function handleRuleError(type: RULE_ERROR.UNRECOGNIZED_OPTION, opts: Options, ruleName: PropertyKey): void;
function handleRuleError(type: RULE_ERROR, opts: Options, ruleName: PropertyKey, subst_0?: PropertyKey, subst_1?: PropertyKey): void
{
	let errorConst: ErrorConstructor | undefined = undefined;
	let doWarn = opts.printWarnings === false ? false : true;
	let msg = '';

	switch (type) {
	case RULE_ERROR.UNRECOGNIZED_OPTION:
		msg = `Option object contains unrecognized option '${String(ruleName)}'`;
		if (opts.throwOnUnrecognized === true)
			errorConst = Error;

		doWarn = false;
		break;
	case RULE_ERROR.REFERENCE_ERROR:
		msg = `Rule '${String(ruleName)}' was discarded because it references non-existent rule '${String(subst_0)}'`;

		if (opts.throwOnReferenceError === true)
			errorConst = ReferenceError;

		break;
	case RULE_ERROR.CIRCULAR_REFERENCE:
		if (ruleName === subst_0)
			msg = `Rule '${String(ruleName)}' references itself`;
		else
			msg = `Rule '${String(ruleName)}' forms a circular reference because rule '${String(subst_0)}' references '${String(subst_1)}'`;

		if (opts.throwOnCircularReference === true)
			errorConst = Error;

		break;
	}

	if (errorConst instanceof Function)
		throw errorConst(msg);
	else if (doWarn)
		console.warn(msg);
}

function invalid(obj: { [x: string]: any }, baseKey: PropertyKey,
		 targetKey: PropertyKey, rule: OptionRule, reason: ERRNO,
		 options: Options, extra?: Error): void
{
	baseKey = String(baseKey);

	if (options.throwOnInvalid !== true && reason !== ERRNO.SUB_RULE_MISMATCH &&
	    (rule.required !== true || (rule.__refs && rule.__refs.length))) {
		if ('defaultValue' in rule &&
		    (!(targetKey in obj) ||
		     ((rule.mapTo || rule.macro) && targetKey in obj &&
		      rule.allowOverride))) {
			obj[targetKey as string] = rule.defaultValue;
		}

		return;
	}

	let prop: string;
	if (baseKey === targetKey)
		prop = `Value matching rule '${baseKey}'`;
	else
		prop = `Value mapped to '${String(targetKey)}' via rule '${baseKey}'`;

	switch (reason) {
	case ERRNO.OUT_OF_RANGE:
		rule = rule as (OptionRuleNumber | OptionRuleBigint);
		const rangeMax = 'max' in rule ? ' < ' + (rule.max! + 1) : '';
		const rangeMin = 'min' in rule ? (rule.min! - 1) + ' < ' : '';

		throw RangeError(`${prop} is not within its allowed ` +
				 `range [${rangeMin}x${rangeMax}]`);
	case ERRNO.NOT_FINITE:
		throw RangeError(`${prop} is not a finite number`);
	case ERRNO.NOT_A_NUMBER:
		throw TypeError(`${prop} must not be NaN`);
	case ERRNO.NOT_INTEGER:
		throw TypeError(`${prop} is not an integer`);
	case ERRNO.MISSING_VALUE:
		throw ReferenceError(`Missing required value for rule '${baseKey}'.`);
	case ERRNO.INVALID_TYPE:
		throw TypeError(`${prop} must be of type ${rule.type},` +
				` got ${typeof obj[baseKey]}`);
	case ERRNO.TEST_FAIL:
		throw Error(`${prop} failed to validate`);
	case ERRNO.INVALID_LENGTH:
		rule = rule as (OptionRuleObject | OptionRuleString);

		if (typeof obj[baseKey].length !== 'number')
			throw ReferenceError(prop + 'has a specified max \
                                and/or min length but value lacks a length property');

		const lenMax = 'maxLength' in rule ?
				       ' < ' + (rule.maxLength! + 1) :
				       '';
		const lenMin = 'minLength' in rule ?
				       (rule.minLength! - 1) + ' < ' :
				       '';

		throw RangeError(
			`${prop} has an invalid length, the ` +
			`allowed range is [${lenMin}length${lenMax}]`);
	case ERRNO.INVALID_INSTANCE:
		rule = rule as OptionRuleObject;
		if (rule.instance && rule.instance.name)
			throw TypeError(`${prop} is not an instance of ${
				rule.instance.name}`);
		else
			throw TypeError(`${prop} is not a valid instance type`);
	case ERRNO.UNEXPECTED_VALUE:
		throw Error(`${prop} has an unexpected value`);
	case ERRNO.NOT_ARRAY_LIKE:
		throw Error(`${prop} is not an array-like Object`);
	case ERRNO.PATTERN_MISMATCH:
		rule = rule as OptionRuleString;
		let tmp = `${prop} does not match pattern ${rule.pattern}`;
		if (rule.__pattern)
			tmp += ` (derived from '${rule.__pattern}')`;

		throw Error(tmp);
	case ERRNO.SUB_RULE_MISMATCH:
		throw Error(`Sub-rule '${baseKey}' failed to validate: ${extra?.message}`);
	}

	throw Error(`${prop} is invalid (unknown reason: ${reason})`);
}

/** Returns `key` or the property key at the end of a macro chain. */
function getRootMacro<T extends PropertyKey>(key: T, schema: Schema<any>, opts: Options): T
{
	let chain: T[] = [key];
	let cur: T|undefined = schema[key]?.macro;

	for (let i = 0; i < MAX_REFERENCE_DEPTH; i++) {
		if (cur === undefined) {
			cur = chain.pop();
			break;
		}

		if (!(cur in schema)) {
			handleRuleError(RULE_ERROR.REFERENCE_ERROR, opts, key, cur);
			break;
		} else if (chain.includes(cur)) {
			handleRuleError(RULE_ERROR.CIRCULAR_REFERENCE, opts,
					key, cur, schema[cur].macro);
			break;
		}

		chain.push(cur);
		cur = schema[cur].macro;
	}

	return cur ?? key;
}

function extendRule(target: OptionRule, source: OptionRule, allowOverwrite?: boolean) {
	if (allowOverwrite)
		return Object.assign(target, source);

	for (const [k, v] of Object.entries(source)) {
		if (k in target || k === '__isExpanded')
			continue;

		target[k as keyof typeof target] = v;
	}
}

function resolveReference<O extends Schema = {}, K extends keyof O = keyof O>(key: string & K, schema: O, opts: Options): (O[K] & OptionRule) | undefined {
	let out = {...schema[key], __refs: schema[key].__refs ?? []};
	Object.defineProperty(out, '__refs', { enumerable: false });

	for (let i = 0, cur: K & string = key; i < MAX_REFERENCE_DEPTH; i++) {
		cur = getRootMacro(cur, schema, opts);

		const rule: OptionRule = schema[cur];
		if (rule && rule.extends === undefined) {
			extendRule(out, rule);
			out.__refs.push(cur);
			break;
		} else if (!rule || rule.extends === undefined || !(rule.extends in schema)) {
			handleRuleError(RULE_ERROR.REFERENCE_ERROR, opts, key, rule.extends);
			return;
		} else if (out.__refs.includes(cur)) {
			handleRuleError(RULE_ERROR.CIRCULAR_REFERENCE, opts, key, cur, rule.extends);
			break;
		}

		out.__refs.push(cur);
		Object.assign(out, rule);

		// getRootMacro cannot be moved here.
		if (rule.extends !== undefined)
			cur = rule.extends as K & string;
		else
			break;
	}

	// Remove reference to self.
	out.__refs.shift();

	// Expanded rules must not contain 'extends'.
	delete out.extends;

	return out;
}

declare type ObjectOf<T> = (
	{ [key: string]: T } &
	{ [key: number]: T } &
	// Workaround for TS insisting that Symbols can't index Objects.
	/// @ts-ignore
	{ [key: symbol]: T }
);

/** Returns the expanded schema based on `schema`. */
function expandSchema<T extends Schema, K extends string = string & keyof T>(schema: T, opts: Options, parentChain: OptionRule[] = []): T
{
	const out = Object.assign(Object.create(null), schema) as Schema;
	const refs: ObjectOf<K[]> = Object.create(null);

	for (const k of Object.keys(schema) as K[]) {
		if (out[k].__isExpanded) {
			out[k] = schema[k];
			continue;
		}

		let rule: OptionRule = out[k];

		if (schema[k].extends && !schema[k].macro) {
			const opt = resolveReference<T, K>(k, schema, opts);

			if (opt)
				Object.assign(rule, opt);
		}

		if (!refs[k])
			refs[k] = [];

		if (schema[k].macro) {
			const r = getRootMacro(k, schema, opts);
			if (!refs[r])
				refs[r] = [];

			if (r !== k && !refs[r].includes(k))
				refs[r].push(k);
		} else if (schema[k].mapTo && schema[k].mapTo! in schema) {
			const _k = schema[k].mapTo as string;
			if (!refs[_k])
				refs[_k] = [];

			if (!refs[_k].includes(k))
				refs[_k].push(k);
		}

		// A required rule implies that its dependencies are, too.
		if (rule.required === true) {
			for (let i = 0; i < parentChain.length; i++) {
				if (parentChain[i].required === false)
					break;

				parentChain[i].required = true;
			}
		}

		if (isObject(rule.subRule)) {
			if (rule.type === 'object') {
				rule.subRule = expandSchema(rule.subRule, opts, Array.prototype.concat(parentChain, rule));
			} else {
				if (opts.printWarnings)
					console.warn(`Rule '${k}' incorrectly implements subRule: rule type is not 'object'.`);

				delete rule.subRule;
			}
		}

		if (typeof out[k].allowOverride !== 'boolean' && !schema[k].macro)
			out[k].allowOverride = !opts.allowOverride;

		if (rule.type === 'string' && typeof rule.pattern === 'string') {
			rule.__pattern = rule.pattern;
			rule.pattern = createMatchRegExp(rule.pattern);
		} else if (rule.type !== 'string' && 'pattern' in rule) {
			if (opts.printWarnings)
				console.warn(`Rule '${k}' incorrectly implements pattern: rule type is not 'string'.`);

			delete (rule as OptionRuleString).pattern;
		}

		rule.__isExpanded = true;
	}

	for (const k in refs) {
		if (refs[k].length && !out[k].hasOwnProperty('__refs'))
			Object.defineProperty(out[k], '__refs', { enumerable: false, value: [] });

		for (let i = 0; i < refs[k].length; i++) {
			if (!out[k].__refs!.includes(refs[k][i]))
				out[k].__refs!.push(refs[k][i]);
		}
	}

	return out as T;
}

function evalTestFn(val: any, fn?: (arg: any) => boolean, passFull?: boolean,
		    partial?: boolean, cmpctArrLike?: boolean): [boolean, typeof val]
{
	if (!(fn instanceof Function))
		return [true, val];

	if (passFull === true || val === undefined || val === null ||
	    typeof val === 'symbol' ||
	    !(val[Symbol.iterator] instanceof Function)) {
		return [!!fn.call(null, val), val];
	}

	// Handle edge cases.
	const isStr = (typeof val === 'string');
	const isMapOrSet = val instanceof Map || val instanceof Set;
	const isArrayLike = Array.isArray(val) || isTypedArray(val);

	let tmp: any;
	if (partial) {
		if (isStr)
			tmp = '';
		else
			tmp = new (SpeciesConstructor(val, Object));
	}

	let validIndicies: Set<any> = new Set();
	let result = true;
	let entries: [string | number | symbol, any][];

	if (isMapOrSet)
		entries = [...val.entries()];
	else
		entries = Object.entries(val);

	for (const [k, v] of entries) {
		if (!fn.call(null, v)) {
			if (!partial) {
				result = false;
				break;
			}
		} else if (partial) {
			if (isStr)
				tmp += v;
			else if (isMapOrSet)
				'set' in tmp ? tmp.set(k, v) : tmp.add(v);
			else
				tmp[k] = v;

			validIndicies.add(k);
		}
	}

	if (partial && validIndicies.size === 0)
		result = false;

	if (result && isArrayLike && cmpctArrLike && validIndicies.size !== val.length)
		tmp = tmp.filter((_: any, i: number) => validIndicies.has('' + i));

	validIndicies.clear();
	return [result, partial ? tmp : (tmp = null)];
}

const OptionsPrototype: Required<Options> = {
	allowOverride           : true,
	printWarnings           : true,
	noReturnValuePrototype  : true,
	skipSchemaExpansion	: false,
	throwOnCircularReference: false,
	throwOnInvalid          : false,
	throwOnReferenceError   : false,
	throwOnUnrecognized     : false
};
Object.freeze(OptionsPrototype);

export function normalizeObject<S extends Schema, P extends InputObject<S> = any>(
	schema: S,
	obj?: P,
	options?: Options): {
		[k in keyof S]: 'macro' extends keyof S[k] ? unknown :
		(k extends keyof P ? (P[k] extends typeRetVal<S[k]['type']> ? P[k] : typeRetVal<S[k]['type']>) : typeRetVal<S[k]['type']>) |
		('defaultValue' extends keyof S[k] ? S[k]['defaultValue'] :
			('required' extends keyof S[k] ? (true extends S[k]['required'] ? never : undefined) : undefined))
	}
{
	const required: Set<string> = new Set();
	const opts = {...OptionsPrototype, ...options};
	const out: P = Object.create(null) as P;
	if (typeof obj !== 'object')
		obj = out;

	if (opts.throwOnUnrecognized === true) {
		for (const k of Object.keys(obj)) {
			if (!(k in schema))
				handleRuleError(RULE_ERROR.UNRECOGNIZED_OPTION, schema, k);
		}
	}

	let _schema: Schema;
	if (opts.skipSchemaExpansion === true)
		_schema = schema;
	else
		_schema = expandSchema<S>(schema, opts);

	// Mapped options and macros need to go first
	// so that they do not take precedence.
	const declKeys = Object.keys(_schema).sort(
		(a, b) => (_schema[a].mapTo || _schema[a].macro ? -1 : 0) -
			  (_schema[b].mapTo || _schema[b].macro ? -1 : 0));

	for (const k of declKeys) {
		let rule = _schema[k];
		let targetKey = k;

		if (rule.macro) {
			const rootKey = getRootMacro(k, _schema, opts) as string;
			if (rootKey && _schema[rootKey] && rootKey !== k && !(!rule.allowOverride && rootKey in out))
				rule = _schema[rootKey];
			else
				continue;
	
			targetKey = rootKey;
		}
		targetKey = (rule.mapTo ?? targetKey) as string;

		let __eq_val;
		let __eq_flag = false;
		let __skip_type_check = false;
		let __check_arraylike = false;

		/* Convert macro types. */
		switch (rule.type) {
		case 'array':
			rule = Object.assign(rule, { type: 'object', instance: Array });
			break;
		case 'arraylike':
			rule = Object.assign(rule, { type: 'object' });
			__check_arraylike = true;
			break;
		case 'null':
			rule = Object.assign(rule, { type: 'object' });
			__eq_flag = true;
			__eq_val = null;
			break;
		case 'int':
			rule.type = 'number';
			rule.notFloat = true;
			break;
		case 'any':
			__skip_type_check = true;
			break;
		default:
			rule.type = rule.type?.toLowerCase() as BaseTypes;
			break;
		}

		if (!hasProperty(obj, k, rule.allowInherited)) {
			invalid(out, k, targetKey, rule, ERRNO.MISSING_VALUE, opts);
			if (rule.required)
				required.add(targetKey);
			continue;
		}

		let value = obj[k];

		if (shouldCoerceType(rule) && !__skip_type_check)
			value = coerceType(value, rule.type);

		if (rule.type !== typeof value && !__skip_type_check &&
		    rule.onWrongType instanceof Function)
			value = rule.onWrongType.call(null, value);

		if (rule.transformFn instanceof Function)
			value = rule.transformFn.call(null, value);

		/** Final value type. */
		const valType = typeof value;
		if (rule.type !== valType && !__skip_type_check) {
			invalid(out, k, targetKey, rule, ERRNO.INVALID_TYPE, opts);
			continue;
		}

		if (__eq_flag && value !== __eq_val) {
			invalid(out, k, targetKey, rule, ERRNO.UNEXPECTED_VALUE, opts);
			continue;
		}

		if (__check_arraylike && !isArrayLike(value)) {
			invalid(out, k, targetKey, rule, ERRNO.NOT_ARRAY_LIKE, opts);
			continue;
		}

		if ((rule.type === 'object' || rule.type === 'function') && value !== null && 'instance' in rule) {
			if (!isObject(value) ||
			    !(value instanceof rule.instance!)) {
				invalid(out, k, targetKey, rule, ERRNO.INVALID_INSTANCE, opts);
				continue;
			}
		}

		if (rule.type === 'object' && rule.subRule) {
			try {
				value = normalizeObject(rule.subRule, value, opts);
			} catch(err) {
				invalid(out, k, targetKey, rule, ERRNO.SUB_RULE_MISMATCH, opts, err);
				continue;
			}
		}

		/* Pattern matching. */
		if (rule.type === 'string' && rule.pattern && !(rule.pattern as RegExp).test(value)) {
			invalid(out, k, targetKey, rule, ERRNO.PATTERN_MISMATCH, opts);
			continue;
		}

		/* Test range and length. */
		if (valType === 'number' || valType === 'bigint') {
			if (('min' in rule && rule.min! > value) ||
			    ('max' in rule && rule.max! < value)) {
				invalid(out, k, targetKey, rule, ERRNO.OUT_OF_RANGE, opts);
				continue;
			}
		} else if (valType === 'string' || valType === 'object') {
			const len: number = typeof value?.length === 'number' ?
						    value?.length :
						    NaN;
			if (('minLength' in rule &&
			     (len === NaN || rule.minLength! > len)) ||
			    ('maxLength' in rule &&
			     (len === NaN || rule.maxLength! < len))) {
				invalid(out, k, targetKey, rule, ERRNO.INVALID_LENGTH, opts);
				continue;
			}
		}

		if (valType === 'number') {
			if ('notNaN' in rule && rule.notNaN && Number.isNaN(value)) {
				invalid(out, k, targetKey, rule, ERRNO.NOT_A_NUMBER, opts);
				continue;
			} else if ('notInfinite' in rule && rule.notInfinite &&
				   !Number.isFinite(value)) {
				invalid(out, k, targetKey, rule, ERRNO.NOT_FINITE, opts);
				continue;
			} else if ('notFloat' in rule && rule.notFloat &&
				   !Number.isInteger(value)) {
				invalid(out, k, targetKey, rule, ERRNO.NOT_INTEGER, opts);
				continue;
			}
		}

		const passTest =
			evalTestFn(value, rule.passTest, rule.testFullValue,
				   rule.allowPartialPass,
				   (rule as OptionRuleObject).compactArrayLike);

		if (!passTest[0]) {
			invalid(out, k, targetKey, rule, ERRNO.TEST_FAIL, opts);
			continue;
		} else {
			out[targetKey as keyof S] = passTest[1];
		}
	}

	for (const r of required) {
		if (!(r in out))
			invalid(out, r, r, { required: true } as OptionRule, ERRNO.MISSING_VALUE, opts);
	}

	if (opts.noReturnValuePrototype === false)
		return Object.assign({}, out);

	return out;
}

export function validateObject<S extends Schema, P extends InputObject<S> = any>(
		schema: Schema<S>, obj?: P, options?: Options): boolean
{
	var res;
	try {
		res = normalizeObject(schema, obj, options);
	} catch (err) { /* Intentionally left empty. */
	}

	return !!res;
}

export function createNormalizer<S extends Schema, P extends InputObject<S>>(schema: S, options?: Options): (obj?: P) => ReturnType<typeof normalizeObject> {
	const _options = Object.assign({}, options, { skipSchemaExpansion: true });
	const _schema  = expandSchema(schema, _options);
	return (obj?: P) => normalizeObject(_schema, obj, _options);
}

export function createValidator<S extends Schema, P extends InputObject<S>>(schema: S, options?: Options): (obj?: P) => ReturnType<typeof validateObject> {
	const _options = Object.assign({}, options, { skipSchemaExpansion: true });
	const _schema  = expandSchema(schema, _options);

	return (obj?: P) => validateObject(_schema, obj, _options);
}