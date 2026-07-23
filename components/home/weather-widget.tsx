import { CloudSun } from "lucide-react";

/**
 * Live Linton, Indiana conditions via Open-Meteo (no API key),
 * revalidated every 30 minutes. Fails silently to a weatherless
 * line if the API is unreachable.
 */

const WEATHER_LABELS: Record<number, string> = {
  0: "Clear skies",
  1: "Mostly clear",
  2: "Partly cloudy",
  3: "Overcast",
  45: "Foggy",
  48: "Foggy",
  51: "Drizzling",
  53: "Drizzling",
  55: "Drizzling",
  61: "Raining",
  63: "Raining",
  65: "Pouring",
  71: "Snowing",
  73: "Snowing",
  75: "Heavy snow",
  80: "Showers",
  81: "Showers",
  82: "Downpours",
  95: "Thunderstorms",
  96: "Thunderstorms",
  99: "Thunderstorms",
};

async function getLintonWeather(): Promise<{ tempF: number; label: string } | null> {
  try {
    const res = await fetch(
      "https://api.open-meteo.com/v1/forecast?latitude=39.0348&longitude=-87.1656&current=temperature_2m,weather_code&temperature_unit=fahrenheit",
      { next: { revalidate: 1800 } },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as {
      current?: { temperature_2m?: number; weather_code?: number };
    };
    if (typeof data.current?.temperature_2m !== "number") return null;
    return {
      tempF: Math.round(data.current.temperature_2m),
      label: WEATHER_LABELS[data.current.weather_code ?? -1] ?? "Weather",
    };
  } catch {
    return null;
  }
}

export async function WeatherWidget() {
  const weather = await getLintonWeather();

  return (
    <div className="flex items-center gap-4 rounded-lg border border-gold/25 bg-primary-light/40 px-5 py-4 backdrop-blur-sm">
      <CloudSun aria-hidden className="h-8 w-8 shrink-0 text-gold" />
      <div>
        {weather ? (
          <>
            <p className="font-serif text-xl font-semibold text-cream">
              {weather.tempF}°F · {weather.label} in Linton
            </p>
            <p className="text-sm text-cream/70">
              Inside The Bunker it&apos;s always 72° and tee time.
            </p>
          </>
        ) : (
          <>
            <p className="font-serif text-xl font-semibold text-cream">
              Whatever the weather in Linton —
            </p>
            <p className="text-sm text-cream/70">
              inside The Bunker it&apos;s always 72° and tee time.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
