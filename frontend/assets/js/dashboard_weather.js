(() => {
  const status = document.getElementById('dashboard-weather-status');
  const content = document.getElementById('dashboard-weather-content');
  const retry = document.getElementById('dashboard-weather-retry');
  if (!status || !content || !retry) return;

  const weatherNames = {
    0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
    45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Drizzle',
    55: 'Dense drizzle', 56: 'Freezing drizzle', 57: 'Dense freezing drizzle',
    61: 'Slight rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain',
    67: 'Heavy freezing rain', 71: 'Slight snow', 73: 'Snow', 75: 'Heavy snow',
    77: 'Snow grains', 80: 'Rain showers', 81: 'Rain showers', 82: 'Heavy rain showers',
    85: 'Snow showers', 86: 'Heavy snow showers', 95: 'Thunderstorm',
    96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail'
  };
  const weatherIcons = code => code === 0 ? '☀️' : [1,2].includes(code) ? '🌤️' : [3,45,48].includes(code) ? '☁️' : [51,53,55,56,57,61,63,65,66,67,80,81,82].includes(code) ? '🌧️' : [71,73,75,77,85,86].includes(code) ? '❄️' : '⛈️';
  const safe = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  function showFallback(message) {
    status.textContent = message;
    content.innerHTML = '<div class="weather-fallback"><span class="weather-fallback-icon">📍</span><div><strong>Location weather unavailable</strong><p>Allow location access or search for your town manually.</p><a class="weather-manual-link" href="weather.html">Open Weather page →</a></div></div>';
  }

  async function loadWeather(lat, lon) {
    status.textContent = 'Location found. Loading nearby weather…';
    content.innerHTML = '<div class="weather-loading"><span class="weather-loader"></span><span>Loading live weather…</span></div>';
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(lat)}&longitude=${encodeURIComponent(lon)}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max,weather_code&forecast_days=5&timezone=auto`;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Weather service returned an error');
      const data = await response.json();
      if (!data.current || !data.daily) throw new Error('Weather data is incomplete');
      const c = data.current;
      const d = data.daily;
      let locationName = 'Your current location';


try {
  const geoUrl =
    `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${encodeURIComponent(lat)}&lon=${encodeURIComponent(lon)}&zoom=10&addressdetails=1`;

  const geoResponse = await fetch(geoUrl);

  if (geoResponse.ok) {
    const geoData = await geoResponse.json();
    const address = geoData.address || {};

    const place =
      address.village ||
      address.town ||
      address.city ||
      address.hamlet ||
      address.municipality ||
      address.suburb;

    locationName = [
      place,
      address.county || address.state_district,
      address.state
    ].filter(Boolean)
     .filter((value, index, array) => array.indexOf(value) === index)
     .join(', ') || locationName;
  }
} catch (error) {
  console.warn('Location name lookup failed:', error);
}

      const todayCode = Number(c.weather_code);
      const days = (d.time || []).slice(0,5).map((date, i) => {
        const day = i === 0 ? 'Today' : new Date(`${date}T12:00:00`).toLocaleDateString(undefined,{weekday:'short'});
        return `<div class="weather-day"><span>${safe(day)}</span><span class="weather-day-icon">${weatherIcons(Number(d.weather_code[i]))}</span><strong>${Math.round(d.temperature_2m_max[i])}°</strong><small>${Math.round(d.temperature_2m_min[i])}° · ${d.precipitation_probability_max?.[i] ?? '—'}% rain</small></div>`;
      }).join('');
      content.innerHTML = `<div class="weather-current-card"><div class="weather-big-icon">${weatherIcons(todayCode)}</div><div><small>${safe(locationName)}</small><strong class="weather-temperature">${Math.round(c.temperature_2m)}°C</strong><p>${safe(weatherNames[todayCode] || 'Current conditions')}</p><span>Feels like ${Math.round(c.apparent_temperature)}°C</span></div></div><div class="weather-stat-grid"><div class="weather-stat"><span>💧</span><small>Humidity</small><strong>${c.relative_humidity_2m}%</strong></div><div class="weather-stat"><span>🌬️</span><small>Wind</small><strong>${Math.round(c.wind_speed_10m)} km/h</strong></div><div class="weather-stat"><span>🌧️</span><small>Precipitation</small><strong>${c.precipitation} mm</strong></div></div><div class="weather-forecast"><div class="weather-forecast-title">5-day outlook</div>${days}</div>`;
      status.textContent = 'Weather updated from your device location.';

// Update dashboard Weather Behaviour cards
const heatValue = document.getElementById('weather-heat-value');
const heatStatus = document.getElementById('weather-heat-status');
const rainValue = document.getElementById('weather-rain-value');
const rainStatus = document.getElementById('weather-rain-status');
const windValue = document.getElementById('weather-wind-value');
const windStatus = document.getElementById('weather-wind-status');
const reminder = document.getElementById('weather-reminder');
const alertsStatus = document.getElementById('weather-alerts-status');
const outlook = document.getElementById('dashboard-weather-outlook');

const maxTemp = Math.max(...(d.temperature_2m_max || []).filter(Number.isFinite));
const rainProb = Math.max(...(d.precipitation_probability_max || []).filter(Number.isFinite));
const windSpeed = Number(c.wind_speed_10m);

if (heatValue && heatStatus) {
  heatValue.textContent = Number.isFinite(maxTemp) ? `${Math.round(maxTemp)}°C maximum` : 'Unavailable';
  heatStatus.textContent = maxTemp >= 40 ? 'High heat risk' :
    maxTemp >= 35 ? 'Hot conditions' : 'No extreme heat detected';
}

if (rainValue && rainStatus) {
  rainValue.textContent = Number.isFinite(rainProb) ? `${rainProb}% chance` : 'Unavailable';
  rainStatus.textContent = rainProb >= 80 ? 'High chance of rain' :
    rainProb >= 50 ? 'Rain is possible' : 'Lower rain probability';
}

if (windValue && windStatus) {
  windValue.textContent = Number.isFinite(windSpeed) ? `${Math.round(windSpeed)} km/h` : 'Unavailable';
  windStatus.textContent = windSpeed >= 40 ? 'Strong wind — take care' :
    windSpeed >= 25 ? 'Breezy conditions' : 'No strong wind detected';
}

if (reminder) {
  if (maxTemp >= 40) {
    reminder.textContent = 'Extreme heat may occur. Check soil moisture and crop water needs.';
  } else if (rainProb >= 80) {
    reminder.textContent = 'Rain is likely. Check field drainage and postpone unnecessary spraying.';
  } else if (windSpeed >= 40) {
    reminder.textContent = 'Strong winds are possible now. Take care with spraying and exposed equipment.';
  } else {
    reminder.textContent = 'Check your field conditions daily and review the forecast before irrigation or spraying.';
  }
}

if (alertsStatus) {
  alertsStatus.textContent = 'Weather behaviour is based on your current conditions and five-day forecast.';
}

if (outlook) {
  outlook.innerHTML = (d.time || []).slice(0, 5).map((date, i) => {
    const day = i === 0 ? 'Today' :
      new Date(`${date}T12:00:00`).toLocaleDateString(undefined, { weekday: 'short' });
    const high = d.temperature_2m_max?.[i];
    const low = d.temperature_2m_min?.[i];
    const rain = d.precipitation_probability_max?.[i];

    return `
      <article class="weather-outlook-card">
        <strong>${safe(day)}</strong>
        <span>${weatherIcons(Number(d.weather_code?.[i]))}</span>
        <p>${Number.isFinite(high) ? Math.round(high) + '°' : '—'} / ${Number.isFinite(low) ? Math.round(low) + '°' : '—'}</p>
        <small>${rain ?? '—'}% rain chance</small>
      </article>`;
  }).join('');
}
    } catch (error) {
      showFallback('Could not load weather right now. You can retry or choose a city.');
    }
  }

  
function detectLocation() {
  if (!navigator.geolocation) {
    showFallback('Your browser does not support location detection.');
    return;
  }

  status.textContent = 'Requesting your location permission…';
  content.innerHTML = `
    <div class="weather-loading">
      <span class="weather-loader"></span>
      <span>Detecting your location…</span>
    </div>`;

  navigator.geolocation.getCurrentPosition(
    async position => {
      const { latitude, longitude } = position.coords;

      // First try the direct weather request.
      await loadWeather(latitude, longitude);
    },
    error => {
      let message;

      if (error.code === 1) {
        message = 'Location access is blocked. Allow it in Chrome site settings.';
      } else if (error.code === 2) {
        message = 'Your device could not determine its location. Check Windows location services.';
      } else {
        message = 'Location detection timed out. Please try again.';
      }

      showFallback(message);
    },
    {
      enableHighAccuracy: false,
      timeout: 25000,
      maximumAge: 600000
    }
  );
}

  retry.addEventListener('click', detectLocation);
  detectLocation();
})();
