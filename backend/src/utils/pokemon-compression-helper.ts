import * as LZString from "lz-string";

/**
 * Safely store data in Redis without compression
 * @param redisClient Redis client
 * @param key Cache key
 * @param data Data to store
 * @param ttl Time to live in seconds
 */
export async function safeCacheStore(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	redisClient: any,
	key: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	data: any,
	ttl: number,
): Promise<boolean> {
	try {
		// Convert to JSON string
		const stringData = typeof data === "string" ? data : JSON.stringify(data);

		// Store without compression
		await redisClient.setEx(key, ttl, stringData);
		return true;
	} catch (error) {
		console.error(`Cache storage error for key ${key}:`, error);
		return false;
	}
}

/**
 * Safely retrieve and decompress data from Redis
 * @param redisClient Redis client
 * @param key Cache key
 * @returns Retrieved data or null if retrieval fails
 */
export async function safeCacheRetrieve(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	redisClient: any,
	key: string,
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
): Promise<any | null> {
	try {
		const cachedData = await redisClient.get(key);
		console.log(cachedData);
		if (!cachedData) return null;

		// Try decompression strategies
		const decompressionStrategies = [
			// Strategy 1: LZ String decompression
			() => {
				try {
					const decompressed = LZString.decompress(cachedData);
					if (decompressed) {
						return JSON.parse(decompressed);
					}
					return null;
				} catch {
					return null;
				}
			},
			// Strategy 2: Direct JSON parsing
			() => {
				try {
					return JSON.parse(cachedData);
				} catch {
					return null;
				}
			},
			// Strategy 3: Return as-is if parsing fails
			() => cachedData,
		];

		// Try each decompression strategy
		for (const strategy of decompressionStrategies) {
			const result = strategy();
			console.log("result");
			if (result !== null) {
				return result;
			}
		}

		// Log diagnostic information if all strategies fail
		console.error(`Failed to parse cached data for key ${key}:`, {
			cachedDataType: typeof cachedData,
			cachedDataLength: cachedData.length,
			cachedDataStart: cachedData.slice(0, 50),
		});

		return null;
	} catch (error) {
		console.error(`Cache retrieval error for key ${key}:`, error);
		return null;
	}
}

/**
 * Clear specific keys or pattern from Redis
 * @param redisClient Redis client
 * @param pattern Pattern to match keys (default is pokemon-related keys)
 */
export async function clearCache(
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	redisClient: any,
	pattern = "pokemon:*",
): Promise<void> {
	try {
		// Scan for keys matching the pattern
		let cursor = "0";
		do {
			const [newCursor, keys] = await redisClient.scan(
				cursor,
				"MATCH",
				pattern,
				"COUNT",
				1000,
			);

			// Delete matched keys
			if (keys.length > 0) {
				console.log(
					`Deleting ${keys.length} keys matching pattern: ${pattern}`,
				);
				await redisClient.del(...keys);
			}

			cursor = newCursor;
		} while (cursor !== "0");

		console.log("Cache cleanup complete");
	} catch (error) {
		console.error("Error during cache cleanup:", error);
	}
}
