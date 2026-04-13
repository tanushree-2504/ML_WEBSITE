// Splash screen
window.onload = function () {
    setTimeout(() => {
        document.getElementById("splash").style.display = "none";
        document.getElementById("menu").style.display = "block";
    }, 5000);
};

// Navigation
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

// Load patients into dropdown
function loadPatients(file) {
    const reader = new FileReader();
    reader.onload = function (e) {
        const text = e.target.result;
        const rows = text.split("\n").slice(1); // skip header
        const select = document.getElementById("patientSelect");
        select.innerHTML = "";

        rows.forEach((row, index) => {
            if (row.trim() !== "") {
                const option = document.createElement("option");
                option.value = index;
                option.text = "Patient #" + (index + 1);
                select.appendChild(option);
            }
        });
    };
    reader.readAsText(file);
}

// Run diagnosis
async function runDiagnosis() {
    const fileInput = document.getElementById("csvFile");
    if (!fileInput.files.length) {
        alert("Please upload a CSV file.");
        return;
    }

    const patientIndex = document.getElementById("patientSelect").value;
    if (patientIndex === "") {
        alert("Please select a patient.");
        return;
    }

    const reader = new FileReader();
    reader.onload = async function (e) {
        const text = e.target.result;
        const rows = text.split("\n").slice(1);
        const row = rows[patientIndex].split(",");

        const features = row.slice(1, 31).map(Number);

        try {
            const response = await fetch("https://ml-website-r0z3.onrender.com/predict", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ data: features })
            });

            const result = await response.json();

            document.getElementById("result").innerHTML = `
                <p><strong>Prediction:</strong> ${result.prediction == 0 ? "❌ Malignant" : "✅ Benign"}</p>
                <p><strong>Confidence:</strong> ${(result.confidence * 100).toFixed(2)}%</p>
                <p><strong>Reliability:</strong> ${result.reliability}</p>
                <p><strong>Warning:</strong> ${result.warning}</p>
            `;
        } catch (error) {
            document.getElementById("result").innerHTML = `<p style="color:red;">Error: ${error.message}</p>`;
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// Dashboard placeholder
function loadDashboard() {
    document.getElementById("dashboardTable").innerHTML = "<p>Dashboard feature coming soon...</p>";
}


