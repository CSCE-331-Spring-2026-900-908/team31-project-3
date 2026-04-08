import { getWeather } from "./WeatherAPI";
import { useEffect, useState } from "react";


const Weather = () =>{
    const [weather, setWeather] = useState(null);

    useEffect(() => {
        async function loadWeather() {
            const data = await getWeather();
            setWeather(data);
        }

        loadWeather();
    }, []);

    return(
    <div>
        <h1>The Weather is {weather ? weather.temp() : "Weather can not be provided"}</h1>
        
    </div>
    )
}

export default Weather;