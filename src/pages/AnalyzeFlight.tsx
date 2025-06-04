
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
  const [steadyWindowStart, setSteadyWindowStart] = useState(0);
  const [steadyWindowEnd, setSteadyWindowEnd] = useState(100);

  useEffect(() => {
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

  // Prepare chart data
  const chartData = coefficients.map((coeff, index) => ({
    index,
    time: ((coeff.timestamp - coefficients[0]?.timestamp || 0) / 1000).toFixed(2),
    CL: Number(coeff.CL.toFixed(4)),
    CD: Number(coeff.CD.toFixed(4)),
    velocity: Number(coeff.velocity.toFixed(2)),
    dynamicPressure: Number(coeff.dynamicPressure.toFixed(2))
  }));

  // Calculate steady window statistics
  const steadyStartIdx = Math.floor((steadyWindowStart / 100) * coefficients.length);
  const steadyEndIdx = Math.floor((steadyWindowEnd / 100) * coefficients.length);
  const steadyData = coefficients.slice(steadyStartIdx, steadyEndIdx);
  
  const avgCL = steadyData.length > 0 ? 
    steadyData.reduce((sum, c) => sum + c.CL, 0) / steadyData.length : 0;
  const avgCD = steadyData.length > 0 ? 
    steadyData.reduce((sum, c) => sum + c.CD, 0) / steadyData.length : 0;
  
  const stdCL = steadyData.length > 1 ? 
    Math.sqrt(steadyData.reduce((sum, c) => sum + Math.pow(c.CL - avgCL, 2), 0) / (steadyData.length - 1)) : 0;
  const stdCD = steadyData.length > 1 ? 
    Math.sqrt(steadyData.reduce((sum, c) => sum + Math.pow(c.CD - avgCD, 2), 0) / (steadyData.length - 1)) : 0;

  const liftToDragRatio = avgCD > 0 ? avgCL / avgCD : 0;

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
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle>Aerodynamic Coefficients vs Time</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis 
                        dataKey="time" 
                        label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                      />
                      <YAxis 
                        label={{ value: 'Coefficient', angle: -90, position: 'insideLeft' }} 
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          Number(value).toFixed(4), 
                          name === 'CL' ? 'Lift Coefficient' : 'Drag Coefficient'
                        ]}
                        labelFormatter={(label) => `Time: ${label}s`}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="CL" 
                        stroke="#22C55E" 
                        name="CL (Lift)" 
                        dot={false}
                        strokeWidth={2}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="CD" 
                        stroke="#EF4444" 
                        name="CD (Drag)" 
                        dot={false}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Steady Flight Statistics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Lift Coefficient</p>
                  <p className="text-2xl font-bold text-green-700">{avgCL.toFixed(4)}</p>
                  <p className="text-xs text-gray-500">± {stdCL.toFixed(4)}</p>
                </div>
                
                <div className="bg-red-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Average Drag Coefficient</p>
                  <p className="text-2xl font-bold text-red-700">{avgCD.toFixed(4)}</p>
                  <p className="text-xs text-gray-500">± {stdCD.toFixed(4)}</p>
                </div>
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">Lift-to-Drag Ratio</p>
                  <p className="text-2xl font-bold text-blue-700">{liftToDragRatio.toFixed(2)}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Velocity and Dynamic Pressure</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="time" 
                      label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} 
                    />
                    <YAxis 
                      yAxisId="left"
                      label={{ value: 'Velocity (m/s)', angle: -90, position: 'insideLeft' }} 
                    />
                    <YAxis 
                      yAxisId="right"
                      orientation="right"
                      label={{ value: 'Dynamic Pressure (Pa)', angle: 90, position: 'insideRight' }} 
                    />
                    <Tooltip 
                      formatter={(value, name) => [
                        Number(value).toFixed(2), 
                        name === 'velocity' ? 'Velocity (m/s)' : 'Dynamic Pressure (Pa)'
                      ]}
                      labelFormatter={(label) => `Time: ${label}s`}
                    />
                    <Legend />
                    <Line 
                      yAxisId="left"
                      type="monotone" 
                      dataKey="velocity" 
                      stroke="#3B82F6" 
                      name="Velocity" 
                      dot={false}
                      strokeWidth={2}
                    />
                    <Line 
                      yAxisId="right"
                      type="monotone" 
                      dataKey="dynamicPressure" 
                      stroke="#F59E0B" 
                      name="Dynamic Pressure" 
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
