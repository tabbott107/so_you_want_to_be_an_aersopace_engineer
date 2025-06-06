
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

    const bounds: FlightBounds = {
      flightStart: startTimeNum,
      flightEnd: endTimeNum,
      stationaryStart: 0,
      stationaryEnd: 0
    };

    console.log("Setting bounds:", bounds);
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
              type="text"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder="Enter start time"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end-time">Flight End Time (seconds)</Label>
            <Input
              id="end-time"
              type="text"
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
      </CardContent>
    </Card>
  );
};

export default FlightBoundsSelector;
