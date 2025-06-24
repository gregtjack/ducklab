"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Upload,
  ImportIcon,
  FileText,
  Link,
  Settings,
  Database,
  ChevronDown,
  ChevronUp,
  FileSpreadsheet,
  X,
} from "lucide-react";
import { useDuckDBStore } from "@/store/duckdb-store";
import { type ImportOptions, type FileFormat, fileFormats } from "@/lib/types/fs";
import { useCatalogStore } from "@/store/catalog-store";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import prettyBytes from "pretty-bytes";

type FileUploadProps = React.PropsWithChildren;

const JSONFormats = [
  { value: "auto", label: "Auto-detect" },
  { value: "newline_delimited", label: "Newline Delimited" },
  { value: "records", label: "Records" },
];

const inferTableName = (fileName: string): string => {
  const nameWithoutExt = fileName.replace(/\.[^/.]+$/, "");

  let tableName = nameWithoutExt
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "_")
    .replace(/_+/g, "_")
    .replace(/^_|_$/g, "");

  if (tableName && !/^[a-z]/.test(tableName)) {
    tableName = "table_" + tableName;
  }

  if (!tableName) {
    tableName = "imported_data";
  }

  return tableName;
};

export function FileUpload({ children }: FileUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [tableName, setTableName] = useState("");
  const [selectedFormat, setSelectedFormat] = useState<FileFormat>("csv");
  const [url, setUrl] = useState("");
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

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
      const format = fileFormats.find(f => f.extensions.some(ext => fileName.endsWith(ext)));
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

    setIsOpen(false);
    resetForm();

    const options: ImportOptions = getImportOptions();

    toast.promise(
      async () => {
        if (file) {
          await importFile(file, options);
        } else {
          await importFromURL(url.trim(), options);
        }

        refreshDatasets();
      },
      {
        loading: `Importing ${file ? file.name : "data"} as table "${tableName}"...`,
        success: (
          <span>
            Successfully imported as table <span className="font-mono">{tableName}</span>
          </span>
        ),
        error: error => {
          const errorMessage = file ? "Failed to import file" : "Failed to import from URL";
          return error instanceof Error ? error.message : errorMessage;
        },
      },
    );
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "text/csv": [".csv"],
      "application/csv": [".csv"],
      "application/json": [".json"],
      "application/octet-stream": [".parquet", ".pq"],
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
    },
    multiple: false,
    disabled: false,
  });

  const resetForm = () => {
    setTableName("");
    setSelectedFormat("csv");
    setUrl("");
    setFile(null);
    setShowAdvancedOptions(false);
    setImportOptions({
      delimiter: ",",
      tableName: "default",
      format: "csv",
      sampleSize: 1000,
      header: true,
    });
  };

  const removeFile = () => {
    setFile(null);
    setTableName("");
    setSelectedFormat("csv");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <Database className="h-6 w-6 text-primary" />
            Create a new table
          </DialogTitle>
          <DialogDescription>
            Import data from a file or URL to create a new table in your database.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Upload File
              </Label>
              <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 ${
                  isDragActive
                    ? "border-primary bg-primary/5 scale-[1.02]"
                    : "border-muted-foreground/25 hover:border-primary/50 hover:bg-muted/30"
                }`}
              >
                <input {...getInputProps()} />
                <Upload className="mx-auto size-10 text-muted-foreground mb-3" />
                {file ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.name}</p>
                        <p className="text-xs text-muted-foreground">{prettyBytes(file.size)}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={e => {
                          e.stopPropagation();
                          removeFile();
                        }}
                        className="ml-2 h-8 w-8 p-0 hover:bg-destructive hover:bg-muted"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : isDragActive ? (
                  <p className="text-sm font-medium">Drop the file here...</p>
                ) : (
                  <div className="space-y-2">
                    <p className="text-sm font-medium">Drag and drop a file here</p>
                    <p className="text-xs text-muted-foreground">or click to browse</p>
                    <div className="flex flex-wrap justify-center gap-1 mt-2">
                      {fileFormats.map(f => (
                        <span
                          key={f.value}
                          className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-muted text-muted-foreground"
                        >
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or</span>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium flex items-center gap-2">
                <Link className="h-4 w-4" />
                Import from public URL
              </Label>
              <Input
                value={url}
                onChange={e => setUrl(e.target.value)}
                placeholder={`https://example.com/data.${selectedFormat}`}
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tableName" className="text-sm font-medium">
                  Table Name
                </Label>
                <Input
                  id="tableName"
                  value={tableName}
                  onChange={e => setTableName(e.target.value)}
                  placeholder="Enter table name"
                  className="h-9"
                />
                {file && (
                  <p className="text-xs text-muted-foreground">Auto-generated from filename</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="format" className="text-sm font-medium">
                  File Format
                </Label>
                <Select
                  value={selectedFormat}
                  onValueChange={(value: FileFormat) => setSelectedFormat(value)}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {fileFormats.map(format => (
                      <SelectItem key={format.value} value={format.value}>
                        {format.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="p-2"
            size="sm"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">More options</span>
            </div>
            {showAdvancedOptions ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </Button>

          {showAdvancedOptions && (
            <div className="space-y-3 p-4 bg-muted/30 rounded-lg border">
              <FileOptions
                selectedFormat={selectedFormat}
                options={importOptions}
                setOptions={setImportOptions}
              />
            </div>
          )}

          <Button onClick={handleSubmit} className="w-full h-11 text-base font-medium">
            <ImportIcon className="mr-2 h-4 w-4" />
            Import Data
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function FileOptions({
  selectedFormat,
  options,
  setOptions,
}: {
  selectedFormat: FileFormat;
  options: ImportOptions;
  setOptions: (options: ImportOptions) => void;
}) {
  if (selectedFormat === "parquet") {
    return <div>No options available for Parquet</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Settings className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-base font-medium">Import Options</h3>
      </div>

      {selectedFormat === "csv" && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="delimiter" className="text-sm font-medium">
                Delimiter
              </Label>
              <Input
                id="delimiter"
                value={options.delimiter}
                onChange={e => setOptions({ ...options, delimiter: e.target.value })}
                placeholder=","
                className="h-9"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="sampleSize" className="text-sm font-medium">
                Sample Size
              </Label>
              <Input
                id="sampleSize"
                type="number"
                value={options.sampleSize}
                onChange={e => setOptions({ ...options, sampleSize: Number(e.target.value) })}
                className="h-9"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
            <div className="space-y-1">
              <Label htmlFor="hasHeader" className="text-sm font-medium">
                Has header row
              </Label>
              <p className="text-xs text-muted-foreground">First row contains column names</p>
            </div>
            <Switch
              id="hasHeader"
              checked={options.header}
              onCheckedChange={() => setOptions({ ...options, header: !options.header })}
            />
          </div>
        </div>
      )}

      {selectedFormat === "json" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="jsonFormat" className="text-sm font-medium">
              JSON Format
            </Label>
            <Select
              value={options.jsonFormat}
              onValueChange={(value: "auto" | "newline_delimited" | "records") =>
                setOptions({ ...options, jsonFormat: value })
              }
            >
              <SelectTrigger className="h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {JSONFormats.map(format => (
                  <SelectItem key={format.value} value={format.value}>
                    {format.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
    </div>
  );
}
