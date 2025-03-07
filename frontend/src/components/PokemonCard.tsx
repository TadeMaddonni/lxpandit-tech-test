// src/components/PokemonCard.tsx
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "./ui/card";
import { Link } from "react-router-dom";

interface PokemonCardProps {
	name: string;
	url: string;
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	details?: any;
}

const PokemonCard = ({ name, url, details }: PokemonCardProps) => {
	// Extract ID from URL for fallback image
	const getId = () => {
		try {
			return url.split("/").filter(Boolean).pop() || "1";
		} catch (e) {
			return "1";
		}
	};

	// Only fetch if details weren't passed down
	const {
		data: pokemon,
		isLoading,
		isError,
	} = useQuery({
		queryKey: ["pokemon", name],
		queryFn: async () => {
			const response = await fetch(
				`${import.meta.env.VITE_API_URL}/pokemon/${name}`,
			);
			if (!response.ok) {
				throw new Error("Failed to fetch Pokemon details");
			}
			return response.json();
		},
		// Don't run the query if details were passed down
		enabled: !details,
		staleTime: 30 * 60 * 1000,
	});

	// Use passed details or query result
	const pokemonData = details || pokemon;

	// Improved image URL function with debugging
	const getImageUrl = () => {
		if (!pokemonData?.sprites) {
			return null;
		}

		// Try to get official artwork
		const officialArtwork =
			pokemonData.sprites.other?.["official-artwork"]?.front_default;
		if (officialArtwork) {
			return officialArtwork;
		}

		// Try to get front default sprite
		if (pokemonData.sprites.front_default) {
			return pokemonData.sprites.front_default;
		}

		// No valid sprite found
		return null;
	};

	// Fallback to PokeAPI direct URL if our data doesn't have images
	// const fallbackImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getId()}.png`;

	// Check which image we're using
	const imageSource = getImageUrl();

	return (
		<Link to={`/${getId()}`} className="w-full">
			<Card className="overflow-hidden hover:shadow-lg hover:shadow-[#DC0A2D]/20 cursor-pointer transition-shadow duration-300">
				<CardContent className="p-4">
					<div className="flex flex-col items-center">
						{isLoading ? (
							<div className="w-32 h-32 bg-gray-200 animate-pulse rounded-full mb-2">
								{" "}
							</div>
						) : (
							<div className="relative w-32 h-32 mb-2">
								<img
									src={imageSource}
									alt={name}
									className="w-full h-full object-contain"
									loading="lazy"
									onError={(e) => {
										console.log(`Error loading image for ${name}:`, e);
										(e.target as HTMLImageElement).src =
											"https://via.placeholder.com/150";
									}}
								/>
							</div>
						)}

						<h3 className="text-xl font-bold capitalize">{name}</h3>

						{pokemonData?.types && (
							<div className="mt-2 flex flex-wrap gap-2 justify-center">
								{/* biome-ignore lint/suspicious/noExplicitAny: <explanation> */}
								{pokemonData.types.map((type: any) => (
									<span
										key={type.type.name}
										className="px-2 py-1 text-xs rounded-full bg-gray-200 text-gray-800"
									>
										{type.type.name}
									</span>
								))}
							</div>
						)}
					</div>
				</CardContent>
			</Card>
		</Link>
	);
};

export default PokemonCard;
