const MAX_REFERENCE_DEPTH = 16;
const SIMPLE_PATTERN_REGEX = /^\(([^()]+)(?:\+|\*)(?=\))\)$/;
function isObject(arg) {
    return arg !== null && (typeof arg === 'object' || arg instanceof Object);
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
    return isObject(val) && Uint8Array.prototype.__proto__.isPrototypeOf(val);
}
function isIterable(val) {
    if (!(val[Symbol.iterator] instanceof Function))
        return false;
    const itr = val[Symbol.iterator]();
    if (!(itr[Symbol.iterator] instanceof Function))
        return false;
    let tmp;
    return isObject(itr) &&
        'next' in itr &&
        itr.next instanceof Function &&
        isObject(tmp = itr.next()) &&
        typeof tmp.done === 'boolean' &&
        'value' in tmp;
}
function isArrayLike(val) {
    if (!isObject(val) || !('length' in val) || typeof val.length !== 'number')
        return false;
    return Array.isArray(val) || isTypedArray(val) || isIterable(val);
}
function isConstructor(arg) {
    return isObject(arg) && arg.constructor instanceof Function;
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
function shouldCoerceType(rule) {
    return rule.coerceType === true &&
        (rule.type === 'number' || rule.type === 'boolean' ||
            rule.type === 'string' || rule.type === 'bigint');
}
function coerceType(value, toType) {
    if (toType === 'bigint') {
        let v = null;
        try {
            v = BigInt(ToNumber(value));
        }
        catch (err) { }
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
function SpeciesConstructor(O, defaultConstructor) {
    const C = O.constructor;
    if (C === undefined)
        return defaultConstructor;
    if (isObject(C)) {
        const S = C[Symbol.species];
        if (S === undefined || S === null)
            return defaultConstructor;
        if (isConstructor(S))
            return S;
    }
    throw new TypeError(C + ' is not a valid constructor');
}
function createMatchRegExp(arg, partial) {
    if (typeof arg !== 'string') {
        if (arg instanceof RegExp)
            return arg;
        throw TypeError(`'${arg}' is not a valid pattern`);
    }
    const out = [];
    let haveUnicode = false;
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
            haveUnicode = true;
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
    let regExpStr = out.join('');
    if (!partial)
        regExpStr = `^${regExpStr}$`;
    return new RegExp(regExpStr, haveUnicode ? 'u' : '');
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
function invalid(obj, baseKey, targetKey, rule, reason, options, extra) {
    baseKey = String(baseKey);
    if (options.throwOnInvalid !== true && reason !== 12 &&
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
        case 12:
            throw Error(`Sub-rule '${baseKey}' failed to validate: ${extra === null || extra === void 0 ? void 0 : extra.message}`);
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
function extendRule(target, source, allowOverwrite) {
    for (const [k, v] of Object.entries(source)) {
        if ((!allowOverwrite && k in target) || k === '__refs')
            continue;
        else if (k === '__flags')
            target.__flags = v & 0x7FFFFFFF;
        else
            target[k] = v;
    }
}
function resolveReference(key, schema, opts) {
    var _a;
    let out = { ...schema[key], __refs: (_a = schema[key].__refs) !== null && _a !== void 0 ? _a : [] };
    for (let i = 0, cur = key; i < MAX_REFERENCE_DEPTH; i++) {
        cur = getRootMacro(cur, schema, opts);
        const rule = schema[cur];
        if (rule && rule.extends === undefined) {
            extendRule(out, rule);
            out.__refs.push(cur);
            break;
        }
        else if (!rule || rule.extends === undefined || !(rule.extends in schema)) {
            handleRuleError(2, opts, key, rule.extends);
            return;
        }
        else if (out.__refs.includes(cur)) {
            handleRuleError(3, opts, key, cur, rule.extends);
            break;
        }
        out.__refs.push(cur);
        extendRule(out, rule, true);
        if (rule.extends !== undefined)
            cur = rule.extends;
        else
            break;
    }
    out.__refs.shift();
    delete out.extends;
    return out;
}
function expandMacroRule(rule) {
    switch (rule.type) {
        case 'int':
            rule.type = 'number';
            rule.notFloat = true;
            break;
        case 'array':
            rule.type = 'object';
            rule.instance = Array;
            break;
        case 'map':
            rule.type = 'object';
            rule.instance = Map;
            break;
        case 'set':
            rule.type = 'object';
            rule.instance = Set;
            break;
        case 'arraylike':
            rule.type = 'object';
            rule.__flags = (rule.__flags || 0) | 256;
            break;
        case 'null':
            rule.__flags = (rule.__flags || 0) | 128;
            break;
    }
    return rule;
}
function incorrectImpl(rule, ruleKey, name, printWarning) {
    if (printWarning === true)
        console.warn(`Rule '${name}' incorrectly implements subRule: rule type is not '${rule.type}'.`);
    delete rule[ruleKey];
}
function expandSchema(schema, opts, parentChain = []) {
    var _a;
    const out = Object.assign(Object.create(null), schema);
    const refs = Object.create(null);
    for (const k of Object.keys(schema)) {
        if (((_a = out[k]) === null || _a === void 0 ? void 0 : _a.__flags) & 1) {
            out[k] = schema[k];
            continue;
        }
        let rule = expandMacroRule(out[k]);
        if (schema[k].extends && !schema[k].macro) {
            const opt = resolveReference(k, schema, opts);
            if (opt)
                extendRule(rule, opt, true);
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
        if (rule.required === true) {
            for (let i = 0; i < parentChain.length; i++) {
                if (parentChain[i].required === false)
                    break;
                parentChain[i].required = true;
            }
        }
        if (isObject(rule.subRule)) {
            if (rule.type === 'object')
                rule.subRule = expandSchema(rule.subRule, opts, Array.prototype.concat(parentChain, rule));
            else
                incorrectImpl(rule, 'subRule', k, opts.printWarnings);
        }
        if (typeof out[k].allowOverride !== 'boolean' && !schema[k].macro)
            out[k].allowOverride = !opts.allowOverride;
        if (rule.type === 'string' &&
            typeof rule.pattern === 'string') {
            rule.__pattern = rule.pattern;
            rule.pattern = createMatchRegExp(rule.pattern, rule.patternAction === 'discard' ||
                rule.patternAction === 'retain');
        }
        else if (rule.type !== 'string' && 'pattern' in rule) {
            incorrectImpl(rule, 'pattern', k, opts.printWarnings);
        }
        rule.__flags = (rule.__flags || 0) | 1;
    }
    for (const k in refs) {
        if (refs[k].length && !_hasOwnProperty(out[k], '__refs'))
            out[k].__refs = [];
        for (let i = 0; i < refs[k].length; i++) {
            if (!out[k].__refs.includes(refs[k][i]))
                out[k].__refs.push(refs[k][i]);
        }
    }
    return out;
}
function evalTestFn(val, fn, rule) {
    if (rule.testFullValue === true || val === undefined || val === null ||
        typeof val === 'symbol' || typeof val === 'string' ||
        !(val[Symbol.iterator] instanceof Function)) {
        return [!!fn.call(null, val), val];
    }
    const isMapOrSet = val instanceof Map || val instanceof Set;
    const isArrayLike = Array.isArray(val) || isTypedArray(val);
    let tmp;
    if (rule.allowPartialPass)
        tmp = new (SpeciesConstructor(val, Object));
    rule = rule;
    const validIndicies = new Set();
    const entries = isMapOrSet ? [...val.entries()] : Object.entries(val);
    let result = true;
    for (const [k, v] of entries) {
        if (!fn.call(null, v)) {
            if (!rule.allowPartialPass) {
                result = false;
                break;
            }
        }
        else if (rule.allowPartialPass) {
            if (isMapOrSet)
                'set' in tmp ? tmp.set(k, v) : tmp.add(v);
            else
                tmp[k] = v;
            validIndicies.add(k);
        }
    }
    if (rule.allowPartialPass && validIndicies.size === 0)
        result = false;
    if (result && isArrayLike && rule.compactArrayLike && validIndicies.size !== val.length)
        tmp = tmp.filter((_, i) => validIndicies.has('' + i));
    validIndicies.clear();
    return [result, rule.allowPartialPass ? tmp : (tmp = null)];
}
function retain(str, predicate) {
    let out = '';
    for (let i = 0; i < str.length; i++)
        if (predicate.call(undefined, str[i]))
            out += str[i];
    return out;
}
function applyPattern(pattern, value, action) {
    const out = [true, ''];
    switch (action) {
        case 'retain':
            out[1] = retain(value, (c) => pattern.test(c));
            break;
        case 'discard':
            out[1] = retain(value, (c) => !pattern.test(c));
            break;
        case 'discard':
        case 'pass':
        default:
            out[0] = pattern.test(value);
            if (action === 'discard')
                out[0] = !out[0];
            if (out[0])
                out[1] = value;
            break;
    }
    return out;
}
const OptionsPrototype = {
    allowOverride: true,
    printWarnings: true,
    noReturnValuePrototype: true,
    skipSchemaExpansion: false,
    throwOnCircularReference: false,
    throwOnInvalid: false,
    throwOnReferenceError: false,
    throwOnUnrecognized: false
};
Object.freeze(OptionsPrototype);
export function normalizeObject(schema, obj, options) {
    var _a;
    const required = new Set();
    const opts = { ...OptionsPrototype, ...options };
    const out = Object.create(null);
    if (typeof obj !== 'object')
        obj = Object.create(null);
    if (opts.throwOnUnrecognized === true) {
        for (const k of Object.keys(obj)) {
            if (!(k in schema))
                handleRuleError(1, schema, k);
        }
    }
    let _schema;
    if (opts.skipSchemaExpansion === true)
        _schema = schema;
    else
        _schema = expandSchema(schema, opts);
    const declKeys = Object.keys(_schema).sort((a, b) => (_schema[a].mapTo || _schema[a].macro ? -1 : 0) -
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
        const flags = rule.__flags || 0;
        const skip_type_check = rule.type === 'any';
        if (!hasProperty(obj, k, rule.allowInherited)) {
            invalid(out, k, targetKey, rule, 4, opts);
            if (rule.required)
                required.add(targetKey);
            continue;
        }
        let value = obj[k];
        if ((flags & 128) && value !== null) {
            invalid(out, k, targetKey, rule, 9, opts);
            continue;
        }
        if (!skip_type_check && shouldCoerceType(rule))
            value = coerceType(value, rule.type);
        if (!skip_type_check && rule.type !== typeof value &&
            rule.onWrongType instanceof Function)
            value = rule.onWrongType.call(null, value);
        if (rule.type !== typeof value && !skip_type_check) {
            invalid(out, k, targetKey, rule, 5, opts);
            continue;
        }
        if ((flags & 256) && !isArrayLike(value)) {
            invalid(out, k, targetKey, rule, 10, opts);
            continue;
        }
        if (rule.type === 'object' && value !== null && 'instance' in rule) {
            if (!isObject(value) ||
                !(value instanceof rule.instance)) {
                invalid(out, k, targetKey, rule, 8, opts);
                continue;
            }
        }
        if (rule.type === 'object' && rule.subRule) {
            try {
                value = normalizeObject(rule.subRule, value, { ...opts, skipSchemaExpansion: true });
            }
            catch (err) {
                invalid(out, k, targetKey, rule, 12, opts, err);
                continue;
            }
        }
        if (rule.type === 'string' && rule.pattern) {
            const res = applyPattern(rule.pattern, value, rule.patternAction);
            if (!res[0]) {
                invalid(out, k, targetKey, rule, 11, opts);
                continue;
            }
            value = res[1];
        }
        if (rule.type === 'number' || rule.type === 'bigint') {
            if (('min' in rule && rule.min > value) ||
                ('max' in rule && rule.max < value)) {
                invalid(out, k, targetKey, rule, 0, opts);
                continue;
            }
        }
        else if (rule.type === 'string' || rule.type === 'object') {
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
        if (rule.type === 'number') {
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
        if (rule.passTest instanceof Function) {
            const res = evalTestFn(value, rule.passTest, rule);
            if (!res[0]) {
                invalid(out, k, targetKey, rule, 6, opts);
                continue;
            }
            value = res[1];
        }
        if (rule.onPass instanceof Function)
            out[targetKey] = rule.onPass.call(null, value);
        else
            out[targetKey] = value;
    }
    for (const r of required) {
        if (!(r in out))
            invalid(out, r, r, { required: true }, 4, opts);
    }
    if (opts.noReturnValuePrototype === false)
        return Object.assign({}, out);
    return out;
}
export function validateObject(schema, obj, options) {
    var res;
    try {
        res = normalizeObject(schema, obj, options);
    }
    catch (err) { }
    return !!res;
}
export function createNormalizer(schema, options) {
    const _options = { ...options, skipSchemaExpansion: true };
    const _schema = expandSchema(schema, _options);
    return (obj) => normalizeObject(_schema, obj, _options);
}
export function createValidator(schema, options) {
    const _options = { ...options, skipSchemaExpansion: true };
    const _schema = expandSchema(schema, _options);
    return (obj) => validateObject(_schema, obj, _options);
}
