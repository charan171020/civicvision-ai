let model;

async function loadModel() {
    model = await mobilenet.load();
    console.log("MobileNet Loaded");
}

// AI Classification
async function classifyImage(imageElement) {

    const predictions = await model.classify(imageElement);
    const topPrediction = predictions[0];

    const label = topPrediction.className;
    const confidence = (topPrediction.probability * 100).toFixed(2);

    return { label, confidence };
}


// Simple Heuristic AI-generated detection
function detectAIGenerated(imageElement) {

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = imageElement.width;
    canvas.height = imageElement.height;

    ctx.drawImage(imageElement, 0, 0);

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;

    let variance = 0;

    for (let i = 0; i < data.length; i += 4) {
        variance += Math.abs(data[i] - data[i+1]);
    }

    variance = variance / (data.length / 4);

    if (variance < 15) {
        return true; // Likely AI generated
    }

    return false;
}


// Category Mapping
function mapCategory(label) {

    label = label.toLowerCase();

    if (label.includes("trash") || label.includes("garbage"))
        return "Garbage";

    if (label.includes("road") || label.includes("traffic") || label.includes("light"))
        return "Street Lights & Road Damage";

    if (label.includes("water") || label.includes("pipe") || label.includes("drain"))
        return "Drainage";

    return "Sanitation";
}