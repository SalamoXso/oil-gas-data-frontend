export interface Flare {
  id: number;
  volume: number;
  duration: number;
  h2s: number;
  date: string;
  latitude: number;
  longitude: number;
  location: string; // Ensure this is included
  operator: string;
}