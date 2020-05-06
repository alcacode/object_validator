# object_validator

Provides object schema validation _and_ normalization through the `validateObject()` and `normalizeObject()` functions.

This project is based on my previous `OptionChecker`-project and is its direct successor.

## Installation

### NPM

```console
npm install alcacode/object_validator
```

### Manual

Download or clone the repository using `git clone https://github.com/alcacode/object_validator.git`.

## Usage

```JavaScript
const schema = {
    str: {
      type: 'string',
      // Reject values whose 'length' property is less than 1.
      minLength: 1,
      // Reject values whose 'length' property is greater than 10.
      maxLength: 10,
      // If the input was rejected, set the value to 'default'.
      defaultValue: 'default'
    },
    num: {
      type: 'number',
      // Reject values smaller than 10.
      min: 10,
      // Reject values greater than 30.
      max: 30,
      // Reject NaN values.
      notNaN: true,
      // Function whose return value replace input of wrong type.
      onWrongType: (v) => typeof v === 'string' ? +v : undefined
    },
    str2: {
      macro: 'str'
    }
}

// Just validate.
if (validateObject(schema, obj, options))
  console.log("Object is valid!");

// Validate and return a normalized object.
const normalized = normalizeObject(schema, obj, options);
```

In the above example, `normalized` is guaranteed to have `str` property with a `String` value of length between 1 and 10. If no valid `str` option is provided, the value of `str2` is used instead (provided that it is valid). If both `str` and `str2` are invalid or missing `str` will recieve its default value `'default'`.\
`normalized` will have a `num` property _if_ a `num` option with a non-`NaN` `Number` or `String` coercable to a `Number` value that is greater than or equal to `10` and less than or equal to `30` was provided.

## Table of Contents

