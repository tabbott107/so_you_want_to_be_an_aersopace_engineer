
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import FileUploader from "@/components/FileUploader";
import DataVisualizer from "@/components/DataVisualizer";
import ProcessingControls from "@/components/ProcessingControls";
import { ProcessedData, RawData } from "@/types";

const Index = () => {
  const [rawData, setRawData] = useState<RawData | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<string>("upload");

  const handleFileUploaded = (data: RawData) => {
    setRawData(data);
    setProcessedData(null);
    setActiveTab("visualize");
  };

  const handleDataProcessed = (data: ProcessedData) => {
    setProcessedData(data);
    setIsProcessing(false);
    setActiveTab("export");
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8 text-center">IMU Data Processor</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="upload">Upload Data</TabsTrigger>
          <TabsTrigger value="visualize" disabled={!rawData}>Visualize Data</TabsTrigger>
          <TabsTrigger value="export" disabled={!processedData}>Export Results</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload CSV Data</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUploader onFileUploaded={handleFileUploaded} />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="visualize" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Data Visualization</CardTitle>
            </CardHeader>
            <CardContent>
              {rawData && (
                <>
                  <DataVisualizer data={rawData} />
                  <ProcessingControls 
                    data={rawData} 
                    onProcessingStart={() => setIsProcessing(true)}
                    onProcessingComplete={handleDataProcessed}
                  />
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="export" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Export Processed Data</CardTitle>
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
                        link.setAttribute("download", "processed_data.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="w-full sm:w-auto"
                    >
                      Download CSV
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Index;
