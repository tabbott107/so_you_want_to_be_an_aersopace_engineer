
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RawData, FlightBounds, AircraftParameters, AerodynamicCoefficient } from "@/types";
import { calculateAerodynamicCoefficients } from "@/utils/aerodynamicCalculations";
import { Rocket, Download, BarChart3, Clock } from "lucide-react";
import { toast } from "sonner";

interface AnalyzeFlightProps {
  data: RawData;
  bounds: FlightBounds;
  aircraftParams: AircraftParameters;
  onBack: () => void;
}

const AnalyzeFlight: React.FC<AnalyzeFlightProps> = ({
  data,
  bounds: initialBounds,
  aircraftParams,
  onBack
}) => {
  const [coefficients, setCoefficients] = useState<AerodynamicCoefficient[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [bounds, setBounds] = useState<FlightBounds>(initialBounds);
  const [startTime, setStartTime] = useState(0);
  const [endTime, setEndTime] = useState(10);

  // Calculate total time duration from data
  const totalDuration = data.data.length > 0 ? 
    (data.data[data.data.length - 1].timestamp - data.data[0].timestamp) / 1000 : 0;

  useEffect(() => {
    // Initialize time inputs based on bounds
    const startSeconds = (bounds.flightStart / data.data.length) * totalDuration;
    const endSeconds = (bounds.flightEnd / data.data.length) * totalDuration;
    setStartTime(startSeconds);
    setEndTime(endSeconds);
    
    calculateCoefficients();
  }, [data, bounds, aircraftParams]);

  const calculateCoefficients = async () => {
    setIsCalculating(true);
    try {
      console.log("Calculating aerodynamic coefficients...");
      const result = calculateAerodynamicCoefficients(data.data, bounds, aircraftParams);
      setCoefficients(result);
      toast.success("Aerodynamic coefficients calculated successfully");
    } catch (error) {
      console.error("Error calculating coefficients:", error);
      toast.error("Error calculating aerodynamic coefficients");
    } finally {
      setIsCalculating(false);
    }
  };

  const handleUpdateBounds = () => {
    if (startTime >= endTime) {
      toast.error("Start time must be less than end time");
      return;
    }
    
    if (startTime < 0 || endTime > totalDuration) {
      toast.error(`Times must be between 0 and ${totalDuration.toFixed(2)} seconds`);
      return;
    }

    // Convert time inputs to data indices
    const startPercentage = (startTime / totalDuration) * 100;
    const endPercentage = (endTime / totalDuration) * 100;
    
    const newBounds: FlightBounds = {
      flightStart: Math.floor((startPercentage / 100) * data.data.length),
      flightEnd: Math.floor((endPercentage / 100) * data.data.length),
      stationaryStart: bounds.stationaryStart,
      stationaryEnd: bounds.stationaryEnd
    };

    setBounds(newBounds);
    toast.success("Flight bounds updated");
  };

  // Prepare chart data
  const chartData = coefficients.map((coeff, index) => ({
    index,
    time: ((coeff.timestamp - coefficients[0]?.timestamp || 0) / 1000).toFixed(2),
    CL: Number(coeff.CL.toFixed(4)),
    CD: Number(coeff.CD.toFixed(4)),
    velocity: Number(coeff.velocity.toFixed(2)),
    dynamicPressure: Number(coeff.dynamicPressure.toFixed(2))
  }));

  // Calculate average coefficients
  const avgCL = coefficients.length > 0 ? 
    coefficients.reduce((sum, c) => sum + c.CL, 0) / coefficients.length : 0;
  const avgCD = coefficients.length > 0 ? 
    coefficients.reduce((sum, c) => sum + c.CD, 0) / coefficients.length : 0;
  
  const liftToDragRatio = avgCD > 0 ? avgCL / avgCD : 0;

  // Prepare acceleration data for the flight period
  const flightData = data.data.slice(bounds.flightStart, bounds.flightEnd + 1);
  const accelChartData = flightData.map((point, index) => {
    const accelX = point['linear_accel_x'] || point['Linear Accel X'] || 0;
    const accelY = point['linear_accel_y'] || point['Linear Accel Y'] || 0;
    const accelZ = point['linear_accel_z'] || point['Linear Accel Z'] || 0;
    
    return {
      index,
      time: ((point.timestamp - flightData[0].timestamp) / 1000).toFixed(2),
      accelX: Number(accelX.toFixed(4)),
      accelY: Number(accelY.toFixed(4)),
      accelZ: Number(accelZ.toFixed(4))
    };
  });

  const downloadResults = () => {
    const csvContent = [
      "Time(s),CL,CD,Velocity(m/s),DynamicPressure(Pa)",
      ...chartData.map(row => `${row.time},${row.CL},${row.CD},${row.velocity},${row.dynamicPressure}`)
    ].join("\n");
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", "aerodynamic_coefficients.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  if (isCalculating) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex items-center justify-center">
        <Card className="p-8">
          <div className="text-center">
            <Rocket className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
            <h2 className="text-xl font-bold mb-2">Calculating Aerodynamic Coefficients</h2>
            <p className="text-gray-600">Processing flight data...</p>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <BarChart3 className="h-12 w-12 text-blue-600 mr-3" />
          </div>
          <h1 className="text-3xl font-bold mt-2 text-gray-800">Flight Analysis Results</h1>
          <p className="text-gray-600 mt-2">Aerodynamic coefficients calculated from IMU data</p>
        </header>

        <div className="space-y-6">
          {/* Average Coefficients Display */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Lift Coefficient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">{avgCL.toFixed(4)}</p>
                  <p className="text-sm text-gray-600">C_L (mean)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Average Drag Coefficient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-red-700">{avgCD.toFixed(4)}</p>
                  <p className="text-sm text-gray-600">C_D (mean)</p>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Lift-to-Drag Ratio</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-blue-700">{liftToDragRatio.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">L/D Ratio</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Flight Acceleration Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Flight Acceleration Data</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={accelChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Acceleration (m/s²)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        Number(value).toFixed(4), 
                        name === 'accelX' ? 'Linear Accel X' : 
                        name === 'accelY' ? 'Linear Accel Y' : 'Linear Accel Z'
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
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Flight Bounds Update */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Clock className="mr-2" />
                Update Flight Time Bounds
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
                Current flight duration: {((endTime - startTime)).toFixed(2)} seconds
              </div>
              
              <Button onClick={handleUpdateBounds} className="w-full">
                Update Flight Bounds & Recalculate
              </Button>
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button onClick={onBack} variant="outline">
              Back to Visualization
            </Button>
            <Button onClick={downloadResults} className="flex items-center">
              <Download className="mr-2 h-4 w-4" />
              Download Results
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyzeFlight;
