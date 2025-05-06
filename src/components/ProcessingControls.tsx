
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { RawData, ProcessedData, ProcessingOptions } from "@/types";
import { processData } from "@/utils/dataProcessing";
import { toast } from "sonner";

interface ProcessingControlsProps {
  data: RawData;
  onProcessingStart: () => void;
  onProcessingComplete: (data: ProcessedData) => void;
}

const ProcessingControls: React.FC<ProcessingControlsProps> = ({
  data,
  onProcessingStart,
  onProcessingComplete,
}) => {
  const [options, setOptions] = useState<ProcessingOptions>({
    filterCutoff: 0.8,
    integrationMethod: "euler",
    gravityCompensation: true,
    calculateFromGyro: true, // Default to true since we're using gyro data
  });
  
  const handleProcess = async () => {
    try {
      onProcessingStart();
      
      // Small delay to allow UI updates
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Process the data
      const processedData = processData(data, options);
      
      // Notify completion
      onProcessingComplete(processedData);
      toast.success("Data processing completed successfully");
    } catch (error) {
      console.error("Processing error:", error);
      toast.error("Error processing data");
    }
  };
  
  return (
    <Card className="p-4 mt-6">
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium mb-4">Processing Options</h3>
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="integration-method">Integration Method</Label>
              <Select
                value={options.integrationMethod}
                onValueChange={(value) =>
                  setOptions({
                    ...options,
                    integrationMethod: value as ProcessingOptions["integrationMethod"],
                  })
                }
              >
                <SelectTrigger id="integration-method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="euler">Euler Integration</SelectItem>
                  <SelectItem value="rk4">Runge-Kutta (RK4)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-gray-500">
                Euler is faster but less accurate. RK4 is more accurate but may be slower.
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filter-cutoff">Smoothing Filter (Alpha)</Label>
              <div className="pt-2">
                <Slider
                  id="filter-cutoff"
                  min={0}
                  max={1}
                  step={0.01}
                  defaultValue={[options.filterCutoff || 0.8]}
                  onValueChange={(value) =>
                    setOptions({
                      ...options,
                      filterCutoff: value[0],
                    })
                  }
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>More Smoothing</span>
                <span>Less Smoothing</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex items-center space-x-2">
            <Switch
              id="gravity-compensation"
              checked={options.gravityCompensation}
              onCheckedChange={(checked) =>
                setOptions({
                  ...options,
                  gravityCompensation: checked,
                })
              }
            />
            <Label htmlFor="gravity-compensation">Apply Gravity Compensation</Label>
          </div>
          
          <div className="flex items-center space-x-2">
            <Switch
              id="calculate-from-gyro"
              checked={options.calculateFromGyro}
              onCheckedChange={(checked) =>
                setOptions({
                  ...options,
                  calculateFromGyro: checked,
                })
              }
            />
            <Label htmlFor="calculate-from-gyro">Calculate Acceleration from Gyroscope Data</Label>
            <div className="text-xs text-gray-500 ml-2">
              (Enable this since your data doesn't include acceleration values)
            </div>
          </div>
        </div>
        
        <div className="pt-2">
          <Button 
            onClick={handleProcess} 
            className="w-full"
            size="lg"
          >
            Process Data
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProcessingControls;
