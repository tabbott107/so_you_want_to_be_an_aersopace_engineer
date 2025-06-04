
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FlightBounds, RawData } from "@/types";
import { Plane } from "lucide-react";

interface FlightBoundsSelectorProps {
  data: RawData;
  onBoundsSet: (bounds: FlightBounds) => void;
}

const FlightBoundsSelector: React.FC<FlightBoundsSelectorProps> = ({ data, onBoundsSet }) => {
  const [flightStart, setFlightStart] = useState(10);
  const [flightEnd, setFlightEnd] = useState(90);
  const [stationaryStart, setStationaryStart] = useState(0);
  const [stationaryEnd, setStationaryEnd] = useState(8);

  // Prepare chart data with acceleration magnitude for easier boundary detection
  const chartData = useMemo(() => {
    return data.data.map((point, index) => {
      const accelMagnitude = Math.sqrt(
        (point.accelX || 0) ** 2 + 
        (point.accelY || 0) ** 2 + 
        (point.accelZ || 0) ** 2
      );
      return {
        index,
        timestamp: point.timestamp,
        accelMagnitude,
        displayTime: ((point.timestamp - data.data[0].timestamp) / 1000).toFixed(2)
      };
    });
  }, [data]);

  // Convert percentage positions to actual data indices
  const getActualIndex = (percentage: number) => {
    return Math.floor((percentage / 100) * chartData.length);
  };

  // Get reference line positions based on percentage
  const getReferencePosition = (percentage: number) => {
    const index = Math.floor((percentage / 100) * chartData.length);
    return chartData[index]?.displayTime;
  };

  const handleChartClick = (event: any) => {
    if (!event || !event.activeLabel) return;
    
    const clickedIndex = chartData.findIndex(d => d.displayTime === event.activeLabel);
    if (clickedIndex === -1) return;
    
    const clickedPercentage = (clickedIndex / chartData.length) * 100;
    
    // Determine which slider to move based on proximity
    const distances = [
      { slider: 'stationaryStart', distance: Math.abs(clickedPercentage - stationaryStart) },
      { slider: 'stationaryEnd', distance: Math.abs(clickedPercentage - stationaryEnd) },
      { slider: 'flightStart', distance: Math.abs(clickedPercentage - flightStart) },
      { slider: 'flightEnd', distance: Math.abs(clickedPercentage - flightEnd) }
    ];
    
    const closest = distances.reduce((min, curr) => curr.distance < min.distance ? curr : min);
    
    switch (closest.slider) {
      case 'stationaryStart':
        setStationaryStart(clickedPercentage);
        break;
      case 'stationaryEnd':
        setStationaryEnd(clickedPercentage);
        break;
      case 'flightStart':
        setFlightStart(clickedPercentage);
        break;
      case 'flightEnd':
        setFlightEnd(clickedPercentage);
        break;
    }
  };

  const handleSetBounds = () => {
    const bounds: FlightBounds = {
      flightStart: getActualIndex(flightStart),
      flightEnd: getActualIndex(flightEnd),
      stationaryStart: getActualIndex(stationaryStart),
      stationaryEnd: getActualIndex(stationaryEnd)
    };
    onBoundsSet(bounds);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Acceleration Magnitude vs Time</CardTitle>
          <p className="text-sm text-gray-600">Click on the chart to move the nearest slider</p>
        </CardHeader>
        <CardContent>
          <div className="h-96">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} onClick={handleChartClick}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="displayTime" 
                  label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                />
                <YAxis 
                  label={{ value: 'Acceleration (m/s²)', angle: -90, position: 'insideLeft' }} 
                />
                <Tooltip 
                  formatter={(value) => [`${Number(value).toFixed(3)} m/s²`, 'Acceleration']}
                  labelFormatter={(label) => `Time: ${label}s`}
                />
                <Line 
                  type="monotone" 
                  dataKey="accelMagnitude" 
                  stroke="#0EA5E9" 
                  dot={false}
                  strokeWidth={2}
                />
                <ReferenceLine 
                  x={getReferencePosition(flightStart)} 
                  stroke="green" 
                  strokeDasharray="5 5" 
                  label="Flight Start" 
                />
                <ReferenceLine 
                  x={getReferencePosition(flightEnd)} 
                  stroke="red" 
                  strokeDasharray="5 5" 
                  label="Flight End" 
                />
                <ReferenceLine 
                  x={getReferencePosition(stationaryStart)} 
                  stroke="blue" 
                  strokeDasharray="5 5" 
                  label="Stationary Start" 
                />
                <ReferenceLine 
                  x={getReferencePosition(stationaryEnd)} 
                  stroke="purple" 
                  strokeDasharray="5 5" 
                  label="Stationary End" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Plane className="mr-2" />
            Flight Boundaries
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-green-700">Flight Period</h4>
              <div>
                <Label>Flight Start (%): {flightStart.toFixed(1)}</Label>
                <Slider
                  value={[flightStart]}
                  onValueChange={(value) => setFlightStart(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Flight End (%): {flightEnd.toFixed(1)}</Label>
                <Slider
                  value={[flightEnd]}
                  onValueChange={(value) => setFlightEnd(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>

            <div className="space-y-4">
              <h4 className="font-medium text-blue-700">Stationary Period (for IMU calibration)</h4>
              <div>
                <Label>Stationary Start (%): {stationaryStart.toFixed(1)}</Label>
                <Slider
                  value={[stationaryStart]}
                  onValueChange={(value) => setStationaryStart(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Stationary End (%): {stationaryEnd.toFixed(1)}</Label>
                <Slider
                  value={[stationaryEnd]}
                  onValueChange={(value) => setStationaryEnd(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t">
            <Button onClick={handleSetBounds} className="w-full" size="lg">
              Set Flight Boundaries & Analyze Flight
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FlightBoundsSelector;
