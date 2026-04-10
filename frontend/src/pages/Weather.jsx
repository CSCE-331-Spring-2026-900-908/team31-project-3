import './Weather.css'
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
    <div className='weatherDisplay'>
        <img src={weather ? weather.icon : "Loading"}></img>
        <h1>{weather ? weather.temp + "°F" : "Loading"}</h1>
        {/* <h1>Your location is {
                    location
                        ? `${location.latitude}, ${location.longitude}`
                        : "Loading location..."
        }</h1> */}
        <h1>{weather ? weather.city : "Loading"}</h1>
    </div>
    )
}

export default Weather;