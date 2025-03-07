import * as LZString from "lz-string";
import express, {
	type Request,
	type Response,
	type NextFunction,
} from "express";
import axios from "axios";
import type { PokemonDetail } from "../types/pokemon";
import { asyncHandler } from "../utils/asyncHandler";

const router = express.Router();
const POKEAPI_BASE_URL =
	process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";

// Cache TTL values (in seconds)
const CACHE_TTL = {
	LIST: 3600, // 1 hour for list data
	SEARCH_RESULTS: 1800, // 30 minutes for search results
	POKEMON_DETAILS: 86400, // 24 hours for Pokemon details (rarely change)
};

// Middleware to handle rate limiting
const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
	const clientIP = req.ip;
	const key = `ratelimit:${clientIP}`;

	try {
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const redisClient = (req as any).redisClient;

		redisClient
			.incr(key)
			.then((requestCount: number) => {
				// Set expiry for the key if this is the first request in the time window
				if (requestCount === 1) {
					return redisClient.expire(key, 60); // 1 minute window
				}
				return Promise.resolve();
			})
			.then(() => {
				// Check if the request count exceeds the limit
				return redisClient.get(key);
			})
			.then((requestCount: string) => {
				if (Number.parseInt(requestCount) > 50) {
					// 30 requests per minute limit
					res.status(429).json({
						error: "Too many requests, please try again later.",
					});
				} else {
					next();
				}
			})
			.catch((error: Error) => {
				console.error("Rate limiter error:", error);
				next(); // Proceed even if rate limiting fails
			});
	} catch (error) {
		console.error("Rate limiter error:", error);
		next(); // Proceed even if rate limiting fails
	}
};

// Apply rate limiting to all routes
router.use(rateLimiter);

// Get Pokemon list with pagination and optional name filter
router.get(
	"/",
	asyncHandler(async (req: Request, res: Response) => {
		try {
			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 20;
			const name = ((req.query.name as string) || "").toLowerCase();

			// Create cache key based on query parameters
			const cacheKey = `pokemon:list:${name}:page${page}:limit${limit}`;

			// Try to get data from cache first
			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const redisClient = (req as any).redisClient;
			// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
			let cachedData;
			try {
				cachedData = await redisClient.get(cacheKey);
			} catch (cacheError) {
				console.error("Cache retrieval error:", cacheError);
				// Continue without cache
			}

			if (cachedData) {
				// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
				let parsedData;
				try {
					// Try to decompress if compressed
					const decompressed = LZString.decompress(cachedData);
					parsedData = decompressed
						? JSON.parse(decompressed)
						: JSON.parse(cachedData);
					return res.json(parsedData);
				} catch (parseError) {
					console.error("Error parsing cached data:", parseError);
					// Continue and fetch fresh data
				}
			}

			// biome-ignore lint/suspicious/noImplicitAnyLet: <explanation>
			let result;

			if (name) {
				// Searching by name - fetch and filter
				const response = await axios.get(
					`${POKEAPI_BASE_URL}/pokemon?limit=500`,
				);

				// Filter by name
				// biome-ignore lint/suspicious/noExplicitAny: <explanation>
				const filteredResults = response.data.results.filter((pokemon: any) =>
					pokemon.name.toLowerCase().includes(name),
				);

				// Handle pagination on the filtered results
				const offset = (page - 1) * limit;
				const paginatedResults = filteredResults.slice(offset, offset + limit);

				result = {
					results: paginatedResults,
					count: filteredResults.length,
					totalPages: Math.max(1, Math.ceil(filteredResults.length / limit)),
					currentPage: page,
				};
			} else {
				// Standard pagination
				const offset = (page - 1) * limit;
				const response = await axios.get(
					`${POKEAPI_BASE_URL}/pokemon?offset=${offset}&limit=${limit}`,
				);

				result = {
					results: response.data.results,
					count: response.data.count,
					totalPages: Math.max(1, Math.ceil(response.data.count / limit)),
					currentPage: page,
				};
			}

			// Cache the results with compression
			try {
				const compressed = LZString.compress(JSON.stringify(result));
				await redisClient.setEx(
					cacheKey,
					name ? CACHE_TTL.SEARCH_RESULTS : CACHE_TTL.LIST,
					compressed,
				);
			} catch (cacheError) {
				console.error("Error caching list results:", cacheError);
				// Continue even if caching fails
			}

			res.json(result);
		} catch (error) {
			console.error("Error fetching Pokemon list:", error);
			res.status(500).json({ error: "Failed to fetch Pokemon data" });
		}
	}),
);

