const API_KEY = "e3f87a17d8ced33be2deee93b4c29bca"
const city = "London"
export async function getWeather(){
    const WEATHER_API_URL = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${API_KEY}&units=imperial`
    const response = await fetch(WEATHER_API_URL);
    

    if (!response.ok) {
        throw new Error("Weather request failed");
    }
    const data = await response.json();

    

    return {
        temp: data.main.temp,
        description: data.weather[0].description,
        city: data.name
    };
} 