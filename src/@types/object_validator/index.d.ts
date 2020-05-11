declare module 'object_validator'
{
	/** ES-6 types. */
	export type BaseTypes = ('object'|'function'|'number'|'bigint'|'string'|
				 'undefined'|'boolean'|'symbol');

	export type MacroTypes = ('any'|'array'|'null'|'int'|'arraylike');

	export type OptionCheckerTypes = BaseTypes|MacroTypes;

	export interface OptTransform<T = any> {
		/**
		 * If present and type does not match type of value,
		 * replace value with the return value of `onWrongType`
		 * called with itself as the
		 * first argument.\
		 * \
		 * Note: `onWrongType` is called _before_ `transformFn`.
		 */
		onWrongType?: (value: any) => T;

		/**
		 * If present, replace value with the return value of
		 * `transformFn` called with itself as the first
		 *  argument.\
		 * \
		 * Note: `transformFn` is called _after_ `onWrongType`.
		 */
		transformFn?: (value: any) => T;
	}

	export interface OptLength {
		/**
		 * Maximum allowed length. Ignored if value lacks a
		 * numeric `length` property.
		 */
		maxLength?: number;
		/**
		 * Minimum allowed length. Ignored if value lacks a
		 * numeric `length` property.
		 */
		minLength?: number;
	}

	export interface OptInstance {
		/**
		 * If present, reject values that are not instances of
		 * `instance`.
		 */
		instance?: new(...args: any[]) => any;
	}

	export interface OptRange {
		/**
		 * Maximum numeric value. Ignored if type is not
		 * `number` or `bigint`.
		 */
		max?: number;
		/**
		 * Minimum numeric value. Ignored if type is not
		 * `number` or `bigint`.
		 */
		min?: number;
	}

	export interface OptCoerceType {
		/**
		 * If `true`, attempt to convert value to the one
		 * specified in `type`.
		 */
		coerceType?: boolean;
	}

	export interface OptCompactArrayLike {
		/**
		 * If `true`, remove any gaps resulting from a partial
		 * pass. Instances of `Array` and `TypedArray` are
		 * considered array-like.
		 *
		 * Note: Has no effect if `allowPartialPass` is not
		 * `true`.
		 */
		compactArrayLike?: boolean;
	}

	export interface OptPatternMatch {
		/**
		 * Test input value against pattern.
		 *
		 * If `pattern` is a string value, the following special tokens
		 * can be used (case sensitive):
		 *   - `*` Wildcard, matches anything.
		 *   - `%d` Matches any number, including the fractional part.
		 * 	Only period/full stop decimal points are supported.
		 *   - `%i` Matches any whole number.
		 *   - `%s` Matches any non-whitespace character.
		 *   - `%n` Matches newline.
		 *   - `%w` Matches any whitespace character.
		 *   - `%c` Matches any latin alphabet character (a-zA-Z).
		 * 
		 * Repeated tokens match exactly _n_ times, where _n_ is the number of repetitions.
		 * 
		 * Note: Special token generation can be prevented by escaping the character.
		 */
		pattern?: string|RegExp;

		/**
		 * Original pattern value.
		 * @internal
		 */
		__pattern?: string;
	}

	export interface OptionRuleBase extends OptTransform {
		/**
		 * If `true` throw an exception if value is missing or
		 * invalid.
		 */
		required?: boolean;

		/**
		 * Value used to replace missing or invalid values
		 * with.\ Ignored if `required` is `true`.
		 */
		defaultValue?: any;

		/**
		 * If present, pass value as argument to `passTest` and
		 * reject those
		 * where the return value is not `true`.\
		 * If the value is iterable then member items will be
		 * passed individually.
		 *
		 * This behavior can be overriden by `passFull`.
		 */
		passTest?: (value: any) => boolean;

		/**
		 * Pass the entire value to `passTest` regardless of
		 * type. Default: `false`.
		 */
		testFullValue?: boolean;

		/**
		 * Replace `string` and `object` values with the
		 * intersection of the set of given values and the set
		 * of possible valid values. Default: `false`.
		 */
		allowPartialPass?: boolean;

		/**
		 * Use the rules of another rule and map output to it.
		 * _All_ other rules are discarded if set. If the
		 * referenced rule does not exist, a warning message
		 * will be printed and the property will be discarded.
		 */
		macro?: PropertyKey;

		/**
		 * Inherit rules from another rule. Settings defined on the
		 * extending rule take precedence over inherited rules. If the
		 * referenced rule does not exist or forms a circular reference,
		 * a warning will be printed and the property will be discarded.
		 */
		extends?: PropertyKey;

		/**
		 * Map property to a different property key in the output
		 * object.
		 */
		mapTo?: PropertyKey;

		/**
		 * If `true`, a mapped property may overwrite the property
		 * it is mapped to (the last valid value is used). If
		 * `false`, a mapped property is only used when the
		 * property it is mapped to is either missing or invalid.
		 * Defaults to the value of the global `allowOverride`.
		 */
		allowOverride?: boolean;

		/**
		 * If `true`, extends property search to include the input
		 * object's prototype chain.
		 * 
		 * # Example
		 * 
		 * ```js
		 * const schema = {
		 * 	hasOwnProperty: {
		 * 		type: 'function',
		 * 		allowInherited: true
		 * 	}
		 * };
		 * 
		 * normalizeObject(schema, {}); // { hasOwnProperty: [Function: hasOwnProperty] }
		 * ```
		 */
		allowInherited?: boolean;

		/** 
		 * Reference chain of expanded rule.
		 * @internal
		 */
		__refs?: string[];
	}

	export interface OptionRuleBoolean extends OptCoerceType {
		type: 'boolean';
	}

	export interface OptionRuleString extends OptLength, OptCoerceType, OptPatternMatch {
		type: 'string';
	}

	export interface OptionRuleMacro {
		macro: PropertyKey;
		type?: undefined;
	}

	export interface OptionRuleExtends {
		extends: string;
		type?: undefined;
	}
	export interface OptionRuleAny {
		type: 'any';
	}
	export interface OptionRuleNull {
		type: 'null';
	}
	export interface OptionRuleUndefined {
		type: 'undefined';
	}
	export interface OptionRuleSymbol {
		type: 'symbol';
	}

	export interface OptionRuleObject extends OptLength, OptInstance,
						  OptCompactArrayLike {
		type: 'object'|'arraylike';
	}

	export interface OptionRuleFunction extends OptLength, OptInstance {
		type: 'function';
	}

	export interface OptionRuleArray extends OptLength,
						 OptCompactArrayLike {
		type: 'array';
	}

	export interface OptionRuleNumber extends OptRange, OptCoerceType {
		type: 'number'|'int';

		/** If `true`, reject non-integer values. */
		notFloat?: boolean;

		/** If `true`, reject NaN-values. */
		notNaN?: boolean;

		/**
		 * If `true`, reject non-finite values. If `false`,
		 * allow infinite values.
		 */
		notInfinite?: boolean;
	}

	export interface OptionRuleBigint extends OptRange, OptCoerceType {
		type: 'bigint';
	}

	export type CoercableTypes = ('bigint'|'boolean'|'number'|'string');
	export type CoercableOptionRuleType = OptionRuleBase&
		{type: CoercableTypes};

	export type RuleObject = { [key: string]: OptionRule };

	export type OptionRule = OptionRuleBase &
		(OptionRuleObject|OptionRuleString|OptionRuleFunction|
		 OptionRuleUndefined|OptionRuleNumber|OptionRuleBigint|
		 OptionRuleBoolean|OptionRuleArray|OptionRuleSymbol|
		 OptionRuleNull|OptionRuleAny|OptionRuleMacro|OptionRuleExtends);

	export type Schema<O extends RuleObject = RuleObject> = {
		[P in keyof O]: O[P] & OptionRule
	}

	export const enum RULE_ERROR {
		UNRECOGNIZED_OPTION = 1,
		REFERENCE_ERROR = 2,
		CIRCULAR_REFERENCE = 3
	}

	export const enum ERRNO {
		OUT_OF_RANGE,
		NOT_FINITE,
		NOT_A_NUMBER,
		NOT_INTEGER,
		MISSING_VALUE,
		INVALID_TYPE,
		TEST_FAIL,
		INVALID_LENGTH,
		INVALID_INSTANCE,
		UNEXPECTED_VALUE,
		NOT_ARRAY_LIKE,
		PATTERN_MISMATCH
	}

	export const enum COERCE_TYPE {BIGINT, BOOLEAN, NUMBER, STRING}

	export type typeRetVal<T> = T extends string ? (
		T extends 'number' ? number :
		T extends 'int' ? number :
		T extends 'string' ? string :
		T extends 'object' ? object :
		T extends 'array' ? any[] :
		T extends 'bigint' ? BigInt :
		T extends 'symbol' ? symbol :
		T extends 'undefined' ? undefined :
		T extends 'null' ? null :
		T extends 'arraylike' ? ArrayLike<any> :
		T extends 'any' ? any :
		T extends 'boolean' ? boolean :
		T extends 'function' ? (...args: any[]) => any :
		T
	) : unknown;

	export interface Options {
		/**
		 * (Global) Overrides the default value of
		 * `allowOverride`. Does _not_ override individually set
		 * `allowOverride`. Default: `true`.
		 */
		allowOverride?: boolean;

		/**
		 * If `true`, print warnings when encountering non-fatal
		 * errors.\
		 * Default: `true`
		 */
		printWarnings?: boolean;

		/**
		 * If `true`, causes `normalizeObject()` to return a null
		 * prototype object, otherwise its prototype will be `Object`.
		 */
		noReturnValuePrototype?: boolean;

		/**
		 * If `true`, skips parsing schema with `expandSchema()`.
		 */
		skipSchemaExpansion?: boolean;

		/**
		 * If `true`, throw an exception if any rule contains
		 * circular references.\
		 * Default: `false`.
		 */
		throwOnCircularReference?: boolean;

		/**
		 * If `true`, throw a ReferenceError if a rule contains
		 * references to non-existent rules.\
		 * Default: `false`.
		 */
		throwOnReferenceError?: boolean;

		/**
		 * If `true`, throw an exception if any undeclared properties
		 * exist on the input object.\
		 * Default: `false`.
		 */
		throwOnUnrecognized?: boolean;

		/**
		 * If `true`, throw an exception if the input object
		 * contain any invalid values.\
		 * Default: `false`.
		 */
		throwOnInvalid?: boolean;
	}

	export function normalizeObject<O extends RuleObject, P extends { [k in keyof O]?: any } = any>(
		schema: Schema<O>,
		obj?: P,
		options?: Options): {[k in keyof O]: 'macro' extends keyof O[k] ? undefined :
			(k extends keyof P ? (P[k] extends typeRetVal<O[k]['type']> ? P[k] : typeRetVal<O[k]['type']>) : typeRetVal<O[k]['type']>) |
			('defaultValue' extends keyof O[k] ? O[k]['defaultValue'] : (O[k]['required'] extends true ? never : undefined))
		};

	export function validateObject<O extends RuleObject, P extends { [k in keyof O]?: any } = any>(
		schema: Schema<O>,
		obj?: P,
		options?: Options): boolean;

	/**
	 * Creates a new function that take an input object as its only
	 * argument. When called the input object is passed to `normalizeObject`
	 * along with the options it was created with and schema in its expanded
	 * form.
	 */
	export function createNormalizer<
		S extends Schema, P extends {[k in keyof S]?: any}>(
		schema: S, options?: Options&{skipSchemaExpansion: true}):
		(obj?: P) => ReturnType<typeof normalizeObject>;

	/**
	 * Creates a new function that take an input object as its only
	 * argument. When called the input object is passed to `validateObject`
	 * along with the options it was created with and schema in its expanded
	 * form.
	 */
	export function createValidator<
		S extends Schema, P extends {[k in keyof S]?: any}>(
		schema: S, options?: Options&{skipSchemaExpansion: true}):
		(obj?: P) => ReturnType<typeof validateObject>;
}