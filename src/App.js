import React from 'react';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import SearchBar from './components/SearchBar';
import AnimeCard from './components/AnimeCard';
import { searchAnime, getSeasonalAnime } from './services/animeApi';
import './App.css';

const queryClient = new QueryClient();

function AnimeList() {
  const [searchQuery, setSearchQuery] = React.useState('');
  
  const { data: searchResults, isLoading: searchLoading } = useQuery({
    queryKey: ['animeSearch', searchQuery],
    queryFn: () => searchAnime(searchQuery),
    enabled: !!searchQuery
  });

  const { data: seasonalAnime, isLoading: seasonalLoading } = useQuery({
    queryKey: ['seasonalAnime'],
    queryFn: getSeasonalAnime
  });

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center mb-8">Anime Tracker</h1>
      <SearchBar onSearch={handleSearch} />
      
      {(searchLoading || seasonalLoading) && (
        <div className="text-center py-4">Loading...</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {searchQuery && searchResults?.data?.map((anime) => (
          <AnimeCard key={anime.id} anime={anime.node} />
        ))}
        
        {!searchQuery && seasonalAnime?.data?.map((anime) => (
          <AnimeCard key={anime.id} anime={anime.node} />
        ))}
      </div>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-gray-100">
        <AnimeList />
      </div>
    </QueryClientProvider>
  );
}

export default App;