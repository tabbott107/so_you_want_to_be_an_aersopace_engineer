
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plane } from "lucide-react";
import { toast } from "sonner";

export interface AircraftParameters {
  wingSurfaceArea: number;
  aircraftWeight: number;
  airDensity: number;
}

interface AircraftParametersFormProps {
  onParametersSubmit: (parameters: AircraftParameters) => void;
}

const AircraftParametersForm: React.FC<AircraftParametersFormProps> = ({ 
  onParametersSubmit 
}) => {
  const [wingSurfaceArea, setWingSurfaceArea] = useState<string>("10");
  const [aircraftWeight, setAircraftWeight] = useState<string>("1.5");
  const [airDensity, setAirDensity] = useState<string>("1.225");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate inputs
    const surfaceArea = parseFloat(wingSurfaceArea);
    const weight = parseFloat(aircraftWeight);
    const density = parseFloat(airDensity);
    
    if (isNaN(surfaceArea) || surfaceArea <= 0) {
      toast.error("Please enter a valid wing surface area");
      return;
    }
    
    if (isNaN(weight) || weight <= 0) {
      toast.error("Please enter a valid aircraft weight");
      return;
    }
    
    if (isNaN(density) || density <= 0) {
      toast.error("Please enter a valid air density");
      return;
    }
    
    // Submit parameters
    onParametersSubmit({ 
      wingSurfaceArea: surfaceArea, 
      aircraftWeight: weight, 
      airDensity: density 
    });
    
    toast.success("Aircraft parameters saved successfully");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Plane className="mr-2" />
          Aircraft Parameters
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wing-area">Wing Surface Area (m²)</Label>
            <Input
              id="wing-area"
              type="number"
              step="0.01"
              min="0.01"
              value={wingSurfaceArea}
              onChange={(e) => setWingSurfaceArea(e.target.value)}
              placeholder="Enter wing surface area"
              required
            />
            <p className="text-xs text-gray-500">The total surface area of the aircraft's wings</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="weight">Aircraft Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.01"
              min="0.01"
              value={aircraftWeight}
              onChange={(e) => setAircraftWeight(e.target.value)}
              placeholder="Enter aircraft weight"
              required
            />
            <p className="text-xs text-gray-500">The total weight of the aircraft</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="density">Air Density (kg/m³)</Label>
            <Input
              id="density"
              type="number"
              step="0.001"
              min="0.001"
              value={airDensity}
              onChange={(e) => setAirDensity(e.target.value)}
              placeholder="Enter air density"
              required
            />
            <p className="text-xs text-gray-500">Standard air density at sea level is approximately 1.225 kg/m³</p>
          </div>
          
          <Button type="submit" className="w-full">
            Save Parameters
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default AircraftParametersForm;
