import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PokemonListPage from "./pages/PokemonListPage";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input } from "./components/ui/input";
import { Button } from "./components/ui/button";
import { debounce } from "lodash";
import PokemonList from "./components/PokemonList";
import PokemonDetailPage from "./pages/PokemonDetailPage";

// Create a query client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 10 * 60 * 1000, // Increase to 10 minutes
		},
	},
});

function App() {
	return (
		<BrowserRouter>
			<Routes>
				<Route path="/" element={<PokemonListPage />} />
				<Route path="/:pokemonId" element={<PokemonDetailPage />} />
			</Routes>
		</BrowserRouter>
	);
}

export default App;

/* 
const [searchTerm, setSearchTerm] = useState("");
	const [inputValue, setInputValue] = useState("");

	// Debounced search handler
	const debouncedSearch = debounce((value: string) => {
		setSearchTerm(value);
	}, 300);

	const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setInputValue(value);
		debouncedSearch(value);
	};

	const handleSubmit = (e: React.FormEvent) => {
		e.preventDefault();
		setSearchTerm(inputValue);
	};
*/
