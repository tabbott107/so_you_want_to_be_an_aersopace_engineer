
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

      // Extract headers from first row and clean them
      const headers = lines[0].split(",").map(h => h.trim());
      
      // Verify that the first column is time (in seconds)
      const timeColumnIndex = headers.findIndex(h => 
        h.toLowerCase().includes("time") || h.toLowerCase().includes("t (s)") || h.toLowerCase() === "t");
      
      if (timeColumnIndex === -1) {
        throw new Error("First column must be time in seconds. Please check your CSV format.");
      }
      
      // Map all headers to use as columns for visualization
      const mappedHeaders = headers.map(header => ({
        original: header,
        display: header,
        selected: false
      }));
      
      // Extract data rows
      const data = lines.slice(1).map(line => {
        const values = line.split(",").map(v => v.trim());
        if (values.length !== headers.length) {
          throw new Error("CSV row has incorrect number of columns");
        }

        // Create a data point with timestamp and all other columns as numerical values
        const dataPoint: any = {
          timestamp: parseFloat(values[timeColumnIndex])
        };
        
        // Add other columns dynamically
        headers.forEach((header, index) => {
          if (index !== timeColumnIndex) {
            dataPoint[header.replace(/\s+/g, '_').toLowerCase()] = parseFloat(values[index]);
          }
        });

        return dataPoint;
      });

      return { 
        headers: mappedHeaders,
        timeColumnIndex,
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
        <p>Your CSV file should include:</p>
        <ul className="list-disc list-inside pl-4">
          <li>Time column (in seconds) which should be the first column</li>
          <li>Any number of additional data columns (e.g., Gyro X, Y, Z, Pressure, etc.)</li>
          <li>Headers in the first row with meaningful names</li>
        </ul>
        <p className="mt-2 italic">The application will automatically detect all columns for visualization.</p>
      </div>
    </div>
  );
};

export default FileUploader;