- [object_validator](#objectvalidator)
  - [Installation](#installation)
    - [NPM](#npm)
    - [Manual](#manual)
  - [Usage](#usage)
  - [Table of Contents](#table-of-contents)
  - [Option types](#option-types)
    - [ES6 Types](#es6-types)
    - [Macro Types](#macro-types)
      - [Array](#array)
      - [Int](#int)
      - [Null](#null)
    - [Special Types](#special-types)
      - [Any](#any)
      - [ArrayLike](#arraylike)
  - [The `Options` Object](#the-options-object)
    - [`Options.allowOverride`](#optionsallowoverride)
    - [`Options.throwOnCircularReference`](#optionsthrowoncircularreference)
      - [Example](#example)
    - [`Options.throwOnReferenceError`](#optionsthrowonreferenceerror)
    - [`Options.throwOnUnrecognized`](#optionsthrowonunrecognized)
    - [`Options.throwOnInvalid`](#optionsthrowoninvalid)
    - [`Options.printWarnings`](#optionsprintwarnings)
  - [The `ObjectSchema` Object](#the-objectschema-object)
    - [**`ObjectSchema.type`**](#objectschematype)
    - [`ObjectSchema.required`](#objectschemarequired)
    - [`ObjectSchema.allowOverride`](#objectschemaallowoverride)
    - [`ObjectSchema.defaultValue`](#objectschemadefaultvalue)
    - [`ObjectSchema.pattern`](#objectschemapattern)
    - [`ObjectSchema.passTest(value)`](#objectschemapasstestvalue)
      - [Returns](#returns)
    - [`ObjectSchema.testFullValue`](#objectschematestfullvalue)
    - [`ObjectSchema.allowPartialPass`](#objectschemaallowpartialpass)
    - [`ObjectSchema.onWrongType(value)`](#objectschemaonwrongtypevalue)
    - [`ObjectSchema.transformFn(value)`](#objectschematransformfnvalue)
    - [`ObjectSchema.maxLength`](#objectschemamaxlength)
    - [`ObjectSchema.minLength`](#objectschemaminlength)
    - [`ObjectSchema.instance`](#objectschemainstance)
    - [`ObjectSchema.max`](#objectschemamax)
    - [`ObjectSchema.min`](#objectschemamin)
    - [`ObjectSchema.notFloat`](#objectschemanotfloat)
    - [`ObjectSchema.notNaN`](#objectschemanotnan)
    - [`ObjectSchema.notInfinite`](#objectschemanotinfinite)
    - [`ObjectSchema.coerceType`](#objectschemacoercetype)
      - [Conversion to `bigint`](#conversion-to-bigint)
      - [Conversion to `boolean`](#conversion-to-boolean)
      - [Conversion to `number`](#conversion-to-number)
      - [Conversion to `string`](#conversion-to-string)
    - [`ObjectSchema.compactArrayLike`](#objectschemacompactarraylike)
    - [`ObjectSchema.mapTo`](#objectschemamapto)
    - [`ObjectSchema.macro`](#objectschemamacro)
    - [`ObjectSchema.extends`](#objectschemaextends)
      - [Example](#example-1)
  - [`normalizeObject(schema[,obj][, options])`](#normalizeobjectschemaobj)
    - [Parameters](#parameters)
    - [Returns](#returns-1)
    - [Exceptions](#exceptions)
    - [Example](#example-2)
  - [`validateObject(schema[,obj][, options])`](#validateobjectschemaobj)
    - [Parameters](#parameters-1)
    - [Returns](#returns-2)
    - [Exceptions](#exceptions-1)

## Option types

The following types can be used in `ObjectSchema`. Type value is case-insensitive.

### ES6 Types

- object
- function
- number
- bigint
- string
- undefined
- boolean
- symbol

### Macro Types

Macro types are types that expand to a built-in type with some specific configuration.

#### Array

Shorthand for 'object' where `instance` is `Array`.

#### Int

Shorthand for 'number' where `isFloat` is `false`.

#### Null

Shorthand for 'object' where the only allowed value is `null`.

### Special Types

Special types are types with specific behavior associated with them.

#### Any

Allows any type to pass. Prevents `onWrongType` from being called.

#### ArrayLike

Any `Array`, `TypedArray`, or `Object` with a `Number` valued `length` property and `@@iterable` method returning well-formed iterables.
An iterable is considered well-formed when it has a `value` property and a `Boolean` valued `done` property.

## The `Options` Object

The options declaration object is used to declare the requirements of applicable to options and to tweak the behavior of `validateObject()`.

### `Options.allowOverride`

- <`boolean`>

Optional. Overrides the default value of `allowOverride`. Does _not_ override individually set `allowOverride`. Default: `true`.

### `Options.noReturnValuePrototype`

- <`boolean`>

If `true`, causes `normalizeObject()` to return a null prototype object, otherwise its prototype will be `Object`.

Default: `true`.

### `Options.throwOnCircularReference`

- <`boolean`>

Optional. If `true`, throw an exception if any rule contains circular references. Default: `false`.

#### Example

```JavaScript
{
  rule_1: {
    type: 'any',
    extends: 'rule_2'
  },
  rule_2: {
    extends: 'rule_1'
  },
  rule_3: {
    macro: 'rule_1'
  }
}
```

Resolving any of the above rules is impossible, because their reference chain contain themselves.

### `Options.throwOnReferenceError`

- <`boolean`>

Optional. If `true`, throw a `ReferenceError` if a rule contains references to non-existent rules. Default: `false`.

### `Options.throwOnUnrecognized`

- <`boolean`>

Optional. If `true`, throw an exception if any undeclared properties exist on the input object. Default: `false`.

### `Options.throwOnInvalid`

- <`boolean`>

Optional. If `true`, throw an exception if the input object contain _any_ invalid values. Default: `false`.

### `Options.printWarnings`

- <`boolean`>

Optional. If `true`, a warning message will be emitted when reference errors or circular references are found. Default: `true`.

## The `ObjectSchema` Object

Object specifying limits for individual options.

### **`ObjectSchema.type`**

- <`string`>

Required. Case insensitive. One of `'object'`, `'function'`, `'number'`, `'bigint'`, `'string'`, `'undefined'`, `'boolean'`, `'symbol'`, `'array'`, `'null'`, or `'any'`.

Note: Although the option value is tested against the specified type, there are multiple ways of converting said value to an appropriate type. What it really means is that the _resulting value_ of any conversion attempts must adhere to the specified type.

### `ObjectSchema.required`

- <`boolean`>

Optional. If `true` an exception will be thrown if the option is missing or its value is invalid.

### `ObjectSchema.allowOverride`

- <`boolean`>

Optional. If `true`, a mapped option may overwrite the option it is mapped to (the last valid value is used). If `false`, a mapped option will only used when the option it is mapped to is either missing or invalid. Defaults to the value of the global `allowOverride`.

### `ObjectSchema.defaultValue`

- <`any`>

Optional. Value to use if option is missing or its value is invalid. If set, that option is guaranteed to exist in the parsed options object.

Note: If `required` is `true` this value is effectively ignored.

### `ObjectSchema.pattern`

- <`RegExp`>

Optional. Test input value against pattern. If `pattern` is a string value, the following special tokens can be used (case sensitive):

- `*` Wildcard, matches anything.
- `%d` Matches any number, including the fractional part. Only period/full stop decimal points are supported.
- `%i` Matches any whole number.
- `%s` Matches any non-whitespace character.
- `%n` Matches newline.
- `%w` Matches any whitespace character.
- `%c` Matches any latin alphabet character (a-zA-Z).

Repeated tokens match exactly _n_ times, where _n_ is the number of repetitions.
For example `%c%c%c` match exactly 3 latin alphabet characters and is equivalent to `/^([a-zA-Z]{3})$/u`.

Note: Special token generation can be prevented by escaping the character.

### `ObjectSchema.passTest(value)`

Optional. Function used to test option value.

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated or its member items if an `@@iterator` method is present.

#### Returns

- <`boolean`>

`true` to validate value, `false` to invalidate the value.

### `ObjectSchema.testFullValue`

- <`boolean`>

Optional. Passes the entire option value to `passTest()` even if an `@@iterator` method is present. Does nothing if `passTest()` is not present.

### `ObjectSchema.allowPartialPass`

- <`boolean`>

Optional. If `true` and `passTest()` is present, instead of the entire value being discarded only the failing property will be discarded.

Note: This creates a new object of the same type as the option value is created **by calling its constructor**. Do not use this option if you do not know what that constructor does.

### `ObjectSchema.onWrongType(value)`

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated.

Optional. Function called **if** type check fails, replacing the current option value and continuing evaluation. If not present, a type mismatch will instead dismiss the option. Called before final type check.

### `ObjectSchema.transformFn(value)`

- `this` <`undefined`>
- `value` <`any`> Value of the option currently being evaluated.

Optional. Transformation function whose return value replaces the current option value. This can be used to cast values to more appropriate types or formats. Called before final type check.

Note: This function is called after `onWrongType()`.

### `ObjectSchema.maxLength`

### `ObjectSchema.minLength`

- <`number`>

Optional. Only applies where `type` is `'string'`, `'object'`, `'function'`, or `'array'`. Discard the option if its `length` property is greater than `maxLength`, less than `minLength`, or if no numeric `length` property is present.

### `ObjectSchema.instance`

- <`object`> | <`Function`>

Optional. Only applies where `type` is `'object'` or `'function'`. Discard option if value is not an instance of `instance`.

### `ObjectSchema.max`

### `ObjectSchema.min`

- <`number`>

Optional. Only applies where `type` is `'number'` or `'bigint'`. Discard values greater than `max` and/or less than `min`.

### `ObjectSchema.notFloat`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard non-integer values.

### `ObjectSchema.notNaN`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard `NaN` values.

### `ObjectSchema.notInfinite`

- <`boolean`>

Optional. Only applies where `type` is `'number'`. Discard non-finite values (`Infinity`).

### `ObjectSchema.coerceType`

- <`boolean`>

Optional. Only applies where `type` is `'bigint'`, `'boolean'`, `'number'`, or `'string'`. If `true`, attempt to convert option value to the one specified in `type`. Type coercion is performed before the final type check.

#### Conversion to `bigint`

Values are convert to `BigInt` by first converting the value to a `Number` and then calling the `BigInt()` function with that value as its argument. If conversion is not possible the value becomes `null`.

#### Conversion to `boolean`

Truthy values are converted to `true`, the rest become `false`.

#### Conversion to `number`

Values of types other than `BigInt` and `Symbol` are converted to `Number`s by using the unary + operator. `BigInt` values are converted by calling the `Number()` constructor with the value as its argument. `Symbol` values are converted to `NaN`.

#### Conversion to `string`

Values are converted by performing string concatenation, with the exception of `Symbol` values which are converted by calling the `String()` constructor with the value as its argument.

Note: This occurs _before_ `onWrongType()` and `transformFn()` are called.

### `ObjectSchema.compactArrayLike`

- <`boolean`>

Optional. If `true`, remove any gaps resulting from a partial pass. Instances of `Array` and `TypedArray` are considered array-like.

Note: Has no effect if `allowPartialPass` is not `true`.

### `ObjectSchema.mapTo`

- <`string`>

Optional. Map option to a different property key in the output object.

### `ObjectSchema.macro`

- <`string`>

Optional. Use the rules of another option and map output accordingly. _All_ other options are discarded if set. If the referenced rule does not exist or forms a circular reference, a warning will be printed and the option will be discarded.

### `ObjectSchema.extends`

- <`string`>

Optional. Inherit rules from another rule. Settings defined on the extending rule take precedence over inherited rules. If the referenced rule does not exist or forms a circular reference, a warning will be printed and the option will be discarded.

#### Example

```JavaScript
{
  options: {
    firstOption: {
      type: 'number',
      min: 0,
      max: 10,
      defaultValue: 5,
      coerceType: true
    },
    secondOption: {
      type: 'number',
      reference: 'firstOption',
      max: 11
    }
  }
}
```

In the example above `secondOption`, because it itself does not have them, will inherit `min`, `defaultValue`, and `coerceType` from `firstOption`. After references have been resolved, `secondOption` is effectively equivallent to:

```JavaScript
{
  // ...
  secondOption: {
    type: 'number',
    min: 0,
    max: 11,
    defaultValue: 5,
    coerceType: true
  }
}
```

## `normalizeObject(schema[,obj][, options])`

### Parameters

- **schema** <`ObjectSchema`>\
Object describing the structure of valid objects.

- **obj** <`object`>\
Object to validate.

- **options** <`Options`>

  - `allowOverride` <`boolean`> Default override behavior. If `true` macroed and mapped properties may replace existing values, if `false` once a valid value has been assigned all other values mapped to that property key are discarded. Default: `true`.
  - `throwOnCircularReference` <`boolean`> If `true`, throw an exception if a circular reference is detected. Default: `false`.
  - `throwOnReferenceError` <`boolean`> If `true`, throw a `ReferenceError` if a rule references a non-existent rule. Default: `false`.
  - `throwOnUnrecognized` <`boolean`> If `true`, throw an exception if any undeclared properties exist on `obj`. Default: `false`.
  - `throwOnInvalid` <`boolean`> If `true`, throw an exception if `obj` contain _any_ invalid values. Default: `false`.
  - `printWarnings` <`boolean`> If `true`, a warning message will be emitted when reference errors or circular references are found. Default: `true`.

### Returns

- <`object`>

Normalized object. Contains options with valid values or its default value if one was defined in `ObjectSchema.defaultValue`.

### Exceptions

- <`Error`> If `throwOnCircularError` is `true` and a macro rule or rule reference forms a circular reference.
- <`ReferenceError`> If `throwOnReferenceError` is `true` and a rule references a non-existent rule.
- <`Error`> If `throwOnUnrecognized` is `true` and any undeclared properties exist on the input object.
- <`Error`> If `throwOnInvalid` is `true` and _any_ value fails to validate.
- If `ObjectSchema.required` is set to `true` on any rule and the input object does not contain a property mapping to that key or if all such values are invalid. The type of exception thrown is determined by the first failed criterion.

### Example

```JavaScript
  {
    options: {
      num: {
        type: 'number',
        min: 0,
        notNaN: true,
        defaultValue: 3
      },
      name: {
        type: 'string',
        minLength: 1,
        required: true
      }
    }
  }
```

In this example, the option `num` must be a `Number` greater than or equal to `0` and it must not be `NaN`. If it fails any of those tests, or is missing, it will still appear in the parsed options object, but with its default value of `3`. The option `name` **must** be present and it **must** be valid (`String` whose `length` is greater than or equal to `1`) or an exception will be raised due to `required` being `true`.

## `validateObject(schema[,obj][, options])`

Returns `true` if the provided object `obj` conforms with `schema`, `false` otherwise.

Note: `validateObject` uses `normalizeObject` internally. It is therefore **a mistake** to first call `validateObject` followed by `normalizeObject` with the same arguments, instead just call `normalizeObject` (in a `try...catch`-statement if necessary).

### Parameters

- **schema** <`ObjectSchema`>\
Object describing the structure of valid objects.

- **obj** <`object`>\
Object to validate.

- **options** <`Options`>

  - `allowOverride` <`boolean`> Default override behavior. If `true` macroed and mapped properties may replace existing values, if `false` once a valid value has been assigned all other values mapped to that property key are discarded. Default: `true`.
  - `throwOnCircularReference` <`boolean`> If `true`, throw an exception if a circular reference is detected. Default: `false`.
  - `throwOnReferenceError` <`boolean`> If `true`, throw a `ReferenceError` if a rule references a non-existent rule. Default: `false`.
  - `throwOnUnrecognized` <`boolean`> If `true`, throw an exception if any undeclared properties exist on `obj`. Default: `false`.
  - `throwOnInvalid` <`boolean`> If `true`, throw an exception if `obj` contain _any_ invalid values. Default: `false`.
  - `printWarnings` <`boolean`> If `true`, a warning message will be emitted when reference errors or circular references are found. Default: `true`.

### Returns

- <`boolean`>

Returns `true` if `obj` is valid, `false` otherwise.

### Exceptions

- <`Error`> If `throwOnCircularError` is `true` and a macro rule or rule reference forms a circular reference.
- <`ReferenceError`> If `throwOnReferenceError` is `true` and a rule references a non-existent rule.
- <`Error`> If `throwOnUnrecognized` is `true` and any undeclared properties exist on the input object.
- <`Error`> If `throwOnInvalid` is `true` and _any_ value fails to validate.
