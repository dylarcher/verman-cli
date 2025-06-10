#!/usr/bin/env node
"use strict"

const path = require('path')
const { Command } = require('commander')
const fs = require('fs')
const readline = require('readline')

// Check if commander is installed, if not suggest installing it
try {
    require.resolve('commander')
} catch (e) {
    console.error('Error: This tool requires the "commander" package.')
    console.error('Please install it using: npm install commander')
    process.exit(1)
}

// Import functionality from src/index.js
const {
    collectVersionConstraints,
    getVersionSummary,
    updatePackageJsonEngines
} = require('../src')

const program = new Command()

// Function to prompt user for input
function askQuestion(question) {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    })

    return new Promise((resolve) => {
        rl.question(question, (answer) => {
            rl.close()
            resolve(answer.trim().toLowerCase())
        })
    })
}

program
    .name('verlimit')
    .description('Analyze Node.js and npm version constraints of a project')
    .version('1.0.0')
    .option('-j, --json', 'Output results as JSON')
    .option('-q, --quiet', 'Only print the version numbers without explanations')
    .option('-p, --path <path>', 'Path to the project to analyze', process.cwd())

program.parse(process.argv)
const options = program.opts()

// Main function to run the CLI
async function run() {
    try {
        // Change to the specified directory if provided
        if (options.path && options.path !== process.cwd()) {
            process.chdir(options.path)
        }

        // Check if we're in a Node.js project
        const packageJsonPath = path.join(process.cwd(), 'package.json')
        if (!fs.existsSync(packageJsonPath)) {
            console.error('Error: No package.json found in the current directory.')
            console.error('Make sure you are in a Node.js project or specify a path with --path.')
            process.exit(1)
        }

        // Collect and analyze constraints
        const isQuietMode = options.json || options.quiet
        const constraints = await collectVersionConstraints(isQuietMode)
        const summary = getVersionSummary(constraints)

        // Output results based on options
        if (options.json) {
            console.log(JSON.stringify(summary, null, 2))
        } else if (options.quiet) {
            if (summary.lowest.node) {
                console.log(`node:${summary.lowest.node}|npm:${summary.lowest.npm}`)
            }
            if (summary.highest.node) {
                const highestNode = summary.highest.node === 'unlimited' ? 'latest' : summary.highest.node
                console.log(`node:${highestNode}|npm:${summary.highest.npm}`)
            }
        } else {
            console.log('\n=== Version Constraints Summary ===')

            if (summary.lowest.node) {
                console.log(`\nLowest supported Node.js version: v${summary.lowest.node}`)
                console.log(`Associated npm version: v${summary.lowest.npm}`)
            } else {
                console.log('\nNo Node.js version constraints found.')
            }

            if (summary.highest.node) {
                console.log(`\nHighest compatible Node.js version: ${summary.highest.node === 'unlimited' ? 'unlimited' : 'v' + summary.highest.node}`)
                console.log(`Associated npm version: ${summary.highest.npm}`)
            } else {
                console.log('\nNo upper bound found for Node.js version.')
            }

            console.log('\nNote: This is a best-effort analysis and may not capture all constraints.')
            console.log('For precise requirements, review each dependency\'s documentation.')

            // Prompt user to update package.json if we have constraints and not in quiet/json mode
            if (summary.lowest.node && summary.lowest.npm) {
                console.log('\n=== Update package.json ===')
                console.log('Would you like to update your package.json with these version constraints?')
                console.log('This will add/update the following:')

                const nodeConstraint = summary.highest.node && summary.highest.node !== 'unlimited'
                    ? `>=${summary.lowest.node},<=${summary.highest.node}`
                    : `>=${summary.lowest.node}`

                const npmConstraint = summary.highest.npm && summary.highest.npm !== 'latest compatible'
                    ? `>=${summary.lowest.npm},<=${summary.highest.npm}`
                    : `>=${summary.lowest.npm}`

                console.log(`  "engines": {`)
                console.log(`    "node": "${nodeConstraint}",`)
                console.log(`    "npm": "${npmConstraint}"`)
                console.log(`  },`)
                console.log(`  "packageManager": "npm@${summary.lowest.npm}"`)

                const answer = await askQuestion('\nProceed? (y/N): ')

                if (answer === 'y' || answer === 'yes') {
                    const success = updatePackageJsonEngines(packageJsonPath, summary)
                    if (success) {
                        console.log('\n✅ Successfully updated package.json!')
                    } else {
                        console.log('\n❌ Failed to update package.json. Please check the file permissions.')
                    }
                } else {
                    console.log('\nNo changes made to package.json.')
                }
            }
        }
    } catch (error) {
        console.error('Error:', error.message)
        process.exit(1)
    }
}

run()
