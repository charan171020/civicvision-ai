// =============================
// LOAD ALL REPORTS
// =============================

async function loadAdminReports() {

    const { data: reports, error } = await supabaseClient
        .from("reports")
        .select("*")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading reports:", error);
        return;
    }

    updateStats(reports);
    renderReports(reports);
}

// =============================
// RENDER REPORT CARDS
// =============================

function renderReports(reports) {

    const container = document.getElementById("adminReports");
    container.innerHTML = "";

    reports.forEach(report => {

        let statusColor = "";
        if (report.status === "Pending") statusColor = "orange";
        if (report.status === "Cleared") statusColor = "#00ff99";
        if (report.status === "Rejected") statusColor = "red";

        let priorityColor = "white";
        if (report.priority_level === "Emergency") priorityColor = "red";
        if (report.priority_level === "High") priorityColor = "orange";
        if (report.priority_level === "Medium") priorityColor = "#00ff99";

        const latitude = report.latitude;
        const longitude = report.longitude;

        const locationHTML = (latitude && longitude)
            ? `<a href="https://www.google.com/maps?q=${latitude},${longitude}" 
                  target="_blank" 
                  style="color:#00ff99;">
                  ${latitude.toFixed(5)}, ${longitude.toFixed(5)}
               </a>`
            : "Not Available";

        const card = document.createElement("div");
        card.className = "report-card";

        card.innerHTML = `
            <img src="${report.image_url}" class="report-image">

            <h3>${report.category}</h3>
            <p>${report.description}</p>

            <p><strong>AI:</strong> ${report.predicted_label}</p>
            <p><strong>Location:</strong> ${locationHTML}</p>

            <p style="color:${statusColor}; font-weight:bold;">
                ${report.status}
            </p>

            <p><strong>Severity:</strong> ${report.severity_score}/5</p>

            <p>
                <strong>Priority:</strong> 
                <span style="color:${priorityColor}; font-weight:bold;">
                    ${report.priority_level}
                </span>
            </p>

            <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
                <button onclick="updateStatus('${report.id}','Pending')" class="btn-outline">Pending</button>
                <button onclick="updateStatus('${report.id}','Cleared')" class="btn-glow">Cleared</button>
                <button onclick="updateStatus('${report.id}','Rejected')" class="btn-outline">Rejected</button>
                <button onclick="deleteReport('${report.id}')" class="btn-danger">Delete</button>
            </div>
        `;

        container.appendChild(card);
    });
}

/// =======================================
// UPDATE STATUS + SEND SMS
// =======================================

async function updateStatus(reportId, newStatus) {

    // Update report status
    const { error } = await supabaseClient
        .from("reports")
        .update({ status: newStatus })
        .eq("id", reportId);

    if (error) {
        alert("Update failed");
        return;
    }

    // Fetch phone number
    const { data: report, error: fetchError } = await supabaseClient
        .from("reports")
        .select("phone_number, description")
        .eq("id", reportId)
        .single();

    if (fetchError || !report?.phone_number) {
        loadAdminReports();
        return;
    }

    // Send SMS via Edge Function
    try {
        await fetch(
            "https://kxenpfaldfgfzkfofqil.supabase.co/functions/v1/send-sms",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    to: report.phone_number,
                    message: `Your CivicVision report has been marked as ${newStatus}. Thank you for helping your city!`
                })
            }
        );
    } catch (err) {
        console.error("SMS Error:", err);
    }

    loadAdminReports();
}

// =============================
// DELETE REPORT
// =============================

async function deleteReport(reportId) {

    const confirmDelete = confirm("Are you sure you want to delete this report?");
    if (!confirmDelete) return;

    const { error } = await supabaseClient
        .from("reports")
        .delete()
        .eq("id", reportId);

    if (error) {
        alert("Delete failed");
        console.error(error);
        return;
    }

    loadAdminReports();
}

// =============================
// STATS UPDATE
// =============================

function updateStats(reports) {

    document.getElementById("totalCount").innerText = reports.length;
    document.getElementById("pendingCount").innerText =
        reports.filter(r => r.status === "Pending").length;
    document.getElementById("clearedCount").innerText =
        reports.filter(r => r.status === "Cleared").length;
    document.getElementById("rejectedCount").innerText =
        reports.filter(r => r.status === "Rejected").length;
}

document.addEventListener("DOMContentLoaded", loadAdminReports);