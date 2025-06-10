#!/usr/bin/env node

const fs = require("node:fs")
const path = require("node:path")
const { execSync } = require("node:child_process")

// Mapping of Node.js versions to their corresponding npm versions
// Source: https://nodejs.org/en/download/releases/
const NODE_NPM_MAPPING = {
    "4.0.0": "2.14.2",
    "6.0.0": "3.8.6",
    "8.0.0": "5.0.0",
    "10.0.0": "6.0.0",
    "12.0.0": "6.9.0",
    "14.0.0": "6.14.4",
    "16.0.0": "7.10.0",
    "18.0.0": "8.6.0",
    "20.0.0": "9.6.4",
    "21.0.0": "10.2.0",
    "22.0.0": "10.4.0",
}

// Common packages and their minimum Node.js version requirements
// This is a simplified mapping and should be expanded for real-world use
const PACKAGE_NODE_REQUIREMENTS = {
    react: { "16.0.0": "8.0.0", "17.0.0": "12.0.0", "18.0.0": "14.0.0" },
    next: {
        "10.0.0": "10.13.0",
        "11.0.0": "12.0.0",
        "12.0.0": "12.22.0",
        "13.0.0": "16.14.0",
        "14.0.0": "18.17.0",
    },
    express: { "4.0.0": "0.10.0", "5.0.0": "12.0.0" },
    commander: {
        "10.0.0": "14.0.0",
        "11.0.0": "16.0.0",
        "12.0.0": "16.0.0",
        "13.0.0": "16.0.0",
        "14.0.0": "18.0.0",
    },
    typescript: { "4.0.0": "10.0.0", "5.0.0": "14.17.0" },
    eslint: { "8.0.0": "12.22.0", "9.0.0": "18.18.0" },
    webpack: { "5.0.0": "10.13.0" },
    "node-fetch": { "3.0.0": "14.0.0" },
    axios: { "1.0.0": "14.0.0" },
}

// Function to get npm version for a Node.js version
function getNpmVersionForNode(nodeVersion) {
    // Find the closest version in our mapping
    const versions = Object.keys(NODE_NPM_MAPPING).sort((a, b) =>
        compareVersions(a, b),
    )

    for (const version of versions) {
        if (compareVersions(nodeVersion, version) <= 0) {
            return NODE_NPM_MAPPING[version]
        }
    }

    // If we can't find a match, return the latest known npm version
    return NODE_NPM_MAPPING[versions[versions.length - 1]]
}

// Simple semver comparison function
function compareVersions(a, b) {
    const partsA = a.split(".").map(Number)
    const partsB = b.split(".").map(Number)

    for (let i = 0; i < 3; i++) {
        const partA = partsA[i] || 0
        const partB = partsB[i] || 0
        if (partA !== partB) {
            return partA - partB
        }
    }

    return 0
}

// Function to normalize version ranges to a comparable format
function normalizeVersionRange(range) {
    // Handle common version range formats
    if (!range) return null

    const versionMatch = range.match(/\d+\.\d+\.\d+|\d+\.\d+|\d+/)

    if (versionMatch) {
        const version = versionMatch[0]
        // Ensure it's a proper semver with 3 parts
        const parts = version.split(".").map(Number)
        while (parts.length < 3) parts.push(0)
        return parts.join(".")
    }

    return null
}

// Function to get the minimum Node.js version required for a package and version
function getNodeRequirementForPackage(packageName, packageVersion) {
    // If we don't have info about this package, return null
    if (!PACKAGE_NODE_REQUIREMENTS[packageName]) {
        return null
    }

    // Normalize the version
    const normalizedVersion = normalizeVersionRange(packageVersion)
    if (!normalizedVersion) return null

    // Find the appropriate requirement
    const requirements = PACKAGE_NODE_REQUIREMENTS[packageName]
    const versions = Object.keys(requirements).sort((a, b) =>
        compareVersions(a, b),
    )

    // Find the highest package version that's less than or equal to our version
    let nodeRequirement = null
    for (const version of versions) {
        if (compareVersions(normalizedVersion, version) >= 0) {
            nodeRequirement = requirements[version]
        } else {
            break
        }
    }

    return nodeRequirement
}

