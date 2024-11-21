import React, { useState } from 'react';

const SearchBar = ({ onSearch }) => {
    const [query, setQuery] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if (query.trim()) {
            onSearch(query);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="w-full max-w-xl mx-auto p-4">
            <div className="flex items-center border-2 rounded-lg overflow-hidden">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search for anime..."
                    className="w-full px-4 py-2 focus:outline-none"
                />
                <button
                    type="submit"
                    className="px-6 py-2 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none"
                >
                    Search
                </button>
            </div>
        </form>
    );
};

export default SearchBar;
