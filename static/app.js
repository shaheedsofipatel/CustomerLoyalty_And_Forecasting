/* ===================================================================
   Customer Loyalty Dashboard – Frontend Logic
   =================================================================== */

const API = {
    dataset:  "/api/dataset",
    spending: "/api/predict-spending",
    loyalty:  "/api/loyalty-score",
    interest: "/api/predict-interest",
    insights: "/api/insights",
};

// Chart.js global defaults
Chart.defaults.color = "#64748B";
Chart.defaults.borderColor = "rgba(226,232,240,0.8)";
Chart.defaults.font.family = "'Inter', sans-serif";

// ─────────────────────── Helpers ───────────────────────
const $ = (sel) => document.querySelector(sel);
const money = (v) => `$${Number(v).toFixed(0)}`;

async function fetchJSON(url) {
    const res = await fetch(url);
    return res.json();
}

// ─────────────────────── 1. Dataset Overview ───────────────────────
function renderDatasetTable(data) {
    const thead = $("#dataset-table thead tr");
    const tbody = $("#dataset-table tbody");
    const cols = Object.keys(data[0]);

    thead.innerHTML = cols.map((c) => `<th>${c.replace(/_/g, " ")}</th>`).join("");
    tbody.innerHTML = data
        .slice(0, 20)                      // Show first 20 rows
        .map(
            (row) =>
                `<tr>${cols.map((c) => `<td>${row[c]}</td>`).join("")}</tr>`
        )
        .join("");
}

function renderSpendingDistChart(data) {
    const buckets = { "0-50": 0, "50-100": 0, "100-150": 0, "150-200": 0, "200-250": 0, "250+": 0 };
    data.forEach((d) => {
        const s = d.Avg_Spending;
        if (s < 50) buckets["0-50"]++;
        else if (s < 100) buckets["50-100"]++;
        else if (s < 150) buckets["100-150"]++;
        else if (s < 200) buckets["150-200"]++;
        else if (s < 250) buckets["200-250"]++;
        else buckets["250+"]++;
    });

    new Chart($("#chart-spending-dist"), {
        type: "bar",
        data: {
            labels: Object.keys(buckets),
            datasets: [{
                label: "Customers",
                data: Object.values(buckets),
                backgroundColor: [
                    "rgba(14,165,233,0.75)",
                    "rgba(101,163,13,0.75)",
                    "rgba(124,58,237,0.6)",
                    "rgba(202,138,4,0.65)",
                    "rgba(220,38,38,0.6)",
                    "rgba(14,165,233,0.5)",
                ],
                borderRadius: 8,
                borderWidth: 0,
            }],
        },
        options: {
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                y: { beginAtZero: true, ticks: { precision: 0 } },
                x: { title: { display: true, text: "Avg Spending ($)" } },
            },
        },
    });
}

function renderCategoryPie(data) {
    const counts = {};
    data.forEach((d) => {
        counts[d.Favorite_Category] = (counts[d.Favorite_Category] || 0) + 1;
    });

    const colors = [
        "#0EA5E9", "#65A30D", "#7C3AED", "#CA8A04",
        "#DC2626", "#EA580C", "#0D9488",
    ];

    new Chart($("#chart-category-pie"), {
        type: "doughnut",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                data: Object.values(counts),
                backgroundColor: colors,
                borderWidth: 0,
                hoverOffset: 10,
            }],
        },
        options: {
            responsive: true,
            cutout: "60%",
            plugins: {
                legend: { position: "right", labels: { boxWidth: 14, padding: 12 } },
            },
        },
    });
}

// ─────────────────────── 2. Spending Forecast ───────────────────────
function renderSpendingTable(data) {
    const tbody = $("#spending-table tbody");
    tbody.innerHTML = data
        .slice(0, 15)
        .map(
            (r) =>
                `<tr>
                    <td>${r.customer_id}</td>
                    <td>${money(r.current_monthly_spend)}</td>
                    <td style="color:#22C55E;font-weight:600">${money(r.predicted_next_month)}</td>
                    <td style="color:#38BDF8;font-weight:600">${money(r.predicted_next_3_months)}</td>
                </tr>`
        )
        .join("");
}

function renderSpendingLineChart(data) {
    const top = data.slice(0, 12);

    new Chart($("#chart-spending-line"), {
        type: "line",
        data: {
            labels: top.map((d) => d.customer_id),
            datasets: [
                {
                    label: "Current Spending",
                    data: top.map((d) => d.current_monthly_spend),
                    borderColor: "#0EA5E9",
                    backgroundColor: "rgba(14,165,233,0.1)",
                    fill: true,
                    tension: 0.4,
                    pointRadius: 5,
                    pointHoverRadius: 8,
                },
                {
                    label: "Predicted Next Month",
                    data: top.map((d) => d.predicted_next_month),
                    borderColor: "#65A30D",
                    backgroundColor: "rgba(101,163,13,0.1)",
                    fill: true,
                    tension: 0.4,
                    borderDash: [6, 3],
                    pointRadius: 5,
                    pointHoverRadius: 8,
                },
            ],
        },
        options: {
            responsive: true,
            interaction: { mode: "index", intersect: false },
            plugins: { legend: { labels: { boxWidth: 14 } } },
            scales: {
                y: { title: { display: true, text: "Spending ($)" } },
            },
        },
    });
}

