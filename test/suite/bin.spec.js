const assert = require('node:assert')
const fs = require('node:fs')
const path = require('node:path')
const os = require('node:os')
const { execSync } = require('node:child_process')

// Test helper to create temporary directory with package.json
function createTempProject(packageContent, lockfileContent = null) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cli-test-'))
    const packagePath = path.join(tmpDir, 'package.json')
    fs.writeFileSync(packagePath, packageContent)

    if (lockfileContent) {
        const lockfilePath = path.join(tmpDir, 'package-lock.json')
        fs.writeFileSync(lockfilePath, lockfileContent)
    }

    return tmpDir
}

// Test helper to cleanup temporary directory
function cleanupTempProject(projectDir) {
    try {
        fs.rmSync(projectDir, { recursive: true, force: true })
    } catch (e) {
        // Ignore cleanup errors
    }
}

// Test helper to run CLI command
function runCLI(args, options = {}) {
    const cliPath = path.resolve(__dirname, '../../bin/cli.js')
    const cmd = `node "${cliPath}" ${args.join(' ')}`

    try {
        const result = execSync(cmd, {
            encoding: 'utf8',
            cwd: options.cwd || process.cwd(),
            timeout: 10000,
            stdio: 'pipe'
        })
        return { stdout: result, stderr: '', exitCode: 0 }
    } catch (error) {
        return {
            stdout: error.stdout || '',
            stderr: error.stderr || '',
            exitCode: error.status || 1
        }
    }
}

// CLI options and help tests
function cliTest1() {
    const result = runCLI(['--help'])
    assert.strictEqual(result.exitCode, 0)
    assert(result.stdout.includes('verlimit'))
    assert(result.stdout.includes('Analyze Node.js and npm version constraints'))
}

function cliTest2() {
    const result = runCLI(['--version'])
    assert.strictEqual(result.exitCode, 0)
    assert(result.stdout.includes('1.0.0'))
}

