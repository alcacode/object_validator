"use strict";
var _a, _b;
Object.defineProperty(exports, "__esModule", { value: true });
const index_1 = require("../index");
const general_1 = require("./general");
const string_1 = require("./string");
const array_1 = require("./array");
const arraylike_1 = require("./arraylike");
const number_1 = require("./number");
const VERBOSE_OUTPUT = false;
const EXPAND_ALL = false;
const OUTPUT_MAX_LENGTH = 60;
const tests = {
    any: general_1.testConfig,
    string: string_1.testConfig,
    array: array_1.testConfig,
    arrayLike: arraylike_1.testConfig,
    number: number_1.testConfig,
};
function centerAndPad(str, fillString) {
    const l1 = Math.floor((OUTPUT_MAX_LENGTH + str.length) / 2);
    return str.padStart(l1, fillString)
        .padEnd(OUTPUT_MAX_LENGTH, fillString);
}
function getPrototype(obj) {
    if (typeof obj === 'number')
        return Number;
    if ('prototype' in obj)
        return obj.prototype;
    if ('__proto__' in obj)
        return obj.__proto__;
    if (typeof obj === 'object')
        return null;
    return undefined;
}
function areObjectsSimilar(a, b) {
    if (a === b)
        return true;
    if (typeof a !== typeof b)
        return false;
    if (getPrototype(a) !== getPrototype(b))
        return false;
    const aProps = Object.getOwnPropertyDescriptors(a);
    const bProps = Object.getOwnPropertyDescriptors(b);
    for (const k in aProps) {
        if (!aProps.hasOwnProperty(k))
            continue;
        if (!(k in bProps))
            return false;
        if (aProps[k].configurable !== bProps[k].configurable ||
            aProps[k].enumerable !== bProps[k].enumerable ||
            aProps[k].writable !== bProps[k].writable ||
            aProps[k].value !== bProps[k].value ||
            aProps[k].get !== bProps[k].get ||
            aProps[k].set !== bProps[k].set) {
            return false;
        }
    }
    for (const k in bProps) {
        if (!(k in aProps))
            return false;
    }
    return true;
}
const O = {
    throwOnCircularReference: true,
    throwOnReferenceError: true,
    throwOnUnrecognized: true,
    throwOnInvalid: false
};
const vTestDecl = {
    a: { type: 'number', required: true },
    b: { extends: 'a', required: false }
};
let resCount = [0, 0];
const validate_test_1 = index_1.validateObject(vTestDecl, { a: 1 }) === true;
const validate_test_2 = index_1.validateObject(vTestDecl, { b: 1 }) === false;
resCount[validate_test_1 ? 0 : 1]++;
resCount[validate_test_2 ? 0 : 1]++;
console.log(`Passed validateObject returns true: `, validate_test_1);
console.log(`Failed validateObject returns false:`, validate_test_2);
for (const ck in tests) {
    console.log();
    console.groupCollapsed(centerAndPad(` ${ck.toUpperCase()} `, '='));
    for (const tk in tests[ck]) {
        const t = tests[ck][tk];
        const decl = {
            [tk]: t.decl,
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
                macro: tk
            },
            __selfReference: {
                type: t.decl.type,
                extends: tk,
                required: false
            },
        };
        const expect = t.shouldFail || t.shouldThrow ?
            undefined :
            'expect' in t ? t.expect : t.arg;
        const opts = {};
        if ('arg' in t)
            opts[tk] = t.arg;
        let descStr = (t.description || tk).substring(0, 48);
        if (t.description && t.description.length >= 48)
            descStr += '…';
        let res = {};
        let didParse = false;
        let errMsg = '';
        try {
            res = index_1.normalizeObject(decl, opts, O);
            didParse = true;
        }
        catch (err) {
            errMsg = err instanceof Error ?
                (VERBOSE_OUTPUT && err.stack ?
                    err.stack :
                    err.message) :
                'unknown error';
        }
        const propKey = (_b = ((_a = decl[tk].macro) !== null && _a !== void 0 ? _a : decl[tk].mapTo)) !== null && _b !== void 0 ? _b : tk;
        const gotExpected = areObjectsSimilar(res[propKey], expect);
        let didPass = didParse && gotExpected;
        if (t.shouldThrow)
            didPass = !didParse;
        if (t.shouldFail && !didPass)
            didPass = true;
        resCount[didPass ? 0 : 1] += 1;
        if (!didPass || EXPAND_ALL) {
            console.log(`\n> ${descStr.padEnd(46, ' ')} [%c${didPass ? 'PASSED' : 'FAILED'}]`, `color:${didPass ? 'green' : 'red'};font-weight:600;`);
            console.log('Input:        ', ('arg' in t ? t.arg : '<no argument>'));
            console.log('Output:       ', didParse ? res[propKey] : '<no return value>');
            console.log('Output Key:   ', didParse ? propKey : '<no return value>');
            console.log('Expected:     ', t.shouldThrow ? 'N/A' : expect);
            console.log('Should Fail:  ', t.shouldFail ? 'Yes' : 'No');
            console.log('Should Throw: ', t.shouldThrow ? 'Yes' : 'No');
            if (didParse)
                console.log('Full Output:  ', res);
            let resStr = `Result:       %c${didPass ? 'PASSED' : 'FAILED'}%c`;
            if (!didParse)
                resStr += `, exception${errMsg ? ` %c(${errMsg})` : ''}`;
            else if (!(propKey in res))
                resStr += ', option discarded';
            else if (!gotExpected)
                resStr += `, unexpected value`;
            console.log(resStr + '\n', `color:${didPass ? 'green' : 'red'};font-weight:600;`, '', '');
        }
        else {
            console.log(`${descStr.padEnd(48, ' ')} [PASSED]`);
        }
    }
    console.groupEnd();
}
const totalRes = resCount[0] + resCount[1];
console.log(`Passed: ${resCount[0]} / ${totalRes}`);
console.log(`Failed: ${resCount[1]} / ${totalRes}`);
console.log(`Final result: ${resCount[0] === totalRes ? 'PASS' : 'FAIL'}`);
