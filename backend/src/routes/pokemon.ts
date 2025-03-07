import express, {
	type Request,
	type Response,
	type NextFunction,
} from "express";
import axios from "axios";
import type { PokemonDetail } from "../types/pokemon";
import { asyncHandler } from "../utils/asyncHandler";
import {
	safeCacheStore,
	safeCacheRetrieve,
} from "../utils/pokemon-compression-helper"; // Import the new helper functions

const router = express.Router();
const POKEAPI_BASE_URL =
	process.env.POKEAPI_BASE_URL || "https://pokeapi.co/api/v2";

// Cache TTL values (in seconds)
const CACHE_TTL = {
	LIST: 3600, // 1 hour for list data
	SEARCH_RESULTS: 1800, // 30 minutes for search results
	POKEMON_DETAILS: 86400, // 24 hours for Pokemon details (rarely change)
};

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
				const cachedData = redisClient.get(key);

				return cachedData;
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

router.get(
	"/",
	asyncHandler(async (req: Request, res: Response) => {
		try {
			const page = Number.parseInt(req.query.page as string) || 1;
			const limit = Number.parseInt(req.query.limit as string) || 20;
			const name = ((req.query.name as string) || "").toLowerCase();

			// Create cache key based on query parameters
			const cacheKey = `pokemon:list:${name}:page${page}:limit${limit}`;

			// biome-ignore lint/suspicious/noExplicitAny: <explanation>
			const redisClient = (req as any).redisClient;

			// Use the new safeCacheRetrieve function
			const cachedData = await safeCacheRetrieve(redisClient, cacheKey);

			if (cachedData) {
				return res.json(cachedData);
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

			// Use the new safeCacheStore function for caching
			await safeCacheStore(
				redisClient,
				cacheKey,
				result,
				name ? CACHE_TTL.SEARCH_RESULTS : CACHE_TTL.LIST,
			);

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
					const cachedPokemon = await safeCacheRetrieve(
						redisClient,
						individualCacheKey,
					);
					console.log(cachedPokemon);

					if (cachedPokemon) {
						results[name] = cachedPokemon;
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

						// Use safeCacheStore for storing
						await safeCacheStore(
							redisClient,
							individualCacheKey,
							minimalData,
							CACHE_TTL.POKEMON_DETAILS,
						);
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

		// Use safeCacheRetrieve
		const cachedData = await safeCacheRetrieve(redisClient, cacheKey);
		if (cachedData) {
			return res.json(cachedData);
		}

		// Fetch from PokeAPI
		const response = await axios.get<PokemonDetail>(
			`${POKEAPI_BASE_URL}/pokemon/${identifier.toLowerCase()}`,
		);

		// Use safeCacheStore
		await safeCacheStore(
			redisClient,
			cacheKey,
			response.data,
			CACHE_TTL.POKEMON_DETAILS,
		);

		res.json(response.data);
	}),
);

export default router;
