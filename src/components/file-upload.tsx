"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Switch } from "./ui/switch";
import { Progress } from "./ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { toast } from "sonner";
import { Upload, FileText, Link, Loader2 } from "lucide-react";
import { useDuckDBStore, ImportOptions, FileFormat } from "@/store/duckdb-store";
import { useCatalogStore } from "@/store/catalog-store";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

interface FileUploadProps {
  children: React.ReactNode;
}

const FILE_FORMATS: { value: FileFormat; label: string; extensions: string[] }[] = [
  { value: "csv", label: "CSV", extensions: [".csv"] },
  { value: "json", label: "JSON", extensions: [".json"] },
  { value: "parquet", label: "Parquet", extensions: [".parquet", ".pq"] },
  { value: "arrow", label: "Arrow", extensions: [".arrow", ".feather"] },
];

const JSON_FORMATS = [
  { value: "auto", label: "Auto-detect" },
  { value: "newline_delimited", label: "Newline Delimited" },
  { value: "records", label: "Records" },
];

export function FileUpload({ children }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tableName, setTableName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("csv");
  const [url, setUrl] = useState("");

  // CSV options
  const [delimiter, setDelimiter] = useState(",");
  const [hasHeader, setHasHeader] = useState(true);
  const [autoDetect, setAutoDetect] = useState(true);
  const [sampleSize, setSampleSize] = useState(1000);

  // JSON options
  const [jsonFormat, setJsonFormat] = useState<"auto" | "newline_delimited" | "records">("auto");

  const { importFile, importFromURL } = useDuckDBStore();
  const { refreshDatasets } = useCatalogStore();

  const getAcceptedFileTypes = () => {
    const format = FILE_FORMATS.find(f => f.value === selectedFormat);
    return format ? format.extensions : [];
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const fileExtension = file.name.toLowerCase();
    const format = FILE_FORMATS.find(f =>
      f.extensions.some(ext => fileExtension.endsWith(ext))
    );

    if (!format) {
      toast.error(`Please select a ${selectedFormat.toUpperCase()} file`);
      return;
    }

    if (!tableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const options: ImportOptions = {
        tableName: tableName.trim(),
        format: selectedFormat,
        // CSV specific options
        delimiter,
        header: hasHeader,
        autoDetect,
        sampleSize,
        // JSON specific options
        jsonFormat,
      };

      await importFile(file, options);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`Successfully imported ${file.name} as table '${tableName}'`);

      // Refresh the catalog to show the new table
      await refreshDatasets();

      // Reset form
      resetForm();
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import file");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  }, [tableName, selectedFormat, delimiter, hasHeader, autoDetect, sampleSize, jsonFormat, importFile, refreshDatasets]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/csv': ['.csv'],
      'application/json': ['.json'],
      'application/octet-stream': ['.parquet', '.pq', '.arrow', '.feather'],
    },
    multiple: false,
    disabled: isUploading,
  });

  const handleURLImport = async () => {
    if (!url.trim()) {
      toast.error("Please enter a URL");
      return;
    }

    if (!tableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 100);

      const options: ImportOptions = {
        tableName: tableName.trim(),
        format: selectedFormat,
        // CSV specific options
        delimiter,
        header: hasHeader,
        autoDetect,
        sampleSize,
        // JSON specific options
        jsonFormat,
        // Parquet specific options
      };

      await importFromURL(url.trim(), options);

      clearInterval(progressInterval);
      setUploadProgress(100);

      toast.success(`Successfully imported ${selectedFormat.toUpperCase()} from URL as table '${tableName}'`);

      // Refresh the catalog to show the new table
      await refreshDatasets();

      // Reset form
      resetForm();
      setIsOpen(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import from URL");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetForm = () => {
    setTableName("");
    setSelectedFormat("csv");
    setUrl("");
    setDelimiter(",");
    setHasHeader(true);
    setAutoDetect(true);
    setSampleSize(1000);
    setJsonFormat("auto");
  };

  const renderFormatOptions = () => {
    switch (selectedFormat) {
      case "csv":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="delimiter">Delimiter</Label>
                <Input
                  id="delimiter"
                  value={delimiter}
                  onChange={(e) => setDelimiter(e.target.value)}
                  placeholder=","
                  disabled={isUploading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sampleSize">Sample Size</Label>
                <Input
                  id="sampleSize"
                  type="number"
                  value={sampleSize}
                  onChange={(e) => setSampleSize(Number(e.target.value))}
                  disabled={isUploading}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="hasHeader"
                checked={hasHeader}
                onCheckedChange={setHasHeader}
                disabled={isUploading}
              />
              <Label htmlFor="hasHeader">Has header row</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="autoDetect"
                checked={autoDetect}
                onCheckedChange={setAutoDetect}
                disabled={isUploading}
              />
              <Label htmlFor="autoDetect">Auto-detect data types</Label>
            </div>
          </div>
        );

      case "json":
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jsonFormat">JSON Format</Label>
              <Select value={jsonFormat} onValueChange={(value: "auto" | "newline_delimited" | "records") => setJsonFormat(value)} disabled={isUploading}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {JSON_FORMATS.map(format => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "parquet":
        return null;

      case "arrow":
        return (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Arrow files will be imported using default settings.
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="size-4" />
            Import File
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <Input
              id="tableName"
              value={tableName}
              onChange={(e) => setTableName(e.target.value)}
              placeholder="Enter table name"
              disabled={isUploading}
            />
          </div>

          {/* File Format Selection */}
          <div className="space-y-2">
            <Label htmlFor="format">File Format</Label>
            <Select value={selectedFormat} onValueChange={(value: FileFormat) => setSelectedFormat(value)} disabled={isUploading}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FILE_FORMATS.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Format-specific Import Options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Import Options</h4>
            {renderFormatOptions()}
          </div>

          {/* File Upload */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Upload File</h4>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${isDragActive
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
                } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
              {isDragActive ? (
                <p className="text-sm">Drop the {selectedFormat.toUpperCase()} file here...</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-1">Drop a {selectedFormat.toUpperCase()} file here</p>
                  <p className="text-xs text-muted-foreground">or click to browse</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Supported: {getAcceptedFileTypes().join(", ")}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* URL Import */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Or Import from URL</h4>

            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder={`https://example.com/data.${selectedFormat}`}
                disabled={isUploading}
              />
              <Button
                onClick={handleURLImport}
                disabled={isUploading || !url.trim() || !tableName.trim()}
                size="sm"
              >
                {isUploading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Link className="size-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Importing...</span>
                <span>{uploadProgress}%</span>
              </div>
              <Progress value={uploadProgress} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
} 