// ─────────────────────── 3. Loyalty Score ───────────────────────
function drawGauge(canvas, score, maxScore) {
    const ctx = canvas.getContext("2d");
    const size = canvas.width;
    const cx = size / 2;
    const cy = size / 2;
    const radius = size / 2 - 10;
    const startAngle = 0.75 * Math.PI;
    const endAngle = 2.25 * Math.PI;
    const pct = Math.min(score / maxScore, 1);
    const sweepAngle = startAngle + pct * (endAngle - startAngle);

    // Background arc
    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, endAngle, false);
    ctx.lineWidth = 10;
    ctx.strokeStyle = "rgba(226,232,240,0.8)";
    ctx.lineCap = "round";
    ctx.stroke();

    // Value arc
    let color;
    if (score >= 70) color = "#65A30D";
    else if (score >= 50) color = "#0EA5E9";
    else if (score >= 30) color = "#CA8A04";
    else color = "#DC2626";

    ctx.beginPath();
    ctx.arc(cx, cy, radius, startAngle, sweepAngle, false);
    ctx.lineWidth = 10;
    ctx.strokeStyle = color;
    ctx.lineCap = "round";
    ctx.stroke();

    // Score text
    ctx.fillStyle = "#1E293B";
    ctx.font = "bold 18px Inter, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(score.toFixed(0), cx, cy + 4);
}

function renderGauges(data) {
    const container = $("#gauge-container");
    // Only show top 12 for visual clarity
    const top = [...data].sort((a, b) => b.loyalty_score - a.loyalty_score).slice(0, 12);

    top.forEach((c) => {
        const card = document.createElement("div");
        card.className = "gauge-card";

        const canvas = document.createElement("canvas");
        canvas.width = 100;
        canvas.height = 100;

        const segmentSlug = c.segment.toLowerCase().replace(/\s+/g, "-");

        card.innerHTML = `
            <div class="gauge-label">${c.customer_id}</div>
        `;
        card.prepend(canvas);
        const seg = document.createElement("span");
        seg.className = `gauge-segment ${segmentSlug}`;
        seg.textContent = c.segment;
        card.appendChild(seg);

        container.appendChild(card);
        drawGauge(canvas, c.loyalty_score, 100);
    });
}

function renderSegmentChart(data) {
    const counts = { "Highly Loyal": 0, "Potential Loyal": 0, "At Risk": 0, "New Customer": 0 };
    data.forEach((c) => { counts[c.segment] = (counts[c.segment] || 0) + 1; });

    new Chart($("#chart-segments"), {
        type: "bar",
        data: {
            labels: Object.keys(counts),
            datasets: [{
                label: "Customers",
                data: Object.values(counts),
                backgroundColor: [
                    "rgba(101,163,13,0.75)",
                    "rgba(14,165,233,0.75)",
                    "rgba(220,38,38,0.65)",
                    "rgba(202,138,4,0.65)",
                ],
                borderRadius: 8,
                borderWidth: 0,
            }],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, ticks: { precision: 0 } },
            },
        },
    });
}

// ─────────────────────── 4. Product Interest ───────────────────────
function renderInterestTable(data) {
    const sorted = [...data].sort((a, b) => b.interest_probability - a.interest_probability);
    const tbody = $("#interest-table tbody");
    tbody.innerHTML = sorted
        .slice(0, 15)
        .map((r) => {
            const color = r.interest_probability >= 60 ? "#65A30D" : r.interest_probability >= 40 ? "#CA8A04" : "#DC2626";
            return `<tr>
                <td>${r.customer_id}</td>
                <td>${r.favorite_category}</td>
                <td style="color:${color};font-weight:600">${r.interest_probability}%</td>
            </tr>`;
        })
        .join("");
}

function renderInterestBarChart(data) {
    const sorted = [...data].sort((a, b) => b.interest_probability - a.interest_probability).slice(0, 15);

    const colors = sorted.map((d) =>
        d.interest_probability >= 60
            ? "rgba(101,163,13,0.75)"
            : d.interest_probability >= 40
            ? "rgba(202,138,4,0.65)"
            : "rgba(220,38,38,0.65)"
    );

    new Chart($("#chart-interest-bar"), {
        type: "bar",
        data: {
            labels: sorted.map((d) => d.customer_id),
            datasets: [{
                label: "Interest %",
                data: sorted.map((d) => d.interest_probability),
                backgroundColor: colors,
                borderRadius: 6,
                borderWidth: 0,
            }],
        },
        options: {
            indexAxis: "y",
            responsive: true,
            plugins: { legend: { display: false } },
            scales: {
                x: { beginAtZero: true, max: 100, title: { display: true, text: "Probability (%)" } },
            },
        },
    });
}

// ─────────────────────── 5. Insights ───────────────────────
function renderInsights(data) {
    const container = $("#insights-list");
    container.innerHTML = data
        .map((text) => `<div class="insight-card">${text}</div>`)
        .join("");
}

// ─────────────────────── Init ───────────────────────
async function init() {
    try {
        const [dataset, spending, loyalty, interest, insights] = await Promise.all([
            fetchJSON(API.dataset),
            fetchJSON(API.spending),
            fetchJSON(API.loyalty),
            fetchJSON(API.interest),
            fetchJSON(API.insights),
        ]);

        // Section 1
        renderDatasetTable(dataset);
        renderSpendingDistChart(dataset);
        renderCategoryPie(dataset);

        // Section 2
        renderSpendingTable(spending);
        renderSpendingLineChart(spending);

        // Section 3
        renderGauges(loyalty);
        renderSegmentChart(loyalty);

        // Section 4
        renderInterestTable(interest);
        renderInterestBarChart(interest);

        // Section 5
        renderInsights(insights);
    } catch (err) {
        console.error("Failed to load dashboard data:", err);
        document.body.innerHTML += `<div style="position:fixed;bottom:1rem;right:1rem;background:#F87171;color:#fff;padding:1rem;border-radius:8px;z-index:999">
            Failed to load data. Make sure the Flask server is running on port 5000.</div>`;
    }
}

document.addEventListener("DOMContentLoaded", init);
