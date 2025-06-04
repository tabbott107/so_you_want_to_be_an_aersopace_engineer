
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/FileUploader";
import DataVisualizer from "@/components/DataVisualizer";
import AircraftParametersForm from "@/components/AircraftParametersForm";
import FlightBoundsSelector from "@/components/FlightBoundsSelector";
import AnalyzeFlight from "@/pages/AnalyzeFlight";
import { RawData, AircraftParameters, FlightBounds } from "@/types";
import { Rocket, Plane, Wind, Gauge, BarChart3 } from "lucide-react";

const Index = () => {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [aircraftParams, setAircraftParams] = useState<AircraftParameters | null>(null);
  const [flightBounds, setFlightBounds] = useState<FlightBounds | null>(null);
  const [activeTab, setActiveTab] = useState<string>("upload");
  const [showAnalysis, setShowAnalysis] = useState<boolean>(false);
  
  // Flight boundary state
  const [flightStart, setFlightStart] = useState(10);
  const [flightEnd, setFlightEnd] = useState(90);
  const [stationaryStart, setStationaryStart] = useState(0);
  const [stationaryEnd, setStationaryEnd] = useState(8);

  const handleFileUploaded = (data: RawData) => {
    setRawData(data);
    setFlightBounds(null);
    setShowAnalysis(false);
    setActiveTab("parameters");
  };

  const handleParametersSubmit = (params: AircraftParameters) => {
    setAircraftParams(params);
    setActiveTab("visualize");
  };

  const handleBoundsSet = (bounds: FlightBounds) => {
    setFlightBounds(bounds);
    setShowAnalysis(true);
  };

  const handleBackToVisualization = () => {
    setShowAnalysis(false);
    setActiveTab("visualize");
  };

  const handleChartClick = (event: any) => {
    if (!event || !event.activeLabel || !rawData) return;
    
    // Find the clicked time position
    const clickedTime = parseFloat(event.activeLabel);
    const totalTime = rawData.data.length > 0 ? 
      ((rawData.data[rawData.data.length - 1].timestamp - rawData.data[0].timestamp) / 1000) : 1;
    
    const clickedPercentage = (clickedTime / totalTime) * 100;
    
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

  if (showAnalysis && rawData && flightBounds && aircraftParams) {
    return (
      <AnalyzeFlight
        data={rawData}
        bounds={flightBounds}
        aircraftParams={aircraftParams}
        onBack={handleBackToVisualization}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white">
      <div className="container mx-auto py-8 px-4">
        <header className="mb-8 text-center">
          <div className="flex justify-center">
            <Rocket className="h-12 w-12 text-blue-600 mr-3" />
          </div>
          <h1 className="text-3xl font-bold mt-2 text-gray-800">Aerospace IMU Data Analyzer</h1>
          <p className="text-gray-600 mt-2">Analyze and process IMU data for flight performance calculations</p>
        </header>
        
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="upload" className="flex items-center justify-center">
              <Plane className="h-4 w-4 mr-2" />
              Upload Data
            </TabsTrigger>
            <TabsTrigger value="parameters" disabled={!rawData} className="flex items-center justify-center">
              <Wind className="h-4 w-4 mr-2" />
              Aircraft Parameters
            </TabsTrigger>
            <TabsTrigger value="visualize" disabled={!rawData || !aircraftParams} className="flex items-center justify-center">
              <Gauge className="h-4 w-4 mr-2" />
              Set Flight Bounds
            </TabsTrigger>
            <TabsTrigger value="results" disabled={!flightBounds} className="flex items-center justify-center">
              <BarChart3 className="h-4 w-4 mr-2" />
              Flight Analysis
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Plane className="mr-2" />
                  Upload Flight Data CSV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader onFileUploaded={handleFileUploaded} />
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="parameters" className="mt-6">
            {rawData && !aircraftParams && (
              <AircraftParametersForm onParametersSubmit={handleParametersSubmit} />
            )}
            {rawData && aircraftParams && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Plane className="mr-2" />
                    Aircraft Parameters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-sky-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Wing Surface Area</p>
                      <p className="text-xl font-bold">{aircraftParams.wingSurfaceArea} m²</p>
                    </div>
                    <div className="bg-sky-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Aircraft Weight</p>
                      <p className="text-xl font-bold">{aircraftParams.aircraftWeight} kg</p>
                    </div>
                    <div className="bg-sky-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Air Density</p>
                      <p className="text-xl font-bold">{aircraftParams.airDensity} kg/m³</p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => setActiveTab("visualize")} 
                    className="mt-4 w-full"
                  >
                    Continue to Flight Bounds Selection
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="visualize" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Gauge className="mr-2" />
                  Flight Data Visualization & Bounds Selection
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {rawData && (
                  <>
                    <FlightBoundsSelector 
                      data={rawData}
                      onBoundsSet={handleBoundsSet}
                      flightStart={flightStart}
                      flightEnd={flightEnd}
                      stationaryStart={stationaryStart}
                      stationaryEnd={stationaryEnd}
                      onFlightStartChange={setFlightStart}
                      onFlightEndChange={setFlightEnd}
                      onStationaryStartChange={setStationaryStart}
                      onStationaryEndChange={setStationaryEnd}
                    />
                    
                    <DataVisualizer 
                      data={rawData} 
                      flightStart={flightStart}
                      flightEnd={flightEnd}
                      stationaryStart={stationaryStart}
                      stationaryEnd={stationaryEnd}
                      onChartClick={handleChartClick}
                    />
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="results" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2" />
                  Flight Analysis Complete
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <p className="text-gray-600 mb-4">Flight bounds have been set and analysis is ready.</p>
                  <Button
                    onClick={() => setShowAnalysis(true)}
                    className="w-full sm:w-auto"
                  >
                    <Rocket className="mr-2 h-4 w-4" /> 
                    View Aerodynamic Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
