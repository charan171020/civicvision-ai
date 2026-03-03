// ===============================
// LOAD USER REPORTS
// ===============================

async function loadUserReports() {

    const { data: sessionData } = await supabaseClient.auth.getSession();

    if (!sessionData.session) {
        window.location.href = "login.html";
        return;
    }

    const userId = sessionData.session.user.id;

    const { data: reports, error } = await supabaseClient
        .from("reports")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

    console.log("Logged in user:", userId);
    console.log("Reports:", reports);

    if (error) {
        console.error(error);
        return;
    }

    const container = document.getElementById("reportContainer");
    container.innerHTML = "";

    if (!reports || reports.length === 0) {
        container.innerHTML = "<p>No reports submitted yet.</p>";
        return;
    }

    reports.forEach(report => {

        let statusClass = "";

        if (report.status === "Pending") statusClass = "status-pending";
        if (report.status === "Cleared") statusClass = "status-cleared";
        if (report.status === "Rejected") statusClass = "status-rejected";

        const card = `
            <div class="report-card">
                <img src="${report.image_url}" class="report-image" />
                <h3>${report.category}</h3>
                <p>${report.description}</p>
                <p><strong>AI Label:</strong> ${report.predicted_label}</p>
                <span class="status ${statusClass}">
                    ${report.status}
                </span>
            </div>
        `;

        container.innerHTML += card;
    });
}

// Auto-load when page opens
document.addEventListener("DOMContentLoaded", loadUserReports);