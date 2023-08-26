import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Placeholder from "./components/Placeholder";
import weatherDescriptions from "./components/WeatherCodes";

function App() {
  const [weatherData, setWeatherData] = useState({});
  const [currentLocation, setCurrentLocation] = useState("");
  const [gotLocation, setGotLocation] = useState(false);
  const [locationError, setLocationError] = useState("");

  const fetchWeatherData = useCallback(async (abortController) => {
    try {
      const response = await fetch("https://ipapi.co/json/", {
        signal: abortController.signal,
      });
      const location = await response.json();
      const { latitude, longitude } = location;
      const city = location.city;
      getWeather(city, latitude, longitude);
    } catch (error) {
      console.error("Error fetching location data:", error);
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

  const getWeather = async (city, latitude, longitude) => {
    try {
      setCurrentLocation(city);
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&daily=weathercode,temperature_2m_max,temperature_2m_min,precipitation_sum&current_weather=true&timezone=auto`
      );
      const weatherData = await weatherResponse.json();
      setWeatherData(weatherData);
    } catch (error) {
      console.error("Error fetching weather data:", error);
    }
  };

  const getCity = async (lat, long) => {
    const url = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${long}`
    );
    const data = await url.json();
    return data?.address?.city;
  };

  const getGeoLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          setGotLocation(true);
          setWeatherData({});
          const { latitude, longitude } = position.coords;
          const city = await getCity(latitude, longitude);
          getWeather(city, latitude, longitude);
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError(
                "Please allow location access in your browser settings."
              );
              break;
            case error.POSITION_UNAVAILABLE:
              setLocationError("Location information is unavailable.");
              break;
            case error.TIMEOUT:
              setLocationError("The request to get user location timed out.");
              break;
            case error.UNKNOWN_ERROR:
              setLocationError("An unknown error occurred.");
              break;
          }
        }
      );
    } else {
      alert("Geolocation is not supported by this browser.");
      setGotLocation(false);
    }
  };

  return (
    <div className="flex justify-center items-center h-screen flex-col dark:bg-gray-900 dark:text-gray-200">
      {weatherData.current_weather ? (
        <>
          <p className="text-xl font-medium">Currently</p>
          {!gotLocation && (
            <div
              onClick={getGeoLocation}
              className="flex flex-row items-center justify-center gap-2 border-2 border-gray-700 px-4 py-1 text-[13px] mt-4 cursor-pointer rounded-full text-blue-400 fill-current bg-slate-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                className="w-4 h-4"
              >
                <path d="M12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm8.94 3A8.994 8.994 0 0 0 13 3.06V1h-2v2.06A8.994 8.994 0 0 0 3.06 11H1v2h2.06A8.994 8.994 0 0 0 11 20.94V23h2v-2.06A8.994 8.994 0 0 0 20.94 13H23v-2h-2.06zM12 19c-3.87 0-7-3.13-7-7s3.13-7 7-7 7 3.13 7 7-3.13 7-7 7z" />
              </svg>
              <span>Use precise location</span>
            </div>
          )}
          {locationError && <p className="mt-3 text-sm">{locationError}</p>}
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
