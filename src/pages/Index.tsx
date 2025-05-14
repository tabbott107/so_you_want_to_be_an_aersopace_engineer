
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/FileUploader";
import DataVisualizer from "@/components/DataVisualizer";
import ProcessingControls from "@/components/ProcessingControls";
import AircraftParametersForm from "@/components/AircraftParametersForm";
import { ProcessedData, RawData, AircraftParameters } from "@/types";
import { Rocket, Plane, Wind, Gauge } from "lucide-react";

const Index = () => {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [aircraftParams, setAircraftParams] = useState<AircraftParameters | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleFileUploaded = (data: RawData) => {
    setRawData(data);
    setProcessedData(null);
    setActiveTab("parameters");
  };

  const handleParametersSubmit = (params: AircraftParameters) => {
    setAircraftParams(params);
    setActiveTab("visualize");
  };

  const handleDataProcessed = (data: ProcessedData) => {
    setProcessedData(data);
    setIsProcessing(false);
    setActiveTab("export");
  };

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
              Visualize Data
            </TabsTrigger>
            <TabsTrigger value="export" disabled={!processedData} className="flex items-center justify-center">
              <Rocket className="h-4 w-4 mr-2" />
              Export Results
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
                    Continue to Data Visualization
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
                  Flight Data Visualization
                </CardTitle>
              </CardHeader>
              <CardContent>
                {rawData && (
                  <>
                    <DataVisualizer data={rawData} />
                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <h3 className="text-lg font-medium mb-4">Process Data for Analysis</h3>
                      <ProcessingControls 
                        data={rawData} 
                        onProcessingStart={() => setIsProcessing(true)}
                        onProcessingComplete={handleDataProcessed}
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="export" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Rocket className="mr-2" />
                  Export Processed Flight Data
                </CardTitle>
              </CardHeader>
              <CardContent>
                {processedData && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-lg font-medium">Processed Results</h3>
                      <DataVisualizer data={processedData} />
                    </div>
                    
                    <div className="flex justify-center">
                      <Button
                        onClick={() => {
                          const csvContent = processedData.csvContent;
                          const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
                          const url = URL.createObjectURL(blob);
                          const link = document.createElement("a");
                          link.setAttribute("href", url);
                          link.setAttribute("download", "processed_flight_data.csv");
                          document.body.appendChild(link);
                          link.click();
                          document.body.removeChild(link);
                        }}
                        className="w-full sm:w-auto"
                      >
                        <Plane className="mr-2 h-4 w-4" /> Download Processed Data (CSV)
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mt-4">
                      <h4 className="font-medium text-blue-800 mb-2">Coming Soon: Aerodynamic Coefficient Calculations</h4>
                      <p className="text-blue-700 text-sm">
                        In an upcoming update, this data will be used to calculate drag and lift coefficients 
                        based on your aircraft parameters and flight data.
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
