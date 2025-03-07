import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { getPokemonTypeColor } from "@/lib/utils";
import axios from "axios";
import { Button } from "@/components/ui/button";

interface PokemonDetail {
	id: number;
	name: string;
	types: Array<{
		type: { name: string };
		slot: number;
	}>;
	stats: Array<{
		base_stat: number;
		stat: { name: string };
	}>;
	sprites: {
		other: {
			"official-artwork"?: {
				front_default?: string;
			};
		};
		front_default?: string;
	};
}

const PokemonDetailPage: React.FC = () => {
	const { pokemonId } = useParams<{ pokemonId: string }>();
	const [pokemon, setPokemon] = useState<PokemonDetail | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		const fetchPokemonDetails = async () => {
			try {
				setLoading(true);
				const response = await axios.get(
					`https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
				);
				setPokemon(response.data);
			} catch (err) {
				setError("Failed to fetch Pokemon details");
				console.error(err);
			} finally {
				setLoading(false);
			}
		};

		if (pokemonId) {
			fetchPokemonDetails();
		}
	}, [pokemonId]);

	if (loading) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				Loading...
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex justify-center items-center min-h-screen text-red-500">
				{error}
			</div>
		);
	}

	if (!pokemon) {
		return (
			<div className="flex justify-center items-center min-h-screen">
				No Pokemon found
			</div>
		);
	}

	// Get the primary type (first type in the list)
	const primaryType = pokemon.types[0].type.name.toLowerCase();
	const backgroundColor = getPokemonTypeColor(primaryType);

	// Map of stat names to their display names
	const statNameMap: Record<string, string> = {
		hp: "HP",
		attack: "Attack",
		defense: "Defense",
		"special-attack": "Sp. Atk",
		"special-defense": "Sp. Def",
		speed: "Speed",
	};

	// Get official artwork or fallback to front_default
	const pokemonImage =
		pokemon.sprites.other["official-artwork"]?.front_default ||
		pokemon.sprites.front_default ||
		"";

	return (
		<div
			className="min-h-screen flex flex-col justify-between"
			style={{ backgroundColor }}
		>
			{/* Header with back button and Pokemon name */}
			<div className="flex items-center p-4 text-white">
				<Button className="mr-4 p-2" onClick={() => window.history.back()}>
					{/* Back arrow icon */}
					{/* biome-ignore lint/a11y/noSvgWithoutTitle: <explanation> */}
					<svg
						xmlns="http://www.w3.org/2000/svg"
						width="24"
						height="24"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						strokeWidth="2"
						strokeLinecap="round"
						strokeLinejoin="round"
					>
						<path d="M15 18l-6-6 6-6" />
					</svg>
				</Button>
				<h1 className="text-2xl font-bold capitalize flex-grow">
					{pokemon.name}
				</h1>
				<span className="text-xl">
					#{pokemon.id.toString().padStart(3, "0")}
				</span>
			</div>

			{/* Pokemon Image */}
			<div className="flex justify-center items-center relative h-64">
				<img
					src={pokemonImage}
					alt={`Representation of ${pokemon.name}`}
					className="max-w-full max-h-[300px] md:max-h-[500px] object-contain z-10"
				/>
			</div>

			{/* Base Stats */}
			<div className="bg-white rounded-t-3xl h-fit p-6 pt-[80px] pb-[80px] flex flex-col justify-center items-center gap-y-4">
				{/* Pokemon Types */}
				<div className="flex justify-center space-x-2 mb-4">
					{pokemon.types.map((typeInfo) => {
						const typeName = typeInfo.type.name;
						const typeColor = getPokemonTypeColor(typeName);
						return (
							<div
								key={typeName}
								className="px-3 py-1 rounded-full text-white capitalize"
								style={{ backgroundColor: typeColor }}
							>
								{typeName}
							</div>
						);
					})}
				</div>
				<h2
					className="text-center text-xl font-bold mb-4 capitalize"
					style={{ color: backgroundColor }}
				>
					Base Stats
				</h2>
				<div className="space-y-2 w-full max-w-[600px]">
					{pokemon.stats.map((stat) => {
						const statName = statNameMap[stat.stat.name] || stat.stat.name;
						const statValue = stat.base_stat;

						return (
							<div
								key={stat.stat.name}
								className="flex justify-start items-center"
							>
								<div
									className="w-15 font-medium text-start"
									style={{ color: backgroundColor }}
								>
									{statName}
								</div>
								<div className="w-12 text-right mr-2">{statValue}</div>
								<div className="flex-grow bg-gray-200 rounded-full h-2">
									<div
										className="h-2 rounded-full"
										style={{
											width: `${Math.min(statValue, 100)}%`,
											backgroundColor,
										}}
									>
										{" "}
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
};

export default PokemonDetailPage;
