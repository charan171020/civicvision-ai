let map;

async function showMap() {

    document.getElementById("reportContainer").style.display = "none";
    document.getElementById("mapContainer").style.display = "block";

    if (!map) {
        map = L.map('map').setView([20.5937, 78.9629], 5);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap'
        }).addTo(map);
    }

    const { data: sessionData } = await supabaseClient.auth.getSession();
    const userId = sessionData.session.user.id;

    const { data: reports } = await supabaseClient
        .from("reports")
        .select("*")
        .eq("user_id", userId);

    reports.forEach(report => {

        if (!report.latitude || !report.longitude) return;

        let markerColor = "orange";

        if (report.status === "Cleared") markerColor = "green";
        if (report.status === "Rejected") markerColor = "red";

        const marker = L.circleMarker(
            [report.latitude, report.longitude],
            {
                radius: 8,
                color: markerColor,
                fillColor: markerColor,
                fillOpacity: 0.8
            }
        ).addTo(map);

        marker.bindPopup(`
            <strong>${report.category}</strong><br>
            ${report.description}<br>
            Status: ${report.status}
        `);
    });
}

function showCards() {
    document.getElementById("reportContainer").style.display = "grid";
    document.getElementById("mapContainer").style.display = "none";
}