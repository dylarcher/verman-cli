const assert = require('node:assert')
const main = require('../../docs/main.js')

function docTest1() {
    assert.strictEqual(typeof main, 'object')
    assert.strictEqual(Object.keys(main).length, 0)
}

function docTest2() {
    assert.notStrictEqual(main, undefined)
    assert.notStrictEqual(main, null)
}

function docTest3() {
    assert.strictEqual(main.constructor, Object)
}

module.exports = { docTest1, docTest2, docTest3 }
