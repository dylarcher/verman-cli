document.addEventListener("DOMContentLoaded", () => {
    const brilliantBlues = {
        darkBlue: "#000428",
        mediumBlue: "#004e92",
        brightBlue: "#4286f4",
        lightBlue: "#ade8f4",
        white: "#ffffff",
    }

    const wrapLabel = (str, maxLen = 16) => {
        if (typeof str !== "string" || str.length <= maxLen) {
            return str
        }
        const words = str.split(" ")
        const lines = []
        let currentLine = ""
        for (const word of words) {
            if (
                (`${currentLine} ${word}`).trim().length > maxLen &&
                currentLine.length > 0
            ) {
                lines.push(currentLine.trim())
                currentLine = word
            } else {
                currentLine = (`${currentLine} ${word}`).trim()
            }
        }
        if (currentLine) {
            lines.push(currentLine.trim());
        }
        return lines
    };

    const baseTooltipConfig = {
        callbacks: {
            title: (tooltipItems) => {
                const item = tooltipItems[0]
                if (!item) return ""
                const label = item.chart.data.labels[item.dataIndex]
                if (Array.isArray(label)) {
                    return label.join(" ")
                }
                return label
            },
        },
    };

    const cliFrameworkCtx = document.getElementById("cliFrameworkChart")
    if (cliFrameworkCtx) {
        new Chart(cliFrameworkCtx, {
            type: "bar",
            data: {
                labels: ["Commander.js", "Yargs", "oclif"].map((label) =>
                    wrapLabel(label),
                ),
                datasets: [
                    {
                        label: "Qualitative Score",
                        data: [7, 9, 8],
                        backgroundColor: [
                            brilliantBlues.lightBlue,
                            brilliantBlues.brightBlue,
                            brilliantBlues.mediumBlue,
                        ],
                        borderColor: brilliantBlues.white,
                        borderWidth: 2,
                        borderRadius: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                indexAxis: "y",
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: baseTooltipConfig,
                },
                scales: {
                    x: {
                        beginAtZero: true,
                        max: 10,
                        title: {
                            display: true,
                            text: "Robustness & Feature Score",
                            color: brilliantBlues.mediumBlue,
                            font: { weight: "600" },
                        },
                        grid: { color: "#e0e0e020" },
                        ticks: {
                            color: brilliantBlues.mediumBlue,
                            font: { weight: "600" },
                        },
                    },
                    y: {
                        grid: { display: false },
                        ticks: {
                            color: brilliantBlues.mediumBlue,
                            font: { weight: "600", size: 14 },
                        },
                    },
                },
            },
        })
    }

    const explainReportBtn = document.getElementById("explainReportBtn")
    const suggestSolutionsBtn = document.getElementById("suggestSolutionsBtn")
    const geminiResponseArea = document.getElementById("geminiResponseArea")

    const mockVermanReport = {
        projectName: "my-awesome-app",
        compatibleNodeRange: ">=16.0.0 <18.0.0",
        dependencies: [
            {
                name: "express",
                constraint: "^14.0.0 || ^16.0.0",
                status: "compatible",
            },
            { name: "lodash", constraint: ">=12.0.0", status: "compatible" },
            { name: "left-pad", constraint: ">=18.0.0", status: "conflict" },
        ],
        hasConflict: true,
    }

    async function callGeminiAPI(prompt) {
        geminiResponseArea.innerHTML =
            '<div class="loader"></div><p class="text-center text-sm text-gray-400">Generating insights...</p>'

        const chatHistory = [{ role: "user", parts: [{ text: prompt }] }]
        const payload = { contents: chatHistory }
        const apiKey = "" // API key will be injected by the environment if needed
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`

        try {
            const response = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            })

            if (!response.ok) {
                const errorData = await response.json()
                console.error("Gemini API Error:", errorData)
                throw new Error(
                    `API request failed with status ${response.status}: ${errorData.error?.message || "Unknown error"}`,
                )
            }

            const result = await response.json()

            if (
                result.candidates &&
                result.candidates.length > 0 &&
                result.candidates[0].content &&
                result.candidates[0].content.parts &&
                result.candidates[0].content.parts.length > 0
            ) {
                const text = result.candidates[0].content.parts[0].text
                geminiResponseArea.textContent = text
            } else {
                console.error("Unexpected API response structure:", result)
                geminiResponseArea.textContent =
                    "Could not retrieve insights. The response from the AI was not in the expected format."
                if (result.promptFeedback?.blockReason) {
                    geminiResponseArea.textContent += `\nReason: ${result.promptFeedback.blockReason}`
                    if (
                        result.promptFeedback.blockReason === "SAFETY" &&
                        result.promptFeedback.safetyRatings
                    ) {
                        for (const rating of result.promptFeedback.safetyRatings) {
                            geminiResponseArea.textContent += `\nCategory: ${rating.category}, Probability: ${rating.probability}`
                        }
                    }
                }
            }
        } catch (error) {
            console.error("Error calling Gemini API:", error)
            geminiResponseArea.textContent = `An error occurred while fetching insights: ${error.message}. Check the console for more details.`
        }
    }

    if (explainReportBtn) {
        explainReportBtn.addEventListener("click", () => {
            const prompt = `
                                        Explain the following Node.js compatibility report for a project named "${mockVermanReport.projectName}":
                                        - Overall Compatible Node.js Range: ${mockVermanReport.compatibleNodeRange}
                                        - Dependencies:
                                          ${mockVermanReport.dependencies.map((dep) => `  - ${dep.name} (requires: ${dep.constraint}, status: ${dep.status})`).join("\n")}
                                        Focus on what the overall range means for the project and highlight any specific dependency issues or points of attention.
                                        Be concise and clear.
                                    `
            callGeminiAPI(prompt)
        })
    }

    if (suggestSolutionsBtn) {
        suggestSolutionsBtn.addEventListener("click", () => {
            if (!mockVermanReport.hasConflict) {
                geminiResponseArea.textContent =
                    "No conflicts detected in the mock report. Nothing to suggest solutions for!"
                return
            }
            const conflictingDeps = mockVermanReport.dependencies.filter(
                (dep) => dep.status === "conflict",
            )
            const prompt = `
                The following Node.js compatibility report for project "${mockVermanReport.projectName}" shows conflicts:
                - Overall Compatible Node.js Range: ${mockVermanReport.compatibleNodeRange}
                - Conflicting Dependencies:
                  ${conflictingDeps.map((dep) => `  - ${dep.name} (requires: ${dep.constraint})`).join("\n")}
                Please suggest potential solutions or strategies to resolve these Node.js version conflicts. Consider options like upgrading/downgrading packages, using npm/yarn overrides or resolutions, or checking for alternative packages.
                Provide actionable advice.
            `
            callGeminiAPI(prompt)
        })
    }
})
