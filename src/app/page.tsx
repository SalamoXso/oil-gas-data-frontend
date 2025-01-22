"use client";
import { useEffect, useState, useRef } from "react";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // Number of items per page
  const intervalId = useRef<NodeJS.Timeout | null>(null); // Use useRef to persist intervalId

  // Fetch flares data
  const fetchFlares = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://oil-gas-data-backend.onrender.com/api/v1";

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
      if (error instanceof Error) {
        setError(error.message); // Access error.message only if error is an Error object
      } else {
        setError("An unknown error occurred"); // Handle non-Error objects
      }
      setIsLoading(false);
    }
  };

  // Start scraping
  const handleScrape = async () => {
    setIsScraping(true);
    setError(null);

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://oil-gas-data-backend.onrender.com/api/v1";

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
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
      setIsScraping(false); // Reset scraping state on error
    }
  };

  // Stop scraping
  const handleStopScrape = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://oil-gas-data-backend.onrender.com/api/v1";

    try {
      const response = await fetch(`${apiUrl}/stop-scrape/`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Stop scraping result:", result);

      // Fetch scraping progress immediately to update the UI
      await fetchScrapingProgress();
    } catch (error) {
      console.error("Error stopping scrape:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  // Fetch scraping progress
  const fetchScrapingProgress = async () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://oil-gas-data-backend.onrender.com/api/v1";

    try {
      const response = await fetch(`${apiUrl}/scraping-progress/`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setIsScraping(data.is_running);
      setRowsScraped(data.rows_scraped);

      // Stop polling if scraping is no longer running
      if (!data.is_running && intervalId.current) {
        clearInterval(intervalId.current);
      }
    } catch (error) {
      console.error("Error fetching scraping progress:", error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError("An unknown error occurred");
      }
    }
  };

  // Filter flares based on search term
  const filteredFlares = flares.filter(
    (flare) =>
      flare.operator_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      flare.filing_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentFlares = filteredFlares.slice(indexOfFirstItem, indexOfLastItem);

  // Fetch data on component mount
  useEffect(() => {
    fetchFlares();

    // Start polling only if scraping is running
    if (isScraping) {
      intervalId.current = setInterval(fetchScrapingProgress, 1000); // Poll every second
    }

    // Cleanup interval on component unmount
    return () => {
      if (intervalId.current) {
        clearInterval(intervalId.current);
      }
    };
  }, [isScraping]); // Re-run effect when isScraping changes

  // Loading state
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p>Loading...</p>
      </div>
    );
  }

  // Error state
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
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow-sm">
            <thead>
              <tr className="bg-gray-100">
                <th className="px-4 py-2">Exception Number</th>
                <th className="px-4 py-2">Submittal Date</th>
                <th className="px-4 py-2">Filing Number</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Filing Type</th>
                <th className="px-4 py-2">Operator Name</th>
                <th className="px-4 py-2">Property</th>
                <th className="px-4 py-2">Effective Date</th>
                <th className="px-4 py-2">Expiration Date</th>
                <th className="px-4 py-2">FV District</th>
                <th className="px-4 py-2">Volume</th>
                <th className="px-4 py-2">Duration</th>
                <th className="px-4 py-2">H2S</th>
                <th className="px-4 py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {currentFlares.map((flare) => (
                <tr key={flare.id} className="border-t">
                  <td className="px-4 py-2">{flare.exception_number}</td>
                  <td className="px-4 py-2">{flare.submittal_date}</td>
                  <td className="px-4 py-2">{flare.filing_number}</td>
                  <td className="px-4 py-2">{flare.status}</td>
                  <td className="px-4 py-2">{flare.filing_type}</td>
                  <td className="px-4 py-2">{flare.operator_name}</td>
                  <td className="px-4 py-2">{flare.property}</td>
                  <td className="px-4 py-2">{flare.effective_date}</td>
                  <td className="px-4 py-2">{flare.expiration_date}</td>
                  <td className="px-4 py-2">{flare.fv_district}</td>
                  <td className="px-4 py-2">{flare.volume}</td>
                  <td className="px-4 py-2">{flare.duration}</td>
                  <td className="px-4 py-2">{flare.h2s}</td>
                  <td className="px-4 py-2">{flare.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination Controls */}
        <div className="mt-4 flex justify-between items-center">
          <button
            onClick={() => setCurrentPage(currentPage - 1)}
            disabled={currentPage === 1}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            Previous
          </button>
          <span>Page {currentPage}</span>
          <button
            onClick={() => setCurrentPage(currentPage + 1)}
            disabled={indexOfLastItem >= filteredFlares.length}
            className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:bg-blue-300"
          >
            Next
          </button>
        </div>
      </div>
    </main>
  );
}
