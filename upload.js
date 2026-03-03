// ============================
// CivicVision - FINAL CLEAN VERSION
// ============================

let cameraStream = null;

// ============================
// SEVERITY LOGIC
// ============================

function calculateSeverity(confidence) {
    confidence = parseFloat(confidence);

    if (confidence > 85) return 5;
    if (confidence > 70) return 4;
    if (confidence > 55) return 3;
    if (confidence > 40) return 2;
    return 1;
}

function getPriority(severity) {
    if (severity === 5) return "Emergency";
    if (severity === 4) return "High";
    if (severity === 3) return "Medium";
    return "Low";
}

// ============================
// CAMERA FUNCTIONS
// ============================

async function startCamera() {

    const video = document.getElementById("camera");

    try {
        cameraStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: "environment" }
        });

        video.srcObject = cameraStream;
        video.style.display = "block";

    } catch (error) {
        alert("Camera access denied.");
        console.error(error);
    }
}

function capturePhoto() {

    const video = document.getElementById("camera");
    const canvas = document.getElementById("canvas");

    if (!video.srcObject) {
        alert("Start camera first.");
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0);

    canvas.toBlob(async (blob) => {

        const imageFile = new File([blob], "captured.jpg", {
            type: "image/jpeg"
        });

        await analyzeAndSubmit(imageFile);

    }, "image/jpeg");

    if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
    }

    video.style.display = "none";
}

// ============================
// SIMPLE SMART DETECTION
// ============================

async function simpleDetect(imageFile) {

    return new Promise((resolve) => {

        const img = new Image();
        img.src = URL.createObjectURL(imageFile);

        img.onload = function () {

            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");

            canvas.width = img.width;
            canvas.height = img.height;

            ctx.drawImage(img, 0, 0);

            const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

            let darkPixels = 0;
            let bluePixels = 0;
            let totalPixels = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {

                const r = data[i];
                const g = data[i + 1];
                const b = data[i + 2];

                if (r < 60 && g < 60 && b < 60) darkPixels++;
                if (b > 120 && g > 100 && r < 100) bluePixels++;
            }

            const darkRatio = darkPixels / totalPixels;
            const blueRatio = bluePixels / totalPixels;

            let label = "Garbage";
            let confidence = 70;

            if (darkRatio > 0.15) {
                label = "Pothole";
                confidence = darkRatio * 300;
            }
            else if (blueRatio > 0.12) {
                label = "Water Leakage";
                confidence = blueRatio * 300;
            }

            resolve({
                label: label,
                confidence: Math.min(95, confidence).toFixed(2)
            });
        };
    });
}

// ============================
// SUBMIT (FILE UPLOAD)
// ============================

async function submitReport() {

    const imageInput = document.getElementById("imageInput");
    const description = document.getElementById("description").value.trim();

    if (!imageInput.files[0] || !description) {
        alert("Image and description required.");
        return;
    }

    const imageFile = imageInput.files[0];

    await analyzeAndSubmit(imageFile);
}

// ============================
// ANALYZE + SAVE
// ============================

async function analyzeAndSubmit(imageFile) {

    document.getElementById("aiResult").innerHTML =
        "<p>Analyzing image...</p>";

    const result = await simpleDetect(imageFile);

    const severity = calculateSeverity(result.confidence);
    const priority = getPriority(severity);

    document.getElementById("aiResult").innerHTML =
        `<p><strong>Category:</strong> ${result.label}</p>
         <p><strong>Confidence:</strong> ${result.confidence}%</p>
         <p><strong>Severity:</strong> ${severity}/5</p>
         <p><strong>Priority:</strong> ${priority}</p>`;

    // Upload image to Supabase
    const fileName = Date.now() + "_" + imageFile.name;

    const { error: uploadError } = await supabaseClient.storage
        .from("report-images")
        .upload(fileName, imageFile);

    if (uploadError) {
        alert(uploadError.message);
        return;
    }

    const { data } = supabaseClient.storage
        .from("report-images")
        .getPublicUrl(fileName);

    const imageUrl = data.publicUrl;

    const { data: sessionData } = await supabaseClient.auth.getSession();
    if (!sessionData.session) {
        alert("User not logged in.");
        return;
    }

    const userId = sessionData.session.user.id;

    navigator.geolocation.getCurrentPosition(async (position) => {

        await supabaseClient.from("reports").insert([{
            user_id: userId,
            image_url: imageUrl,
            description: document.getElementById("description").value,
            predicted_label: result.label,
            category: result.label,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            status: "Pending",
            severity_score: severity,
            priority_level: priority
        }]);

        alert("Report submitted successfully!");
        window.location.href = "dashboard.html";

    }, () => {
        alert("Location permission denied.");
    });
}