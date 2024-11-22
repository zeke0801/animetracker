import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { getSeasonalAnime } from './services/animeApi';
import './App.css';

function App() {
  const [timeFilter, setTimeFilter] = useState('today');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isCompactView, setIsCompactView] = useState(() => {
    return localStorage.getItem('compactView') === 'true';
  });
  const [showQR, setShowQR] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('compactView', isCompactView);
  }, [isCompactView]);

  useEffect(() => {
    localStorage.setItem('favorites', JSON.stringify(favorites));
  }, [favorites]);

  const { data: seasonalAnime, isLoading: isSeasonalLoading } = useQuery({
    queryKey: ['seasonal'],
    queryFn: getSeasonalAnime,
  });

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
  };

  const toggleFavorite = (animeId) => {
    setFavorites(prev => {
      if (prev.includes(animeId)) {
        return prev.filter(id => id !== animeId);
      } else {
        return [...prev, animeId];
      }
    });
  };

  const filterAnimeByTime = (anime) => {
    // Skip if no broadcast info or if it's dubbed/non-Japanese
    if (!anime?.node?.broadcast?.day_of_the_week) return false;
    if (anime.node.media_type === 'dub') return false;
    
    // Check if it's current season anime
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentSeason = getCurrentSeason();
    
    const animeStartSeason = anime.node.start_season;
    if (!animeStartSeason || 
        animeStartSeason.year !== currentYear || 
        animeStartSeason.season !== currentSeason) {
      return false;
    }

    const today = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayName = daysOfWeek[today.getDay()].toLowerCase();
    const animeDay = anime.node.broadcast.day_of_the_week.toLowerCase();
    
    switch (timeFilter) {
      case 'today':
        return animeDay === todayName;
      case 'tomorrow': {
        const tomorrowIndex = (today.getDay() + 1) % 7;
        const tomorrowName = daysOfWeek[tomorrowIndex].toLowerCase();
        return animeDay === tomorrowName;
      }
      case 'past-week': {
        const currentDayIndex = today.getDay();
        const pastWeekDays = [];
        for (let i = 7; i >= 0; i--) {
          const dayIndex = (currentDayIndex - i + 7) % 7;
          pastWeekDays.push(daysOfWeek[dayIndex]);
        }
        return pastWeekDays.includes(animeDay);
      }
      default:
        return true;
    }
  };

  const sortAnimeByFavorites = (animeList) => {
    if (!animeList) return [];
    
    return [...animeList].sort((a, b) => {
      const aIsFavorite = favorites.includes(a.node.id);
      const bIsFavorite = favorites.includes(b.node.id);
      
      if (aIsFavorite && !bIsFavorite) return -1;
      if (!aIsFavorite && bIsFavorite) return 1;
      
      // If both are favorites or both are not, sort by broadcast time
      const aTime = a.node.broadcast?.start_time || '';
      const bTime = b.node.broadcast?.start_time || '';
      return aTime.localeCompare(bTime);
    });
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // getMonth() returns 0-11
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
  };

  const filteredAnime = sortAnimeByFavorites(seasonalAnime?.data?.filter(filterAnimeByTime));

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      {/* QR Code Modal */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity">
          <div className="relative bg-white dark:bg-gray-800 p-8 rounded-lg shadow-xl">
            <button
              onClick={() => setShowQR(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors"
              aria-label="Close QR code"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <QRCodeSVG
              value="https://animetrackerbyz.netlify.app"
              size={256}
              bgColor="transparent"
              fgColor="currentColor"
              className="text-gray-900 dark:text-white"
            />
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
              Anime Tracker
            </h1>
            <p className="mt-1 text-gray-600 dark:text-gray-400 text-lg">
              Is your favorite anime airing today?
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowQR(true)}
              className="bg-white dark:bg-gray-800 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
              aria-label="Show QR code"
            >
              <QRCodeSVG
                value="https://animetrackerbyz.netlify.app"
                size={32}
                bgColor="transparent"
                fgColor="currentColor"
                className="text-gray-900 dark:text-white"
              />
            </button>
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <svg className="w-6 h-6 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Time Filter Buttons and View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors ${
                timeFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors ${
                timeFilter === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('tomorrow')}
              className={`px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors ${
                timeFilter === 'tomorrow'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setTimeFilter('past-week')}
              className={`px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors ${
                timeFilter === 'past-week'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Past Week
            </button>
          </div>
          
          <button
            onClick={() => setIsCompactView(!isCompactView)}
            className="p-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            aria-label="Toggle view mode"
          >
            {isCompactView ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5z" />
              </svg>
            )}
          </button>
        </div>

        {/* Anime Grid */}
        <div className={`grid gap-6 ${
          isCompactView 
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {filteredAnime?.map((anime) => (
            <div key={anime.node.id} className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden transition-transform duration-200 hover:scale-105 ${
              isCompactView ? 'p-2' : 'p-4'
            }`}>
              <div className="relative">
                <img
                  src={anime.node.main_picture?.large || anime.node.main_picture?.medium}
                  alt={anime.node.title}
                  className="w-full h-48 object-cover rounded"
                />
                <button
                  onClick={() => toggleFavorite(anime.node.id)}
                  className="absolute top-2 right-2 p-2 rounded-full bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                >
                  {favorites.includes(anime.node.id) ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>
              <div className={`${isCompactView ? 'mt-2' : 'mt-4'}`}>
                <h3 className={`font-bold text-gray-900 dark:text-white ${
                  isCompactView ? 'text-sm' : 'text-lg'
                }`}>
                  {anime.node.title}
                </h3>
                <div className="mt-2 space-y-1">
                  {anime.node.broadcast?.day_of_the_week && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Airs: {anime.node.broadcast.day_of_the_week} at {anime.node.broadcast.start_time} (JST)
                    </p>
                  )}
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Rating: {anime.node.rating || 'N/A'}
                  </p>
                  {anime.node.start_season && (
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Season: {anime.node.start_season.season} {anime.node.start_season.year}
                    </p>
                  )}
                  {anime.node.genres && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {anime.node.genres.map((genre, index) => (
                        <span
                          key={index}
                          className={`inline-block text-xs px-2 py-0.5 rounded-full ${
                            isCompactView 
                              ? 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                              : 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300'
                          }`}
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Loading States */}
        {isSeasonalLoading && (
          <div className="flex justify-center items-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Powered by <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">MAL</a> <br />
          Created by Zeke
        </footer>
      </div>
    </div>
  );
}

export default App;