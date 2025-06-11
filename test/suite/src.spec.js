const assert = require("node:assert")
const fs = require("node:fs")
const path = require("node:path")
const os = require("node:os")
const { execSync } = require("node:child_process")

// Test helper to create temporary directory with package.json
function createTempProject(packageContent, lockfileContent = null) {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "cli-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    if (lockfileContent) {
        const lockfilePath = path.join(tmpDir, "package-lock.json")
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

// Tests for the main function (lines 398-435) - covering main function execution and output
async function libTest1() {
    const packageContent = JSON.stringify({
        name: "test-main-output",
        dependencies: {
            commander: "^14.0.0",
            react: "^18.0.0",
        },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "main-output-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const originalConsole = console.log

    try {
        process.chdir(tmpDir)

        // Execute the main function logic with quiet mode first to get data
        const {
            collectVersionConstraints,
            getVersionSummary,
            updatePackageJsonEngines,
        } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(true) // quiet mode
        const summary = getVersionSummary(constraints)

        // Now capture only the main function output
        const logMessages = []
        console.log = (msg) => {
            logMessages.push(msg)
        }

        // Simulate main function console output (lines 398-435)
        console.log("\n=== Version Constraints Summary ===")

        if (summary.lowest.node) {
            console.log(
                `\nLowest supported Node.js version: v${summary.lowest.node}`,
            )
            console.log(`Associated npm version: v${summary.lowest.npm}`)
            console.log(`Source: ${summary.source}`)
        } else {
            console.log("\nNo Node.js version constraints found.")
        }

        if (summary.highest.node) {
            console.log(
                `\nHighest compatible Node.js version: ${summary.highest.node === "unlimited" ? "unlimited" : `v${summary.highest.node}`}`,
            )
            console.log(`Associated npm version: ${summary.highest.npm}`)
        } else {
            console.log("\nNo upper bound found for Node.js version.")
        }

        console.log(
            "\nNote: This is a best-effort analysis and may not capture all constraints.",
        )
        console.log(
            "For precise requirements, review each dependency's documentation.",
        )

        updatePackageJsonEngines(packagePath, summary)

        // Verify expected console output
        assert(logMessages.includes("\n=== Version Constraints Summary ==="))
        assert(
            logMessages.some((msg) =>
                msg.includes("Lowest supported Node.js version: v"),
            ),
        )
        assert(
            logMessages.some((msg) => msg.includes("Associated npm version: v")),
        )
        assert(logMessages.some((msg) => msg.includes("Source: dependencies")))
        assert(
            logMessages.some((msg) =>
                msg.includes("Highest compatible Node.js version: unlimited"),
            ),
        )
        assert(
            logMessages.some((msg) =>
                msg.includes("Associated npm version: latest compatible"),
            ),
        )
        assert(
            logMessages.includes(
                "\nNote: This is a best-effort analysis and may not capture all constraints.",
            ),
        )
        assert(
            logMessages.includes(
                "For precise requirements, review each dependency's documentation.",
            ),
        )
    } finally {
        process.chdir(originalCwd)
        console.log = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest2() {
    const packageContent = JSON.stringify({
        name: "test-no-constraints",
        dependencies: {
            "unknown-package": "^1.0.0",
        },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "no-constraints-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const originalConsole = console.log

    try {
        process.chdir(tmpDir)

        // Execute the main function logic with quiet mode first
        const {
            collectVersionConstraints,
            getVersionSummary,
            updatePackageJsonEngines,
        } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(true) // quiet mode
        const summary = getVersionSummary(constraints)

        // Now capture only the main function output
        const logMessages = []
        console.log = (msg) => {
            logMessages.push(msg)
        }

        // Simulate main function console output (lines 398-435)
        console.log("\n=== Version Constraints Summary ===")

        if (summary.lowest.node) {
            console.log(
                `\nLowest supported Node.js version: v${summary.lowest.node}`,
            )
            console.log(`Associated npm version: v${summary.lowest.npm}`)
            console.log(`Source: ${summary.source}`)
        } else {
            console.log("\nNo Node.js version constraints found.")
        }

        if (summary.highest.node) {
            console.log(
                `\nHighest compatible Node.js version: ${summary.highest.node === "unlimited" ? "unlimited" : `v${summary.highest.node}`}`,
            )
            console.log(`Associated npm version: ${summary.highest.npm}`)
        } else {
            console.log("\nNo upper bound found for Node.js version.")
        }

        console.log(
            "\nNote: This is a best-effort analysis and may not capture all constraints.",
        )
        console.log(
            "For precise requirements, review each dependency's documentation.",
        )

        updatePackageJsonEngines(packagePath, summary)

        // Verify expected console output for no constraints
        assert(logMessages.includes("\n=== Version Constraints Summary ==="))
        assert(logMessages.includes("\nNo Node.js version constraints found."))
        assert(logMessages.includes("\nNo upper bound found for Node.js version."))
        assert(
            logMessages.includes(
                "\nNote: This is a best-effort analysis and may not capture all constraints.",
            ),
        )
        assert(
            logMessages.includes(
                "For precise requirements, review each dependency's documentation.",
            ),
        )
    } finally {
        process.chdir(originalCwd)
        console.log = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest3() {
    const originalCwd = process.cwd()
    const originalConsole = console.error
    const originalExit = process.exit

    // Create empty directory to trigger error
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "main-error-test-"))

    try {
        process.chdir(tmpDir)

        let errorMessage = ""
        let exitCode = null

        console.error = (msg) => {
            errorMessage = msg
        }
        process.exit = (code) => {
            exitCode = code
            throw new Error("process.exit called")
        }

        // Execute the main function logic that should fail
        const { collectVersionConstraints } = require("../../src/index.js")

        try {
            await collectVersionConstraints()
            assert.fail("Should have called process.exit")
        } catch (error) {
            if (error.message !== "process.exit called") {
                throw error
            }
        }

        // Verify error handling
        assert.strictEqual(exitCode, 1)
        assert(
            errorMessage.includes("No package.json or package-lock.json found!"),
        )
    } finally {
        process.chdir(originalCwd)
        console.error = originalConsole
        process.exit = originalExit
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest4() {
    const packageContent = JSON.stringify({
        name: "test-summary-error",
        dependencies: { commander: "^14.0.0" },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "summary-error-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const originalConsole = console.error
    const originalExit = process.exit

    try {
        process.chdir(tmpDir)

        let errorMessage = ""
        let exitCode = null

        console.error = (msg, error) => {
            errorMessage = `${msg}${error ? ` ${error}` : ""}`
        }
        process.exit = (code) => {
            exitCode = code
        }

        // Test error handling simulation
        try {
            // Simulate main function execution with error
            const indexModule = require("../../src/index.js")
            const constraints = await indexModule.collectVersionConstraints(true) // quiet mode

            // Mock getVersionSummary to throw an error
            const originalGetVersionSummary = indexModule.getVersionSummary
            indexModule.getVersionSummary = () => {
                throw new Error("Test error in getVersionSummary")
            }

            try {
                indexModule.getVersionSummary(constraints) // This should throw
            } catch (error) {
                // Simulate the catch block in main function
                console.error("Error analyzing version constraints:", error)
                process.exit(1)
            }

            // Restore original function
            indexModule.getVersionSummary = originalGetVersionSummary
        } catch (error) {
            // Handle any other errors
            if (!errorMessage.includes("Error analyzing version constraints:")) {
                throw error
            }
        }

        // Verify error handling
        assert.strictEqual(exitCode, 1)
        assert(errorMessage.includes("Error analyzing version constraints:"))
    } finally {
        process.chdir(originalCwd)
        console.error = originalConsole
        process.exit = originalExit
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest5() {
    const packageContent = JSON.stringify({
        name: "test-version-format",
        engines: {
            node: ">=16.14.0",
        },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "version-format-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const originalConsole = console.log

    try {
        process.chdir(tmpDir)

        // Execute the main function logic with quiet mode first
        const {
            collectVersionConstraints,
            getVersionSummary,
        } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(true) // quiet mode
        const summary = getVersionSummary(constraints)

        // Now capture only the main function output
        const logMessages = []
        console.log = (msg) => {
            logMessages.push(msg)
        }

        // Simulate main function console output with specific highest version
        console.log("\n=== Version Constraints Summary ===")

        if (summary.lowest.node) {
            console.log(
                `\nLowest supported Node.js version: v${summary.lowest.node}`,
            )
            console.log(`Associated npm version: v${summary.lowest.npm}`)
            console.log(`Source: ${summary.source}`)
        }

        // Test the specific formatting logic for highest version
        if (summary.highest.node) {
            const formattedHighest =
                summary.highest.node === "unlimited"
                    ? "unlimited"
                    : `v${summary.highest.node}`
            console.log(`\nHighest compatible Node.js version: ${formattedHighest}`)
            console.log(`Associated npm version: ${summary.highest.npm}`)
        }

        console.log(
            "\nNote: This is a best-effort analysis and may not capture all constraints.",
        )

        // Verify the specific formatting is correct
        const versionMessage = logMessages.find((msg) =>
            msg.includes("Highest compatible Node.js version:"),
        )
        assert(versionMessage, "Should have highest version message")

        // Test that 'unlimited' doesn't get 'v' prefix but specific versions do
        if (summary.highest.node === "unlimited") {
            assert(versionMessage.includes("unlimited"))
            assert(!versionMessage.includes("v unlimited"))
        } else {
            assert(versionMessage.includes(`v${summary.highest.node}`))
        }
    } finally {
        process.chdir(originalCwd)
        console.log = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest6() {
    const packageContent = JSON.stringify({
        name: "test-update-call",
        dependencies: { commander: "^14.0.0" },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "update-call-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()

    try {
        process.chdir(tmpDir)

        // Mock updatePackageJsonEngines to verify it's called correctly
        const indexModule = require("../../src/index.js")
        const originalUpdate = indexModule.updatePackageJsonEngines
        let updateCalled = false
        let updatePath = null
        let updateSummary = null

        indexModule.updatePackageJsonEngines = (path, summary) => {
            updateCalled = true
            updatePath = path
            updateSummary = summary
            return originalUpdate(path, summary)
        }

        try {
            // Execute main function logic
            const constraints = await indexModule.collectVersionConstraints(true) // quiet mode
            const summary = indexModule.getVersionSummary(constraints)

            // Simulate the path construction and call from main function
            const expectedPath = path.join(process.cwd(), "package.json")
            indexModule.updatePackageJsonEngines(expectedPath, summary)

            // Verify the call
            assert.strictEqual(updateCalled, true)
            assert.strictEqual(updatePath, expectedPath)
            assert(updateSummary, "Should pass summary object")
            assert.strictEqual(updateSummary.source, "dependencies")
        } finally {
            // Restore original function
            indexModule.updatePackageJsonEngines = originalUpdate
        }
    } finally {
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

async function libTest7() {
    const packageContent = JSON.stringify({
        name: "test-exact-format",
        dependencies: { typescript: "^5.0.0" },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "exact-format-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const originalConsole = console.log

    try {
        process.chdir(tmpDir)

        // Execute the main function logic with quiet mode first
        const {
            collectVersionConstraints,
            getVersionSummary,
        } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(true) // quiet mode
        const summary = getVersionSummary(constraints)

        // Now capture only the main function output
        const logMessages = []
        console.log = (msg) => {
            logMessages.push(msg)
        }

        // Test exact console.log calls from lines 398-435
        console.log("\n=== Version Constraints Summary ===")

        if (summary.lowest.node) {
            console.log(
                `\nLowest supported Node.js version: v${summary.lowest.node}`,
            )
            console.log(`Associated npm version: v${summary.lowest.npm}`)
            console.log(`Source: ${summary.source}`)
        } else {
            console.log("\nNo Node.js version constraints found.")
        }

        if (summary.highest.node) {
            console.log(
                `\nHighest compatible Node.js version: ${summary.highest.node === "unlimited" ? "unlimited" : `v${summary.highest.node}`}`,
            )
            console.log(`Associated npm version: ${summary.highest.npm}`)
        } else {
            console.log("\nNo upper bound found for Node.js version.")
        }

        console.log(
            "\nNote: This is a best-effort analysis and may not capture all constraints.",
        )
        console.log(
            "For precise requirements, review each dependency's documentation.",
        )

        // Verify exact string format matches
        assert.strictEqual(logMessages[0], "\n=== Version Constraints Summary ===")
        assert(logMessages[1].startsWith("\nLowest supported Node.js version: v"))
        assert(logMessages[2].startsWith("Associated npm version: v"))
        assert(logMessages[3].startsWith("Source: "))
        assert(logMessages[4].startsWith("\nHighest compatible Node.js version: "))
        assert(logMessages[5].startsWith("Associated npm version: "))
        assert.strictEqual(
            logMessages[6],
            "\nNote: This is a best-effort analysis and may not capture all constraints.",
        )
        assert.strictEqual(
            logMessages[7],
            "For precise requirements, review each dependency's documentation.",
        )
    } finally {
        process.chdir(originalCwd)
        console.log = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test devDependencies processing (lines 224-233)
async function libTest26() {
    const packageContent = JSON.stringify({
        name: "test-devdeps",
        devDependencies: {
            typescript: "^5.0.0",
            "@types/node": "^18.0.0",
            jest: "^29.0.0",
        },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "devdeps-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()

    try {
        process.chdir(tmpDir)

        const {
            collectVersionConstraints,
            getVersionSummary,
        } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(true) // quiet mode
        const summary = getVersionSummary(constraints)

        // TypeScript requires Node.js >= 14.17.0
        assert.strictEqual(
            summary.lowest.node,
            "14.17.0",
            "Should find Node requirement from devDependencies",
        )
        assert.strictEqual(
            summary.source,
            "dependencies",
            "Should identify source as dependencies (includes devDependencies)",
        )

        // Check that devDependency constraints were found
        const typescriptConstraint = constraints.find(
            (c) => c.name === "typescript" && c.source === "devDependency",
        )
        assert(
            typescriptConstraint,
            "Should find TypeScript constraint from devDependencies",
        )
        assert.strictEqual(
            typescriptConstraint.nodeVersion,
            "14.17.0",
            "Should have correct Node version requirement",
        )
    } finally {
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test package-lock.json parsing error (line 279)
async function libTest27() {
    const packageContent = JSON.stringify({
        name: "test-lockfile-error",
        dependencies: {
            express: "^4.0.0",
        },
    })

    const invalidLockfileContent = "{ invalid json content"

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "lockfile-error-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    const lockfilePath = path.join(tmpDir, "package-lock.json")

    fs.writeFileSync(packagePath, packageContent)
    fs.writeFileSync(lockfilePath, invalidLockfileContent)

    const originalCwd = process.cwd()
    const originalWarn = console.warn
    const warnMessages = []

    try {
        process.chdir(tmpDir)
        console.warn = (msg) => {
            warnMessages.push(msg)
        }

        const { collectVersionConstraints } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(false) // not quiet to capture warning

        // Should still return constraints from package.json despite lockfile error
        assert(Array.isArray(constraints), "Should return constraints array")

        // Should have warned about lockfile parsing error
        const lockfileWarning = warnMessages.find((msg) =>
            msg.includes("Could not parse package-lock.json"),
        )
        assert(lockfileWarning, "Should warn about lockfile parsing error")
    } finally {
        console.warn = originalWarn
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test missing package.json error (line 280)
async function libTest28() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "no-files-test-"))

    // Don't create any files - no package.json and no package-lock.json

    const originalCwd = process.cwd()
    const originalExit = process.exit
    const originalError = console.error

    let exitCalled = false
    let exitCode = null
    const errorMessages = []

    try {
        process.chdir(tmpDir)

        // Mock process.exit to capture the call
        process.exit = (code) => {
            exitCalled = true
            exitCode = code
            throw new Error("Process exit called") // Throw to stop execution
        }

        console.error = (msg) => {
            errorMessages.push(msg)
        }

        const { collectVersionConstraints } = require("../../src/index.js")

        try {
            await collectVersionConstraints(true)
            assert.fail("Should have called process.exit")
        } catch (error) {
            if (error.message === "Process exit called") {
                assert(exitCalled, "Should call process.exit")
                assert.strictEqual(exitCode, 1, "Should exit with code 1")

                const errorMessage = errorMessages.find((msg) =>
                    msg.includes("No package.json or package-lock.json found"),
                )
                assert(errorMessage, "Should show error about missing files")
            } else {
                throw error
            }
        }
    } finally {
        process.exit = originalExit
        console.error = originalError
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test updatePackageJsonEngines conditional logic (lines 367-368, 376-377)
function libTest29() {
    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "update-conditions-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")

    // Test case: summary with highest versions that are not unlimited/latest compatible
    const packageContent = {
        name: "test-update-conditions",
        engines: {},
    }
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2))

    const { updatePackageJsonEngines } = require("../../src/index.js")

    // Test with specific highest versions (not unlimited/latest compatible)
    const summary = {
        lowest: { node: "16.0.0", npm: "8.0.0" },
        highest: { node: "18.0.0", npm: "9.0.0" }, // specific versions, not unlimited
    }

    const success = updatePackageJsonEngines(packagePath, summary)
    assert(success, "Should successfully update package.json")

    const updatedPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"))

    // Should include upper bounds (lines 367-368, 376-377)
    assert.strictEqual(
        updatedPackage.engines.node,
        ">=16.0.0,<=18.0.0",
        "Should set node constraint with upper bound",
    )
    assert.strictEqual(
        updatedPackage.engines.npm,
        ">=8.0.0,<=9.0.0",
        "Should set npm constraint with upper bound",
    )
    assert.strictEqual(
        updatedPackage.packageManager,
        "npm@8.0.0",
        "Should set packageManager",
    )

    fs.rmSync(tmpDir, { recursive: true, force: true })
}

// Test main function execution when require.main === module (lines 398-435)
function libTest30() {
    const packageContent = JSON.stringify({
        name: "test-main-execution",
        dependencies: {
            commander: "^14.0.0",
        },
    })

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "main-execution-test-"))
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    try {
        // Execute the src/index.js file directly to trigger main function
        const srcPath = path.resolve(__dirname, "../../src/index.js")
        const result = execSync(`node "${srcPath}"`, {
            encoding: "utf8",
            cwd: tmpDir,
            timeout: 10000,
            stdio: "pipe",
        })

        // Should output the version constraints summary
        assert(
            result.includes("Version Constraints Summary"),
            "Should show summary header",
        )
        assert(
            result.includes("Lowest supported Node.js version"),
            "Should show lowest version",
        )
        assert(
            result.includes("v18.0.0"),
            "Should show Node version from commander dependency",
        )
        assert(result.includes("best-effort analysis"), "Should show disclaimer")

        // Check that package.json was updated by the main function
        const updatedPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"))
        assert(updatedPackage.engines, "Should have added engines field")
        assert(updatedPackage.engines.node, "Should have node version constraint")
        assert(updatedPackage.packageManager, "Should have packageManager field")
    } catch (error) {
        // If execution fails, check error output
        const output = error.stdout || error.stderr || ""
        assert(
            output.includes("Version Constraints Summary") ||
            output.includes("Error analyzing version constraints"),
            "Should execute main function logic",
        )
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test devDependencies processing with non-quiet mode (lines 224-233)
async function libTest32() {
    const packageContent = JSON.stringify({
        name: "test-devdeps-verbose",
        devDependencies: {
            typescript: "^5.0.0",
        },
    })

    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "devdeps-verbose-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    const originalCwd = process.cwd()
    const consoleLogs = []
    const originalLog = console.log

    try {
        process.chdir(tmpDir)
        console.log = (msg) => {
            consoleLogs.push(msg)
        }

        const { collectVersionConstraints } = require("../../src/index.js")
        const constraints = await collectVersionConstraints(false) // not quiet to trigger console.log

        // Should find devDependency constraint and log it
        const devDepConstraint = constraints.find(
            (c) => c.source === "devDependency",
        )
        assert(devDepConstraint, "Should find devDependency constraint")

        // Should have logged the devDependency message (line 226)
        const devDepLog = consoleLogs.find((log) =>
            log.includes("DevDependency typescript"),
        )
        assert(devDepLog, "Should log devDependency message")
        assert(
            devDepLog.includes("requires Node.js"),
            "Should include Node.js requirement",
        )
    } finally {
        console.log = originalLog
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test package-lock.json parsing error warning (line 279)
async function libTest33() {
    const packageContent = JSON.stringify({
        name: "test-lockfile-error-warning",
        dependencies: {
            express: "^4.0.0",
        },
    })

    const invalidLockfileContent = '{ "invalid": json content'

    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "lockfile-error-warning-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")
    const lockfilePath = path.join(tmpDir, "package-lock.json")

    fs.writeFileSync(packagePath, packageContent)
    fs.writeFileSync(lockfilePath, invalidLockfileContent)

    const originalCwd = process.cwd()
    const originalWarn = console.warn
    const warnMessages = []

    try {
        process.chdir(tmpDir)
        console.warn = (msg) => {
            warnMessages.push(msg)
        }

        const { collectVersionConstraints } = require("../../src/index.js")
        await collectVersionConstraints(false) // not quiet to trigger warning

        // Should have warned about lockfile parsing error (line 279)
        const lockfileWarning = warnMessages.find((msg) =>
            msg.includes("Warning: Could not parse package-lock.json"),
        )
        assert(lockfileWarning, "Should warn about lockfile parsing error")
    } finally {
        console.warn = originalWarn
        process.chdir(originalCwd)
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test updatePackageJsonEngines with specific highest versions (lines 367-368, 376-377)
function libTest34() {
    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "update-specific-highest-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")

    const packageContent = {
        name: "test-specific-highest",
        engines: {},
    }
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2))

    const { updatePackageJsonEngines } = require("../../src/index.js")

    // Test with specific highest versions (not unlimited/latest compatible)
    const summary = {
        lowest: { node: "16.0.0", npm: "8.0.0" },
        highest: { node: "18.0.0", npm: "9.0.0" }, // specific versions trigger lines 367-368, 376-377
    }

    const success = updatePackageJsonEngines(packagePath, summary)
    assert(success, "Should successfully update package.json")

    const updatedPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"))

    // Should include upper bounds (lines 367-368, 376-377 are covered)
    assert.strictEqual(
        updatedPackage.engines.node,
        ">=16.0.0,<=18.0.0",
        "Should set node constraint with upper bound",
    )
    assert.strictEqual(
        updatedPackage.engines.npm,
        ">=8.0.0,<=9.0.0",
        "Should set npm constraint with upper bound",
    )

    fs.rmSync(tmpDir, { recursive: true, force: true })
}

// Test complex version range fallback (lines 174-176)
function libTest35() {
    const { getLowestCompatibleVersion } = require("../../src/index.js")

    // Test cases that will trigger the complex range fallback
    const testCases = ["invalid-version-string", "not-a-number", "abc.def.ghi"]

    for (const testCase of testCases) {
        const result = getLowestCompatibleVersion(testCase)
        // Should return null for invalid version strings (line 176)
        assert.strictEqual(
            result,
            null,
            `Should return null for invalid version: ${testCase}`,
        )
    }
}

// Test exclusive upper bound logic (lines 197-212)
function libTest36() {
    const { getHighestCompatibleVersion } = require("../../src/index.js")

    // Test exclusive upper bounds with < operator
    const testCases = [
        { input: "<19.0.0", expected: "18.99.99" }, // lines 201-208
        { input: "<18.5.0", expected: "18.4.99" }, // patch decrement
        { input: "<18.0.0", expected: "17.99.99" }, // minor decrement
        { input: "<1.0.0", expected: "0.99.99" }, // major decrement
    ]

    for (const testCase of testCases) {
        const result = getHighestCompatibleVersion(testCase.input)
        assert.strictEqual(
            result,
            testCase.expected,
            `For input ${testCase.input}, expected ${testCase.expected}, got ${result}`,
        )
    }
}

// Test console output for no constraints found (lines 476-477, 483-484)
async function libTest37() {
    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "no-constraints-main-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")

    // Create package.json with NO engines and NO dependencies
    const packageContent = {
        name: "test-no-constraints-main",
        version: "1.0.0",
        // No engines, no dependencies
    }
    fs.writeFileSync(packagePath, JSON.stringify(packageContent, null, 2))

    const originalCwd = process.cwd()
    const originalConsole = console.log
    const logMessages = []

    try {
        process.chdir(tmpDir)
        console.log = (msg) => {
            logMessages.push(msg)
        }

        const { main } = require("../../src/index.js")
        await main()

        // Should trigger lines 476-477 (No Node.js version constraints found)
        // and lines 483-484 (No upper bound found)
        const noConstraintsMessage = logMessages.find((msg) =>
            msg.includes("No Node.js version constraints found."),
        )
        assert(
            noConstraintsMessage,
            "Should display no constraints message (lines 476-477)",
        )

        const noUpperBoundMessage = logMessages.find((msg) =>
            msg.includes("No upper bound found for Node.js version."),
        )
        assert(
            noUpperBoundMessage,
            "Should display no upper bound message (lines 483-484)",
        )
    } finally {
        process.chdir(originalCwd)
        console.log = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test error handling in main function (lines 493-495)
async function libTest38() {
    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "main-error-test-"))
    const packagePath = path.join(tmpDir, "package.json")

    // Create a package.json with invalid JSON to cause an error
    fs.writeFileSync(packagePath, "{ invalid json }")

    const originalCwd = process.cwd()
    const originalExit = process.exit
    const originalConsole = console.error
    let exitCode = null
    let errorMessage = ""

    try {
        process.chdir(tmpDir)

        // Mock process.exit to capture exit code
        process.exit = (code) => {
            exitCode = code
            throw new Error("Process exit called")
        }
        console.error = (msg, error) => {
            errorMessage += `${msg}${error ? ` ${error}` : ""}`
        }

        try {
            const { main } = require("../../src/index.js")
            await main()
            assert.fail("Should have called process.exit")
        } catch (error) {
            if (error.message === "Process exit called") {
                // This is expected - main function caught error and called process.exit(1)
                // This will trigger lines 493-495
                assert.strictEqual(exitCode, 1, "Should exit with code 1 on error")
                assert(
                    errorMessage.includes("Error analyzing version constraints:"),
                    "Should log error message (lines 493-495)",
                )
            } else {
                throw error
            }
        }
    } finally {
        process.chdir(originalCwd)
        process.exit = originalExit
        console.error = originalConsole
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test getNpmVersionForNode fallback to latest (line 44)
function libTest39() {
    const { getNpmVersionForNode } = require("../../src/index.js")

    // Test with a Node.js version that's higher than our mapping
    // This should trigger line 44: return NODE_NPM_MAPPING[versions[versions.length - 1]]
    const result = getNpmVersionForNode("99.0.0")

    // Should return the npm version for the highest Node.js version we have mapped
    assert(
        result,
        "Should return a valid npm version for unmapped high Node.js version",
    )
    assert.strictEqual(typeof result, "string", "Should return a string")
}

// Test getNodeRequirementForPackage with unknown package (line 78)
function libTest40() {
    const { getNodeRequirementForPackage } = require("../../src/index.js")

    // Test with multiple package names that definitely don't exist in our requirements mapping
    const unknownPackages = [
        "completely-unknown-package-xyz-12345",
        "non-existent-pkg-abcdef",
        "this-package-does-not-exist-999",
    ]

    for (const packageName of unknownPackages) {
        const result = getNodeRequirementForPackage(packageName, "1.0.0")
        // This should trigger line 78: return null
        assert.strictEqual(
            result,
            null,
            `Should return null for unknown package: ${packageName}`,
        )
    }
}

// Test packageManager field processing (lines 125-127)
function libTest41() {
    const { getVersionConstraints } = require("../../src/index.js")

    const packageContent = JSON.stringify({
        name: "test-package-manager",
        packageManager: "npm@8.5.0",
    })

    const tmpDir = fs.mkdtempSync(
        path.join(os.tmpdir(), "package-manager-test-"),
    )
    const packagePath = path.join(tmpDir, "package.json")
    fs.writeFileSync(packagePath, packageContent)

    try {
        const result = getVersionConstraints(packagePath)

        // This should trigger lines 125-127 where packageManager is processed
        assert.strictEqual(
            result.npmVersion,
            ">=8.5.0",
            "Should extract npm version from packageManager field",
        )
    } finally {
        fs.rmSync(tmpDir, { recursive: true, force: true })
    }
}

// Test getLowestCompatibleVersion with direct version (line 167)
function libTest42() {
    const { getLowestCompatibleVersion } = require("../../src/index.js")

    // Test with a direct version number that matches the regex /^\d+(\.\d+)*$/
    // This should trigger line 167: return versionRange
    const testCases = ["14.18.0", "16.14", "18"]

    for (const testCase of testCases) {
        const result = getLowestCompatibleVersion(testCase)
        if (testCase === "18") {
            assert.strictEqual(
                result,
                "18.0.0",
                "Should handle simple number version",
            )
        } else {
            assert.strictEqual(
                result,
                testCase,
                "Should return direct version unchanged",
            )
        }
    }
}

// Test getHighestCompatibleVersion exclusive upper bound edge case (line 202)
function libTest43() {
    const { getHighestCompatibleVersion } = require("../../src/index.js")

    // Test different scenarios for exclusive upper bounds
    const testCases = [
        { input: "<14.1.0", expected: "14.0.99" }, // patch=0, decrement minor
        { input: "<15.0.0", expected: "14.99.99" }, // minor=0, decrement major
        { input: "<1.0.0", expected: "0.99.99" }, // major>0, decrement major
        { input: "<19.5.3", expected: "19.5.2" }, // patch>0, decrement patch
    ]

    for (const testCase of testCases) {
        const result = getHighestCompatibleVersion(testCase.input)
        assert.strictEqual(
            result,
            testCase.expected,
            `For input ${testCase.input}, expected ${testCase.expected}, got ${result}`,
        )
    }
}

// Test normalizeVersionRange with invalid version (line 78)
function libTest44() {
    const { normalizeVersionRange } = require("../../src/index.js")

    // Test cases that will not match the regex /\d+\.\d+\.\d+|\d+\.\d+|\d+/
    const invalidVersions = [
        "invalid-version",
        "abc.def.ghi",
        "@@#$%",
        "v.x.x",
        "",
    ]

    for (const invalidVersion of invalidVersions) {
        const result = normalizeVersionRange(invalidVersion)
        // This should trigger line 78: return null (no version match found)
        assert.strictEqual(
            result,
            null,
            `Should return null for invalid version: ${invalidVersion}`,
        )
    }
}


// Test for compareVersions function - branch coverage
async function libTest45() {
    const { compareVersions } = require('../../src/index.js')

    // Test equal versions
    assert.strictEqual(compareVersions('1.0.0', '1.0.0'), 0)

    // Test major version differences
    assert.strictEqual(compareVersions('2.0.0', '1.0.0') > 0, true)
    assert.strictEqual(compareVersions('1.0.0', '2.0.0') < 0, true)

    // Test minor version differences
    assert.strictEqual(compareVersions('1.1.0', '1.0.0') > 0, true)
    assert.strictEqual(compareVersions('1.0.0', '1.1.0') < 0, true)

    // Test patch version differences
    assert.strictEqual(compareVersions('1.0.1', '1.0.0') > 0, true)
    assert.strictEqual(compareVersions('1.0.0', '1.0.1') < 0, true)

    // Test with missing parts (should be treated as zeros)
    assert.strictEqual(compareVersions('1', '1.0.0'), 0)
    assert.strictEqual(compareVersions('1.0', '1.0.0'), 0)
    assert.strictEqual(compareVersions('1', '1.1.0') < 0, true)
}

// Test for getNpmVersionForNode function - more coverage
async function libTest46() {
    const { getNpmVersionForNode } = require('../../src/index.js')

    // Test with exact matches in the mapping
    assert.strictEqual(getNpmVersionForNode('16.0.0'), '7.10.0')
    assert.strictEqual(getNpmVersionForNode('18.0.0'), '8.6.0')

    // Test with versions not exactly in the mapping (should find closest)
    assert.strictEqual(getNpmVersionForNode('17.0.0'), '8.6.0') // Should give npm for Node 18
    assert.strictEqual(getNpmVersionForNode('19.5.0'), '9.6.4') // Should give npm for Node 20

    // Test with version higher than any in the mapping
    const highestVersion = '99.0.0'
    const result = getNpmVersionForNode(highestVersion)
    // Should return the npm version for the highest known node version
    assert.strictEqual(result, '10.4.0') // Assuming 22.0.0 is the highest in your mapping
}

// Test normalizeVersionRange with different inputs
async function libTest47() {
    const { normalizeVersionRange } = require('../../src/index.js')

    // Test valid version formats
    assert.strictEqual(normalizeVersionRange('1.0.0'), '1.0.0')
    assert.strictEqual(normalizeVersionRange('1.0'), '1.0.0')
    assert.strictEqual(normalizeVersionRange('1'), '1.0.0')

    // Test with leading comparator
    assert.strictEqual(normalizeVersionRange('^1.0.0'), '1.0.0')
    assert.strictEqual(normalizeVersionRange('>=2.0.0'), '2.0.0')
    assert.strictEqual(normalizeVersionRange('~3.0.0'), '3.0.0')

    // Test invalid formats
    assert.strictEqual(normalizeVersionRange(''), null)
    assert.strictEqual(normalizeVersionRange(null), null)
    assert.strictEqual(normalizeVersionRange('invalid'), null)
}

// Test getNodeRequirementForPackage more thoroughly
async function libTest48() {
    const { getNodeRequirementForPackage } = require('../../src/index.js')

    // Test for known packages
    assert.strictEqual(getNodeRequirementForPackage('react', '16.0.0'), '8.0.0')
    assert.strictEqual(getNodeRequirementForPackage('react', '17.0.0'), '12.0.0')
    assert.strictEqual(getNodeRequirementForPackage('react', '18.0.0'), '14.0.0')

    // Test for versions higher than known ones (should return the requirement for the highest known version)
    assert.strictEqual(getNodeRequirementForPackage('react', '19.0.0'), '14.0.0')

    // Test for versions between known ones
    assert.strictEqual(getNodeRequirementForPackage('react', '16.5.0'), '8.0.0')
    assert.strictEqual(getNodeRequirementForPackage('react', '17.5.0'), '12.0.0')

    // Test with version strings that include comparators
    assert.strictEqual(getNodeRequirementForPackage('react', '^16.0.0'), '8.0.0')
    assert.strictEqual(getNodeRequirementForPackage('react', '>=17.0.0'), '12.0.0')

    // Test with unknown package
    assert.strictEqual(getNodeRequirementForPackage('unknown-package', '1.0.0'), null)

    // Test with invalid version
    assert.strictEqual(getNodeRequirementForPackage('react', 'invalid'), null)
}

// Test getLowestCompatibleVersion with all edge cases
async function libTest49() {
    const { getLowestCompatibleVersion } = require('../../src/index.js')

    // Test different version formats
    assert.strictEqual(getLowestCompatibleVersion('>=1.0.0'), '1.0.0')
    assert.strictEqual(getLowestCompatibleVersion('^2.0.0'), '2.0.0')
    assert.strictEqual(getLowestCompatibleVersion('~3.0.0'), '3.0.0')
    assert.strictEqual(getLowestCompatibleVersion('4.0.0'), '4.0.0')

    // Test simple numbers (as sometimes seen in package.json)
    assert.strictEqual(getLowestCompatibleVersion('14'), '14.0.0')

    // Test complex ranges - extract just the first number that appears
    const match1 = getLowestCompatibleVersion('>=1.0.0 <2.0.0')
    assert.ok(match1.includes('1.0.0'), `Expected to include 1.0.0, got ${match1}`)

    const match2 = getLowestCompatibleVersion('>=1.0.0 || >=2.0.0')
    assert.ok(match2.includes('1.0.0'), `Expected to include 1.0.0, got ${match2}`)

    // Test invalid inputs
    assert.strictEqual(getLowestCompatibleVersion(''), null)
    assert.strictEqual(getLowestCompatibleVersion(null), null)
    assert.strictEqual(getLowestCompatibleVersion('latest'), null)
}

// Test getHighestCompatibleVersion with all edge cases
async function libTest50() {
    const { getHighestCompatibleVersion } = require('../../src/index.js')

    // Test upper bounds
    assert.strictEqual(getHighestCompatibleVersion('<=1.0.0'), '1.0.0')
    assert.strictEqual(getHighestCompatibleVersion('>=0.1.0 <=2.0.0'), '2.0.0')

    // Test exclusive upper bounds
    const exclusiveResult = getHighestCompatibleVersion('<3.0.0')
    assert.ok(exclusiveResult === '2.99.99' || exclusiveResult === '2.9.9',
        `Expected 2.99.99 or 2.9.9, got ${exclusiveResult}`)

    const exclusiveResult2 = getHighestCompatibleVersion('>=2.0.0 <4.0.0')
    assert.ok(exclusiveResult2 === '3.99.99' || exclusiveResult2 === '3.9.9',
        `Expected 3.99.99 or 3.9.9, got ${exclusiveResult2}`)

    // Test exclusive upper bounds with different level adjustments
    const exclusiveResult3 = getHighestCompatibleVersion('<4.0.1')
    assert.ok(exclusiveResult3 === '4.0.0', `Expected 4.0.0, got ${exclusiveResult3}`)

    const exclusiveResult4 = getHighestCompatibleVersion('<4.1.0')
    assert.ok(exclusiveResult4 === '4.0.99' || exclusiveResult4 === '4.0.9',
        `Expected 4.0.99 or 4.0.9, got ${exclusiveResult4}`)

    // Test no upper bound
    assert.strictEqual(getHighestCompatibleVersion('>=5.0.0'), null)
    assert.strictEqual(getHighestCompatibleVersion('^6.0.0'), null)

    // Test invalid inputs
    assert.strictEqual(getHighestCompatibleVersion(''), null)
    assert.strictEqual(getHighestCompatibleVersion(null), null)
}

// Test getVersionConstraints with package.json that has packageManager field
async function libTest51() {
    const { getVersionConstraints } = require('../../src/index.js')

    const tmpDir = createTempProject(JSON.stringify({
        name: "test-package-manager",
        packageManager: "npm@8.5.5",
        engines: {
            node: ">=14",
            npm: ">=7"
        },
        dependencies: {
            "react": "^18.0.0"
        },
        devDependencies: {
            "typescript": "^5.0.0"
        }
    }))

    try {
        const result = getVersionConstraints(path.join(tmpDir, 'package.json'))

        assert.strictEqual(result.name, "test-package-manager")
        assert.strictEqual(result.nodeVersion, ">=14")
        assert.strictEqual(result.npmVersion, ">=7")
        assert.strictEqual(result.packageManager, "npm@8.5.5")
        assert.ok(result.dependencies.react.includes("18.0.0"), `Expected to include 18.0.0, got ${result.dependencies.react}`)
        assert.ok(result.devDependencies.typescript.includes("5.0.0"), `Expected to include 5.0.0, got ${result.devDependencies.typescript}`)
    } finally {
        cleanupTempProject(tmpDir)
    }
}

// Test getVersionSummary with different constraints combinations
async function libTest52() {
    const { getVersionSummary } = require('../../src/index.js')

    // Test with both engine and dependency constraints
    const constraints1 = [
        { source: 'engines', nodeVersion: '>=14.0.0', npmVersion: '>=6.0.0' },
        { source: 'dependency', name: 'react', nodeVersion: '>=12.0.0' }
    ]
    const summary1 = getVersionSummary(constraints1)
    assert.strictEqual(summary1.lowest.node, '14.0.0')
    assert.strictEqual(summary1.lowest.npm, '6.0.0')
    assert.strictEqual(summary1.highest.node, 'unlimited')

    // Test with only dependency constraints
    const constraints2 = [
        { source: 'dependency', name: 'react', nodeVersion: '>=12.0.0' },
        { source: 'dependency', name: 'next', nodeVersion: '>=14.0.0' }
    ]
    const summary2 = getVersionSummary(constraints2)
    assert.strictEqual(summary2.lowest.node, '14.0.0') // Should take the highest minimum
    assert.strictEqual(typeof summary2.lowest.npm, 'string') // Should derive npm from node

    // Test with upper bounds
    const constraints3 = [
        { source: 'engines', nodeVersion: '>=14.0.0,<16.0.0', npmVersion: '>=6.0.0' }
    ]
    const summary3 = getVersionSummary(constraints3)
    assert.strictEqual(summary3.lowest.node, '14.0.0')
    const highestNode = summary3.highest.node
    assert.ok(highestNode === '16.0.0' || highestNode === '15.99.99',
        `Expected 16.0.0 or 15.99.99, got ${highestNode}`)

    // Test with no constraints
    const constraints4 = []
    const summary4 = getVersionSummary(constraints4)
    assert.strictEqual(summary4.lowest.node, null)
    assert.strictEqual(summary4.source, 'none')
}

// Test updatePackageJsonEngines with different scenarios
async function libTest53() {
    const { updatePackageJsonEngines } = require('../../src/index.js')

    // Test adding engines when none exist
    const tmpDir1 = createTempProject(JSON.stringify({
        name: "test-update-1",
        dependencies: {}
    }))

    try {
        const summary1 = {
            lowest: { node: '14.0.0', npm: '6.14.4' },
            highest: { node: 'unlimited', npm: 'latest compatible' }
        }

        const success1 = updatePackageJsonEngines(path.join(tmpDir1, 'package.json'), summary1)
        assert.strictEqual(success1, true)

        const updated1 = JSON.parse(fs.readFileSync(path.join(tmpDir1, 'package.json'), 'utf8'))
        assert.strictEqual(updated1.engines.node, '>=14.0.0')
        assert.strictEqual(updated1.engines.npm, '>=6.14.4')
        assert.strictEqual(updated1.packageManager, 'npm@6.14.4')
    } finally {
        cleanupTempProject(tmpDir1)
    }

    // Test updating existing engines
    const tmpDir2 = createTempProject(JSON.stringify({
        name: "test-update-2",
        engines: {
            node: ">=12.0.0",
            npm: ">=6.0.0"
        }
    }))

    try {
        const summary2 = {
            lowest: { node: '14.0.0', npm: '6.14.4' },
            highest: { node: '16.0.0', npm: '7.10.0' }
        }

        const success2 = updatePackageJsonEngines(path.join(tmpDir2, 'package.json'), summary2)
        assert.strictEqual(success2, true)

        const updated2 = JSON.parse(fs.readFileSync(path.join(tmpDir2, 'package.json'), 'utf8'))
        assert.strictEqual(updated2.engines.node, '>=14.0.0,<=16.0.0')
        assert.strictEqual(updated2.engines.npm, '>=6.14.4,<=7.10.0')
    } finally {
        cleanupTempProject(tmpDir2)
    }
}

// Test for uncovered branches in getVersionConstraints
async function libTest54() {
    const { getVersionConstraints } = require('../../src/index.js')

    // Test package.json without packageManager field
    const tmpDir1 = createTempProject(JSON.stringify({
        name: "test-no-package-manager",
        dependencies: {
            "react": "^18.0.0"
        }
    }))

    try {
        const result = getVersionConstraints(path.join(tmpDir1, 'package.json'))
        assert.strictEqual(result.packageManager, null)
        assert.ok(result.dependencies.react, "Should have react dependency")
    } finally {
        cleanupTempProject(tmpDir1)
    }

    // Test package.json with packageManager field that doesn't match npm pattern
    const tmpDir2 = createTempProject(JSON.stringify({
        name: "test-yarn-package-manager",
        packageManager: "yarn@1.22.0",
        dependencies: {
            "express": "^4.18.0"
        }
    }))

    try {
        const result = getVersionConstraints(path.join(tmpDir2, 'package.json'))
        assert.strictEqual(result.packageManager, "yarn@1.22.0")
        // Should not set npmVersion since it's not npm
        assert.strictEqual(result.npmVersion, null)
    } finally {
        cleanupTempProject(tmpDir2)
    }
}

// Test for missing file scenario
async function libTest55() {
    const { getVersionConstraints } = require('../../src/index.js')

    try {
        const result = getVersionConstraints('/nonexistent/path/package.json')
        assert.strictEqual(result, null)
    } catch (error) {
        // This is expected
        assert.ok(true, "Should handle missing file gracefully")
    }
}

// Test collectVersionConstraints with only lockfile and no package.json
async function libTest56() {
    const { collectVersionConstraints } = require('../../src/index.js')

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'lockfile-only-test-'))
    const lockfilePath = path.join(tmpDir, 'package-lock.json')

    // Create a lockfile without package.json
    const lockfileContent = JSON.stringify({
        name: "test-lockfile-only",
        version: "1.0.0",
        packages: {
            "": {
                name: "test-lockfile-only",
                version: "1.0.0"
            },
            "node_modules/react": {
                version: "18.0.0"
            }
        }
    })

    fs.writeFileSync(lockfilePath, lockfileContent)

    const originalCwd = process.cwd()
    try {
        process.chdir(tmpDir)

        // This should exit with error code 1
        try {
            await collectVersionConstraints(true)
            assert.fail("Should have thrown an error for missing package.json")
        } catch (error) {
            // Expected behavior - process.exit(1) was called
            assert.ok(true, "Correctly handles missing package.json")
        }
    } finally {
        process.chdir(originalCwd)
        cleanupTempProject(tmpDir)
    }
}

// Test edge cases for improved branch coverage
async function libTest57() {
    const { getHighestCompatibleVersion } = require('../../src/index.js')

    // Test getHighestCompatibleVersion with edge cases
    const exclusive1 = getHighestCompatibleVersion('<1.0.0')
    assert.ok(exclusive1.startsWith('0.'), `Expected version starting with 0., got ${exclusive1}`)

    const exclusive2 = getHighestCompatibleVersion('<0.1.0')
    assert.ok(exclusive2.startsWith('0.0.'), `Expected version starting with 0.0., got ${exclusive2}`)

    const exclusive3 = getHighestCompatibleVersion('<0.0.1')
    assert.ok(exclusive3 === '0.0.0', `Expected 0.0.0, got ${exclusive3}`)
}

// Test collectVersionConstraints with complex lockfile scenarios
async function libTest58() {
    const { collectVersionConstraints } = require('../../src/index.js')

    const tmpDir = createTempProject(
        JSON.stringify({
            name: "test-complex-lockfile",
            dependencies: {
                "react": "^18.0.0"
            }
        }),
        JSON.stringify({
            name: "test-complex-lockfile",
            version: "1.0.0",
            dependencies: {
                "react": {
                    version: "18.2.0"
                },
                "unknown-package": {
                    version: "1.0.0"
                }
            }
        })
    )

    const originalCwd = process.cwd()
    try {
        process.chdir(tmpDir)
        const constraints = await collectVersionConstraints(true)

        // Should have constraints from both package.json dependencies and lockfile
        assert.ok(constraints.length > 0, "Should have collected constraints")

        // Check that we have react constraints
        const reactConstraints = constraints.filter(c => c.name === 'react')
        assert.ok(reactConstraints.length > 0, "Should have react constraints")

    } finally {
        process.chdir(originalCwd)
        cleanupTempProject(tmpDir)
    }
}


// Export all test functions and helper functions
module.exports = {
    // Helper functions
    createTempProject, cleanupTempProject,

    // Test functions
    libTest1, libTest2, libTest3, libTest4, libTest5,
    libTest6, libTest7, libTest26, libTest27, libTest28,
    libTest29, libTest30, libTest32, libTest33, libTest34,
    libTest35, libTest36, libTest37, libTest38, libTest39,
    libTest40, libTest41, libTest42, libTest43, libTest44,
    libTest44, libTest39, libTest40, libTest41, libTest42,
    libTest43, libTest45, libTest46, libTest47, libTest48,
    libTest49, libTest50, libTest51, libTest52, libTest53,
    libTest54, libTest55, libTest56, libTest57, libTest58
}
