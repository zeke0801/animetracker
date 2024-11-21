import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { searchAnime, getSeasonalAnime } from './services/animeApi';
import './App.css';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState('today');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('darkMode') === 'true';
  });
  const [isCompactView, setIsCompactView] = useState(() => {
    return localStorage.getItem('compactView') === 'true';
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

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['search', searchTerm],
    queryFn: () => searchAnime(searchTerm),
    enabled: searchTerm.length > 0,
  });

  const { data: seasonalAnime, isLoading: isSeasonalLoading } = useQuery({
    queryKey: ['seasonal'],
    queryFn: getSeasonalAnime,
  });

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
  };

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
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

  // Helper function to get current season
  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1; // getMonth() returns 0-11
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
  };

  const filteredAnime = (searchTerm ? searchResults?.data : seasonalAnime?.data)?.filter(filterAnimeByTime);

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900 transition-colors duration-200">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white">
            Anime Tracker
          </h1>
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

        {/* Time Filter Buttons and View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setTimeFilter('all')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === 'all'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setTimeFilter('today')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === 'today'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Today
            </button>
            <button
              onClick={() => setTimeFilter('tomorrow')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                timeFilter === 'tomorrow'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Tomorrow
            </button>
            <button
              onClick={() => setTimeFilter('past-week')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
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

        {/* Search Input */}
        <div className="mb-8">
          <input
            type="text"
            placeholder="Search anime..."
            value={searchTerm}
            onChange={handleSearch}
            className="w-full p-4 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
          />
        </div>

        {/* Anime Grid */}
        <div className={`grid gap-6 ${
          isCompactView 
            ? 'grid-cols-2 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-2' 
            : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
        }`}>
          {filteredAnime?.map((anime) => (
            <div
              key={anime.node.id}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <img
                src={anime.node.main_picture.medium}
                alt={anime.node.title}
                className="w-full h-48 object-cover"
              />
              <div className={`p-4 ${isCompactView ? 'space-y-1' : 'space-y-2'}`}>
                <h2 className={`font-semibold text-gray-900 dark:text-white ${
                  isCompactView ? 'text-sm line-clamp-1' : 'text-xl mb-2'
                }`}>
                  {anime.node.title}
                </h2>
                {!isCompactView && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">
                    {anime.node.synopsis || 'No synopsis available'}
                  </p>
                )}
                {!isCompactView && anime.node.mean && (
                  <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                    Rating: {anime.node.mean}
                  </div>
                )}
                {anime.node.broadcast && (
                  <div className={`text-gray-500 dark:text-gray-400 ${
                    isCompactView ? 'text-xs' : 'text-sm mt-1'
                  }`}>
                    Airs: {anime.node.broadcast.day_of_the_week} at {anime.node.broadcast.start_time} (JST)
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* Loading States */}
        {(isSearchLoading || isSeasonalLoading) && (
          <div className="flex justify-center items-center mt-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 dark:border-white"></div>
          </div>
        )}

        {/* Footer */}
        <footer className="mt-12 py-4 text-center text-sm text-gray-600 dark:text-gray-400">
          Powered by <a href="https://myanimelist.net" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline">MAL</a>
        </footer>
      </div>
    </div>
  );
}

export default App;