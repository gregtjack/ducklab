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
import { Upload, Loader2, ImportIcon } from "lucide-react";
import { useDuckDBStore, ImportOptions, FileFormat } from "@/store/duckdb-store";
import { useCatalogStore } from "@/store/catalog-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";

type FileUploadProps = React.PropsWithChildren;

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

const inferTableName = (fileName: string): string => {
  // Remove file extension
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  let tableName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (tableName && !/^[a-z]/.test(tableName)) {
    tableName = "table_" + tableName;
  }

  // Fallback if empty
  if (!tableName) {
    tableName = "imported_data";
  }

  return tableName;
};

export function FileUpload({ children }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [tableName, setTableName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("csv");
  const [url, setUrl] = useState("");

  // File import options
  const [importOptions, setImportOptions] = useState<ImportOptions>({
    delimiter: ",",
    tableName: "default",
    format: "csv",
    sampleSize: 1000,
    header: true,
    autoDetect: true,
    jsonFormat: "auto",
  });

  const [file, setFile] = useState<File | null>(null);

  const { importFile, importFromURL } = useDuckDBStore();
  const { refreshDatasets } = useCatalogStore();

  const getAcceptedFileTypes = () => {
    const format = FILE_FORMATS.find(f => f.value === selectedFormat);
    return format ? format.extensions : [];
  };

  const getImportOptions = () => {
    return {
      tableName: tableName.trim(),
      format: selectedFormat,
      delimiter: importOptions.delimiter,
      header: importOptions.header,
      autoDetect: importOptions.autoDetect,
      sampleSize: importOptions.sampleSize,
    };
  };

  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;
      const file = acceptedFiles[0];
      setFile(file);
      const fileName = file.name.toLowerCase();
      const format = FILE_FORMATS.find(f => f.extensions.some(ext => fileName.endsWith(ext)));
      setSelectedFormat(format?.value || "csv");
      setTableName(inferTableName(file.name));
    },
    [setFile, setTableName],
  );

  const handleSubmit = async () => {
    if (!tableName.trim()) {
      toast.error("Please enter a table name");
      return;
    }

    if (!file && !url.trim()) {
      toast.error("Please select a file or enter a URL");
      return;
    }

    await performImport();
  };

  const performImport = async () => {
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

      const options: ImportOptions = getImportOptions();

      if (file) {
        await importFile(file, options);
      } else {
        await importFromURL(url.trim(), options);
      }

      toast.success(
        <span>
          Successfully imported file as table <span className="font-mono">{tableName}</span>
        </span>,
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      // Refresh the catalog to show the new table
      refreshDatasets();

      // Reset form
      resetForm();
      setIsOpen(false);
    } catch (error) {
      const errorMessage = file ? "Failed to import file" : "Failed to import from URL";
      toast.error(error instanceof Error ? error.message : errorMessage);
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/csv": [".csv"],
      "application/json": [".json"],
      "application/octet-stream": [".parquet", ".pq", ".arrow", ".feather"],
    },
    multiple: false,
    disabled: isUploading,
  });

  const resetForm = () => {
    setTableName("");
    setSelectedFormat("csv");
    setUrl("");
    setFile(null);
    setImportOptions({
      delimiter: ",",
      tableName: "default",
      format: "csv",
      sampleSize: 1000,
      header: true,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">Create a table</DialogTitle>
          <DialogDescription>
            Import a file from your computer or via URL to create a new table in DuckDB.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* File upload */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Open file</h4>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                isDragActive
                  ? "border-primary bg-primary/5"
                  : "border-muted-foreground/25 hover:border-primary/50"
              } ${isUploading ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto size-8 text-muted-foreground mb-2" />
              {file ? (
                <p className="text-sm">{file.name}</p>
              ) : isDragActive ? (
                <p className="text-sm">Drop the {selectedFormat.toUpperCase()} file here...</p>
              ) : (
                <div>
                  <p className="text-sm font-medium mb-1">
                    Drag and drop any {FILE_FORMATS.map(f => f.label).join(", ")} file here
                  </p>
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
            <h4 className="flex justify-center items-center gap-2 text-sm font-medium">
              Or import from URL
            </h4>

            <div className="flex gap-2">
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={`https://example.com/data.${selectedFormat}`}
                disabled={isUploading}
              />
            </div>
          </div>
          {/* Table Name */}
          <div className="space-y-2">
            <Label htmlFor="tableName">Table Name</Label>
            <div className="relative">
              <Input
                id="tableName"
                value={tableName}
                onChange={e => setTableName(e.target.value)}
                placeholder="Enter table name"
                disabled={isUploading}
                className={file && tableName === inferTableName(file.name) ? "pr-20" : ""}
              />
              {file && tableName === inferTableName(file.name) && (
                <div className="absolute right-2 top-1/2 -translate-y-1/2">
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                    Auto-generated
                  </span>
                </div>
              )}
            </div>
            {file && (
              <p className="text-xs text-muted-foreground">
                Table name inferred from "{file.name}". You can modify it if needed.
              </p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="format">File Format</Label>
            <Select
              value={selectedFormat}
              onValueChange={(value: FileFormat) => setSelectedFormat(value)}
              disabled={isUploading}
            >
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
          {/* Format-specific import options */}
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Import options</h4>
            <FileOptions
              selectedFormat={selectedFormat}
              options={importOptions}
              setOptions={setImportOptions}
              isUploading={isUploading}
            />
          </div>

          <Button onClick={handleSubmit} disabled={isUploading} className="w-full">
            Import
            {isUploading ? <Loader2 className="animate-spin" /> : <ImportIcon />}
          </Button>

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

function FileOptions({
  selectedFormat,
  options,
  setOptions,
  isUploading,
}: {
  selectedFormat: FileFormat;
  options: ImportOptions;
  setOptions: (options: ImportOptions) => void;
  isUploading: boolean;
}) {
  switch (selectedFormat) {
    case "csv":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delimiter">Delimiter</Label>
              <Input
                id="delimiter"
                value={options.delimiter}
                onChange={e => setOptions({ ...options, delimiter: e.target.value })}
                placeholder=","
                disabled={isUploading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleSize">Sample Size</Label>
              <Input
                id="sampleSize"
                type="number"
                value={options.sampleSize}
                onChange={e => setOptions({ ...options, sampleSize: Number(e.target.value) })}
                disabled={isUploading}
              />
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="hasHeader"
              checked={options.header}
              onCheckedChange={() => setOptions({ ...options, header: !options.header })}
              disabled={isUploading}
            />
            <Label htmlFor="hasHeader">Has header row</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="autoDetect"
              checked={options.autoDetect}
              onCheckedChange={() => setOptions({ ...options, autoDetect: !options.autoDetect })}
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
            <Select
              value={options.jsonFormat}
              onValueChange={(value: "auto" | "newline_delimited" | "records") =>
                setOptions({ ...options, jsonFormat: value })
              }
              disabled={isUploading}
            >
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
}
