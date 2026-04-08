export async function getLocation() {
    if(!navigator.geolocation){
        alert("Geolocation is not supported by your browser");
        return;
    }

    return new Promise((reslove,reject) => {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const coords = {
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude
                };

                console.log(coords);
                reslove(coords);

            }, (error) => {
                reject(error);
            },

            {
                    enableHighAccuracy: true,
            }

        );

    });
}