import { useState, useEffect } from 'react';
import { Cloud, Sun, CloudRain, CloudSnow, CloudLightning, Sparkles } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface WeatherData {
  temp: number;
  condition: string;
  location: string;
}

const getTimeOfDayGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Good morning';
  if (hour >= 12 && hour < 17) return 'Good afternoon';
  if (hour >= 17 && hour < 21) return 'Good evening';
  return 'Good night';
};

const getWeatherIcon = (condition: string) => {
  const lowerCondition = condition.toLowerCase();
  if (lowerCondition.includes('rain') || lowerCondition.includes('drizzle')) {
    return <CloudRain className="h-5 w-5 text-blue-400" />;
  }
  if (lowerCondition.includes('snow')) {
    return <CloudSnow className="h-5 w-5 text-blue-200" />;
  }
  if (lowerCondition.includes('thunder') || lowerCondition.includes('storm')) {
    return <CloudLightning className="h-5 w-5 text-yellow-400" />;
  }
  if (lowerCondition.includes('cloud') || lowerCondition.includes('overcast')) {
    return <Cloud className="h-5 w-5 text-muted-foreground" />;
  }
  return <Sun className="h-5 w-5 text-yellow-400" />;
};

export function GreetingHeader() {
  const { user } = useAuth();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string>('');
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loadingWeather, setLoadingWeather] = useState(true);

  // Fetch profile data
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      
      try {
        const { data } = await supabase
          .from('profiles')
          .select('display_name, avatar_url')
          .eq('user_id', user.id)
          .maybeSingle();
        
        if (data) {
          setAvatarUrl(data.avatar_url);
          setDisplayName(data.display_name || '');
        } else {
          // Fallback to user metadata
          setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
          setAvatarUrl(user.user_metadata?.avatar_url || null);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setDisplayName(user.user_metadata?.display_name || user.email?.split('@')[0] || '');
      }
    };

    fetchProfile();
  }, [user]);

  // Fetch weather using geolocation
  useEffect(() => {
    const fetchWeather = async () => {
      setLoadingWeather(true);
      
      try {
        // Get user's location
        if ('geolocation' in navigator) {
          navigator.geolocation.getCurrentPosition(
            async (position) => {
              const { latitude, longitude } = position.coords;
              
              try {
                // Using Open-Meteo API (free, no API key required)
                const response = await fetch(
                  `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
                );
                const data = await response.json();
                
                // Get location name using reverse geocoding
                const geoResponse = await fetch(
                  `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
                );
                const geoData = await geoResponse.json();
                
                const weatherCodes: Record<number, string> = {
                  0: 'Clear',
                  1: 'Mainly Clear',
                  2: 'Partly Cloudy',
                  3: 'Overcast',
                  45: 'Foggy',
                  48: 'Foggy',
                  51: 'Light Drizzle',
                  53: 'Drizzle',
                  55: 'Heavy Drizzle',
                  61: 'Light Rain',
                  63: 'Rain',
                  65: 'Heavy Rain',
                  71: 'Light Snow',
                  73: 'Snow',
                  75: 'Heavy Snow',
                  80: 'Rain Showers',
                  81: 'Rain Showers',
                  82: 'Heavy Rain Showers',
                  85: 'Snow Showers',
                  86: 'Heavy Snow Showers',
                  95: 'Thunderstorm',
                  96: 'Thunderstorm with Hail',
                  99: 'Thunderstorm with Heavy Hail',
                };
                
                setWeather({
                  temp: Math.round(data.current.temperature_2m),
                  condition: weatherCodes[data.current.weather_code] || 'Clear',
                  location: geoData.address?.city || geoData.address?.town || geoData.address?.county || '',
                });
              } catch (error) {
                console.error('Error fetching weather:', error);
              }
              setLoadingWeather(false);
            },
            () => {
              // Geolocation denied or failed
              setLoadingWeather(false);
            },
            { timeout: 5000 }
          );
        } else {
          setLoadingWeather(false);
        }
      } catch (error) {
        console.error('Error with geolocation:', error);
        setLoadingWeather(false);
      }
    };

    fetchWeather();
  }, []);

  const greeting = getTimeOfDayGreeting();
  const initials = displayName ? displayName.slice(0, 2).toUpperCase() : 'U';

  return (
    <div className="flex items-center gap-4 mb-6">
      {/* Avatar */}
      <Avatar className="h-16 w-16 border-4 border-primary/20 shadow-lg">
        <AvatarImage src={avatarUrl || undefined} alt={displayName} />
        <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
          {initials}
        </AvatarFallback>
      </Avatar>
      
      {/* Greeting and Weather */}
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-primary">
            {greeting}{displayName ? `, ${displayName}` : ''}!
          </h1>
        </div>
        <p className="text-muted-foreground flex items-center gap-2">
          <span>Here's what's happening with your content today.</span>
          {weather && (
            <span className="inline-flex items-center gap-1.5 text-sm bg-muted/50 px-2 py-0.5 rounded-full">
              {getWeatherIcon(weather.condition)}
              <span>{weather.temp}°</span>
              {weather.location && <span className="text-muted-foreground/70">in {weather.location}</span>}
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
