declare type TypedArrayInstance =
        (Int8Array|Int16Array|Int32Array|BigInt64Array|Uint8Array|
                Uint8ClampedArray|Uint16Array|Uint32Array|BigUint64Array|
                Float32Array|Float64Array);

declare interface ArrayLike<T>{
        [Symbol.iterator](): IterableIterator<T>
}

declare interface Uint8Array {
        __proto__: { constructor: Function }
}

declare type typeRetVal<T> = T extends string ? (
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

declare const enum PATTERN_CHARS {
	ASTERISK = 0x002A,
	PERCENT_SIGN = 0x0025,
	REVERSE_SOLIDUS = 0x005C,
	LATIN_SMALL_LETTER_C = 0x0063,
	LATIN_SMALL_LETTER_D = 0x0064,
	LATIN_SMALL_LETTER_I = 0x0069,
	LATIN_SMALL_LETTER_N = 0x006E,
	LATIN_SMALL_LETTER_S = 0x0073,
	LATIN_SMALL_LETTER_W = 0x0077,
}

declare const enum PATTERN_REGEXP {
	ANY = '(.*)',
	LATIN_ALPHABET = '([a-zA-Z]+)',
	NEWLINE = '\\n',
	NON_WHITESPACE = '\\S+',
	NUMBER_AND_FRACTION = '([0-9]+(?:\\.[0-9]+|))',
	WHITESPACE = '\\s+',
	WHOLE_NUMBER = '([0-9]+)',
}