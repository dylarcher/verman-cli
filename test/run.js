#!/usr/bin/env node
"use strict"

// Simple test runner without Node.js test framework to avoid debugger
const { libTest1, libTest2, libTest3, libTest4, libTest5, libTest6, libTest7, libTest26, libTest27, libTest28, libTest29, libTest30, libTest32, libTest33, libTest34, libTest35, libTest36, libTest37, libTest38, libTest39, libTest40, libTest41, libTest42, libTest43, libTest44 } = require('./suite/src.spec.js')
const { cliTest1, cliTest2, cliTest3, cliTest4, cliTest5, cliTest6, cliTest7, cliTest8, cliTest9, cliTest10, cliTest11, cliTest12, cliTest13, cliTest14, cliTest15, cliTest16, cliTest17, cliTest18, cliTest19, cliTest20, cliTest21, cliTest22, cliTest23, cliTest24, cliTest25, cliTest26, cliTest27, cliTest28, cliTest29, cliTest30 } = require('./suite/bin.spec.js')
const { docTest1, docTest2, docTest3 } = require('./suite/docs.spec.js')

async function runTests() {
    let passed = 0
    let failed = 0

    const tests = [
        { name: 'main function should output correct console messages for project with constraints', fn: libTest1 },
        { name: 'main function should output correct messages when no constraints found', fn: libTest2 },
        { name: 'main function should handle error during constraint collection', fn: libTest3 },
        { name: 'main function should handle error during getVersionSummary', fn: libTest4 },
        { name: 'main function should format version output correctly with specific node version', fn: libTest5 },
        { name: 'main function should call updatePackageJsonEngines with correct path', fn: libTest6 },
        { name: 'main function console output matches exact format specifications', fn: libTest7 },
        { name: 'should show help when --help is used', fn: cliTest1 },
        { name: 'should show version when --version is used', fn: cliTest2 },
        { name: 'should analyze project with dependencies', fn: cliTest3 },
        { name: 'should output JSON format when --json flag is used', fn: cliTest4 },
        { name: 'should handle quiet output format', fn: cliTest5 },
        { name: 'should use custom path when --path is specified', fn: cliTest6 },
        { name: 'should error when no package.json is found', fn: cliTest7 },
        { name: 'should error when specified path does not exist', fn: cliTest8 },
        { name: 'should handle invalid package.json gracefully', fn: cliTest9 },
        { name: 'should show detailed analysis in default mode', fn: cliTest10 },
        { name: 'should handle projects with no version constraints', fn: cliTest11 },
        { name: 'should analyze lockfile when present', fn: cliTest12 },
        { name: 'should handle older lockfile format', fn: cliTest13 },
        { name: 'should respect existing engine constraints', fn: cliTest14 },
        { name: 'should fall back to engine constraints when no dependencies have requirements', fn: cliTest15 },
        { name: 'should handle interactive package.json update with user acceptance', fn: cliTest16 },
        { name: 'should handle interactive package.json update with user rejection', fn: cliTest17 },
        { name: 'should handle package.json update failure gracefully', fn: cliTest18 },
        { name: 'should execute main function when run as script', fn: cliTest19 },
        { name: 'should handle missing commander dependency gracefully', fn: cliTest20 },
        { name: 'should change directory when --path option is used', fn: cliTest21 },
        { name: 'should handle commander dependency check error', fn: cliTest22 },
        { name: 'should handle path change when different from cwd', fn: cliTest23 },
        { name: 'should handle updatePackageJsonEngines failure', fn: cliTest24 },
        { name: 'should show no constraints message', fn: cliTest25 },
        { name: 'should show no upper bound message', fn: cliTest26 },
        { name: 'should output JSON with specific highest node version', fn: cliTest27 },
        { name: 'should output quiet mode with specific highest node', fn: cliTest28 },
        { name: 'should format constraints with specific upper bounds', fn: cliTest29 },
        { name: 'should handle quiet mode when no constraints found', fn: cliTest30 },
        { name: 'should process devDependencies with constraints', fn: libTest26 },
        { name: 'should handle package-lock.json parsing errors', fn: libTest27 },
        { name: 'should handle missing package.json with lockfile only', fn: libTest28 },
        { name: 'should handle updatePackageJsonEngines conditional logic', fn: libTest29 },
        { name: 'should execute main function when require.main === module', fn: libTest30 },
        { name: 'should process devDependencies with verbose logging', fn: libTest32 },
        { name: 'should warn about package-lock.json parsing errors', fn: libTest33 },
        { name: 'should set upper bounds in updatePackageJsonEngines', fn: libTest34 },
        { name: 'should handle complex version range fallback', fn: libTest35 },
        { name: 'should handle exclusive upper bound logic', fn: libTest36 },
        { name: 'should output console messages for no constraints', fn: libTest37 },
        { name: 'should handle error in main function', fn: libTest38 },
        { name: 'should handle getNpmVersionForNode fallback to latest', fn: libTest39 },
        { name: 'should return null for unknown package in getNodeRequirementForPackage', fn: libTest40 },
        { name: 'should process packageManager field', fn: libTest41 },
        { name: 'should handle direct version in getLowestCompatibleVersion', fn: libTest42 },
        { name: 'should handle exclusive upper bound edge case', fn: libTest43 },
        { name: 'should handle invalid version in normalizeVersionRange', fn: libTest44 },
        { name: 'main module should export an empty object', fn: docTest1 },
        { name: 'main module should be defined', fn: docTest2 },
        { name: 'main module should be an object', fn: docTest3 }
    ]

    for (const test of tests) {
        try {
            await test.fn()
            console.log(`✔ ${test.name}`)
            passed++
        } catch (error) {
            console.log(`✖ ${test.name}`)
            console.error(`  Error: ${error.message}`)
            failed++
        }
    }

    console.log(`\nTests: ${passed + failed}`)
    console.log(`Passed: ${passed}`)
    console.log(`Failed: ${failed}`)

    if (failed > 0) {
        process.exit(1)
    }
}

runTests().catch(error => {
    console.error('Test runner error:', error)
    process.exit(1)
})
