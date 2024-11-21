const PROXY_URL = 'http://localhost:3001/api';

export const searchAnime = async (query) => {
    const response = await fetch(`${PROXY_URL}/anime?q=${encodeURIComponent(query)}&limit=20`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const getAnimeDetails = async (id) => {
    const response = await fetch(`${PROXY_URL}/anime/${id}?fields=id,title,main_picture,synopsis,mean,rank,popularity,num_episodes,status`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};

export const getSeasonalAnime = async () => {
    const response = await fetch(`${PROXY_URL}/anime/season`);
    if (!response.ok) {
        throw new Error('Network response was not ok');
    }
    return response.json();
};
