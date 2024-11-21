import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import { searchAnime, getSeasonalAnime } from './services/animeApi';
import './App.css';

const queryClient = new QueryClient();

function App() {
  const [searchQuery, setSearchQuery] = React.useState('');

  const { data: searchResults, isLoading: isSearchLoading } = useQuery({
    queryKey: ['animeSearch', searchQuery],
    queryFn: () => searchAnime(searchQuery),
    enabled: searchQuery.length > 0,
  });

  const { data: seasonalAnime, isLoading: isSeasonalLoading } = useQuery({
    queryKey: ['seasonalAnime'],
    queryFn: getSeasonalAnime,
  });

  const handleSearch = (e) => {
    e.preventDefault();
    const query = e.target.elements.search.value;
    setSearchQuery(query);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        {/* Header */}
        <header className="bg-white shadow-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Title */}
              <div className="flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Track your Eps</h1>
              </div>
              
              {/* Search Bar */}
              <div className="flex-1 max-w-2xl mx-4">
                <form onSubmit={handleSearch} className="w-full">
                  <div className="relative">
                    <input
                      type="search"
                      name="search"
                      placeholder="Search anime..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      type="submit"
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </button>
                  </div>
                </form>
              </div>

              {/* Spacer for symmetry */}
              <div className="flex-shrink-0 w-32"></div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {isSearchLoading && <p>Loading search results...</p>}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {searchResults?.data?.map((anime) => (
              <div key={anime.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={anime.main_picture?.medium}
                  alt={anime.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2">{anime.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-3">{anime.synopsis}</p>
                </div>
              </div>
            ))}
            
            {!searchQuery && seasonalAnime?.data?.map((anime) => (
              <div key={anime.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <img
                  src={anime.main_picture?.medium}
                  alt={anime.title}
                  className="w-full h-64 object-cover"
                />
                <div className="p-4">
                  <h2 className="text-lg font-semibold mb-2">{anime.title}</h2>
                  <p className="text-sm text-gray-600 line-clamp-3">{anime.synopsis}</p>
                </div>
              </div>
            ))}
          </div>
          
          {isSeasonalLoading && <p>Loading seasonal anime...</p>}
        </main>
      </div>
    </QueryClientProvider>
  );
}

export default App;