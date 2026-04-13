window.onload = function () {
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
        document.getElementById("menu").style.display = "block";
    }, 5000);
};

function showDataset() {
    hideAll();
    document.getElementById("dataset").style.display = "block";
}

function showImage() {
    hideAll();
    document.getElementById("image").style.display = "block";
}

function showDashboard() {
    hideAll();
    document.getElementById("dashboard").style.display = "block";
    loadDashboard();
}

function hideAll() {
    document.querySelectorAll(".section").forEach(sec => sec.style.display = "none");
}

async function runDiagnosis() {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files.length) {
        alert("Please upload a CSV file.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const text = e.target.result;
        const rows = text.split("\n").slice(1); // skip header
        const firstPatient = rows[0].split(",").slice(1, 31).map(Number); // features only

        const response = await fetch("http://127.0.0.1:8000/predict", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ data: firstPatient })
        });

        const result = await response.json();
        document.getElementById("result").innerHTML = `
      <p>Prediction: ${result.prediction == 0 ? "❌ Malignant" : "✅ Benign"}</p>
      <p>Confidence: ${(result.confidence * 100).toFixed(2)}%</p>
      <p>Reliability: ${result.reliability}</p>
      <p>Warning: ${result.warning}</p>
    `;
    };
    reader.readAsText(fileInput.files[0]);
}

function loadDashboard() {
    // For now, just placeholder
    document.getElementById("dashboardTable").innerHTML = "<p>Dashboard feature coming soon...</p>";
}

