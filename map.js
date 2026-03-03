let latitude = null;
let longitude = null;

function initGeolocation() {

    const status = document.getElementById("locationStatus");

    if (navigator.geolocation) {

        navigator.geolocation.getCurrentPosition(
            (position) => {
                latitude = position.coords.latitude;
                longitude = position.coords.longitude;
                status.innerText = "Location captured automatically.";
            },
            () => {
                status.innerText = "Location permission denied.";
            }
        );

    } else {
        status.innerText = "Geolocation not supported.";
    }
}