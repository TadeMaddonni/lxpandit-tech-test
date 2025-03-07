// src/components/Pagination.tsx
import { Button } from "./ui/button";

interface PaginationProps {
	currentPage: number;
	totalPages: number;
	onPageChange: (page: number) => void;
}

const Pagination = ({
	currentPage,
	totalPages,
	onPageChange,
}: PaginationProps) => {
	// Calculate page numbers to display
	const getPageNumbers = () => {
		const pages: (number | string)[] = [];
		const maxPagesToShow = 5;

		if (totalPages <= maxPagesToShow) {
			// If few pages, show all
			for (let i = 1; i <= totalPages; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			// Add ellipsis if needed
			if (currentPage > 3) {
				pages.push("...");
			}

			// Add pages around current page
			const startPage = Math.max(2, currentPage - 1);
			const endPage = Math.min(totalPages - 1, currentPage + 1);

			for (let i = startPage; i <= endPage; i++) {
				pages.push(i);
			}

			// Add ellipsis if needed
			if (currentPage < totalPages - 2) {
				pages.push("...");
			}

			// Always show last page
			if (totalPages > 1) {
				pages.push(totalPages);
			}
		}

		return pages;
	};

	if (totalPages <= 1) return null;

	return (
		<div className="flex items-center space-x-2">
			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(Math.max(1, currentPage - 1))}
				disabled={currentPage === 1}
			>
				Previous
			</Button>

			{getPageNumbers().map((page, idx) =>
				page === "..." ? (
					<span key={`ellipsis-${idx + 1}`} className="px-2">
						...
					</span>
				) : (
					<Button
						key={page}
						variant={currentPage === page ? "default" : "outline"}
						size="sm"
						onClick={() => onPageChange(page as number)}
					>
						{page}
					</Button>
				),
			)}

			<Button
				variant="outline"
				size="sm"
				onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
				disabled={currentPage === totalPages}
			>
				Next
			</Button>
		</div>
	);
};

export default Pagination;
