// src/components/PokemonList.tsx
import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import PokemonCard from "./PokemonCard";
import SkeletonCard from "./SkeletonCard";
import Pagination from "./Pagination";
import { Button } from "./ui/button";

interface PokemonListProps {
	searchTerm: string;
}

interface Pokemon {
	name: string;
	url: string;
}

interface PokemonListResponse {
	results: Pokemon[];
	count: number;
	totalPages: number;
	currentPage: number;
}

interface PokemonDetails {
	id: number;
	name: string;
	sprites: {
		front_default: string;
		other?: {
			"official-artwork"?: {
				front_default: string;
			};
		};
	};
	types: Array<{
		slot: number;
		type: {
			name: string;
		};
	}>;
}

type PokemonBatchResponse = Record<string, PokemonDetails>;

const PokemonList = ({ searchTerm }: PokemonListProps) => {
	const [currentPage, setCurrentPage] = useState(1);
	const queryClient = useQueryClient();

	// Function to fetch Pokemon list - extracted for reuse in prefetching
	const fetchPokemonList = async (
		term: string,
		page: number,
	): Promise<PokemonListResponse> => {
		const response = await fetch(
			`${import.meta.env.VITE_API_URL}/pokemon?name=${term}&page=${page}&limit=12`,
		);

		if (!response.ok) {
			throw new Error("Failed to fetch Pokemon data");
		}

		return response.json();
	};

	// Function to fetch Pokemon details - extracted for reuse in prefetching
	const fetchPokemonDetails = async (
		pokemonNames: string[],
	): Promise<PokemonBatchResponse> => {
		if (!pokemonNames.length) return {};

		const CHUNK_SIZE = 5; // Smaller chunks
		let results: PokemonBatchResponse = {};

		// Process in chunks
		for (let i = 0; i < pokemonNames.length; i += CHUNK_SIZE) {
			const chunk = pokemonNames.slice(i, i + CHUNK_SIZE);
			const chunkNames = chunk.join(",");

			try {
				const response = await fetch(
					`${import.meta.env.VITE_API_URL}/pokemon/batch?names=${chunkNames}`,
				);

				if (!response.ok) {
					console.error(`Error fetching chunk ${i}: ${response.status}`);
					continue; // Skip this chunk but continue with others
				}

				const chunkData = await response.json();
				results = { ...results, ...chunkData };

				// Add a short delay between chunk requests
				await new Promise((resolve) => setTimeout(resolve, 100));
			} catch (error) {
				console.error(`Error fetching chunk ${i}:`, error);
				// Continue with other chunks even if one fails
			}
		}

		return results;
	};

	// Fetch Pokemon list
	const {
		data: listData,
		isLoading: isListLoading,
		isError: isListError,
		error: listError,
	} = useQuery<PokemonListResponse>({
		queryKey: ["pokemonList", searchTerm, currentPage],
		queryFn: () => fetchPokemonList(searchTerm, currentPage),
		staleTime: 5 * 60 * 1000, // 5 minutes
		retry: 3,
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
	});

	// Fetch details for all Pokemon in the current page with a single batch request
	const {
		data: detailsData,
		isLoading: isDetailsLoading,
		isError: isDetailsError,
		error: detailsError,
	} = useQuery<PokemonBatchResponse>({
		queryKey: [
			"pokemonBatchDetails",
			listData?.results.map((p) => p.name).join(","),
		],
		queryFn: () => {
			if (!listData || !listData.results.length) return Promise.resolve({});
			return fetchPokemonDetails(listData.results.map((p) => p.name));
		},
		enabled: !!listData && listData.results.length > 0,
		staleTime: 10 * 60 * 1000,
		retry: 3,
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
	});
	// Modified prefetching to be more selective - only prefetch the next page
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		setCurrentPage(1);
	}, [searchTerm]);
	// biome-ignore lint/correctness/useExhaustiveDependencies: <explanation>
	useEffect(() => {
		if (!listData) return;

		const totalPages = listData.totalPages;

		// Only prefetch next page, not previous
		if (currentPage < totalPages) {
			const nextPage = currentPage + 1;
			queryClient.prefetchQuery({
				queryKey: ["pokemonList", searchTerm, nextPage],
				queryFn: () => fetchPokemonList(searchTerm, nextPage),
			});
		}
	}, [currentPage, listData, queryClient, searchTerm]);

	const handlePageChange = (page: number) => {
		// Cancel any ongoing prefetch queries to reduce load
		queryClient.cancelQueries({ queryKey: ["pokemonList"] });
		setCurrentPage(page);
		window.scrollTo({ top: 0, behavior: "smooth" });
	};

	// Show loading state for both list and details
	if (isListLoading || (isDetailsLoading && !detailsData)) {
		return (
			<div>
				<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
					{Array(12)
						.fill(0)
						.map((_, index) => (
							// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
							<SkeletonCard key={index} />
						))}
				</div>
			</div>
		);
	}

	// Handle errors
	if (isListError) {
		return (
			<div className="text-center py-12">
				<div className="bg-white p-4 rounded-md shadow-md inline-block text-red-500">
					<p>{(listError as Error)?.message || "Error loading Pokemon list"}</p>
					<Button
						onClick={() =>
							queryClient.refetchQueries({
								queryKey: ["pokemonList", searchTerm, currentPage],
							})
						}
						className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	if (isDetailsError && !detailsData) {
		return (
			<div className="text-center py-12">
				<div className="bg-white p-4 rounded-md shadow-md inline-block text-red-500">
					<p>
						{(detailsError as Error)?.message ||
							"Error loading Pokemon details"}
					</p>
					<Button
						onClick={() =>
							queryClient.refetchQueries({
								queryKey: [
									"pokemonBatchDetails",
									listData?.results.map((p) => p.name).join(","),
								],
							})
						}
						className="mt-2 bg-blue-500 text-white px-4 py-2 rounded-md"
					>
						Try Again
					</Button>
				</div>
			</div>
		);
	}

	if (!listData || listData.results.length === 0) {
		return (
			<div className="text-center py-12">
				<div className="bg-[#DC0A2D] p-10 rounded-md shadow-md inline-block">
					<p className="text-lg font-bold text-white">
						No Pokemon found. Try a different search term.
					</p>
				</div>
			</div>
		);
	}

	return (
		<div>
			<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
				{listData.results.map((pokemon) => (
					<PokemonCard
						key={pokemon.name}
						name={pokemon.name}
						url={pokemon.url}
						details={detailsData?.[pokemon.name]}
					/>
				))}
			</div>

			<div className="flex justify-center mt-8">
				<Pagination
					currentPage={listData.currentPage}
					totalPages={listData.totalPages}
					onPageChange={handlePageChange}
				/>
			</div>
		</div>
	);
};

export default PokemonList;
