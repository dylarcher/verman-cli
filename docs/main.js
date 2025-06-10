document.addEventListener("DOMContentLoaded", () => {
    const wrapLabel = (label, maxLength = 16) => {
        if (typeof label !== "string" || label.length <= maxLength) {
            return label
        }
        const words = label.split(" ")
        const lines = []
        let currentLine = ""
        for (const word of words) {
            if (
                (`${currentLine} ${word}`).length > maxLength &&
                currentLine.length > 0
            ) {
                lines.push(currentLine)
                currentLine = word
            } else {
                if (currentLine.length > 0) {
                    currentLine += ` ${word}`
                } else {
                    currentLine = word
                }
            }
        }
        lines.push(currentLine)
        return lines
    }

    const tooltipTitleCallback = (tooltipItems) => {
        const item = tooltipItems[0]
        const label = item.chart.data.labels[item.dataIndex]
        if (Array.isArray(label)) {
            return label.join(" ")
        }
        return label
    }

    const sharedChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: {
                position: "bottom",
                labels: {
                    color: "#374151",
                    font: {
                        size: 12,
                    },
                },
            },
            tooltip: {
                callbacks: {
                    title: tooltipTitleCallback,
                },
            },
        },
        scales: {
            y: {
                ticks: { color: "#374151" },
                grid: { color: "#e5e7eb" },
            },
            x: {
                ticks: { color: "#374151" },
                grid: { display: false },
            },
        },
    }

    const colors = {
        primary: "#0A9396",
        secondary: "#94D2BD",
        accent: "#EE9B00",
        danger: "#AE2012",
        neutral: "#E9D8A6",
        dark: "#005F73",
    }

    const ctxGrowth = document
        .getElementById("marketGrowthChart")
        ?.getContext("2d")
    if (ctxGrowth) {
        new Chart(ctxGrowth, {
            type: "line",
            data: {
                labels: [
                    "2022",
                    "2023",
                    "2024",
                    "2025",
                    "2026",
                    "2027",
                    "2028",
                    "2029",
                    "2030",
                ],
                datasets: [
                    {
                        label: "Market Value (USD Billion)",
                        data: [35.2, 45.4, 58.5, 75.3, 97.0, 125.0, 155.8, 185.1, 215.7],
                        fill: true,
                        backgroundColor: "rgba(148, 210, 189, 0.2)",
                        borderColor: colors.primary,
                        tension: 0.4,
                        pointBackgroundColor: colors.primary,
                        pointBorderColor: "#fff",
                        pointHoverRadius: 7,
                        pointHoverBackgroundColor: "#fff",
                        pointHoverBorderColor: colors.primary,
                    },
                ],
            },
            options: { ...sharedChartOptions },
        })
    }

    const ctxShare = document
        .getElementById("marketShareChart")
        ?.getContext("2d")
    if (ctxShare) {
        new Chart(ctxShare, {
            type: "doughnut",
            data: {
                labels: [
                    "Enterprise Tech Giants",
                    "Data Platform Specialists",
                    "Niche AI Innovators",
                    "Consulting Firms",
                ],
                datasets: [
                    {
                        label: "Market Share",
                        data: [45, 25, 20, 10],
                        backgroundColor: [
                            colors.dark,
                            colors.primary,
                            colors.secondary,
                            colors.neutral,
                        ],
                        borderColor: "#ffffff",
                        borderWidth: 2,
                        hoverOffset: 4,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: "bottom",
                        labels: {
                            color: "#374151",
                        },
                    },
                    tooltip: {
                        callbacks: {
                            title: tooltipTitleCallback,
                        },
                    },
                },
            },
        })
    }

    const ctxTechAdoption = document
        .getElementById("techAdoptionChart")
        ?.getContext("2d")
    if (ctxTechAdoption) {
        new Chart(ctxTechAdoption, {
            type: "bar",
            data: {
                labels: [
                    "Financial Services",
                    "Healthcare & Life Sciences",
                    "Retail & E-commerce",
                    "Manufacturing",
                ],
                datasets: [
                    {
                        label: "Machine Learning",
                        data: [85, 80, 70, 60],
                        backgroundColor: colors.dark,
                    },
                    {
                        label: "Natural Language Processing",
                        data: [75, 82, 65, 50],
                        backgroundColor: colors.primary,
                    },
                    {
                        label: "Computer Vision",
                        data: [40, 30, 75, 65],
                        backgroundColor: colors.secondary,
                    },
                ],
            },
            options: {
                ...sharedChartOptions,
                scales: {
                    x: {
                        stacked: true,
                        ticks: {
                            color: "#374151",
                            callback: function(value, index, values) {
                                return wrapLabel(this.getLabelForValue(value))
                            },
                        },
                    },
                    y: {
                        stacked: true,
                        title: {
                            display: true,
                            text: "Adoption Rate (%)",
                        },
                    },
                },
                plugins: {
                    legend: {
                        position: "bottom",
                    },
                    tooltip: {
                        mode: "index",
                        intersect: false,
                    },
                },
            },
        })
    }

    const ctxCustomerProfile = document
        .getElementById("customerProfileChart")
        ?.getContext("2d")
    if (ctxCustomerProfile) {
        new Chart(ctxCustomerProfile, {
            type: "radar",
            data: {
                labels: [
                    "Data Maturity",
                    "Tech Savviness",
                    ["Annual Revenue", "(> $500M)"],
                    "Digital Transformation",
                    "Executive Buy-in",
                ],
                datasets: [
                    {
                        label: "Ideal Customer Profile Score",
                        data: [9, 8, 7, 9, 10],
                        fill: true,
                        backgroundColor: "rgba(238, 155, 0, 0.2)",
                        borderColor: colors.accent,
                        pointBackgroundColor: colors.accent,
                        pointBorderColor: "#fff",
                        pointHoverBackgroundColor: "#fff",
                        pointHoverBorderColor: colors.accent,
                    },
                ],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false,
                    },
                    tooltip: {
                        callbacks: {
                            title: tooltipTitleCallback,
                        },
                    },
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 10,
                        pointLabels: {
                            font: {
                                size: 11,
                            },
                            color: "#374151",
                        },
                        ticks: {
                            color: "#374151",
                            backdropColor: "transparent",
                        },
                    },
                },
            },
        })
    }
})
