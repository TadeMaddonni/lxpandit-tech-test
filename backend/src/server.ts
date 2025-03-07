import express, {
	type Request,
	type Response,
	type NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createClient } from "redis";

// Import routes
import pokemonRoutes from "./routes/pokemon";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();
const PORT = process.env.PORT || 5000;

// Redis client setup
const redisClient = createClient({
	url: process.env.REDIS_URL || "redis://localhost:6379",
});
// Connect to Redis
(async () => {
	redisClient.on("error", (err) => console.error("Redis Client Error:", err));
	await redisClient.connect().catch((err) => {
		console.error("Failed to connect to Redis:", err);
		process.exit(1);
	});
	console.log("Connected to Redis successfully");
})();

// Middleware
app.use(cors());
app.use(express.json());

// Add Redis client to request object
app.use((req, res, next) => {
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	(req as any).redisClient = redisClient;
	next();
});

// Routes
app.use("/api/pokemon", pokemonRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
	res.status(200).json({ status: "ok" });
});

// 404 handler
app.use((req, res) => {
	res.status(404).json({ error: "Route not found" });
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
	console.error("Server error:", err);
	res.status(500).json({ error: "Internal server error" });
});

// Start the server
app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});

// Handle graceful shutdown
process.on("SIGINT", async () => {
	await redisClient.quit();
	console.log("Redis connection closed");
	process.exit(0);
});

export default app;
