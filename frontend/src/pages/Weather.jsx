import { getWeather } from "./WeatherAPI";
import { useEffect, useState } from "react";
import { getLocation } from "./Getlocation";

const Weather = () =>{
    const [weather, setWeather] = useState(null);
    const [location, setLocation] = useState(null);

    useEffect(() => {
        async function loadWeather() {
            const data = await getWeather();
            setWeather(data);
        }
        loadWeather();
    }, []);

    useEffect(() =>{
        async function loadLoaction(){

        try{
        const data = await getLocation();
        setLocation(data)
        }
        catch(error){
            console.log(error);
        }
        
    }
    loadLoaction();
    }, []);

    return(
    <div>
        <h1>The Weather is {weather ? weather.temp + " in " + weather.city  : "Weather can not be provided"}</h1>
        <h1>Your location is {
                    location
                        ? `${location.latitude}, ${location.longitude}`
                        : "Loading location..."
        }</h1>
    </div>
    )
}

export default Weather;