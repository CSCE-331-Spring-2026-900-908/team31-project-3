export async function getLocation() {
    if (!navigator.geolocation) {
        console.warn("Geolocation is not supported by your browser");
        return Promise.reject("Geolocation not supported");
    }

    return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };
                console.log("Got location:", coords);
                resolve(coords);
            }, 
            (error) => {
                reject(error);
            },
            {
                timeout: 3000, // 3 seconds timeout so it doesn't hang forever
                maximumAge: 60000 // use cached location if available within 60s
            }
        );
    });
}