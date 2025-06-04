
import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { FlightBounds, RawData } from "@/types";
import { Plane, ZoomIn } from "lucide-react";

interface FlightBoundsSelectorProps {
  data: RawData;
  onBoundsSet: (bounds: FlightBounds) => void;
}

const FlightBoundsSelector: React.FC<FlightBoundsSelectorProps> = ({ data, onBoundsSet }) => {
  const [zoomStart, setZoomStart] = useState(0);
  const [zoomEnd, setZoomEnd] = useState(100);
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

  // Get zoomed data based on percentage sliders
  const zoomedData = useMemo(() => {
    const startIdx = Math.floor((zoomStart / 100) * chartData.length);
    const endIdx = Math.floor((zoomEnd / 100) * chartData.length);
    return chartData.slice(startIdx, endIdx);
  }, [chartData, zoomStart, zoomEnd]);

  // Convert percentage positions to actual data indices
  const getActualIndex = (percentage: number) => {
    return Math.floor((percentage / 100) * chartData.length);
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
          <CardTitle className="flex items-center">
            <ZoomIn className="mr-2" />
            Zoom Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Zoom Start (%): {zoomStart}</Label>
            <Slider
              value={[zoomStart]}
              onValueChange={(value) => setZoomStart(value[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
          <div>
            <Label>Zoom End (%): {zoomEnd}</Label>
            <Slider
              value={[zoomEnd]}
              onValueChange={(value) => setZoomEnd(value[0])}
              max={100}
              step={1}
              className="mt-2"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Acceleration Magnitude vs Time</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={zoomedData}>
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
                <ReferenceLine x={flightStart} stroke="green" strokeDasharray="5 5" label="Flight Start" />
                <ReferenceLine x={flightEnd} stroke="red" strokeDasharray="5 5" label="Flight End" />
                <ReferenceLine x={stationaryStart} stroke="blue" strokeDasharray="5 5" label="Stationary Start" />
                <ReferenceLine x={stationaryEnd} stroke="purple" strokeDasharray="5 5" label="Stationary End" />
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
                <Label>Flight Start (%): {flightStart}</Label>
                <Slider
                  value={[flightStart]}
                  onValueChange={(value) => setFlightStart(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Flight End (%): {flightEnd}</Label>
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
                <Label>Stationary Start (%): {stationaryStart}</Label>
                <Slider
                  value={[stationaryStart]}
                  onValueChange={(value) => setStationaryStart(value[0])}
                  max={100}
                  step={0.1}
                  className="mt-2"
                />
              </div>
              <div>
                <Label>Stationary End (%): {stationaryEnd}</Label>
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
