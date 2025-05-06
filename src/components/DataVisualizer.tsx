
import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RawData, ProcessedData, IMUDataPoint, ProcessedDataPoint } from "@/types";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

interface DataVisualizerProps {
  data: RawData | ProcessedData;
}

const DataVisualizer: React.FC<DataVisualizerProps> = ({ data }) => {
  const [chartType, setChartType] = useState<string>("acceleration");
  
  // Determine if we're working with raw or processed data
  const isProcessedData = 'processedData' in data;
  const chartData = isProcessedData 
    ? (data as ProcessedData).processedData 
    : (data as RawData).data;
  
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

  return (
    <div className="space-y-4">
      <Tabs value={chartType} onValueChange={setChartType} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="acceleration">Acceleration</TabsTrigger>
          <TabsTrigger value="gyroscope">Gyroscope</TabsTrigger>
          <TabsTrigger value="pressure">Pressure</TabsTrigger>
          {isProcessedData && (
            <TabsTrigger value="velocity">Velocity</TabsTrigger>
          )}
        </TabsList>
        
        <TabsContent value="acceleration" className="pt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Acceleration Data</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayTime" 
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Acceleration (m/s²)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(4)} m/s²`, '']}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="accelX" stroke="#8884d8" name="X-axis" dot={false} />
                  <Line type="monotone" dataKey="accelY" stroke="#82ca9d" name="Y-axis" dot={false} />
                  <Line type="monotone" dataKey="accelZ" stroke="#ff7300" name="Z-axis" dot={false} />
                  {isProcessedData && (
                    <Line type="monotone" dataKey="instantAccel" stroke="#ff0000" name="Magnitude" dot={false} />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="gyroscope" className="pt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Gyroscope Data</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayTime" 
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Angular Velocity (rad/s)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(4)} rad/s`, '']}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="gyroX" stroke="#8884d8" name="X-axis" dot={false} />
                  <Line type="monotone" dataKey="gyroY" stroke="#82ca9d" name="Y-axis" dot={false} />
                  <Line type="monotone" dataKey="gyroZ" stroke="#ff7300" name="Z-axis" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="pressure" className="pt-4">
          <Card className="p-4">
            <h3 className="text-lg font-medium mb-4">Pressure Data</h3>
            <div className="h-64 md:h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={formattedData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="displayTime" 
                    label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                  />
                  <YAxis 
                    label={{ value: 'Pressure (hPa)', angle: -90, position: 'insideLeft' }} 
                  />
                  <Tooltip 
                    formatter={(value) => [`${Number(value).toFixed(2)} hPa`, '']}
                    labelFormatter={(label) => `Time: ${label}s`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="pressure" stroke="#8884d8" name="Pressure" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </TabsContent>
        
        {isProcessedData && (
          <TabsContent value="velocity" className="pt-4">
            <Card className="p-4">
              <h3 className="text-lg font-medium mb-4">Velocity Data</h3>
              <div className="h-64 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={formattedData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="displayTime" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value) => [`${Number(value).toFixed(4)} m/s`, '']}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="velocityX" stroke="#8884d8" name="X-axis" dot={false} />
                    <Line type="monotone" dataKey="velocityY" stroke="#82ca9d" name="Y-axis" dot={false} />
                    <Line type="monotone" dataKey="velocityZ" stroke="#ff7300" name="Z-axis" dot={false} />
                    <Line type="monotone" dataKey="speed" stroke="#ff0000" name="Magnitude" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      <div className="text-sm text-gray-500">
        <p>Showing {formattedData.length} of {chartData.length} data points{chartData.length !== formattedData.length ? " (sampled for better visualization)" : ""}</p>
      </div>
    </div>
  );
};

export default DataVisualizer;
