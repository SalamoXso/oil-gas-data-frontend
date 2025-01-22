"use client";

import { useEffect, useState } from "react";
import FlareChart from "../components/FlareChart";
import SearchBar from "../components/SearchBar";
import dynamic from "next/dynamic";

// Dynamically import FlareMap with SSR disabled
const FlareMap = dynamic(() => import("../components/FlareMap"), {
  ssr: false,
});

interface Flare {
  id: number;
  volume: number;
  duration: number;
  h2s: number;
  date: string;
  latitude: number;
  longitude: number;
  location: string;
  operator: string;
}

export default function Home() {
  const [flares, setFlares] = useState<Flare[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false); // State to track scraping status

  const fetchFlares = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/flares/`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log("Fetched data:", data); // Log the data to inspect its structure

      // Transform data if necessary
      const processedData = data.map((flare: any) => ({
        id: flare.id,
        volume: flare.volume,
        duration: flare.duration,
        h2s: flare.h2s,
        date: flare.date,
        latitude: flare.latitude || 0, // Default to 0 if missing
        longitude: flare.longitude || 0, // Default to 0 if missing
        location: flare.location || "Unknown", // Default to "Unknown" if missing
        operator: flare.operator || "Unknown", // Default to "Unknown" if missing
      }));

      setFlares(processedData);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlares();
  }, []);

  const handleScrape = async () => {
    setIsScraping(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/scrape/`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Scraping result:", result);

      // Refetch flares after scraping
      await fetchFlares();
    } catch (error) {
      console.error("Error triggering scrape:", error);
      setError(error.message);
    } finally {
      setIsScraping(false);
    }
  };

  const filteredFlares = flares.filter((flare) =>
    flare.location && flare.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>Error: {error}</p>;
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Oil and Gas Flare Data</h1>
      <div className="flex justify-between items-center mb-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <button
          onClick={handleScrape}
          disabled={isScraping}
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
        >
          {isScraping ? "Scraping..." : "Scrape New Data"}
        </button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Flare Volume Over Time</h2>
          <FlareChart data={filteredFlares} />
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-2">Flare Locations</h2>
          <FlareMap data={filteredFlares} />
        </div>
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Flare Data</h2>
        <ul className="space-y-4">
          {filteredFlares.map((flare) => (
            <li key={flare.id} className="p-4 border rounded-lg shadow-sm">
              <p><strong>Volume:</strong> {flare.volume}</p>
              <p><strong>Duration:</strong> {flare.duration}</p>
              <p><strong>H2S:</strong> {flare.h2s}</p>
              <p><strong>Date:</strong> {flare.date}</p>
              <p><strong>Location:</strong> {flare.location}</p>
              <p><strong>Operator:</strong> {flare.operator}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}