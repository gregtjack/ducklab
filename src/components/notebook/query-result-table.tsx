import * as arrow from "apache-arrow";
import { TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Hash, Calendar, Binary, List, HelpCircle, ClockIcon, TypeIcon, FlagTriangleRight } from "lucide-react";
import { match, P } from "ts-pattern";
import { useState } from "react";
import { TableVirtuoso } from "react-virtuoso";
import { cn } from "@/lib/utils";
import * as TooltipPrimitive from "@radix-ui/react-tooltip";

interface ArrowTableProps {
  data: arrow.Table;
}

interface CellInspectorProps {
  value: unknown;
  type: arrow.DataType;
  column: string;
  isOpen: boolean;
  onClose: () => void;
}

function CellInspector({ value, type, column, isOpen, onClose }: CellInspectorProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {getDataTypeIcon(type, 18)}
            <span>{column}</span>
          </DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Type</h4>
            <p className="text-sm font-mono">{type.toString()}</p>
          </div>
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Value</h4>
            <p className="text-sm font-mono break-all">{String(value)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

const getDataTypeIcon = (type: arrow.DataType, iconSize: number = 12) => {
  return match(type)
    .with(
      P.union(
        P.instanceOf(arrow.Int),
        P.instanceOf(arrow.Uint8),
        P.instanceOf(arrow.Uint16),
        P.instanceOf(arrow.Uint32),
        P.instanceOf(arrow.Uint64),
        P.instanceOf(arrow.Float),
      ),
      () => <Hash size={iconSize} />,
    )
    .with(P.union(P.instanceOf(arrow.DateDay), P.instanceOf(arrow.DateMillisecond)), () => (
      <Calendar size={iconSize} />
    ))
    .with(P.instanceOf(arrow.Timestamp), () => <ClockIcon size={iconSize} />)
    .with(P.union(P.instanceOf(arrow.Utf8), P.instanceOf(arrow.LargeUtf8)), () => (
      <TypeIcon size={iconSize} />
    ))
    .with(P.instanceOf(arrow.Binary), () => <Binary size={iconSize} />)
    .with(P.instanceOf(arrow.List), () => <List size={iconSize} />)
    .with(P.instanceOf(arrow.Bool), () => <FlagTriangleRight size={iconSize} />)
    .otherwise(() => <HelpCircle size={iconSize} />);
};

const isNumberType = (type: arrow.DataType) =>
  match(type)
    .with(
      P.union(
        P.instanceOf(arrow.Int),
        P.instanceOf(arrow.Uint8),
        P.instanceOf(arrow.Uint16),
        P.instanceOf(arrow.Uint32),
        P.instanceOf(arrow.Uint64),
        P.instanceOf(arrow.Float),
        P.instanceOf(arrow.Timestamp),
      ),
      () => true,
    )
    .otherwise(() => false);

export function QueryResultTable({
  data,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & ArrowTableProps) {
  const [inspectedCell, setInspectedCell] = useState<{
    value: unknown;
    type: arrow.DataType;
    column: string;
  } | null>(null);

  const columns = data.schema.fields.map(field => field.name);
  const rows = data.toArray().map(row => {
    const obj: Record<string, unknown> = {};
    columns.forEach(col => {
      obj[col] = row[col];
    });
    return obj;
  });

  return (
    <div className={cn(`h-full`, className)} {...props}>
      <TableVirtuoso
        style={{
          height: "100%",
          width: "100%",
        }}
        data={rows}
        increaseViewportBy={{
          top: 50,
          bottom: 50,
        }}
        fixedHeaderContent={() => (
          <TooltipProvider delayDuration={500}>
            <tr className="border-b">
              {columns.map((column, index) => {
                const field = data.schema.fields.find(f => f.name === column);
                const dataType = field?.type;
                return (
                  <th
                    key={column}
                    className={cn(
                      "py-2 px-2 text-left text-xs font-semibold text-muted-foreground whitespace-nowrap bg-accent",
                      index < columns.length - 1 ? "border-r" : "",
                    )}
                    style={{ minWidth: 150 }}
                  >
                    <TooltipPrimitive.Root>
                      <TooltipTrigger>
                        <div className={`flex items-center gap-1.5`}>
                          {column}
                          {dataType && getDataTypeIcon(dataType)}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="flex items-center gap-4">
                          <span className="text-xs">{column}</span>
                          <span className="text-xs font-mono">{dataType?.toString()}</span>
                        </div>
                      </TooltipContent>
                    </TooltipPrimitive.Root>
                  </th>
                );
              })}
            </tr>
          </TooltipProvider>
        )}
        itemContent={(index, row) => (
          <>
            {columns.map((column, colIndex) => {
              const field = data.schema.fields.find(f => f.name === column);
              const dataType = field?.type;
              return (
                <td
                  key={`${index}-${column}`}
                  className={cn(
                    "px-2 py-1.5 text-xs border-t hover:bg-muted/50 text-foreground",
                    colIndex < columns.length - 1 ? "border-r" : "",
                    isNumberType(dataType) ? "font-mono" : "",
                  )}
                  style={{ minWidth: 150 }}
                  onClick={() => {
                    if (dataType) {
                      setInspectedCell({
                        value: row[column],
                        type: dataType,
                        column,
                      });
                    }
                  }}
                >
                  {String(row[column])}
                </td>
              );
            })}
          </>
        )}
      />
      {inspectedCell && (
        <CellInspector
          value={inspectedCell.value}
          type={inspectedCell.type}
          column={inspectedCell.column}
          isOpen={true}
          onClose={() => setInspectedCell(null)}
        />
      )}
    </div>
  );
}
