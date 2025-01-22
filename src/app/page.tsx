"use client";
import { useEffect, useState } from "react";
import FlareChart from "../components/FlareChart";
import SearchBar from "../components/SearchBar";

interface Flare {
  id: number;
  exception_number: string;
  submittal_date: string;
  filing_number: string;
  status: string;
  filing_type: string;
  operator_number: string;
  operator_name: string;
  property: string;
  effective_date: string;
  expiration_date: string;
  fv_district: string;
  volume: number;
  duration: number;
  h2s: number;
  date: string;
  operator: string;
}

export default function Home() {
  const [flares, setFlares] = useState<Flare[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [rowsScraped, setRowsScraped] = useState(0);

  const fetchFlares = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/flares/`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setFlares(data);
      setIsLoading(false);
    } catch (error) {
      console.error("Error fetching data:", error);
      setError(error.message);
      setIsLoading(false);
    }
  };

  const handleScrape = async () => {
    setIsScraping(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/scrape/`, {
        method: "POST",
      });
      if (!response.ok) {
        const errorData = await response.json(); // Parse the response body
        throw new Error(`HTTP error! Status: ${response.status}, Message: ${errorData.detail}`);
      }
      const result = await response.json();
      console.log("Scraping result:", result);
    } catch (error) {
      console.error("Error triggering scrape:", error);
      setError(error.message);
      setIsScraping(false); // Reset scraping state on error
    }
  };

  const handleStopScrape = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/stop-scrape/`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Stop scraping result:", result);
      setIsScraping(false);
    } catch (error) {
      console.error("Error stopping scrape:", error);
      setError(error.message);
    }
  };

  const fetchScrapingProgress = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

    try {
      const response = await fetch(`${apiUrl}/scraping-progress/`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setIsScraping(data.is_running);
      setRowsScraped(data.rows_scraped); // Update rowsScraped state

      // Stop polling if scraping is no longer running
      if (!data.is_running) {
        clearInterval(intervalId);
      }
    } catch (error) {
      console.error("Error fetching scraping progress:", error);
      setError(error.message);
    }
  };

  let intervalId: NodeJS.Timeout;

  useEffect(() => {
    fetchFlares();

    // Start polling only if scraping is running
    if (isScraping) {
      intervalId = setInterval(fetchScrapingProgress, 1000); // Poll every second
    }

    // Cleanup interval on component unmount
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isScraping]); // Re-run effect when isScraping changes

  const filteredFlares = flares.filter((flare) =>
    flare.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    flare.filing_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
    <main className="p-4">
      <h1 className="text-2xl font-bold mb-4">Oil and Gas Flare Data</h1>
      <div className="flex justify-between items-center mb-4">
        <SearchBar searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
        <div className="flex gap-2">
          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isScraping ? "Scraping..." : "Scrape New Data"}
          </button>
          <button
            onClick={handleStopScrape}
            disabled={!isScraping}
            className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 disabled:bg-red-300"
          >
            Stop Scraping
          </button>
        </div>
      </div>
      <div className="mb-4">
        <p>Rows scraped: {rowsScraped}</p>
      </div>
      <div className="bg-white p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-2">Flare Volume Over Time</h2>
        <FlareChart data={filteredFlares} />
      </div>
      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4">Flare Data</h2>
        <ul className="space-y-4">
          {filteredFlares.map((flare) => (
            <li key={flare.id} className="p-4 border rounded-lg shadow-sm">
              <p><strong>Exception Number:</strong> {flare.exception_number}</p>
              <p><strong>Submittal Date:</strong> {flare.submittal_date}</p>
              <p><strong>Filing Number:</strong> {flare.filing_number}</p>
              <p><strong>Status:</strong> {flare.status}</p>
              <p><strong>Filing Type:</strong> {flare.filing_type}</p>
              <p><strong>Operator Name:</strong> {flare.operator_name}</p>
              <p><strong>Property:</strong> {flare.property}</p>
              <p><strong>Effective Date:</strong> {flare.effective_date}</p>
              <p><strong>Expiration Date:</strong> {flare.expiration_date}</p>
              <p><strong>FV District:</strong> {flare.fv_district}</p>
              <p><strong>Volume:</strong> {flare.volume}</p>
              <p><strong>Duration:</strong> {flare.duration}</p>
              <p><strong>H2S:</strong> {flare.h2s}</p>
              <p><strong>Date:</strong> {flare.date}</p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}