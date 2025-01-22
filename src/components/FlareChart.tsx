"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface Flare {
  date: string;
  volume: number;
  duration: number;
  h2s: number;
}

interface FlareChartProps {
  data: Flare[];
}

export default function FlareChart({ data }: FlareChartProps) {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="volume" fill="#8884d8" />
        <Bar dataKey="duration" fill="#82ca9d" />
        <Bar dataKey="h2s" fill="#ffc658" />
      </BarChart>
    </ResponsiveContainer>
  );
}