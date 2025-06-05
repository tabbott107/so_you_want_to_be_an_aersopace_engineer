
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  const [startTime, setStartTime] = useState(flightStart);
  const [endTime, setEndTime] = useState(flightEnd);

  // Calculate total time duration from data
  const totalDuration = data.data.length > 0 ? 
    (data.data[data.data.length - 1].timestamp - data.data[0].timestamp) / 1000 : 0;

  const handleSetBounds = () => {
    if (startTime >= endTime) {
      alert("Start time must be less than end time");
      return;
    }
    
    if (startTime < 0 || endTime > totalDuration) {
      alert(`Times must be between 0 and ${totalDuration.toFixed(2)} seconds`);
      return;
    }

    // Convert time inputs to data indices
    const startPercentage = (startTime / totalDuration) * 100;
    const endPercentage = (endTime / totalDuration) * 100;
    
    const bounds: FlightBounds = {
      flightStart: Math.floor((startPercentage / 100) * data.data.length),
      flightEnd: Math.floor((endPercentage / 100) * data.data.length),
      stationaryStart: 0,
      stationaryEnd: 0
    };

    onBoundsSet(bounds);
  };

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
              step="0.1"
              min="0"
              max={totalDuration}
              value={startTime}
              onChange={(e) => setStartTime(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Flight End Time (seconds)</Label>
            <Input
              id="end-time"
              type="number"
              step="0.1"
              min="0"
              max={totalDuration}
              value={endTime}
              onChange={(e) => setEndTime(parseFloat(e.target.value) || 0)}
            />
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Total flight duration: {totalDuration.toFixed(2)} seconds
        </div>
        
        <Button onClick={handleSetBounds} className="w-full">
          Set Flight Bounds
        </Button>
      </CardContent>
    </Card>
  );
};

export default FlightBoundsSelector;
