import { BrowserRouter, Routes, Route } from "react-router-dom";
import PokemonListPage from "./pages/PokemonListPage";
import PokemonDetailPage from "./pages/PokemonDetailPage";
import { Button } from "./components/ui/button";

function App() {
	return (
		<>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<PokemonListPage />} />
					<Route path="/:pokemonId" element={<PokemonDetailPage />} />
				</Routes>
			</BrowserRouter>

			{/* Footer */}
			<footer className=" shadow-sm mt-12 py-6">
				<div className="container mx-auto px-6 text-center flex flex-col gap-4 text-gray-600">
					<p>
						Hecho por{" "}
						<a
							className="text-[#DC0A2D] underline"
							href="https://www.linkedin.com/in/tadeomaddonni/"
						>
							{" "}
							Tadeo Maddonni
						</a>{" "}
					</p>
					<a
						href="https://github.com/TadeMaddonni/lxpandit-tech-test"
						target="_blank"
						rel="noopener noreferrer"
						className="text-blue-500 hover:underline"
					>
						<Button>Ver en GitHub</Button>
					</a>
				</div>
			</footer>
		</>
	);
}

export default App;
