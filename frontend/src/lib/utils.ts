import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export const POKEMON_TYPE_COLORS: Record<string, string> = {
	grass: "#74CB48",
	poison: "#A43E9E",
	dark: "#75574C",
	dragon: "#7037FF",
	fighting: "#C12239",
	ground: "#DEC16B",
	ice: "#9AD6DF",
	fairy: "#E69EAC",
	fire: "#F57D31",
	water: "#6493EB",
	bug: "#A7B723",
	flying: "#A891EC",
	electric: "#F9CF30",
	ghost: "#70559B",
	normal: "#AAA67F",
	psychic: "#FB5584",
	steel: "#B7B9D0",
	rock: "#B69E31",
};

/**
 * Get the color for a specific Pokemon type
 * @param type Pokemon type name
 * @returns Hex color code for the type
 */
export function getPokemonTypeColor(type: string): string {
	return POKEMON_TYPE_COLORS[type.toLowerCase()] || "#000000"; // Default to black if type not found
}