router.get(
	"/batch",
	asyncHandler(async (req: Request, res: Response) => {
		const { names } = req.query;

		if (!names || typeof names !== "string") {
			return res
				.status(400)
				.json({ error: "Names parameter required as comma-separated string" });
		}

		const namesList = names.split(",");
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const results: Record<string, any> = {};
		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const redisClient = (req as any).redisClient;

		// Process in smaller chunks (5 at a time)
		const CHUNK_SIZE = 5;
		const chunks = [];

		for (let i = 0; i < namesList.length; i += CHUNK_SIZE) {
			chunks.push(namesList.slice(i, i + CHUNK_SIZE));
		}

		for (const chunk of chunks) {
			// Process each Pokemon individually - DO NOT cache the chunk
			for (const name of chunk) {
				try {
					// Check individual cache first
					const individualCacheKey = `pokemon:detail:${name.toLowerCase()}`;
					const cachedPokemon = await redisClient.get(individualCacheKey);

					if (cachedPokemon) {
						try {
							// First try to decompress assuming it's compressed
							const decompressed = LZString.decompress(cachedPokemon);

							// If decompress returns a string, parse it as JSON
							if (decompressed) {
								results[name] = JSON.parse(decompressed);
							} else {
								// If decompress returns null/undefined, try parsing directly
								// (in case it wasn't compressed)
								results[name] = JSON.parse(cachedPokemon);
							}
						} catch (parseError) {
							// If there's an error in parsing, log it and fetch fresh data
							console.error(
								`Error parsing cached data for ${name}:`,
								parseError,
							);

							// Fetch fresh data
							const response = await axios.get(
								`${POKEAPI_BASE_URL}/pokemon/${name.toLowerCase()}`,
							);

							// Create a minimal version with only the essential data
							const minimalData = {
								id: response.data.id,
								name: response.data.name,
								// biome-ignore lint/suspicious/noExplicitAny: <explanation>
								types: response.data.types.map((t: any) => ({
									slot: t.slot,
									type: { name: t.type.name },
								})),
								sprites: {
									front_default: response.data.sprites.front_default,
									other: {},
								},
							};

							// If official artwork exists, include it
							const officialArtwork =
								response.data.sprites.other?.["official-artwork"]
									?.front_default;

							if (officialArtwork) {
								// Initialize 'other' if it doesn't exist
								minimalData.sprites.other = minimalData.sprites.other || {};
								(
									minimalData.sprites.other as {
										"official-artwork"?: { front_default: string };
									}
								)["official-artwork"] = {
									front_default: officialArtwork,
								};
							}
							results[name] = minimalData;

							// Try to store in cache again with compression
							try {
								const compressed = LZString.compress(
									JSON.stringify(minimalData),
								);
								await redisClient.setEx(
									individualCacheKey,
									CACHE_TTL.POKEMON_DETAILS,
									compressed,
								);
							} catch (cacheError) {
								console.error(`Error caching Pokemon ${name}:`, cacheError);
							}
						}
					} else {
						const response = await axios.get(
							`${POKEAPI_BASE_URL}/pokemon/${name.toLowerCase()}`,
						);

						// Create a minimal version with only the essential data
						const minimalData = {
							id: response.data.id,
							name: response.data.name,
							// biome-ignore lint/suspicious/noExplicitAny: <explanation>
							types: response.data.types.map((t: any) => ({
								slot: t.slot,
								type: { name: t.type.name },
							})),
							sprites: {
								front_default: response.data.sprites.front_default,
								other: {},
							},
						};

						// If official artwork exists, include it
						const officialArtwork =
							response.data.sprites.other?.["official-artwork"]?.front_default;

						if (officialArtwork) {
							// Initialize 'other' if it doesn't exist
							minimalData.sprites.other = minimalData.sprites.other || {};
							(
								minimalData.sprites.other as {
									"official-artwork"?: { front_default: string };
								}
							)["official-artwork"] = {
								front_default: officialArtwork,
							};
						}

						results[name] = minimalData;

						// Compress data before caching individual result
						try {
							const compressed = LZString.compress(JSON.stringify(minimalData));
							await redisClient.setEx(
								individualCacheKey,
								CACHE_TTL.POKEMON_DETAILS,
								compressed,
							);
						} catch (cacheError) {
							console.error(`Error caching Pokemon ${name}:`, cacheError);
							// Continue even if caching fails
						}
					}

					// Add a small delay between requests
					await new Promise((resolve) => setTimeout(resolve, 50));
				} catch (error) {
					console.error(`Error fetching Pokemon ${name}:`, error);
					results[name] = { error: "Failed to fetch Pokemon" };
				}
			}
		}

		res.json(results);
	}),
);
// Get Pokemon details by name or ID
router.get(
	"/:identifier",
	asyncHandler(async (req: Request, res: Response) => {
		const { identifier } = req.params;
		const cacheKey = `pokemon:detail:${identifier.toLowerCase()}`;

		// biome-ignore lint/suspicious/noExplicitAny: <explanation>
		const redisClient = (req as any).redisClient;

		// Try to get from cache first
		const cachedData = await redisClient.get(cacheKey);
		if (cachedData) {
			const decompressedData = LZString.decompress(cachedData);
			return res.json(JSON.parse(decompressedData));
		}

		// Fetch from PokeAPI
		const response = await axios.get<PokemonDetail>(
			`${POKEAPI_BASE_URL}/pokemon/${identifier.toLowerCase()}`,
		);

		// Cache the result
		await redisClient.setEx(
			cacheKey,
			CACHE_TTL.POKEMON_DETAILS,
			JSON.stringify(response.data),
		);

		res.json(response.data);
	}),
);

export default router;