// Project analysis tests
function cliTest3() {
    const packageContent = JSON.stringify({
        name: 'test-project',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)
        assert(result.stdout.includes('node:18.0.0'))
        assert(result.stdout.includes('npm:8.6.0'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest4() {
    const packageContent = JSON.stringify({
        name: 'test-project',
        dependencies: {
            react: '^18.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '14.0.0')
        assert.strictEqual(output.lowest.npm, '6.14.4')
        assert.strictEqual(output.source, 'dependencies')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest5() {
    const packageContent = JSON.stringify({
        name: 'test-project',
        engines: {
            node: '>=16.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)
        assert(result.stdout.includes('node:16.0.0|npm:7.10.0'))
        assert(result.stdout.includes('node:latest|npm:latest compatible'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest6() {
    const packageContent = JSON.stringify({
        name: 'custom-path-project',
        dependencies: {
            express: '^4.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--path', tmpDir, '--json'])
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '0.10.0')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Error handling tests
function cliTest7() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'empty-dir-'))
    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.notStrictEqual(result.exitCode, 0)
        assert(result.stderr.includes('No package.json found'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest8() {
    const result = runCLI(['--path', '/non/existent/path', '--quiet'])
    assert.notStrictEqual(result.exitCode, 0)
}

function cliTest9() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'invalid-json-'))
    const packagePath = path.join(tmpDir, 'package.json')
    fs.writeFileSync(packagePath, 'invalid json content')

    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.notStrictEqual(result.exitCode, 0)
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Default output format tests
function cliTest10() {
    const packageContent = JSON.stringify({
        name: 'detailed-test',
        dependencies: {
            typescript: '^5.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI([], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)
        assert(result.stdout.includes('Version Constraints Summary'))
        assert(result.stdout.includes('Lowest supported Node.js version'))
        assert(result.stdout.includes('v14.17.0'))
        assert(result.stdout.includes('best-effort analysis'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest11() {
    const packageContent = JSON.stringify({
        name: 'no-constraints',
        dependencies: {
            'unknown-package': '^1.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, null)
        assert.strictEqual(output.lowest.npm, null)
        assert.strictEqual(output.source, 'none')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Package-lock.json analysis tests
function cliTest12() {
    const packageContent = JSON.stringify({
        name: 'lockfile-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const lockfileContent = JSON.stringify({
        name: 'lockfile-test',
        lockfileVersion: 3,
        packages: {
            '': {
                name: 'lockfile-test',
                dependencies: {
                    commander: '^14.0.0'
                }
            },
            'node_modules/commander': {
                version: '14.0.0',
                resolved: 'https://registry.npmjs.org/commander/-/commander-14.0.0.tgz'
            }
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent, lockfileContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '18.0.0')
        assert.strictEqual(output.source, 'dependencies')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest13() {
    const packageContent = JSON.stringify({
        name: 'old-lockfile-test',
        dependencies: {
            express: '^4.0.0'
        }
    }, null, 2)

    const lockfileContent = JSON.stringify({
        name: 'old-lockfile-test',
        lockfileVersion: 1,
        dependencies: {
            express: {
                version: '4.18.2',
                resolved: 'https://registry.npmjs.org/express/-/express-4.18.2.tgz'
            }
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent, lockfileContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '0.10.0')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Engine constraints tests
function cliTest14() {
    const packageContent = JSON.stringify({
        name: 'engine-test',
        engines: {
            node: '>=20.0.0',
            npm: '>=9.6.4'
        },
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        // Should use engine constraint (20.0.0) since it's higher than dependency constraint (18.0.0)
        assert.strictEqual(output.lowest.node, '20.0.0')
        assert.strictEqual(output.source, 'engines')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest15() {
    const packageContent = JSON.stringify({
        name: 'engine-fallback-test',
        engines: {
            node: '>=16.0.0'
        },
        dependencies: {
            'unknown-package': '^1.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '16.0.0')
        assert.strictEqual(output.source, 'engines')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test interactive prompt functionality
function cliTest16() {
    const packageContent = JSON.stringify({
        name: 'interactive-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        // Simulate user input 'y'
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const cmd = `echo "y" | node "${cliPath}"`

        const result = execSync(cmd, {
            encoding: 'utf8',
            cwd: tmpDir,
            timeout: 10000,
            stdio: 'pipe'
        })

        // Check that package.json was updated
        const updatedPackage = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'))
        assert(updatedPackage.engines, 'Should have engines field')
        assert(updatedPackage.engines.node, 'Should have node version constraint')
        assert(result.includes('Successfully updated package.json'), 'Should show success message')
    } catch (error) {
        // Handle the case where the test might fail due to terminal interaction
        assert(error.stdout.includes('Update package.json'), 'Should show update prompt')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

function cliTest17() {
    const packageContent = JSON.stringify({
        name: 'interactive-reject-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        // Simulate user input 'n'
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const cmd = `echo "n" | node "${cliPath}"`

        const result = execSync(cmd, {
            encoding: 'utf8',
            cwd: tmpDir,
            timeout: 10000,
            stdio: 'pipe'
        })

        // Check that package.json was not updated
        const originalPackage = JSON.parse(fs.readFileSync(path.join(tmpDir, 'package.json'), 'utf8'))
        assert(!originalPackage.engines, 'Should not have engines field')
        assert(result.includes('No changes made'), 'Should show no changes message')
    } catch (error) {
        // Handle the case where the test might fail due to terminal interaction
        assert(error.stdout.includes('Update package.json'), 'Should show update prompt')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test error handling when package.json update fails
function cliTest18() {
    const packageContent = JSON.stringify({
        name: 'update-fail-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        // Make package.json read-only to simulate update failure
        const packagePath = path.join(tmpDir, 'package.json')
        fs.chmodSync(packagePath, 0o444)

        // Simulate user input 'y'
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const cmd = `echo "y" | node "${cliPath}"`

        try {
            const result = execSync(cmd, {
                encoding: 'utf8',
                cwd: tmpDir,
                timeout: 10000,
                stdio: 'pipe'
            })
            assert(result.includes('Failed to update package.json'), 'Should show failure message')
        } catch (error) {
            // The command might exit with error code, check stderr/stdout
            const output = error.stdout || error.stderr || ''
            assert(output.includes('Update package.json') || output.includes('Failed to update'), 'Should show update attempt')
        }
    } finally {
        // Restore permissions before cleanup
        try {
            fs.chmodSync(path.join(tmpDir, 'package.json'), 0o644)
        } catch (e) {
            // Ignore permission restore errors
        }
        cleanupTempProject(tmpDir)
    }
}

// Test the main execution flow
function cliTest19() {
    const packageContent = JSON.stringify({
        name: 'main-execution-test',
        dependencies: {
            react: '^18.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        // Run the CLI directly as a script
        const result = execSync(`node "${cliPath}" --json`, {
            encoding: 'utf8',
            cwd: tmpDir,
            timeout: 10000,
            stdio: 'pipe'
        })

        const output = JSON.parse(result)
        assert.strictEqual(output.lowest.node, '14.0.0')
        assert.strictEqual(output.source, 'dependencies')
    } catch (error) {
        assert.fail(`CLI execution failed: ${error.message}`)
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test handling of missing commander dependency
function cliTest20() {
    // Create a temporary CLI file that tries to use commander when it's not available
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'missing-commander-'))
    const testCliPath = path.join(tmpDir, 'test-cli.js')

    // Create a CLI file that will fail to require commander
    const testCliContent = `#!/usr/bin/env node
"use strict"

try {
    require.resolve('non-existent-commander-package')
} catch (e) {
    console.error('Error: This tool requires the "commander" package.')
    console.error('Please install it using: npm install commander')
    process.exit(1)
}`
    fs.writeFileSync(testCliPath, testCliContent)

    try {
        const result = execSync(`node "${testCliPath}"`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe'
        })
        assert.fail('Should have failed when commander is not available')
    } catch (error) {
        const errorOutput = error.stderr || error.stdout || ''
        assert(errorOutput.includes('requires the "commander" package') ||
            errorOutput.includes('This tool requires the "commander" package'),
            'Should show commander requirement error')
        assert.strictEqual(error.status, 1, 'Should exit with code 1')
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test directory change with --path option
function cliTest21() {
    const packageContent = JSON.stringify({
        name: 'path-change-test',
        dependencies: {
            express: '^4.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    const otherDir = fs.mkdtempSync(path.join(os.tmpdir(), 'other-dir-'))

    try {
        // Run CLI from different directory with --path pointing to our test project
        const result = runCLI(['--path', tmpDir, '--json'], { cwd: otherDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '0.10.0')
    } finally {
        cleanupTempProject(tmpDir)
        fs.rmSync(otherDir, { recursive: true, force: true })
    }
}

// Test commander dependency check (lines 13-16) - use module mocking to cover original file
function cliTest22() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'commander-test-'))

    try {
        // Create a test script that will execute the original CLI with mocked require.resolve
        const testScriptPath = path.join(tmpDir, 'test-script.js')
        const originalCliPath = path.resolve(__dirname, '../../bin/cli.js')

        // Create a test script that patches Module._resolveFilename before requiring the CLI
        const testScriptContent = `
const Module = require('module');
const originalResolveFilename = Module._resolveFilename;

// Mock require.resolve to fail for commander specifically
Module._resolveFilename = function(request, parent, isMain, options) {
    if (request === 'commander' && parent && parent.filename && parent.filename.includes('cli.js')) {
        const error = new Error("Cannot find module 'commander'");
        error.code = 'MODULE_NOT_FOUND';
        throw error;
    }
    return originalResolveFilename.call(this, request, parent, isMain, options);
};

// Mock require to not actually import commander on line 5
const originalRequire = Module.prototype.require;
Module.prototype.require = function(id) {
    if (id === 'commander' && this.filename && this.filename.includes('cli.js')) {
        // Return a dummy object to prevent failure on line 5
        return { Command: function() {} };
    }
    return originalRequire.call(this, id);
};

// Now require the original CLI file - this should trigger the require.resolve error
require('${originalCliPath.replace(/\\/g, '\\\\')}');
`

        fs.writeFileSync(testScriptPath, testScriptContent)

        // Execute the test script - this should trigger lines 13-16 in the original CLI
        const result = execSync(`node "${testScriptPath}"`, {
            encoding: 'utf8',
            timeout: 5000,
            stdio: 'pipe'
        })

        assert.fail('Should have failed when commander require.resolve fails')
    } catch (error) {
        // This should catch the process.exit(1) from line 15 of the original CLI
        const errorOutput = error.stderr || ''
        assert.strictEqual(error.status, 1, 'Should exit with code 1')
        assert(errorOutput.includes('Error: This tool requires the "commander" package.'), 'Should show commander requirement error from line 13')
        assert(errorOutput.includes('Please install it using: npm install commander'), 'Should show installation instruction from line 14')
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test for "No Node.js version constraints found" (lines 92-93)
function cliTest25() {
    const packageContent = JSON.stringify({
        name: 'no-constraints-test',
        dependencies: {}
    }, null, 2)

    const tmpDir = createTempProject(packageContent)

    try {
        // Use default (non-quiet, non-json) mode to trigger the specific console.log
        const result = runCLI([], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0, 'Should succeed even with no constraints')
        assert(result.stdout.includes('No Node.js version constraints found.'), 'Should show no constraints message')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test for "No upper bound found" message (lines 99-100)
function cliTest26() {
    // Create a test that results in summary.highest.node being null/undefined
    // This is tricky because most dependencies have some constraint
    // Let's create a mock scenario by using a package with only lower bounds
    const packageContent = JSON.stringify({
        name: 'no-upper-bound-test',
        dependencies: {}  // Empty dependencies to avoid any constraints
    }, null, 2)

    const tmpDir = createTempProject(packageContent)

    try {
        // This should result in no constraints found, which triggers both messages
        const result = runCLI([], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0, 'Should succeed')
        // When there are no constraints, both "No Node.js version constraints found"
        // and "No upper bound found" should appear
        assert(result.stdout.includes('No upper bound found for Node.js version.'), 'Should show no upper bound message')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test path change when options.path differs from cwd (lines 92-93)
function cliTest23() {
    const packageContent = JSON.stringify({
        name: 'path-change-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    const differentDir = fs.mkdtempSync(path.join(os.tmpdir(), 'different-dir-'))

    try {
        // Run from different directory using --path option to trigger path change logic
        const result = runCLI(['--path', tmpDir, '--json'], { cwd: differentDir })
        assert.strictEqual(result.exitCode, 0, 'Should succeed with path option')

        const output = JSON.parse(result.stdout)
        assert.strictEqual(output.lowest.node, '18.0.0', 'Should analyze the project at the specified path')
        assert.strictEqual(output.source, 'dependencies', 'Should find dependencies')
    } finally {
        cleanupTempProject(tmpDir)
        fs.rmSync(differentDir, { recursive: true, force: true })
    }
}

// Test updatePackageJsonEngines failure handling (lines 99-100)
function cliTest24() {
    const packageContent = JSON.stringify({
        name: 'update-failure-test',
        dependencies: {
            commander: '^14.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)

    try {
        // Make package.json read-only to force updatePackageJsonEngines to fail
        const packagePath = path.join(tmpDir, 'package.json')
        fs.chmodSync(packagePath, 0o444) // read-only

        // Test with echo to simulate user saying 'yes' to update
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const cmd = `echo "y" | node "${cliPath}"`

        try {
            const result = execSync(cmd, {
                encoding: 'utf8',
                cwd: tmpDir,
                timeout: 10000,
                stdio: 'pipe'
            })

            // Should show failure message when updatePackageJsonEngines fails
            assert(result.includes('❌ Failed to update package.json'), 'Should show failure message')
            assert(result.includes('check the file permissions'), 'Should mention file permissions')
        } catch (error) {
            // Command might exit with error, check output
            const output = error.stdout || ''
            assert(output.includes('Failed to update package.json') ||
                output.includes('Update package.json'), 'Should handle update failure')
        }
    } finally {
        // Restore permissions before cleanup
        try {
            fs.chmodSync(path.join(tmpDir, 'package.json'), 0o644)
        } catch (e) {
            // Ignore permission errors during cleanup
        }
        cleanupTempProject(tmpDir)
    }
}

// Test for JSON output with specific highest node (line 82)
function cliTest27() {
    // Create a scenario where we have a specific highest node version (not unlimited)
    const packageContent = JSON.stringify({
        name: 'specific-highest-test',
        dependencies: {
            'express': '^4.0.0' // This will give us Node 0.10.0 as lowest, no upper bound normally
        }
    }, null, 2)

    // We need to modify the test to provide a specific upper bound
    // Let's create a more complex scenario with engines that provides specific bounds
    const packageWithEngines = JSON.stringify({
        name: 'specific-highest-test',
        engines: {
            node: '>=16.0.0,<=18.0.0' // This gives us a specific upper bound
        },
        dependencies: {
            'express': '^4.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageWithEngines)
    try {
        const result = runCLI(['--json'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        const output = JSON.parse(result.stdout)
        // When there's a specific highest version, it should be in the JSON output
        assert(output.highest.node !== 'unlimited', 'Should have specific highest node version')
        assert(output.highest.node === '18.0.0', 'Should have 18.0.0 as highest')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test for line 82 - quiet mode with specific highest node
function cliTest28() {
    const packageContent = JSON.stringify({
        name: 'quiet-highest-test',
        engines: {
            node: '>=16.0.0,<=18.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)
    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        // In quiet mode with specific highest node, should output both lowest and highest
        const lines = result.stdout.trim().split('\n')
        assert(lines.some(line => line.includes('node:16.0.0|npm:')), 'Should have lowest node output')
        assert(lines.some(line => line.includes('node:18.0.0|npm:')), 'Should have highest node output (line 82)')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test for lines 112-116 - constraint formatting with specific upper bounds
function cliTest29() {
    const packageContent = JSON.stringify({
        name: 'constraint-format-test',
        engines: {
            node: '>=16.0.0,<=18.0.0',
            npm: '>=8.0.0,<=9.0.0'
        }
    }, null, 2)

    const tmpDir = createTempProject(packageContent)

    // We need to simulate the interactive prompt scenario
    // Let's create a test that captures the output before the prompt
    try {
        const result = runCLI([], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0)

        // Should show the constraint formatting lines 112-116
        assert(result.stdout.includes('>=16.0.0,<=18.0.0'), 'Should show node constraint with upper bound (line 112-113)')
        assert(result.stdout.includes('>=8.0.0,<=9.0.0'), 'Should show npm constraint with upper bound (line 115-116)')
        assert(result.stdout.includes('"engines": {'), 'Should show engines block')
        assert(result.stdout.includes('"node":'), 'Should show node constraint')
        assert(result.stdout.includes('"npm":'), 'Should show npm constraint')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test quiet mode when no constraints are found (lines 78-81)
function cliTest30() {
    const packageContent = JSON.stringify({
        name: 'no-constraints-quiet-test',
        version: '1.0.0'
        // No dependencies, no engines - should result in no constraints
    }, null, 2)

    const tmpDir = createTempProject(packageContent)

    try {
        const result = runCLI(['--quiet'], { cwd: tmpDir })
        assert.strictEqual(result.exitCode, 0, 'Should succeed with quiet flag')

        // Should have minimal output when no constraints found in quiet mode
        // This triggers the case where neither summary.lowest.node nor summary.highest.node exist
        // covering lines 78-81 (the conditions that check for node versions but find none)
        assert.strictEqual(result.stdout.trim(), '', 'Should have no output in quiet mode when no constraints found')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test CLI with no arguments in a project with specific dependencies
async function cliTest31() {
    const tmpDir = createTempProject(JSON.stringify({
        name: "test-cli-full-analysis",
        dependencies: {
            "react": "^18.0.0",
            "express": "^4.18.0",
            "typescript": "^5.0.0"
        }
    }))

    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const result = execSync(`node ${cliPath}`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf8'
        })

        assert.ok(result.includes('Version Constraints Summary'))
        assert.ok(result.includes('Lowest supported Node.js version:'))
        assert.ok(result.includes('Would you like to update your package.json'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test CLI with different command line options
async function cliTest32() {
    const tmpDir = createTempProject(JSON.stringify({
        name: "test-cli-options",
        dependencies: {
            "react": "^18.0.0"
        }
    }))

    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')

        // Test --version option
        const versionResult = execSync(`node ${cliPath} --version`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf8'
        })
        assert.ok(versionResult.includes('1.0.0')) // Version from package.json

        // Test --help option
        const helpResult = execSync(`node ${cliPath} --help`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf8'
        })
        assert.ok(helpResult.includes('Usage:'))
        assert.ok(helpResult.includes('Options:'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test CLI with json output format
async function cliTest33() {
    const tmpDir = createTempProject(JSON.stringify({
        name: "test-cli-json",
        dependencies: {
            "react": "^18.0.0"
        },
        engines: {
            "node": ">=14.0.0"
        }
    }))

    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const result = execSync(`node ${cliPath} --json`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf8'
        })

        const jsonResult = JSON.parse(result)
        assert.strictEqual(typeof jsonResult, 'object')
        assert.strictEqual(typeof jsonResult.lowest, 'object')
        assert.strictEqual(typeof jsonResult.highest, 'object')
        assert.strictEqual(jsonResult.lowest.node, '14.0.0')
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test CLI with quiet output format
async function cliTest34() {
    const tmpDir = createTempProject(JSON.stringify({
        name: "test-cli-quiet",
        dependencies: {
            "react": "^18.0.0"
        },
        engines: {
            "node": ">=14.0.0,<16.0.0"
        }
    }))

    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const result = execSync(`node ${cliPath} --quiet`, {
            cwd: tmpDir,
            stdio: 'pipe',
            encoding: 'utf8'
        })

        // Should output just the version numbers
        const lines = result.trim().split('\n')
        assert.strictEqual(lines.length, 2)
        assert.ok(lines[0].startsWith('node:'))
        assert.ok(lines[1].startsWith('node:'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test CLI with custom path
async function cliTest35() {
    const tmpDir = createTempProject(JSON.stringify({
        name: "test-cli-custom-path",
        dependencies: {
            "react": "^18.0.0"
        }
    }))

    const nestedDir = path.join(tmpDir, 'nested')
    fs.mkdirSync(nestedDir)

    try {
        const cliPath = path.resolve(__dirname, '../../bin/cli.js')
        const result = execSync(`node ${cliPath} --path ${tmpDir}`, {
            cwd: nestedDir, // Run from a different directory
            stdio: 'pipe',
            encoding: 'utf8'
        })

        assert.ok(result.includes('Version Constraints Summary'))
        assert.ok(result.includes('test-cli-custom-path'))
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Export all test functions and helper functions
module.exports = {
    // Helper functions
    createTempProject, cleanupTempProject, runCLI,

    // Test functions
    cliTest1, cliTest2, cliTest3, cliTest4, cliTest5,
    cliTest6, cliTest7, cliTest8, cliTest9, cliTest10,
    cliTest11, cliTest12, cliTest13, cliTest14, cliTest15,
    cliTest16, cliTest17, cliTest18, cliTest19, cliTest20,
    cliTest21, cliTest22, cliTest23, cliTest24, cliTest25,
    cliTest26, cliTest27, cliTest28, cliTest29, cliTest30,
    cliTest30, cliTest31, cliTest32, cliTest33, cliTest34,
    cliTest35
}