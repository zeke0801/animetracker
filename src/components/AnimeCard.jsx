import React from 'react';

const AnimeCard = ({ anime, isCompactView, setSelectedAnime }) => {
    return (
        <div className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition-shadow duration-300">
            <img
                src={anime.main_picture?.medium}
                alt={anime.title}
                className="w-full h-64 object-cover"
                loading="lazy" // Add lazy loading for better performance
            />
            {isCompactView ? (
              // Compact view with overlay title
              <div 
                className="relative h-[120px] group cursor-pointer rounded-lg overflow-hidden" 
                key={anime.node.id}
                onClick={() => setSelectedAnime(anime)}
              >
                <h3 className="text-lg font-semibold mb-2 px-4 pb-2 pr-4">{anime.title}</h3>
              </div>
            ) : (
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2 px-4 pb-2 pr-4">{anime.title}</h3>
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                    <span>Score: {anime.mean || 'N/A'}</span>
                    <span>Episodes: {anime.num_episodes || 'N/A'}</span>
                </div>
                <p className="text-gray-700 text-sm line-clamp-3">
                    {anime.synopsis || 'No synopsis available.'}
                </p>
              </div>
            )}
        </div>
    );
};

export default AnimeCard;
