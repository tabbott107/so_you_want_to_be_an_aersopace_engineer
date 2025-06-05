
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { RawData, FlightBounds, AircraftParameters, AerodynamicCoefficient } from "@/types";
import { calculateAerodynamicCoefficients } from "@/utils/aerodynamicCalculations";
import { Rocket, Download, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface AnalyzeFlightProps {
  data: RawData;
  bounds: FlightBounds;
  aircraftParams: AircraftParameters;
  onBack: () => void;
}

const AnalyzeFlight: React.FC<AnalyzeFlightProps> = ({
  data,
  bounds,
  aircraftParams,
  onBack
}) => {
  const [coefficients, setCoefficients] = useState<AerodynamicCoefficient[]>([]);
  const [isCalculating, setIsCalculating] = useState(false);

  // Calculate start and end times from bounds
  const startTime = bounds ? data.data[bounds.flightStart].timestamp : 0;
  const endTime = bounds ? data.data[bounds.flightEnd].timestamp : 10;

  useEffect(() => {
    calculateCoefficients();
  }, [data, bounds, aircraftParams]);

  const calculateCoefficients = async () => {
    setIsCalculating(true);
    try {
      console.log("Calculating aerodynamic coefficients with bounds...");
      console.log("Start time:", startTime, "End time:", endTime);
      
      const result = calculateAerodynamicCoefficients(data.data, startTime, endTime, aircraftParams);
      setCoefficients(result);
      toast.success("Aerodynamic coefficients calculated successfully");
    } catch (error) {
      console.error("Error calculating coefficients:", error);
      toast.error("Error calculating aerodynamic coefficients");
    } finally {
      setIsCalculating(false);
    }
  };

  // Calculate average coefficients and standard deviations
  const avgCL = coefficients.length > 0 ? 
    coefficients.reduce((sum, c) => sum + c.CL, 0) / coefficients.length : 0;
  const avgCD = coefficients.length > 0 ? 
    coefficients.reduce((sum, c) => sum + c.CD, 0) / coefficients.length : 0;
  
  const stdCL = coefficients.length > 1 ? 
    Math.sqrt(coefficients.reduce((sum, c) => sum + Math.pow(c.CL - avgCL, 2), 0) / (coefficients.length - 1)) : 0;
  const stdCD = coefficients.length > 1 ? 
    Math.sqrt(coefficients.reduce((sum, c) => sum + Math.pow(c.CD - avgCD, 2), 0) / (coefficients.length - 1)) : 0;
  
  const liftToDragRatio = avgCD > 0 ? avgCL / avgCD : 0;

  // Prepare data for visualization (filtered to time bounds)
  const flightData = data.data.filter(point => 
    point.timestamp >= startTime && point.timestamp <= endTime
  );
  
  const sensorChartData = flightData.map((point, index) => {
    const accelX = point['Linear Accel X'] || point['linear_accel_x'] || point['LinAccel X'] || 0;
    const pressure = point['Pressure'] || point['pressure'] || 0;
    
    return {
      index,
      time: ((point.timestamp - flightData[0].timestamp)).toFixed(2),
      accelX: Number(accelX.toFixed(4)),
      pressure: Number(pressure.toFixed(4))
    };
  });

  const downloadResults = () => {
    const csvContent = [
      "Time(s),CL,CD,Velocity(m/s),DynamicPressure(Pa)",
      ...coefficients.map(coeff => {
        return `${coeff.timestamp.toFixed(2)},${coeff.CL.toFixed(4)},${coeff.CD.toFixed(4)},${coeff.velocity.toFixed(2)},${coeff.dynamicPressure.toFixed(2)}`;
      })
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
          <p className="text-gray-600 mt-2">Aerodynamic coefficients calculated from pressure and acceleration data</p>
          <p className="text-sm text-gray-500 mt-1">Time Period: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s</p>
        </header>

        <div className="space-y-6">
          {/* Coefficient Statistics Display */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Average Lift Coefficient</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-green-700">{avgCL.toFixed(4)}</p>
                  <p className="text-sm text-gray-600">C_L (mean)</p>
                  <p className="text-xs text-gray-500">±{stdCL.toFixed(4)} std</p>
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
                  <p className="text-xs text-gray-500">±{stdCD.toFixed(4)} std</p>
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

            <Card>
              <CardHeader>
                <CardTitle>Data Points</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <p className="text-3xl font-bold text-purple-700">{coefficients.length}</p>
                  <p className="text-sm text-gray-600">Samples</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Forward Acceleration Data Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Forward Acceleration Data (Time Period: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Forward Acceleration (m/s²)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value) => [Number(value).toFixed(4), 'Forward Acceleration']}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="accelX" 
                      stroke="#0EA5E9" 
                      name="Forward Acceleration" 
                      dot={false}
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Pressure Data Graph */}
          <Card>
            <CardHeader>
              <CardTitle>Pressure Data (Time Period: {startTime.toFixed(2)}s - {endTime.toFixed(2)}s)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sensorChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      label={{ value: 'Pressure (Pa)', angle: -90, position: 'insideLeft' }} 
                    />
                    <Tooltip 
                      formatter={(value) => [Number(value).toFixed(4), 'Pressure']}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    <Legend />
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
            </CardContent>
          </Card>

          <div className="flex justify-center space-x-4">
            <Button onClick={onBack} variant="outline">
              Back to Flight Bounds
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
