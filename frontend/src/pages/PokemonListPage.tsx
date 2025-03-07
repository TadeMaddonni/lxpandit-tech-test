import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { debounce } from "lodash";
import PokemonList from "@/components/PokemonList";

// Create a query client
const queryClient = new QueryClient({
	defaultOptions: {
		queries: {
			refetchOnWindowFocus: false,
			staleTime: 10 * 60 * 1000, // Increase to 10 minutes
		},
	},
});

function PokemonListPage() {
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

	return (
		<QueryClientProvider client={queryClient}>
			<div className="min-h-screen">
				{/* Header/Navbar */}
				<header className=" shadow-sm ">
					<div className="container flex flex-col justify-center items-center mx-auto py-4 px-6">
						<h1 className="text-2xl font-bold text-[#DC0A2D]">Poke Finder</h1>
						<p className="text-sm text-[#DC0A2D]">
							¡El que quiere Pokémon, que los busque!
						</p>
					</div>
				</header>

				{/* Main Content */}
				<main className="container mx-auto py-8 px-6 min-h-screen">
					{/* Search Section */}
					<div className="mb-8">
						<form onSubmit={handleSubmit} className="max-w-md mx-auto">
							<div className="flex flex-col md:flex-row gap-2">
								<Input
									placeholder="Buscar pokémon por nombre..."
									value={inputValue}
									onChange={handleInputChange}
								/>
								<Button type="submit">Search</Button>
							</div>
						</form>
					</div>

					{/* Results Section */}
					<div className="mt-8">
						<PokemonList searchTerm={searchTerm} />
					</div>
				</main>
			</div>
		</QueryClientProvider>
	);
}

export default PokemonListPage;
