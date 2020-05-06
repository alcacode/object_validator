"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const MAX_REFERENCE_DEPTH = 16;
const SIMPLE_PATTERN_REGEX = /^\(([^()]+)(?:\+|\*)(?=\))\)$/;
function isObject(arg) {
    return arg !== null && (typeof arg === 'object' || (arg instanceof Object));
}
function _hasOwnProperty(obj, p) {
    return Object.prototype.hasOwnProperty.call(obj, p);
}
function hasProperty(obj, prop, allowInherited) {
    if (!isObject(obj))
        return false;
    if (allowInherited !== true)
        return _hasOwnProperty(obj, prop);
    return prop in obj;
}
function isTypedArray(val) {
    return val instanceof Uint8Array.prototype.__proto__.constructor;
}
function isIterable(val) {
    if (!(val[Symbol.iterator] instanceof Function))
        return false;
    const itr = val[Symbol.iterator]();
    if (!(itr[Symbol.iterator] instanceof Function))
        return false;
    let tmp;
    return isObject(tmp) &&
        itr.next instanceof Function &&
        isObject(tmp = itr.next()) &&
        typeof tmp.done === 'boolean' &&
        _hasOwnProperty(tmp, 'value');
}
function isArrayLike(val) {
    if (!isObject(val) || !_hasOwnProperty(val, 'length') || typeof val.length !== 'number')
        return false;
    return Array.isArray(val) || isTypedArray(val) || isIterable(val);
}
function shouldCoerceType(rule) {
    return rule.coerceType === true &&
        (rule.type === 'number' || rule.type === 'boolean' ||
            rule.type === 'string' || rule.type === 'bigint');
}
function isConstructor(arg) {
    return arg instanceof Object && typeof arg.constructor === 'function';
}
function ToNumber(val) {
    if (typeof val === 'number')
        return val;
    if (typeof val === 'bigint')
        return Number(val);
    if (typeof val === 'symbol')
        return NaN;
    return +val;
}
function coerceType(value, toType) {
    if (toType === 'bigint') {
        let v = null;
        try {
            v = BigInt(ToNumber(value));
        }
        catch (err) {
        }
        return v;
    }
    if (toType === 'boolean')
        return !!value;
    if (toType === 'number')
        return ToNumber(value);
    if (toType === 'string') {
        if (typeof value === 'symbol')
            return String(value);
        return '' + (value);
    }
    throw TypeError("invalid destination type");
}
function getSpecies(O) {
    if (!isObject(O))
        return;
    let S = undefined;
    try {
        S = O[Symbol.species];
    }
    finally {
    }
    if (S === undefined) {
        if (O.prototype)
            S = O.prototype;
        else
            S = O.__proto__;
    }
    return S;
}
function SpeciesConstructor(O, defaultConstructor) {
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
function createMatchRegExp(arg) {
    if (typeof arg !== 'string') {
        if (arg instanceof RegExp)
            return arg;
        throw TypeError(`'${arg}' is not a valid pattern`);
    }
    let out = [];
    let specialCharFlag = 0;
    let escapeFlag = 0;
    for (let i = 0, cc = 0; i < arg.length; i++) {
        cc = arg.charCodeAt(i);
        if (specialCharFlag) {
            specialCharFlag = 0;
            switch (cc) {
                case 99:
                    out.push("([a-zA-Z]+)");
                    continue;
                case 100:
                    out.push("([0-9]+(?:\\.[0-9]+|))");
                    continue;
                case 105:
                    out.push("([0-9]+)");
                    continue;
                case 110:
                    out.push("\\n");
                    continue;
                case 115:
                    out.push("\\S+");
                    continue;
                case 119:
                    out.push("\\s+");
                    continue;
            }
        }
        if (!escapeFlag && cc === 37) {
            specialCharFlag = 1;
        }
        else if (!escapeFlag && cc === 42) {
            out.push("(.*)");
        }
        else {
            out.push(`\\${cc > 0xFF ? `u{${cc.toString(16)}}` : `x${cc.toString(16)}`}`);
        }
        if (cc === 92)
            escapeFlag = 1;
        else
            escapeFlag = 0;
    }
    for (let i = out.length - 1, c = 0; i >= 0; i--) {
        if (out[i] !== out[i - 1] || i === 0) {
            if (c > 0) {
                out.splice(i, c);
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
function handleRuleError(type, opts, ruleName, subst_0, subst_1) {
    let errorConst = undefined;
    let doWarn = opts.printWarnings === false ? false : true;
    let msg = '';
    switch (type) {
        case 1:
            msg = `Option object contains unrecognized option '${String(ruleName)}'`;
            if (opts.throwOnUnrecognized === true)
                errorConst = Error;
            doWarn = false;
            break;
        case 2:
            msg = `Rule '${String(ruleName)}' was discarded because it references non-existent rule '${String(subst_0)}'`;
            if (opts.throwOnReferenceError === true)
                errorConst = ReferenceError;
            break;
        case 3:
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
function invalid(obj, baseKey, targetKey, rule, reason, options) {
    baseKey = String(baseKey);
    if (options.throwOnInvalid !== true &&
        (rule.required !== true || (rule.__refs && rule.__refs.length))) {
        if ('defaultValue' in rule &&
            (!(targetKey in obj) ||
                ((rule.mapTo || rule.macro) && targetKey in obj &&
                    rule.allowOverride))) {
            obj[targetKey] = rule.defaultValue;
        }
        return;
    }
    let prop;
    if (baseKey === targetKey)
        prop = `Value matching rule '${baseKey}'`;
    else
        prop = `Value mapped to '${String(targetKey)}' via rule '${baseKey}'`;
    switch (reason) {
        case 0:
            rule = rule;
            const rangeMax = 'max' in rule ? ' < ' + (rule.max + 1) : '';
            const rangeMin = 'min' in rule ? (rule.min - 1) + ' < ' : '';
            throw RangeError(`${prop} is not within its allowed ` +
                `range [${rangeMin}x${rangeMax}]`);
        case 1:
            throw RangeError(`${prop} is not a finite number`);
        case 2:
            throw TypeError(`${prop} must not be NaN`);
        case 3:
            throw TypeError(`${prop} is not an integer`);
        case 4:
            throw ReferenceError(`Missing required value for rule '${baseKey}'.`);
        case 5:
            throw TypeError(`${prop} must be of type ${rule.type},` +
                ` got ${typeof obj[baseKey]}`);
        case 6:
            throw Error(`${prop} failed to validate`);
        case 7:
            rule = rule;
            if (typeof obj[baseKey].length !== 'number')
                throw ReferenceError(prop + 'has a specified max \
                                and/or min length but value lacks a length property');
            const lenMax = 'maxLength' in rule ?
                ' < ' + (rule.maxLength + 1) :
                '';
            const lenMin = 'minLength' in rule ?
                (rule.minLength - 1) + ' < ' :
                '';
            throw RangeError(`${prop} has an invalid length, the ` +
                `allowed range is [${lenMin}length${lenMax}]`);
        case 8:
            rule = rule;
            if (rule.instance && rule.instance.name)
                throw TypeError(`${prop} is not an instance of ${rule.instance.name}`);
            else
                throw TypeError(`${prop} is not a valid instance type`);
        case 9:
            throw Error(`${prop} has an unexpected value`);
        case 10:
            throw Error(`${prop} is not an array-like Object`);
        case 11:
            rule = rule;
            let tmp = `${prop} does not match pattern ${rule.pattern}`;
            if (rule.__pattern)
                tmp += ` (derived from '${rule.__pattern}')`;
            throw Error(tmp);
    }
    throw Error(`${prop} is invalid (unknown reason: ${reason})`);
}
function getRootMacro(key, schema, opts) {
    var _a;
    let chain = [key];
    let cur = (_a = schema[key]) === null || _a === void 0 ? void 0 : _a.macro;
    for (let i = 0; i < MAX_REFERENCE_DEPTH; i++) {
        if (cur === undefined) {
            cur = chain.pop();
            break;
        }
        if (!(cur in schema)) {
            handleRuleError(2, opts, key, cur);
            break;
        }
        else if (chain.includes(cur)) {
            handleRuleError(3, opts, key, cur, schema[cur].macro);
            break;
        }
        chain.push(cur);
        cur = schema[cur].macro;
    }
    return cur !== null && cur !== void 0 ? cur : key;
}
function resolveReference(key, schema, opts) {
    var _a;
    let out = { ...schema[key], __refs: (_a = schema[key].__refs) !== null && _a !== void 0 ? _a : [] };
    Object.defineProperty(out, '__refs', { enumerable: false });
    for (let i = 0, cur = key; i < MAX_REFERENCE_DEPTH; i++) {
        cur = getRootMacro(cur, schema, opts);
        const rule = schema[cur];
        if (rule && rule.extends === undefined) {
            out.__refs.push(cur);
            break;
        }
        else if (rule === undefined || !(rule.extends in schema)) {
            handleRuleError(2, opts, key, rule.extends);
            return;
        }
        else if (out.__refs.includes(cur)) {
            handleRuleError(3, opts, key, cur, rule.extends);
            break;
        }
        out.__refs.push(cur);
        Object.assign(out, rule);
        if (rule.extends !== undefined)
            cur = rule.extends;
        else
            break;
    }
    out.__refs.shift();
    delete out.extends;
    return out;
}
function expandSchema(schema, opts) {
    const out = Object.assign(Object.create(null), schema);
    const refs = Object.create(null);
    for (const k of Object.keys(schema)) {
        let rule = schema[k];
        if (schema[k].extends && !schema[k].macro) {
            const opt = resolveReference(k, schema, opts);
            if (opt)
                rule = opt;
        }
        if (!refs[k])
            refs[k] = [];
        if (schema[k].macro) {
            const r = getRootMacro(k, schema, opts);
            if (!refs[r])
                refs[r] = [];
            if (r !== k && !refs[r].includes(k))
                refs[r].push(k);
        }
        else if (schema[k].mapTo && schema[k].mapTo in schema) {
            const _k = schema[k].mapTo;
            if (!refs[_k])
                refs[_k] = [];
            if (!refs[_k].includes(k))
                refs[_k].push(k);
        }
        if (typeof out[k].allowOverride !== 'boolean' && !schema[k].macro)
            out[k].allowOverride = !schema.allowOverride;
        if (rule.type === 'string' && typeof rule.pattern === 'string') {
            rule.__pattern = rule.pattern;
            rule.pattern = createMatchRegExp(rule.pattern);
        }
        else if (rule.type !== 'string' && 'pattern' in rule) {
            if (opts.printWarnings)
                console.warn(`Rule '${k}' incorrectly implements pattern: rule type is not 'string'.`);
            delete rule.pattern;
        }
    }
    for (const k in refs) {
        if (refs[k].length && !out[k].hasOwnProperty('__refs'))
            Object.defineProperty(out[k], '__refs', { enumerable: false, value: [] });
        for (let i = 0; i < refs[k].length; i++) {
            if (!out[k].__refs.includes(refs[k][i]))
                out[k].__refs.push(refs[k][i]);
        }
    }
    return out;
}
function evalTestFn(val, fn, passFull, partial, cmpctArrLike) {
    if (!(fn instanceof Function))
        return [true, val];
    if (passFull === true || val === undefined || val === null ||
        typeof val === 'symbol' ||
        !(val[Symbol.iterator] instanceof Function)) {
        return [!!fn.call(null, val), val];
    }
    const isStr = (typeof val === 'string');
    const isMapOrSet = val instanceof Map || val instanceof Set;
    const isArrayLike = Array.isArray(val) || isTypedArray(val);
    let tmp;
    if (partial) {
        if (isStr)
            tmp = '';
        else
            tmp = new (SpeciesConstructor(val, Object));
    }
    let validIndicies = new Set();
    let result = true;
    let entries;
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
        }
        else if (partial) {
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
        tmp = tmp.filter((_, i) => validIndicies.has('' + i));
    validIndicies.clear();
    return [result, partial ? tmp : (tmp = null)];
}
const OptionsPrototype = {
    allowOverride: true,
    printWarnings: true,
    noReturnValuePrototype: true,
    throwOnCircularReference: false,
    throwOnInvalid: false,
    throwOnReferenceError: false,
    throwOnUnrecognized: false
};
Object.freeze(OptionsPrototype);
function normalizeObject(schema, obj, options) {
    var _a, _b;
    const required = new Set();
    const opts = { ...OptionsPrototype, ...options };
    const out = Object.create(null);
    if (typeof obj !== 'object')
        obj = out;
    if (opts.throwOnUnrecognized === true) {
        for (const k of Object.keys(obj)) {
            if (!(k in schema))
                handleRuleError(1, schema, k);
        }
    }
    const _schema = expandSchema(schema, opts);
    const declKeys = Object.keys(_schema)
        .sort((a, b) => (_schema[a].mapTo || _schema[a].macro ? -1 : 0) -
        (_schema[b].mapTo || _schema[b].macro ? -1 : 0));
    for (const k of declKeys) {
        let rule = _schema[k];
        let targetKey = k;
        if (rule.macro) {
            const rootKey = getRootMacro(k, _schema, opts);
            if (rootKey && _schema[rootKey] && rootKey !== k && !(!rule.allowOverride && rootKey in out))
                rule = _schema[rootKey];
            else
                continue;
            targetKey = rootKey;
        }
        targetKey = ((_a = rule.mapTo) !== null && _a !== void 0 ? _a : targetKey);
        let __eq_val;
        let __eq_flag = false;
        let __skip_type_check = false;
        let __check_arraylike = false;
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
                rule.type = (_b = rule.type) === null || _b === void 0 ? void 0 : _b.toLowerCase();
                break;
        }
        if (!hasProperty(obj, k, rule.allowInherited)) {
            invalid(out, k, targetKey, rule, 4, opts);
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
        const valType = typeof value;
        if (rule.type !== valType && !__skip_type_check) {
            invalid(out, k, targetKey, rule, 5, opts);
            continue;
        }
        if (__eq_flag && value !== __eq_val) {
            invalid(out, k, targetKey, rule, 9, opts);
            continue;
        }
        if (__check_arraylike && !isArrayLike(value)) {
            invalid(out, k, targetKey, rule, 10, opts);
            continue;
        }
        if ((rule.type === 'object' || rule.type === 'function') && 'instance' in rule) {
            if (!isObject(value) ||
                !(value instanceof rule.instance)) {
                invalid(out, k, targetKey, rule, 8, opts);
                continue;
            }
        }
        if (rule.type === 'string' && rule.pattern && !rule.pattern.test(value)) {
            invalid(out, k, targetKey, rule, 11, opts);
            continue;
        }
        if (valType === 'number' || valType === 'bigint') {
            if (('min' in rule && rule.min > value) ||
                ('max' in rule && rule.max < value)) {
                invalid(out, k, targetKey, rule, 0, opts);
                continue;
            }
        }
        else if (valType === 'string' || valType === 'object') {
            const len = typeof (value === null || value === void 0 ? void 0 : value.length) === 'number' ? value === null || value === void 0 ? void 0 : value.length :
                NaN;
            if (('minLength' in rule &&
                (len === NaN || rule.minLength > len)) ||
                ('maxLength' in rule &&
                    (len === NaN || rule.maxLength < len))) {
                invalid(out, k, targetKey, rule, 7, opts);
                continue;
            }
        }
        if (valType === 'number') {
            if ('notNaN' in rule && rule.notNaN && Number.isNaN(value)) {
                invalid(out, k, targetKey, rule, 2, opts);
                continue;
            }
            else if ('notInfinite' in rule && rule.notInfinite &&
                !Number.isFinite(value)) {
                invalid(out, k, targetKey, rule, 1, opts);
                continue;
            }
            else if ('notFloat' in rule && rule.notFloat &&
                !Number.isInteger(value)) {
                invalid(out, k, targetKey, rule, 3, opts);
                continue;
            }
        }
        const passTest = evalTestFn(value, rule.passTest, rule.testFullValue, rule.allowPartialPass, rule.compactArrayLike);
        if (!passTest[0]) {
            invalid(out, k, targetKey, rule, 6, opts);
            continue;
        }
        else {
            out[targetKey] = passTest[1];
        }
    }
    for (const r of required) {
        if (!(r in out))
            invalid(out, r, r, { required: true }, 4, opts);
    }
    if (opts.noReturnValuePrototype === false)
        return Object.assign({}, out);
    return out;
}
exports.normalizeObject = normalizeObject;
function validateObject(schema, obj, options) {
    var res;
    try {
        res = normalizeObject(schema, obj, options);
    }
    catch (err) {
    }
    return !!res;
}
exports.validateObject = validateObject;