// Function to parse package.json and extract version constraints
function getVersionConstraints(packagePath) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"))

        const result = {
            name: packageJson.name || "unknown",
            nodeVersion: packageJson.engines?.node || null,
            npmVersion: packageJson.engines?.npm || null,
            packageManager: packageJson.packageManager || null,
            dependencies: {},
            devDependencies: {},
        }

        // Process packageManager field if present
        if (result.packageManager) {
            const match = result.packageManager.match(/npm@(\d+\.\d+\.\d+)/)
            if (match) {
                result.npmVersion = result.npmVersion || `>=${match[1]}`
            }
        }

        // Process dependencies
        if (packageJson.dependencies) {
            for (const [name, version] of Object.entries(packageJson.dependencies)) {
                result.dependencies[name] = getLowestCompatibleVersion(version)
            }
        }

        // Process devDependencies
        if (packageJson.devDependencies) {
            for (const [name, version] of Object.entries(
                packageJson.devDependencies,
            )) {
                result.devDependencies[name] = getLowestCompatibleVersion(version)
            }
        }

        return result
    } catch (error) {
        console.error(
            `Error reading package.json at ${packagePath}:`,
            error.message,
        )
        return null
    }
}

// Function to get the lowest compatible version from a range
function getLowestCompatibleVersion(versionRange) {
    if (!versionRange) return null

    // Handle >= or ^ or ~ notation
    if (versionRange.startsWith(">=")) {
        return versionRange.substring(2).trim()
    }

    if (versionRange.startsWith("^") || versionRange.startsWith("~")) {
        return versionRange.substring(1).trim()
    }

    // Handle simple number like "14" (as seen in package.json for commander)
    if (/^\d+$/.test(versionRange)) {
        return `${versionRange}.0.0`
    }

    // Handle direct version
    if (/^\d+(\.\d+)*$/.test(versionRange)) {
        return versionRange
    }

    // For complex ranges, just extract the first version number
    const match = versionRange.match(/\d+\.\d+\.\d+|\d+\.\d+|\d+/)
    return match ? match[0] : null
}

// Function to get the highest compatible version from a range
function getHighestCompatibleVersion(versionRange) {
    if (!versionRange) return null

    // Handle ranges with upper bounds like ">=16.0.0,<=18.0.0"
    const upperBoundMatch = versionRange.match(/<=\s*(\d+(?:\.\d+){0,2})/)
    if (upperBoundMatch) {
        const version = upperBoundMatch[1]
        // Ensure it's a proper semver with 3 parts
        const parts = version.split(".").map(Number)
        while (parts.length < 3) parts.push(0)
        return parts.join(".")
    }

    // Handle ranges with < (exclusive upper bound)
    const exclusiveUpperMatch = versionRange.match(/<\s*(\d+(?:\.\d+){0,2})/)
    if (exclusiveUpperMatch) {
        const version = exclusiveUpperMatch[1]
        const parts = version.split(".").map(Number)
        while (parts.length < 3) parts.push(0)
        // For exclusive upper bound, subtract a minor version
        if (parts[2] > 0) {
            parts[2]--
        } else if (parts[1] > 0) {
            parts[1]--
            parts[2] = 99
        } else if (parts[0] > 0) {
            parts[0]--
            parts[1] = 99
            parts[2] = 99
        }
        return parts.join(".")
    }

    // No upper bound found
    return null
}

