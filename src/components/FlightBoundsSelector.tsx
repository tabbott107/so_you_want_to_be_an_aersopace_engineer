
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { FlightBounds, RawData } from "@/types";
import { Plane } from "lucide-react";

interface FlightBoundsSelectorProps {
  data: RawData;
  onBoundsSet: (bounds: FlightBounds) => void;
  flightStart: number;
  flightEnd: number;
  stationaryStart: number;
  stationaryEnd: number;
  onFlightStartChange: (value: number) => void;
  onFlightEndChange: (value: number) => void;
  onStationaryStartChange: (value: number) => void;
  onStationaryEndChange: (value: number) => void;
}

const FlightBoundsSelector: React.FC<FlightBoundsSelectorProps> = ({ 
  data, 
  onBoundsSet,
  flightStart,
  flightEnd,
  stationaryStart,
  stationaryEnd,
  onFlightStartChange,
  onFlightEndChange,
  onStationaryStartChange,
  onStationaryEndChange
}) => {
  // Convert percentage positions to actual data indices
  const getActualIndex = (percentage: number) => {
    return Math.floor((percentage / 100) * data.data.length);
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
                onValueChange={(value) => onFlightStartChange(value[0])}
                max={100}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Flight End (%): {flightEnd.toFixed(1)}</Label>
              <Slider
                value={[flightEnd]}
                onValueChange={(value) => onFlightEndChange(value[0])}
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
                onValueChange={(value) => onStationaryStartChange(value[0])}
                max={100}
                step={0.1}
                className="mt-2"
              />
            </div>
            <div>
              <Label>Stationary End (%): {stationaryEnd.toFixed(1)}</Label>
              <Slider
                value={[stationaryEnd]}
                onValueChange={(value) => onStationaryEndChange(value[0])}
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
  );
};

export default FlightBoundsSelector;
