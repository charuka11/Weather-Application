
import { useState, useEffect } from "react";
import "./App.css";

function getWeather(code) {
  if (code === 0) return { text: "Clear Sky", icon: "☀️" };
  if (code === 1 || code === 2) return { text: "Partly Cloudy", icon: "🌤️" };
  if (code === 3) return { text: "Cloudy", icon: "☁️" };
  if ([45, 48].includes(code)) return { text: "Foggy", icon: "🌫️" };
  if ([51, 53, 55, 56, 57].includes(code)) return { text: "Drizzle", icon: "🌦️" };

  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) {
    return { text: "Rainy", icon: "🌧️" };
  }

  if ([71, 73, 75, 77, 85, 86].includes(code)) {
    return { text: "Snowy", icon: "❄️" };
  }

  if ([95, 96, 99].includes(code)) {
    return { text: "Thunderstorm", icon: "⛈️" };
  }

  return { text: "Unknown", icon: "🌡️" };
}

function App() {
  const [city, setCity] = useState("Colombo");
  const [search, setSearch] = useState("");
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function getWeatherData(cityName) {
    if (!cityName.trim()) {
      setError("Please enter a city name.");
      return;
    }

    setLoading(true);
    setError("");
    setWeather(null);
    setForecast([]);

    try {
      // Find city coordinates
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(cityName)}&count=1&language=en&format=json`
      );

      if (!geoResponse.ok) {
        throw new Error("Unable to search for this city.");
      }

      const geoData = await geoResponse.json();

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error("City not found. Please try another city.");
      }

      const place = geoData.results[0];

      // Get current weather and daily forecast
      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto&forecast_days=7`
      );

      if (!weatherResponse.ok) {
        throw new Error("Unable to load weather information.");
      }

      const weatherData = await weatherResponse.json();

      setCity(`${place.name}${place.country ? ", " + place.country : ""}`);
      setWeather(weatherData.current);

      const dailyForecast = weatherData.daily.time.map((date, index) => ({
        date,
        code: weatherData.daily.weather_code[index],
        max: weatherData.daily.temperature_2m_max[index],
        min: weatherData.daily.temperature_2m_min[index],
      }));

      setForecast(dailyForecast);
      setSearch("");

    } catch (err) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    getWeatherData("Colombo");
  }, []);

  function handleSearch(event) {
    event.preventDefault();
    getWeatherData(search);
  }

  // Today's forecast
  const todayForecast = forecast[0];

  // Remaining six days
  const nextSixDays = forecast.slice(1);

  const todayName = todayForecast
    ? new Date(todayForecast.date + "T12:00:00").toLocaleDateString(
        "en-US",
        { weekday: "long" }
      )
    : "";

  return (
    <div className="app">

      <header className="header">
        <h1>☁️ WeatherNow</h1>
        <p>Your daily weather companion</p>
      </header>

      <main className="container">

        {/* Search Section */}
        <form className="search-form" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Enter city name..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>

        {error && <p className="error">{error}</p>}

        {loading && <p className="loading">Loading weather...</p>}

        {weather && !loading && (
          <>

            {/* Current Temperature */}
            <section className="weather-card">

              <p className="location">📍 {city}</p>

              <h2 className="weather-heading">
                Current Temperature
              </h2>

              <div className="main-weather">

                <span className="weather-icon">
                  {getWeather(weather.weather_code).icon}
                </span>

                <div>
                  <h2>{Math.round(weather.temperature_2m)}°C</h2>
                  <p>{getWeather(weather.weather_code).text}</p>
                </div>

              </div>

              <p className="feels">
                Feels like {Math.round(weather.apparent_temperature)}°C
              </p>

              <div className="details">

                <div className="detail-box">
                  <span>💧</span>
                  <p>Humidity</p>
                  <h3>{weather.relative_humidity_2m}%</h3>
                </div>

                <div className="detail-box">
                  <span>💨</span>
                  <p>Wind Speed</p>
                  <h3>{weather.wind_speed_10m} km/h</h3>
                </div>

                <div className="detail-box">
                  <span>🌧️</span>
                  <p>Precipitation</p>
                  <h3>{weather.precipitation} mm</h3>
                </div>

              </div>
            </section>

            {/* Today's Forecast */}
            {todayForecast && (
              <section className="today-section">

                <h2>Today's Forecast</h2>
                <p className="today-date">{todayName}</p>

                <div className="today-card">

                  <div className="today-weather">
                    <span className="today-icon">
                      {getWeather(todayForecast.code).icon}
                    </span>

                    <div>
                      <h3>{getWeather(todayForecast.code).text}</h3>
                      <p>Today's weather condition</p>
                    </div>
                  </div>

                  <div className="today-temperatures">

                    <div>
                      <p>Maximum Temperature</p>
                      <h2>{Math.round(todayForecast.max)}°C</h2>
                    </div>

                    <div>
                      <p>Minimum Temperature</p>
                      <h2>{Math.round(todayForecast.min)}°C</h2>
                    </div>

                  </div>

                </div>
              </section>
            )}

            {/* Next Six Days Forecast */}
            <section className="forecast-section">

              <h2>Next 6 Days Weather Forecast</h2>

              <div className="forecast-list">

                {nextSixDays.map((day) => (

                  <div className="forecast-card" key={day.date}>

                    <p>
                      {new Date(day.date + "T12:00:00").toLocaleDateString(
                        "en-US",
                        { weekday: "short" }
                      )}
                    </p>

                    <span>{getWeather(day.code).icon}</span>

                    <h3>{Math.round(day.max)}°C</h3>

                    <p className="min-temp">
                      {Math.round(day.min)}°C
                    </p>

                    <small>{getWeather(day.code).text}</small>

                  </div>

                ))}

              </div>
            </section>

          </>
        )}

      </main>

      <footer>
        <p>© 2026</p>
      </footer>

    </div>
  );
}

export default App;