// Function to collect all version constraints
async function collectVersionConstraints(quiet = false) {
    const projectRoot = path.resolve(process.cwd())
    if (!quiet) console.log(`Analyzing project in ${projectRoot}...`)

    const constraints = []

    // Check for lockfile first
    const lockfilePath = path.join(projectRoot, "package-lock.json")
    const packageJsonPath = path.join(projectRoot, "package.json")

    let packageJsonData = null

    if (fs.existsSync(packageJsonPath)) {
        packageJsonData = getVersionConstraints(packageJsonPath)
        if (packageJsonData) {
            if (!quiet)
                console.log(
                    `Project ${packageJsonData.name} analyzing dependencies...`,
                )

            // Add engine constraints if present
            if (packageJsonData.nodeVersion) {
                if (!quiet)
                    console.log(
                        `Found Node.js engine requirement: ${packageJsonData.nodeVersion}`,
                    )
                constraints.push({
                    name: packageJsonData.name,
                    nodeVersion: packageJsonData.nodeVersion,
                    npmVersion: packageJsonData.npmVersion,
                    source: "engines",
                })
            }

            // Process dependencies for Node.js version requirements
            for (const [name, version] of Object.entries(
                packageJsonData.dependencies,
            )) {
                const nodeRequirement = getNodeRequirementForPackage(name, version)
                if (nodeRequirement) {
                    if (!quiet)
                        console.log(
                            `Dependency ${name}@${version} requires Node.js ${nodeRequirement}`,
                        )
                    constraints.push({
                        name: name,
                        nodeVersion: nodeRequirement,
                        source: "dependency",
                    })
                }
            }

            // Process devDependencies for Node.js version requirements
            for (const [name, version] of Object.entries(
                packageJsonData.devDependencies,
            )) {
                const nodeRequirement = getNodeRequirementForPackage(name, version)
                if (nodeRequirement) {
                    if (!quiet)
                        console.log(
                            `DevDependency ${name}@${version} requires Node.js ${nodeRequirement}`,
                        )
                    constraints.push({
                        name: name,
                        nodeVersion: nodeRequirement,
                        source: "devDependency",
                    })
                }
            }
        }
    }

    if (fs.existsSync(lockfilePath)) {
        if (!quiet)
            console.log("Found package-lock.json, analyzing dependency tree...")
        try {
            const lockfileContent = JSON.parse(fs.readFileSync(lockfilePath, "utf8"))

            // Parse lockfile dependencies if it has a newer format (npm v7+)
            if (lockfileContent.packages) {
                for (const [pkgPath, pkgInfo] of Object.entries(
                    lockfileContent.packages,
                )) {
                    // Skip the root package
                    if (pkgPath === "") continue

                    const pkgName = pkgPath.split("/").pop()
                    if (pkgInfo.version) {
                        const nodeRequirement = getNodeRequirementForPackage(
                            pkgName,
                            pkgInfo.version,
                        )
                        if (nodeRequirement) {
                            if (!quiet)
                                console.log(
                                    `Dependency ${pkgName}@${pkgInfo.version} requires Node.js ${nodeRequirement}`,
                                )
                            constraints.push({
                                name: pkgName,
                                nodeVersion: nodeRequirement,
                                source: "lockfile",
                            })
                        }
                    }
                }
            }
            // For older npm lockfile formats (npm v6 and below)
            else if (lockfileContent.dependencies) {
                for (const [pkgName, pkgInfo] of Object.entries(
                    lockfileContent.dependencies,
                )) {
                    if (pkgInfo.version) {
                        const nodeRequirement = getNodeRequirementForPackage(
                            pkgName,
                            pkgInfo.version,
                        )
                        if (nodeRequirement) {
                            if (!quiet)
                                console.log(
                                    `Dependency ${pkgName}@${pkgInfo.version} requires Node.js ${nodeRequirement}`,
                                )
                            constraints.push({
                                name: pkgName,
                                nodeVersion: nodeRequirement,
                                source: "lockfile",
                            })
                        }
                    }
                }
            }
        } catch (error) {
            if (!quiet)
                console.warn(
                    `Warning: Could not parse package-lock.json: ${error.message}`,
                )
        }
    } else if (!packageJsonData) {
        console.error("No package.json or package-lock.json found!")
        process.exit(1)
    }

    return constraints
}

