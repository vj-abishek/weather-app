import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Placeholder from "./components/Placeholder";
import weatherDescriptions from "./components/WeatherCodes";

function App() {
  const [weatherData, setWeatherData] = useState({});
  const [currentLocation, setCurrentLocation] = useState("");

  const fetchWeatherData = useCallback(async (abortController) => {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: abortController.signal,
      });
      const location = await response.json();
      const { latitude, longitude } = location;
      setCurrentLocation(location.city);
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&timezone=auto`
      );
      const weatherData = await weatherResponse.json();
      setWeatherData(weatherData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  }, []);

  useEffect(() => {
    const abortController = new AbortController();
    fetchWeatherData(abortController);

    return () => abortController.abort();
  }, [fetchWeatherData]);

  const maxWeather = () => {
    if (weatherData) {
      const maxWeatherArray = weatherData.daily.temperature_2m_max;
      const maxWeather = Math.max(...maxWeatherArray);
      return maxWeather;
    }
  };

  const minWeather = () => {
    if (weatherData) {
      const minWeatherArray = weatherData.daily.temperature_2m_min;
      const minWeather = Math.min(...minWeatherArray);
      return minWeather;
    }
  };

  const localDay = () => {
    const date = new Date();
    const day = date.getDay();
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    return days[day];
  };

  const weatherDescription = () => {
    if (weatherData) {
      const weatherCode = weatherData.current_weather.weathercode;
      const weatherDescription = weatherDescriptions[weatherCode];
      return weatherDescription;
    }
  };

  return (
    <div className="flex justify-center items-center h-screen flex-col dark:bg-gray-900 dark:text-gray-200">
      {weatherData.current_weather ? (
        <>
          <p className="text-xl font-medium">Currently</p>
          <p className="text-8xl font-bold pt-4">
            {weatherData.current_weather &&
              weatherData.current_weather.temperature}
            <sub className="text-xs">°c </sub>
          </p>
          <p className="text-4xl font-semibold pt-6">{weatherDescription()}</p>
          <p className="text-sm font-medium pt-4">
            High: {maxWeather()} <sup>°</sup> Low: {minWeather()} <sup>°</sup>{" "}
          </p>
          <p className="text-xs font-medium pt-3">
            {" "}
            {localDay()} &middot; {currentLocation}
          </p>
        </>
      ) : (
        <Placeholder />
      )}
    </div>
  );
}

export default App;
