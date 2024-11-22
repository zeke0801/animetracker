import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QRCodeSVG } from 'qrcode.react';
import { getSeasonalAnime } from './services/animeApi';
import './App.css';

// Helper functions for localStorage
const STORAGE_DOMAIN = 'animetracker.';
const getStorageItem = (key, defaultValue) => {
  try {
    const item = localStorage.getItem(STORAGE_DOMAIN + key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
};

const setStorageItem = (key, value) => {
  try {
    localStorage.setItem(STORAGE_DOMAIN + key, JSON.stringify(value));
  } catch (error) {
    console.error('Error saving to localStorage:', error);
  }
};

function App() {
  const [timeFilter, setTimeFilter] = useState('today');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return getStorageItem('darkMode', true);
  });
  const [isCompactView, setIsCompactView] = useState(() => {
    return getStorageItem('compactView', false);
  });
  const [showQR, setShowQR] = useState(false);
  const [favorites, setFavorites] = useState(() => {
    return getStorageItem('favorites', []);
  });
  const [selectedAnime, setSelectedAnime] = useState(null);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    setStorageItem('darkMode', isDarkMode);
  }, [isDarkMode]);

  useEffect(() => {
    setStorageItem('compactView', isCompactView);
  }, [isCompactView]);

  useEffect(() => {
    setStorageItem('favorites', favorites);
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
      const newFavorites = prev.includes(animeId)
        ? prev.filter(id => id !== animeId)
        : [...prev, animeId];
      return newFavorites;
    });
  };

  const getCurrentSeason = () => {
    const month = new Date().getMonth() + 1;
    if (month >= 1 && month <= 3) return 'winter';
    if (month >= 4 && month <= 6) return 'spring';
    if (month >= 7 && month <= 9) return 'summer';
    return 'fall';
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
    
    if (timeFilter === 'favorites') {
      return favorites.includes(anime.node.id);
    }

    if (timeFilter === 'all') {
      return true;
    }

    const today = new Date();
    const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    const todayIndex = today.getDay();
    const animeDay = daysOfWeek.indexOf(anime.node.broadcast.day_of_the_week.toLowerCase());

    switch (timeFilter) {
      case 'today':
        return animeDay === todayIndex;
      case 'tomorrow':
        return animeDay === (todayIndex + 1) % 7;
      default:
        return true;
    }
  };

  const sortAnimeByBroadcastTime = (animeList) => {
    if (!animeList) return [];
    
    return [...animeList].sort((a, b) => {
      // Convert day and time to comparable values
      const daysOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      const aDay = daysOfWeek.indexOf(a.node.broadcast.day_of_the_week.toLowerCase());
      const bDay = daysOfWeek.indexOf(b.node.broadcast.day_of_the_week.toLowerCase());
      
      const aTime = a.node.broadcast.start_time || '';
      const bTime = b.node.broadcast.start_time || '';
      
      if (aDay === bDay) {
        return aTime.localeCompare(bTime);
      }
      return aDay - bDay;
    });
  };

  const filteredAnime = sortAnimeByBroadcastTime(seasonalAnime?.data?.filter(filterAnimeByTime));

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

      {/* Modal */}
      {selectedAnime && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {selectedAnime.node.title}
                </h2>
                <button
                  onClick={() => setSelectedAnime(null)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <img
                    src={selectedAnime.node.main_picture.large}
                    alt={selectedAnime.node.title}
                    className="w-full rounded-lg shadow-lg"
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleFavorite(selectedAnime.node.id);
                    }}
                    className="w-full py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 transition-colors"
                  >
                    {favorites.includes(selectedAnime.node.id) ? (
                      <>
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                        </svg>
                        Remove from Favorites
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        Add to Favorites
                      </>
                    )}
                  </button>
                </div>
                
                <div className="space-y-4">
                  {selectedAnime.node.broadcast && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Broadcast</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedAnime.node.broadcast.day_of_the_week} at {selectedAnime.node.broadcast.start_time} (JST)
                      </p>
                    </div>
                  )}
                  
                  {selectedAnime.node.start_season && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Season</h3>
                      <p className="text-gray-600 dark:text-gray-300">
                        {selectedAnime.node.start_season.season} {selectedAnime.node.start_season.year}
                      </p>
                    </div>
                  )}

                  {selectedAnime.node.genres && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Genres</h3>
                      <div className="flex flex-wrap gap-2">
                        {selectedAnime.node.genres.map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAnime.node.streaming && selectedAnime.node.streaming.length > 0 && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Streaming On</h3>
                      <div className="flex flex-wrap gap-3">
                        {selectedAnime.node.streaming.map((stream, index) => (
                          <a
                            key={index}
                            href={stream.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center hover:opacity-80"
                          >
                            {stream.name.toLowerCase().includes('crunchyroll') && (
                              <img
                                src="https://static.crunchyroll.com/cr-assets/2.0/crunchyroll_logo.png"
                                alt="Crunchyroll"
                                className="h-6 w-auto"
                              />
                            )}
                            {stream.name.toLowerCase().includes('funimation') && (
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Funimation_Logo.svg/1200px-Funimation_Logo.svg.png"
                                alt="Funimation"
                                className="h-6 w-auto"
                              />
                            )}
                            {!stream.name.toLowerCase().includes('crunchyroll') &&
                              !stream.name.toLowerCase().includes('funimation') && (
                                <span className="text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                  {stream.name}
                                </span>
                              )}
                          </a>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedAnime.node.synopsis && (
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">Synopsis</h3>
                      <p className="text-gray-600 dark:text-gray-300 text-sm">
                        {selectedAnime.node.synopsis}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
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
                  <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646L12 7.636l-1.318-1.318a9.003 9.003 0 00-8.354 0z" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Time Filter Buttons and View Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6">
          <div className="flex space-x-2">
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
              onClick={() => setTimeFilter('favorites')}
              className={`px-4 py-2 rounded-lg font-medium text-[0.9rem] transition-colors ${
                timeFilter === 'favorites'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Favorites
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
            isCompactView ? (
              // Compact view with overlay title
              <div 
                className="relative h-[120px] group cursor-pointer" 
                key={anime.node.id}
                onClick={() => setSelectedAnime(anime)}
              >
                <img
                  src={anime.node.main_picture?.medium || anime.node.main_picture?.large}
                  alt={anime.node.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 transition-opacity">
                  <h3 className="text-white text-center font-medium text-sm line-clamp-2">
                    {anime.node.title}
                  </h3>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(anime.node.id);
                  }}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black bg-opacity-50 hover:bg-opacity-70 transition-colors"
                >
                  {favorites.includes(anime.node.id) ? (
                    <svg className="w-5 h-5 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                  )}
                </button>
              </div>
            ) : (
              // Detailed view (existing code)
              <div 
                key={anime.node.id} 
                className={`bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden transition-transform duration-200 hover:scale-[1.02] cursor-pointer`}
                onClick={() => setSelectedAnime(anime)}
              >
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
                <div className="mt-4">
                  <h3 className="font-bold text-gray-900 dark:text-white text-lg">
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
                    {anime.node.streaming && anime.node.streaming.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        <span className="text-sm text-gray-600 dark:text-gray-300">Stream:</span>
                        {anime.node.streaming.map((stream, index) => (
                          <a
                            key={index}
                            href={stream.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center"
                          >
                            {stream.name.toLowerCase().includes('crunchyroll') && (
                              <img
                                src="https://static.crunchyroll.com/cr-assets/2.0/crunchyroll_logo.png"
                                alt="Crunchyroll"
                                className="h-4 w-auto"
                              />
                            )}
                            {stream.name.toLowerCase().includes('funimation') && (
                              <img
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/d/d6/Funimation_Logo.svg/1200px-Funimation_Logo.svg.png"
                                alt="Funimation"
                                className="h-4 w-auto"
                              />
                            )}
                            {!stream.name.toLowerCase().includes('crunchyroll') &&
                              !stream.name.toLowerCase().includes('funimation') && (
                                <span className="text-sm text-blue-500 hover:text-blue-600 dark:text-blue-400 dark:hover:text-blue-300">
                                  {stream.name}
                                </span>
                              )}
                          </a>
                        ))}
                      </div>
                    )}
                    {anime.node.genres && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {anime.node.genres?.slice(0, isCompactView ? 2 : undefined).map((genre, index) => (
                          <span
                            key={index}
                            className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100 rounded-full"
                          >
                            {genre}
                          </span>
                        ))}
                        {isCompactView && anime.node.genres?.length > 2 && (
                          <span className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 rounded-full">
                            +{anime.node.genres.length - 2}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )
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