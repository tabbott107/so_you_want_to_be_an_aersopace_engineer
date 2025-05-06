
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
      const requiredHeaders = ["timestamp", "accelX", "accelY", "accelZ", "gyroX", "gyroY", "gyroZ", "pressure"];
      
      // Check for required headers (case insensitive)
      const headersLower = headers.map(h => h.toLowerCase());
      const missingHeaders = requiredHeaders.filter(
        h => !headersLower.some(header => header.includes(h.toLowerCase()))
      );

      if (missingHeaders.length > 0) {
        throw new Error(`Missing required headers: ${missingHeaders.join(", ")}`);
      }

      // Find the index of each required header
      const headerIndices: { [key: string]: number } = {};
      requiredHeaders.forEach(requiredHeader => {
        const index = headersLower.findIndex(h => h.includes(requiredHeader.toLowerCase()));
        headerIndices[requiredHeader] = index;
      });

      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error("CSV row has incorrect number of columns");
        }

        return {
          timestamp: parseFloat(values[headerIndices.timestamp]),
          accelX: parseFloat(values[headerIndices.accelX]),
          accelY: parseFloat(values[headerIndices.accelY]),
          accelZ: parseFloat(values[headerIndices.accelZ]),
          gyroX: parseFloat(values[headerIndices.gyroX]),
          gyroY: parseFloat(values[headerIndices.gyroY]),
          gyroZ: parseFloat(values[headerIndices.gyroZ]),
          pressure: parseFloat(values[headerIndices.pressure]),
        };
      });

      return { headers, data };
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
            File must contain IMU data (acceleration, gyroscope) and pressure data
          </p>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className="text-sm text-gray-500 space-y-2">
        <p><strong>Required CSV format:</strong></p>
        <p>Your CSV file must include columns for:</p>
        <ul className="list-disc list-inside pl-4">
          <li>timestamp - Time data was recorded</li>
          <li>accelX, accelY, accelZ - Acceleration values</li>
          <li>gyroX, gyroY, gyroZ - Gyroscope values</li>
          <li>pressure - Pressure sensor data</li>
        </ul>
      </div>
    </div>
  );
};

export default FileUploader;
