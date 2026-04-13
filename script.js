const BACKEND_URL = "https://ml-website-r0z3.onrender.com/predict";

const splashMessages = [
    "Initialising systems...",
    "Loading AI models...",
    "Calibrating trust engine...",
    "Ready."
];

window.addEventListener("DOMContentLoaded", () => {
    const bar = document.getElementById("splashBar");
    const text = document.getElementById("splashText");
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");

    let progress = 0;
    let msgIndex = 0;
    const TOTAL_MS = 5000;
    const STEP_MS = 50;
    const increment = (STEP_MS / TOTAL_MS) * 100;

    const interval = setInterval(() => {
        progress += increment;
        bar.style.width = Math.min(progress, 100) + "%";

        const newIndex = Math.min(
            Math.floor((progress / 100) * splashMessages.length),
            splashMessages.length - 1
        );
        if (newIndex !== msgIndex) {
            msgIndex = newIndex;
            text.textContent = splashMessages[msgIndex];
        }

        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                splash.classList.add("fade-out");
                app.classList.remove("hidden");
            }, 300);
        }
    }, STEP_MS);
});

/* ─── NAVIGATION ─────────────────────────────────── */
document.querySelectorAll(".nav-btn").forEach(btn => {
    btn.addEventListener("click", () => {
        const target = btn.dataset.section;

        document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");

        document.querySelectorAll(".section").forEach(s => {
            s.classList.remove("active");
            s.classList.add("hidden");
        });

        const targetSection = document.getElementById("section-" + target);
        if (targetSection) {
            targetSection.classList.remove("hidden");
            targetSection.classList.add("active");
        }
    });
});

/* ─── CSV UPLOAD ─────────────────────────────────── */
let patientRows = [];

document.getElementById("csvInput").addEventListener("change", function () {
    const file = this.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const raw = e.target.result.trim();
        if (!raw) {
            showError("The CSV file appears to be empty.");
            return;
        }

        const lines = raw.split(/\r?\n/).filter(l => l.trim() !== "");
        if (lines.length < 2) {
            showError("CSV must have at least one header row and one data row.");
            return;
        }

        const firstCell = lines[0].split(",")[0].trim().toLowerCase();
        const isHeader = isNaN(Number(firstCell)) && firstCell !== "";
        const dataLines = isHeader ? lines.slice(1) : lines;

        if (dataLines.length === 0) {
            showError("No patient data found after header row.");
            return;
        }

        patientRows = dataLines.map(line => line.split(",").map(c => c.trim()));

        if (patientRows[0].length < 32) {
            showError(
                "CSV must have at least 32 columns (Name + 30 features + expected_label). " +
                "Found " + patientRows[0].length + " columns."
            );
            patientRows = [];
            return;
        }

        const select = document.getElementById("patientSelect");
        select.innerHTML = '<option value="">-- Choose a patient --</option>';
        patientRows.forEach((row, i) => {
            const opt = document.createElement("option");
            opt.value = i;
            opt.textContent = row[0] || "Patient #" + (i + 1);
            select.appendChild(opt);
        });

        document.getElementById("selectCard").style.display = "block";

        const info = document.getElementById("fileInfo");
        info.textContent = "✓  " + file.name + "  —  " + patientRows.length + " patients loaded";
        info.classList.remove("hidden");

        hideResults();
        hideError();
    };

    reader.readAsText(file);
});

/* ─── RUN DIAGNOSIS ──────────────────────────────── */
document.getElementById("runBtn").addEventListener("click", async () => {
    const select = document.getElementById("patientSelect");
    const idx = select.value;

    if (idx === "") {
        showError("Please select a patient from the dropdown.");
        return;
    }

    const row = patientRows[Number(idx)];

    const rawFeatures = row.slice(1, 31);
    const features = rawFeatures.map(v => parseFloat(v));

    if (features.some(isNaN)) {
        showError("One or more feature values are not valid numbers. Please check the CSV.");
        return;
    }

    const expectedLabel = parseInt(row[31]);
    if (isNaN(expectedLabel)) {
        showError("Expected label (column 32) is missing or not a number.");
        return;
    }

    const body = {
        data: features,
        expected_label: expectedLabel
    };

    hideError();
    hideResults();
    showLoading(true);
    setRunBtnDisabled(true);

    try {
        const response = await fetch(BACKEND_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            let detail = "HTTP " + response.status;
            try {
                const errJson = await response.json();
                if (errJson.detail) {
                    detail += ": " + JSON.stringify(errJson.detail);
                }
            } catch (_) { }
            throw new Error(detail);
        }

        const result = await response.json();
        displayResults(result);

    } catch (err) {
        showError("Diagnosis failed: " + err.message);
    } finally {
        showLoading(false);
        setRunBtnDisabled(false);
    }
});

/* ─── DISPLAY RESULTS ────────────────────────────── */
function displayResults(data) {
    const pred = data.prediction;
    const isMalig = (pred === 1 || pred === "1" ||
        String(pred).toLowerCase().includes("malig"));

    document.getElementById("resPrediction").textContent =
        isMalig ? "❌ Malignant" : "✅ Benign";

    const conf = data.confidence !== undefined
        ? (typeof data.confidence === "number"
            ? (data.confidence <= 1
                ? (data.confidence * 100).toFixed(1) + "%"
                : data.confidence.toFixed(1) + "%")
            : data.confidence)
        : "N/A";
    document.getElementById("resConfidence").textContent = conf;

    document.getElementById("resReliability").textContent =
        data.reliability || "N/A";

    const exp = data.expected_label;
    document.getElementById("resExpected").textContent =
        (exp === 0 || exp === "0") ? "✅ Benign (0)"
            : (exp === 1 || exp === "1") ? "❌ Malignant (1)"
                : "N/A";

    const badge = document.getElementById("resultBadge");
    badge.textContent = isMalig ? "Malignant" : "Benign";
    badge.className = "badge " + (isMalig ? "malignant" : "benign");

    const warnBox = document.getElementById("resWarning");
    if (data.warning && data.warning.trim() !== "") {
        warnBox.textContent = "⚠️ " + data.warning;
        warnBox.classList.remove("hidden");
    } else {
        warnBox.classList.add("hidden");
    }

    document.getElementById("resultCard").classList.remove("hidden");
}

/* ─── HELPERS ────────────────────────────────────── */
function showError(msg) {
    const box = document.getElementById("errorBox");
    box.textContent = "⚠️ " + msg;
    box.classList.remove("hidden");
}
function hideError() {
    document.getElementById("errorBox").classList.add("hidden");
}
function hideResults() {
    document.getElementById("resultCard").classList.add("hidden");
}
function showLoading(show) {
    const box = document.getElementById("loadingBox");
    show ? box.classList.remove("hidden") : box.classList.add("hidden");
}
function setRunBtnDisabled(disabled) {
    document.getElementById("runBtn").disabled = disabled;
}