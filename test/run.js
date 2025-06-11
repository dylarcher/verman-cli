#!/usr/bin/env node

// Simple test runner without Node.js test framework to avoid debugger
const { libTest1, libTest2, libTest3, libTest4, libTest5, libTest6, libTest7, libTest26, libTest27, libTest28, libTest29, libTest30, libTest32, libTest33, libTest34, libTest35, libTest36, libTest37, libTest38, libTest39, libTest40, libTest41, libTest42, libTest43, libTest44, libTest45, libTest46, libTest47, libTest48, libTest49, libTest50, libTest51, libTest52, libTest53, libTest54, libTest55, libTest56, libTest57, libTest58 } = require('./suite/src.spec.js')
const { cliTest1, cliTest2, cliTest3, cliTest4, cliTest5, cliTest6, cliTest7, cliTest8, cliTest9, cliTest10, cliTest11, cliTest12, cliTest13, cliTest14, cliTest15, cliTest16, cliTest17, cliTest18, cliTest19, cliTest20, cliTest21, cliTest22, cliTest23, cliTest24, cliTest25, cliTest26, cliTest27, cliTest28, cliTest29, cliTest30, cliTest31, cliTest32, cliTest33, cliTest34, cliTest35 } = require('./suite/bin.spec.js')
const { docTest1, docTest2, docTest3, docTest4, docTest5, docTest6, docTest7, docTest8, docTest9, docTest10, docTest11 } = require('./suite/docs.spec.js')

