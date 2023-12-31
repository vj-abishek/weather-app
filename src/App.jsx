import { useCallback, useEffect, useState } from "react";
import "./App.css";
import Placeholder from "./components/Placeholder";
import weatherDescriptions from "./components/WeatherCodes";
import useLocalStorage from "./lib/useLocalStorage";

function App() {
  const [weatherData, setWeatherData] = useState({});
  const [currentDisplayLocation, setCurrentDisplayLocation] = useState("");
  const [gotLocation, setGotLocation] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [cacheLocationData, setCacheLocationData] = useLocalStorage(
    "locationData",
    0
  );

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

    if (cacheLocationData) {
      getWeather(
        cacheLocationData.city,
        cacheLocationData.latitude,
        cacheLocationData.longitude
      );
      setCurrentDisplayLocation(cacheLocationData.city);
    } else {
      fetchWeatherData(abortController);
    }

    return () => abortController.abort();
  }, [fetchWeatherData, cacheLocationData]);

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
      setCurrentDisplayLocation(city);
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
    const address = data?.address;
    return (
      address?.city ||
      address?.town ||
      address?.village ||
      address?.county ||
      address?.state ||
      address?.state_district ||
      address?.country
    );
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
          setCacheLocationData({
            latitude,
            longitude,
            city,
          });
        },
        (error) => {
          switch (error.code) {
            case error.PERMISSION_DENIED:
              setLocationError(
                "Please enable location access in your device settings. If you're using a mobile device, make sure to allow location access."
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
    <div className="height-100 flex justify-center items-center flex-col dark:bg-gray-900 dark:text-gray-200">
      {weatherData.current_weather ? (
        <>
          <p className="text-xl font-medium">Currently</p>
          {cacheLocationData !== 0 && (
            <p className="text-xs font-medium pt-3">
              <span className="text-gray-400">Location:</span>{" "}
              {cacheLocationData.city}
            </p>
          )}
          {!gotLocation && (
            <div
              onClick={getGeoLocation}
              className="flex flex-row items-center justify-center gap-2 border-2 dark:border-gray-700 px-4 py-1 text-[13px] mt-4 cursor-pointer rounded-full dark:text-blue-400 fill-current dark:bg-slate-800"
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
          {locationError && (
            <p className="mt-4 text-sm text-red-600 dark:text-red-400 max-w-xs text-center">
              {locationError}
            </p>
          )}
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
            {localDay()} &middot; {currentDisplayLocation}
          </p>
        </>
      ) : (
        <Placeholder />
      )}
    </div>
  );
}

export default App;
