import { getLocation } from "./Getlocation";

const API_KEY = "e3f87a17d8ced33be2deee93b4c29bca"

export async function getWeather(){
    const location = await getLocation();
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?lat=${location.latitude}&lon=${location.longitude}&appid=${API_KEY}&units=imperial`
    
    const response = await fetch(WEATHER_API_URL);
    
    if (!response.ok) {
        throw new Error("Weather request failed");
    }
    const data = await response.json();

    const WEATHER_ICON =`https://openweathermap.org/img/wn/${data.weather[0].icon}@2x.png`;
    

    return {
        temp: Math.round(data.main.temp),
        description: data.weather[0].description,
        city: data.name,
        icon: WEATHER_ICON
    };
} 