
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RawData, ProcessedData, IMUDataPoint, ProcessedDataPoint } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Compass, Gauge, Rocket } from "lucide-react";

// Color palette for aerospace theme
const CHART_COLORS = [
  "#0EA5E9", // Sky blue
  "#8E9196", // Neutral gray
  "#EA384C", // Red
  "#33C3F0", // Bright blue
  "#1A1F2C", // Dark purple
  "#FF7300", // Orange
];

interface DataVisualizerProps {
  data: RawData | ProcessedData;
}

const DataVisualizer: React.FC<DataVisualizerProps> = ({ data }) => {
  // Check if we're working with processed data
  const isProcessedData = 'processedData' in data;
  
  // For raw data, we need to handle column selection
  const rawData = isProcessedData ? (data as ProcessedData).rawData : data as RawData;
  const chartData = isProcessedData 
    ? (data as ProcessedData).processedData 
    : (data as RawData).data;
  
  // State for column selection
  const [selectedColumns, setSelectedColumns] = useState<string[]>([]);
  const [availableColumns, setAvailableColumns] = useState<{name: string, key: string, color: string}[]>([]);
  
  // Initialize available columns
  useEffect(() => {
    if (rawData.headers && Array.isArray(rawData.headers)) {
      // If headers is an array of objects with 'original' property
      if (typeof rawData.headers[0] === 'object' && 'original' in rawData.headers[0]) {
        const columns = (rawData.headers as {original: string, display: string}[])
          .filter((header, index) => index !== rawData.timeColumnIndex)
          .map((header, index) => ({
            name: header.display,
            key: header.original.replace(/\s+/g, '_').toLowerCase(),
            color: CHART_COLORS[index % CHART_COLORS.length]
          }));
        setAvailableColumns(columns);
      } 
      // If headers is a simple array of strings
      else {
        const columns = (rawData.headers as string[])
          .filter((_, index) => index !== 0) // Assuming first column is time
          .map((header, index) => ({
            name: header,
            key: header.replace(/\s+/g, '_').toLowerCase(),
            color: CHART_COLORS[index % CHART_COLORS.length]
          }));
        setAvailableColumns(columns);
      }
    }
  }, [rawData]);
  
  // Get a subset of data for better visualization if there's a lot of points
  const sampleData = chartData.length > 500 
    ? chartData.filter((_, index) => index % Math.ceil(chartData.length / 500) === 0)
    : chartData;

  // Format timestamp for display
  const formattedData = sampleData.map(point => ({
    ...point,
    // If timestamp is in milliseconds (large number), convert to seconds for display
    displayTime: point.timestamp > 1000000000 
      ? ((point.timestamp - chartData[0].timestamp) / 1000).toFixed(2)
      : (point.timestamp - chartData[0].timestamp).toFixed(2)
  }));

  const handleColumnToggle = (column: string) => {
    setSelectedColumns(prev => 
      prev.includes(column) 
        ? prev.filter(col => col !== column) 
        : [...prev, column]
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row gap-4">
        <Card className="p-4 md:w-1/4">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Compass className="mr-2" /> Data Columns
          </h3>
          <ScrollArea className="h-[200px] md:h-[350px]">
            <div className="space-y-3 pr-4">
              {availableColumns.map((column) => (
                <div key={column.key} className="flex items-center space-x-2">
                  <Checkbox 
                    id={column.key} 
                    checked={selectedColumns.includes(column.key)} 
                    onCheckedChange={() => handleColumnToggle(column.key)}
                  />
                  <Label 
                    htmlFor={column.key} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                  >
                    {column.name}
                  </Label>
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
        
        <Card className="p-4 md:w-3/4">
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Gauge className="mr-2" /> Time Series Data
          </h3>
          <div className="h-64 md:h-[350px]">
            {selectedColumns.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayTime" 
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Sensor Values', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value, name) => [
                      `${Number(value).toFixed(4)}`, 
                      `${availableColumns.find(col => col.key === name)?.name || name}`
                    ]}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Legend />
                  {selectedColumns.map((column, index) => {
                    const colInfo = availableColumns.find(col => col.key === column);
                    return (
                      <Line 
                        key={column}
                        type="monotone" 
                        dataKey={column} 
                        stroke={colInfo?.color || CHART_COLORS[index % CHART_COLORS.length]} 
                        name={colInfo?.name || column} 
                        dot={false} 
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-gray-500">
                <Rocket size={48} className="mb-4 text-blue-500" />
                <p>Select one or more columns from the list to visualize data</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="text-sm text-gray-500">
        <p>Showing {formattedData.length} of {chartData.length} data points{chartData.length !== formattedData.length ? " (sampled for better visualization)" : ""}</p>
      </div>
    </div>
  );
};

export default DataVisualizer;
