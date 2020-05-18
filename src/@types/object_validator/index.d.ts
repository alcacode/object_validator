declare module 'object_validator'
{
	/** ES-6 types. */
	export type BaseTypes = ('object'|'function'|'number'|'bigint'|'string'|
				 'undefined'|'boolean'|'symbol');

	export type MacroTypes = ('any'|'array'|'null'|'int'|'arraylike');

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
		 * Pattern to apply. What action is taken is controlled by
		 * `patternAction`.
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
		 * @see patternAction
		 */
		pattern?: string|RegExp;

		/**
		 * Action performed on `pattern` match. Default: `'pass'`.
		 * 
		 * Possible values:
		 *  - `'pass'` - Pass if pattern matches.
		 *  - `'reject'` - Reject if pattern matches.
		 *  - `'retain'` - Retain only matching characters.
		 *  - `'discard'` - Discard matching characters.
		 */
		patternAction?: 'reject' | 'pass' | 'retain' | 'discard';

		/**
		 * Original pattern value.
		 * @internal
		 */
		__pattern?: string;
	}

	export interface OptionRuleBase {
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
		 * If `true`, a mapped property may overwrite the property
		 * it is mapped to (the last valid value is used). If
		 * `false`, a mapped property is only used when the
		 * property it is mapped to is either missing or invalid.
		 * Defaults to the value of the global `allowOverride`.
		 */
		allowOverride?: boolean;

		/**
		 * Replace `string` and `object` values with the
		 * intersection of the set of given values and the set
		 * of possible valid values. Default: `false`.
		 */
		allowPartialPass?: boolean;

		/**
		 * Value used to replace missing or invalid values
		 * with.\ Ignored if `required` is `true`.
		 */
		defaultValue?: any;

		/**
		 * Inherit rules from another rule. Settings defined on the
		 * extending rule take precedence over inherited rules. If the
		 * referenced rule does not exist or forms a circular reference,
		 * a warning will be printed and the property will be discarded.
		 */
		extends?: PropertyKey;

		/**
		 * Use the rules of another rule and map output to it.
		 * _All_ other rules are discarded if set. If the
		 * referenced rule does not exist, a warning message
		 * will be printed and the property will be discarded.
		 */
		macro?: PropertyKey;

		/**
		 * Map property to a different property key in the output
		 * object.
		 */
		mapTo?: PropertyKey;

		/**
		 * Function called for each matched valid input value.
		 * Its return value is used as the final output value.
		 * 
		 * # Parameters
		 * 
		 * - `value` <any>\
		 * Input value currently being evaluated. Note that this value
		 * will not necessarily correspond to the actual raw input as
		 * it might have been transformed by other rules, such as
		 * `onWrongType`.
		 * 
		 * # Return Value
		 * 
		 * Final output value.
		 * 
		 * It is recommended that the return type be identical to that
		 * of the input value.
		 */
		onPass?<T = any>(this: null, value: T): T;

		/**
		 * Function called if the input value type does not match the
		 * type specified by the rule. Its return value is used to
		 * replace input value.
		 * 
		 * # Parameters
		 * 
		 * - `value` <any>\
		 * Input value currently being evaluated.
		 * 
		 * # Return Value
		 * 
		 * Value replacing current input value.
		 */
		onWrongType?(this: null, value: any): OptionRuleReturnType<this>;

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
		 * If `true` throw an exception if value is missing or
		 * invalid.
		 */
		required?: boolean;

		/**
		 * Pass the entire value to `passTest` regardless of
		 * type. Default: `false`.
		 */
		testFullValue?: boolean;

		/** 
		 * Reference chain of expanded rule.
		 * @internal
		 */
		__refs?: string[];

		/**
		 * @internal
		 * @see OptionRuleObject
		 */
		subRule?: RuleObject;

		/**
		 * Bitfield of flags. For use internally.
		 * 
		 * | Bit Position  | Description                   |
		 * |:--------------|:------------------------------|
		 * | 1             | Rule MUST NOT be expanded.    |
		 * | 2-7           | Reserved.                     |
		 * | 8             | Expect value to be `null`.    |
		 * | 9             | Expect value to be ArrayLike. |
		 * | 10-32         | Reserved.                     |
		 * 
		 * @see RULE_FLAG
		 * @internal
		 */
		__flags?: number;
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

	interface OptionRuleObjectBase {
		subRule?: RuleObject;

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

	export type OptionRuleObject = (
		OptionRuleObjectBase & OptLength &
		(
			{ type: 'object' | 'arraylike' } & OptInstance |
			{ type: 'array', instance?: ArrayConstructor } |
			{ type: 'map',   instance?: MapConstructor }   |
			{ type: 'set',   instance?: SetConstructor }
		)
	);

	export interface OptionSubRule {
		__parent: OptionRule;
	}

	export interface OptionRuleFunction extends OptLength, OptInstance {
		type: 'function';
	}

	export interface OptionRuleNumber extends OptRange, OptCoerceType {
		type: 'number' | 'int';

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

	/** Returns the expected return type for a given OptionRule. */
	export type OptionRuleReturnType<T> = T extends (infer R & OptionRuleBase) ? OptionRuleRetType<R> : never;

	export type CoercableTypes = ('bigint'|'boolean'|'number'|'string');
	export type CoercableOptionRuleType = OptionRuleBase&
		{type: CoercableTypes};

	export type RuleObject = { [key: string]: OptionRule };

	export type OptionRule = OptionRuleBase &
		(OptionRuleObject|OptionRuleString|OptionRuleFunction|
		 OptionRuleUndefined|OptionRuleNumber|OptionRuleBigint|
		 OptionRuleBoolean|OptionRuleSymbol|
		 OptionRuleNull|OptionRuleAny|OptionRuleMacro|
		 OptionRuleExtends);

	export type Schema<O extends RuleObject = any> = {
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
		PATTERN_MISMATCH,
		SUB_RULE_MISMATCH
	}

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

	type OptionRuleRetType<T> = T extends OptionRule ? (
		T extends OptionRuleAny       ? any       :
		T extends OptionRuleBigint    ? bigint    :
		T extends OptionRuleBoolean   ? boolean   :
		T extends OptionRuleExtends   ? unknown   :
		T extends OptionRuleFunction  ? Function  :
		T extends OptionRuleMacro     ? unknown   :
		T extends OptionRuleNull      ? null      :
		T extends OptionRuleNumber    ? number    :
		T extends OptionRuleObject    ? object    :
		T extends OptionRuleString    ? string    :
		T extends OptionRuleSymbol    ? symbol    :
		T extends OptionRuleUndefined ? undefined : never
	): unknown;

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

	export type InputObject<S extends Schema = any> = { [k in keyof S]?: any };

	export function normalizeObject<S extends Schema, P extends InputObject<S> = any>(
		schema: S,
		obj?: P,
		options?: Options): {
			[k in keyof S]: 'macro' extends keyof S[k] ? unknown :
			(k extends keyof P ? (P[k] extends typeRetVal<S[k]['type']> ? P[k] : typeRetVal<S[k]['type']>) : typeRetVal<S[k]['type']>) |
			('defaultValue' extends keyof S[k] ? S[k]['defaultValue'] :
				('required' extends keyof S[k] ? (true extends S[k]['required'] ? never : undefined) : undefined))
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