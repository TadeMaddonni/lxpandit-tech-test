export interface PokemonListItem {
	name: string;
	url: string;
}

// PokeAPI list response
export interface PokemonListResponse {
	count: number;
	next: string | null;
	previous: string | null;
	results: PokemonListItem[];
}

// Our enhanced pagination response
export interface PaginatedPokemonResponse {
	results: PokemonListItem[];
	count: number;
	totalPages: number;
	currentPage: number;
}

// Pokemon details type (simplified version of what PokeAPI returns)
export interface PokemonDetail {
	id: number;
	name: string;
	height: number;
	weight: number;
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
			url: string;
		};
	}>;
	abilities: Array<{
		ability: {
			name: string;
			url: string;
		};
		is_hidden: boolean;
		slot: number;
	}>;
	stats: Array<{
		base_stat: number;
		effort: number;
		stat: {
			name: string;
			url: string;
		};
	}>;
}