async function runTests() {
    let passed = 0
    let failed = 0

    const tests = [
        { name: '(SRC) main function should output correct console messages for project with constraints', fn: libTest1 },
        { name: '(SRC) main function should output correct messages when no constraints found', fn: libTest2 },
        { name: '(SRC) main function should handle error during constraint collection', fn: libTest3 },
        { name: '(SRC) main function should handle error during getVersionSummary', fn: libTest4 },
        { name: '(SRC) main function should format version output correctly with specific node version', fn: libTest5 },
        { name: '(SRC) main function should call updatePackageJsonEngines with correct path', fn: libTest6 },
        { name: '(SRC) main function console output matches exact format specifications', fn: libTest7 },
        { name: '(SRC) should process devDependencies with constraints', fn: libTest26 },
        { name: '(SRC) should handle package-lock.json parsing errors', fn: libTest27 },
        { name: '(SRC) should handle missing package.json with lockfile only', fn: libTest28 },
        { name: '(SRC) should handle updatePackageJsonEngines conditional logic', fn: libTest29 },
        { name: '(SRC) should execute main function when require.main === module', fn: libTest30 },
        { name: '(SRC) should process devDependencies with verbose logging', fn: libTest32 },
        { name: '(SRC) should warn about package-lock.json parsing errors', fn: libTest33 },
        { name: '(SRC) should set upper bounds in updatePackageJsonEngines', fn: libTest34 },
        { name: '(SRC) should handle complex version range fallback', fn: libTest35 },
        { name: '(SRC) should handle exclusive upper bound logic', fn: libTest36 },
        { name: '(SRC) should output console messages for no constraints', fn: libTest37 },
        { name: '(SRC) should handle error in main function', fn: libTest38 },
        { name: '(SRC) should handle getNpmVersionForNode fallback to latest', fn: libTest39 },
        { name: '(SRC) should return null for unknown package in getNodeRequirementForPackage', fn: libTest40 },
        { name: '(SRC) should process packageManager field', fn: libTest41 },
        { name: '(SRC) should handle direct version in getLowestCompatibleVersion', fn: libTest42 },
        { name: '(SRC) should handle exclusive upper bound edge case', fn: libTest43 },
        { name: '(SRC) should handle invalid version in normalizeVersionRange', fn: libTest44 },
        { name: '(SRC) compareVersions should handle all comparison cases', fn: libTest45 },
        { name: '(SRC) getNpmVersionForNode should find correct versions', fn: libTest46 },
        { name: '(SRC) normalizeVersionRange should handle all version formats', fn: libTest47 },
        { name: '(SRC) getNodeRequirementForPackage should handle all package scenarios', fn: libTest48 },
        { name: '(SRC) getLowestCompatibleVersion should handle all version formats', fn: libTest49 },
        { name: '(SRC) getHighestCompatibleVersion should handle all upper bound scenarios', fn: libTest50 },
        { name: '(SRC) getVersionConstraints should handle packageManager field', fn: libTest51 },
        { name: '(SRC) getVersionSummary should handle different constraint combinations', fn: libTest52 },
        { name: '(SRC) updatePackageJsonEngines should update package.json correctly', fn: libTest53 },
        { name: '(SRC) getVersionConstraints should handle different packageManager scenarios', fn: libTest54 },
        { name: '(SRC) getVersionConstraints should handle missing files gracefully', fn: libTest55 },
        { name: '(SRC) collectVersionConstraints should handle lockfile-only projects', fn: libTest56 },
        { name: '(SRC) getHighestCompatibleVersion should handle all edge cases', fn: libTest57 },
        { name: '(SRC) collectVersionConstraints should handle complex lockfile scenarios', fn: libTest58 },

        { name: '<CLI> should show help when --help is used', fn: cliTest1 },
        { name: '<CLI> should show version when --version is used', fn: cliTest2 },
        { name: '<CLI> should analyze project with dependencies', fn: cliTest3 },
        { name: '<CLI> should output JSON format when --json flag is used', fn: cliTest4 },
        { name: '<CLI> should handle quiet output format', fn: cliTest5 },
        { name: '<CLI> should use custom path when --path is specified', fn: cliTest6 },
        { name: '<CLI> should error when no package.json is found', fn: cliTest7 },
        { name: '<CLI> should error when specified path does not exist', fn: cliTest8 },
        { name: '<CLI> should handle invalid package.json gracefully', fn: cliTest9 },
        { name: '<CLI> should show detailed analysis in default mode', fn: cliTest10 },
        { name: '<CLI> should handle projects with no version constraints', fn: cliTest11 },
        { name: '<CLI> should analyze lockfile when present', fn: cliTest12 },
        { name: '<CLI> should handle older lockfile format', fn: cliTest13 },
        { name: '<CLI> should respect existing engine constraints', fn: cliTest14 },
        { name: '<CLI> should fall back to engine constraints when no dependencies have requirements', fn: cliTest15 },
        { name: '<CLI> should handle interactive package.json update with user acceptance', fn: cliTest16 },
        { name: '<CLI> should handle interactive package.json update with user rejection', fn: cliTest17 },
        { name: '<CLI> should handle package.json update failure gracefully', fn: cliTest18 },
        { name: '<CLI> should execute main function when run as script', fn: cliTest19 },
        { name: '<CLI> should handle missing commander dependency gracefully', fn: cliTest20 },
        { name: '<CLI> should change directory when --path option is used', fn: cliTest21 },
        { name: '<CLI> should handle commander dependency check error', fn: cliTest22 },
        { name: '<CLI> should handle path change when different from cwd', fn: cliTest23 },
        { name: '<CLI> should handle updatePackageJsonEngines failure', fn: cliTest24 },
        { name: '<CLI> should show no constraints message', fn: cliTest25 },
        { name: '<CLI> should show no upper bound message', fn: cliTest26 },
        { name: '<CLI> should output JSON with specific highest node version', fn: cliTest27 },
        { name: '<CLI> should output quiet mode with specific highest node', fn: cliTest28 },
        { name: '<CLI> should format constraints with specific upper bounds', fn: cliTest29 },
        { name: '<CLI> should handle quiet mode when no constraints found', fn: cliTest30 },
        { name: '<CLI> should perform full analysis with default options', fn: cliTest31 },
        { name: '<CLI> should handle different command line options', fn: cliTest32 },
        { name: '<CLI> should output JSON format correctly', fn: cliTest33 },
        { name: '<CLI> should output quiet format correctly', fn: cliTest34 },
        { name: '<CLI> should work with custom path option', fn: cliTest35 },
        { name: '[DOCS] main module should export an empty object', fn: docTest1 },
        { name: '[DOCS] main module should be defined', fn: docTest2 },
        { name: '[DOCS] main module should be an object', fn: docTest3 },
        { name: '[DOCS] should handle API error responses', fn: docTest4 },
        { name: '[DOCS] should handle network errors', fn: docTest5 },
        { name: '[DOCS] should handle unexpected API response structure', fn: docTest6 },
        { name: '[DOCS] should handle suggest solutions with no conflicts', fn: docTest7 },
        { name: '[DOCS] should test wrapLabel function and tooltip config', fn: docTest8 },
        { name: '[DOCS] should test Chart creation and configuration', fn: docTest9 },
        { name: '[DOCS] should handle API response with safety blocks', fn: docTest10 },
        { name: '[DOCS] should test wrapLabel function with chart labels', fn: docTest11 }
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
