// src/components/SkeletonCard.tsx
import { Card, CardContent } from "./ui/card";

const SkeletonCard = () => {
	return (
		<Card className="overflow-hidden">
			<CardContent className="p-4">
				<div className="flex flex-col items-center">
					<div className="w-32 h-32 bg-gray-200 animate-pulse rounded-full mb-2">
						{" "}
					</div>
					<div className="h-6 w-24 bg-gray-200 animate-pulse rounded mb-2">
						{" "}
					</div>
					<div className="flex gap-2">
						<div className="h-4 w-16 bg-gray-200 animate-pulse rounded-full">
							{" "}
						</div>
						<div className="h-4 w-16 bg-gray-200 animate-pulse rounded-full">
							{" "}
						</div>
					</div>
				</div>
			</CardContent>
		</Card>
	);
};

export default SkeletonCard;