// Function to determine the version constraints summary
function getVersionSummary(constraints) {
    let lowestNodeVersion = null
    let highestNodeVersion = null
    let lowestNpmVersion = null
    let highestNpmVersion = null
    let sourceType = "none"

    // Group constraints by source
    const engineConstraints = constraints.filter(
        (c) => c.source === "engines" && (c.nodeVersion || c.npmVersion),
    )
    const dependencyConstraints = constraints.filter(
        (c) =>
            (c.source === "dependency" ||
                c.source === "devDependency" ||
                c.source === "lockfile") &&
            c.nodeVersion,
    )

    // Process ALL constraints (dependencies and engines) to find the highest minimum requirement
    const allConstraints = [...dependencyConstraints, ...engineConstraints]

    for (const constraint of allConstraints) {
        // Process Node.js constraints
        if (constraint.nodeVersion) {
            const lowestVersion = getLowestCompatibleVersion(constraint.nodeVersion)
            if (lowestVersion) {
                // Normalize to full semver
                const normalizedVersion = normalizeVersionRange(lowestVersion)
                if (normalizedVersion) {
                    // Update lowest version - we want the HIGHEST of the minimum versions
                    if (
                        !lowestNodeVersion ||
                        compareVersions(normalizedVersion, lowestNodeVersion) > 0
                    ) {
                        lowestNodeVersion = normalizedVersion
                        // Track which type of constraint provided the final minimum version
                        sourceType =
                            constraint.source === "engines" ? "engines" : "dependencies"
                    }

                    // Check for upper bounds
                    const highestVersion = getHighestCompatibleVersion(
                        constraint.nodeVersion,
                    )
                    if (highestVersion) {
                        const normalizedHighest = normalizeVersionRange(highestVersion)
                        if (normalizedHighest) {
                            // Update highest version - we want the LOWEST of the maximum versions
                            if (
                                !highestNodeVersion ||
                                compareVersions(normalizedHighest, highestNodeVersion) < 0
                            ) {
                                highestNodeVersion = normalizedHighest
                            }
                        }
                    }
                }
            }
        }

        // Process npm constraints from engines
        if (constraint.npmVersion && constraint.source === "engines") {
            const lowestNpmVer = getLowestCompatibleVersion(constraint.npmVersion)
            if (lowestNpmVer) {
                const normalizedNpmVer = normalizeVersionRange(lowestNpmVer)
                if (normalizedNpmVer) {
                    if (
                        !lowestNpmVersion ||
                        compareVersions(normalizedNpmVer, lowestNpmVersion) > 0
                    ) {
                        lowestNpmVersion = normalizedNpmVer
                    }
                }
            }

            const highestNpmVer = getHighestCompatibleVersion(constraint.npmVersion)
            if (highestNpmVer) {
                const normalizedHighestNpm = normalizeVersionRange(highestNpmVer)
                if (normalizedHighestNpm) {
                    if (
                        !highestNpmVersion ||
                        compareVersions(normalizedHighestNpm, highestNpmVersion) < 0
                    ) {
                        highestNpmVersion = normalizedHighestNpm
                    }
                }
            }
        }
    }

    // If no constraints at all, return fallback
    if (!lowestNodeVersion) {
        return {
            lowest: { node: null, npm: null },
            highest: { node: null, npm: null },
            source: "none",
        }
    }

    return {
        lowest: {
            node: lowestNodeVersion,
            npm:
                lowestNpmVersion ||
                (lowestNodeVersion ? getNpmVersionForNode(lowestNodeVersion) : null),
        },
        highest: {
            node: highestNodeVersion || "unlimited",
            npm:
                highestNpmVersion ||
                (highestNodeVersion
                    ? getNpmVersionForNode(highestNodeVersion)
                    : "latest compatible"),
        },
        source: sourceType,
    }
}

// Function to update package.json with engine constraints
function updatePackageJsonEngines(packageJsonPath, summary) {
    try {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

        // Initialize engines object if it doesn't exist
        if (!packageJson.engines) {
            packageJson.engines = {}
        }

        // Set node version constraint
        if (summary.lowest.node) {
            let nodeConstraint = `>=${summary.lowest.node}`
            if (summary.highest.node && summary.highest.node !== "unlimited") {
                nodeConstraint += `,<=${summary.highest.node}`
            }
            packageJson.engines.node = nodeConstraint
        }

        // Set npm version constraint
        if (summary.lowest.npm) {
            let npmConstraint = `>=${summary.lowest.npm}`
            if (summary.highest.npm && summary.highest.npm !== "latest compatible") {
                npmConstraint += `,<=${summary.highest.npm}`
            }
            packageJson.engines.npm = npmConstraint
        }

        // Set packageManager
        if (summary.lowest.npm) {
            packageJson.packageManager = `npm@${summary.lowest.npm}`
        }

        // Write back to file with proper formatting
        fs.writeFileSync(
            packageJsonPath,
            `${JSON.stringify(packageJson, null, 2)}\n`,
        )

        return true
    } catch (error) {
        console.error(`Error updating package.json: ${error.message}`)
        return false
    }
}

// Main function
async function main() {
    try {
        const constraints = await collectVersionConstraints()
        const summary = getVersionSummary(constraints)

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

        // Update package.json with the determined engine constraints
        const packageJsonPath = path.join(process.cwd(), "package.json")
        updatePackageJsonEngines(packageJsonPath, summary)
    } catch (error) {
        console.error("Error analyzing version constraints:", error)
        process.exit(1)
    }
}

// Only run the main function if this file is executed directly
if (require.main === module) {
    // Run the program
    main()
}

// Export functions for use in other modules
module.exports = {
    collectVersionConstraints,
    getVersionSummary,
    getNpmVersionForNode,
    compareVersions,
    normalizeVersionRange,
    getVersionConstraints,
    getLowestCompatibleVersion,
    getHighestCompatibleVersion,
    getNodeRequirementForPackage,
    updatePackageJsonEngines,
    main,
}
