
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RawData, FlightBounds } from "@/types";
import { Clock } from "lucide-react";

interface FlightBoundsSelectorProps {
  data: RawData;
  onBoundsSet: (bounds: FlightBounds) => void;
  flightStart?: number;
  flightEnd?: number;
}

const FlightBoundsSelector: React.FC<FlightBoundsSelectorProps> = ({
  data,
  onBoundsSet,
  flightStart = 0,
  flightEnd = 10
}) => {
  const [startTime, setStartTime] = useState(flightStart.toString());
  const [endTime, setEndTime] = useState(flightEnd.toString());

  // Calculate total time duration from data
  const totalDuration = data.data.length > 0 ? 
    (data.data[data.data.length - 1].timestamp - data.data[0].timestamp) : 0;

  console.log("Flight bounds - Total duration:", totalDuration);
  console.log("First timestamp:", data.data[0]?.timestamp);
  console.log("Last timestamp:", data.data[data.data.length - 1]?.timestamp);

  const handleSetBounds = () => {
    const startTimeNum = parseFloat(startTime);
    const endTimeNum = parseFloat(endTime);
    
    if (isNaN(startTimeNum) || isNaN(endTimeNum)) {
      alert("Please enter valid numbers for start and end times");
      return;
    }
    
    if (startTimeNum >= endTimeNum) {
      alert("Start time must be less than end time");
      return;
    }

    // Convert relative time inputs to actual timestamps
    const firstTimestamp = data.data[0].timestamp;
    const targetStartTime = firstTimestamp + startTimeNum;
    const targetEndTime = firstTimestamp + endTimeNum;
    
    console.log("Target start time:", targetStartTime, "Target end time:", targetEndTime);

    const bounds: FlightBounds = {
      flightStart: startTimeNum,
      flightEnd: endTimeNum,
      stationaryStart: 0,
      stationaryEnd: 0
    };

    console.log("Setting bounds:", bounds);
    onBoundsSet(bounds);
  };

  // Prepare data for visualization
  const chartData = data.data.map((point, index) => {
    const accelX = point['Linear Accel X'] || point['linear_accel_x'] || point['LinAccel X'] || 0;
    const accelY = point['Linear Accel Y'] || point['linear_accel_y'] || point['LinAccel Y'] || 0;
    const accelZ = point['Linear Accel Z'] || point['linear_accel_z'] || point['LinAccel Z'] || 0;
    const pressure = point['Pressure'] || point['pressure'] || 0;
    
    return {
      index,
      time: ((point.timestamp - data.data[0].timestamp)).toFixed(2),
      accelX: Number(accelX.toFixed(4)),
      accelY: Number(accelY.toFixed(4)),
      accelZ: Number(accelZ.toFixed(4)),
      pressure: Number(pressure.toFixed(4))
    };
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Clock className="mr-2" />
          Flight Time Bounds
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start-time">Flight Start Time (seconds)</Label>
            <Input
              id="start-time"
              type="number"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Enter start time"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Flight End Time (seconds)</Label>
            <Input
              id="end-time"
              type="number"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder="Enter end time"
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Total flight duration: {totalDuration.toFixed(2)} seconds
          <br />
          Data points: {data.data.length}
        </div>
        
        <Button onClick={handleSetBounds} className="w-full">
          Set Flight Bounds
        </Button>

        {/* Flight Data Visualization */}
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">Flight Data Overview</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="time" 
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Values', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  formatter={(value, name) => [
                    Number(value).toFixed(4), 
                    name === 'accelX' ? 'Linear Accel X' : 
                    name === 'accelY' ? 'Linear Accel Y' : 
                    name === 'accelZ' ? 'Linear Accel Z' : 'Pressure'
                  ]}
                  labelFormatter={(label) => `Time: ${label}s`}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="accelX" 
                  stroke="#0EA5E9" 
                  name="Linear Accel X" 
                  dot={false}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="accelY" 
                  stroke="#8E9196" 
                  name="Linear Accel Y" 
                  dot={false}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="accelZ" 
                  stroke="#EA384C" 
                  name="Linear Accel Z" 
                  dot={false}
                  strokeWidth={2}
                />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#10B981" 
                  name="Pressure" 
                  dot={false}
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default FlightBoundsSelector;
