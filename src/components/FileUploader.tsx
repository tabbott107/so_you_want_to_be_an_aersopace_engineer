
import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RawData } from "@/types";
import { toast } from "sonner";

interface FileUploaderProps {
  onFileUploaded: (data: RawData) => void;
}

const FileUploader: React.FC<FileUploaderProps> = ({ onFileUploaded }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const parseCSV = (content: string): RawData | null => {
    try {
      const lines = content.trim().split("\n");
      if (lines.length < 2) {
        throw new Error("CSV file must contain headers and at least one row of data");
      }

      const headers = lines[0].split(",").map(h => h.trim());
      
      // Map the headers from your CSV format to the expected format
      const headerMapping: { [key: string]: string } = {
        "Time (s)": "timestamp",
        "Gyro X": "gyroX",
        "Y": "gyroY",
        "Z (rad/s)": "gyroZ",
        "Pressure (p": "pressure",
        "Temp (C)": "temperature" // Extra column not used in the app's data model
      };
      
      // For acceleration, we'll use zeros as placeholders since they're missing
      // from your CSV but required by the app
      
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error("CSV row has incorrect number of columns");
        }

        const timestamp = parseFloat(values[headers.findIndex(h => h === "Time (s)")]);
        const gyroX = parseFloat(values[headers.findIndex(h => h === "Gyro X")]);
        const gyroY = parseFloat(values[headers.findIndex(h => h === "Y")]);
        const gyroZ = parseFloat(values[headers.findIndex(h => h === "Z (rad/s)")]);
        
        // Handle the pressure column which might be combined with temperature
        let pressure = 0;
        const pressureIndex = headers.findIndex(h => h.includes("Pressure"));
        if (pressureIndex >= 0) {
          pressure = parseFloat(values[pressureIndex]);
        }

        // Since acceleration data is missing, we'll use zeros as placeholders
        return {
          timestamp,
          accelX: 0, // Placeholder
          accelY: 0, // Placeholder
          accelZ: 0, // Placeholder
          gyroX,
          gyroY,
          gyroZ,
          pressure
        };
      });

      return { 
        headers: Object.values(headerMapping), 
        data 
      };
    } catch (error) {
      setError((error as Error).message);
      return null;
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsedData = parseCSV(content);

        if (parsedData) {
          setError(null);
          onFileUploaded(parsedData);
          toast.success("CSV file successfully uploaded and parsed");
        }
      } catch (error) {
        setError((error as Error).message);
        toast.error("Error parsing CSV file");
      }
    };

    reader.onerror = () => {
      setError("Error reading file");
      toast.error("Error reading file");
    };

    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.type === "text/csv" || file.name.endsWith(".csv")) {
        processFile(file);
      } else {
        setError("Please upload a CSV file");
        toast.error("Please upload a CSV file");
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-10 text-center ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300"
        } transition-colors duration-200 cursor-pointer`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleButtonClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          accept=".csv"
          className="hidden"
        />
        <div className="space-y-2">
          <p className="text-lg font-medium">
            Drag & drop your CSV file here or click to browse
          </p>
          <p className="text-sm text-gray-500">
            File will be parsed according to the expected format
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-500 space-y-2">
        <p><strong>Expected CSV format:</strong></p>
        <p>Your CSV file should include columns for:</p>
        <ul className="list-disc list-inside pl-4">
          <li>Time (s) - Time data was recorded</li>
          <li>Gyro X, Y, Z (rad/s) - Gyroscope values</li>
          <li>Pressure (p) - Pressure sensor data</li>
          <li>Temp (C) - Temperature data (optional)</li>
        </ul>
        <p className="mt-2 italic">Note: Missing acceleration data will be initialized to zero.</p>
      </div>
    </div>
  );
};

export default FileUploader;
