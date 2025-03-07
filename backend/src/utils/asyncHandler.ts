import type { Request, Response, NextFunction, RequestHandler } from "express";

// Async handler to catch errors in async route handlers
export const asyncHandler = (
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	fn: (req: Request, res: Response, next: NextFunction) => Promise<any>,
): RequestHandler => {
	return (req: Request, res: Response, next: NextFunction) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};
