import React, { useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { formatCurrency, formatDateTime } from "@/lib/pos";
import {
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Loader2,
  Search,
} from "lucide-react";
import { toast } from "sonner";

export interface TableColumn<T extends Record<string, any> = Record<string, any>> {
  key: keyof T | string;
  label: string;
  sortable?: boolean;
  hidden?: boolean;
  render?: (row: T) => React.ReactNode;
  exportValue?: (row: T) => string | number;
}

interface DataTableProps<T extends Record<string, any> = Record<string, any>> {
  title: string;
  description?: string;
  columns: TableColumn<T>[];
  data: T[];
  searchable?: boolean;
  className?: string;
  pageSizeOptions?: number[];
  defaultPageSize?: number;
  getRowClassName?: (row: T) => string;
  renderRowActions?: (row: T) => React.ReactNode;
  amountBold?: boolean;
  onRowClick?: (row: T) => void;
  selectedRows?: T[];
  titleButton?: React.ReactNode;
  isLoading?: boolean;
  isError?: boolean;
  errorMessage?: string;
  exportFilename?: string;
}

function normalizeValue(value: unknown) {
  if (value === null || value === undefined || value === "") return "-";
  return value;
}

function formatDate(value: unknown) {
  return formatDateTime(String(value || ""));
}

export function DataTable<T extends Record<string, any>>({
  title,
  description,
  columns,
  data,
  searchable = true,
  className,
  pageSizeOptions = [5, 10, 20, 50],
  defaultPageSize = 10,
  getRowClassName,
  renderRowActions,
  amountBold = false,
  onRowClick,
  titleButton,
  isLoading = false,
  isError = false,
  errorMessage = "تعذر تحميل البيانات",
  exportFilename,
}: DataTableProps<T>) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const visibleColumns = columns.filter((column) => !column.hidden);

  const filteredData = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return data;
    return data.filter((item) =>
      columns.some((column) =>
        String((item as any)[column.key] ?? "")
          .toLowerCase()
          .includes(term),
      ),
    );
  }, [columns, data, searchTerm]);

  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aValue = (a as any)[sortConfig.key];
      const bValue = (b as any)[sortConfig.key];
      if (aValue === bValue) return 0;
      if (aValue === undefined || aValue === null) return 1;
      if (bValue === undefined || bValue === null) return -1;
      return aValue > bValue
        ? sortConfig.direction === "asc"
          ? 1
          : -1
        : sortConfig.direction === "asc"
          ? -1
          : 1;
    });
  }, [filteredData, sortConfig]);

  const totalPages = Math.max(Math.ceil(sortedData.length / pageSize), 1);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction: current?.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  const exportRows = async () => {
    try {
      const XLSX = await import("xlsx");
      const rows = sortedData.map((row) =>
        Object.fromEntries(
          visibleColumns.map((column) => [
            column.label,
            column.exportValue
              ? column.exportValue(row)
              : normalizeValue((row as any)[column.key]),
          ]),
        ),
      );
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "البيانات");
      XLSX.writeFile(workbook, `${exportFilename || title}.xlsx`);
    } catch (error) {
      console.error(error);
      toast.error("تعذر تصدير البيانات");
    }
  };

  const renderCellContent = (row: T, column: TableColumn<T>) => {
    if (column.render) return column.render(row);

    const key = String(column.key);
    const value = (row as any)[key];

    if (key === "status") {
      return (
        <Badge variant={value === "paid" || value === "completed" ? "default" : "secondary"}>
          {normalizeValue(value)}
        </Badge>
      );
    }

    if (["createdAt", "date", "timestamp", "lastUpdated", "lastUpdate"].includes(key)) {
      return <span className="text-muted-foreground">{formatDate(value)}</span>;
    }

    if (key === "amount" || key === "balance" || key === "total") {
      const amount = Number(value || 0);
      const tone =
        key === "balance" && amount < 0
          ? "text-destructive"
          : key === "balance" && amount > 0
            ? "text-emerald-700"
            : "";
      return (
        <span className={cn(amountBold && "text-lg font-bold", tone)}>
          {formatCurrency(amount)}
        </span>
      );
    }

    return normalizeValue(value);
  };

  return (
    <Card dir="rtl" className={className}>
      <CardHeader>
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle>{title}</CardTitle>
              {titleButton}
            </div>
            {description && <CardDescription>{description}</CardDescription>}
          </div>

          <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
            {searchable && (
              <div className="relative min-w-56 flex-1">
                <Search className="absolute right-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث..."
                  value={searchTerm}
                  onChange={(event) => {
                    setSearchTerm(event.target.value);
                    setCurrentPage(1);
                  }}
                  className="pr-8 text-right"
                />
              </div>
            )}
            {exportFilename && (
              <Button variant="outline" onClick={exportRows}>
                <Download className="h-4 w-4" />
                تصدير
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="overflow-x-auto rounded-md border">
          <Table className="text-center">
            <TableHeader>
              <TableRow>
                {visibleColumns.map((column) => (
                  <TableHead className="text-center" key={String(column.key)}>
                    {column.sortable ? (
                      <Button
                        variant="ghost"
                        onClick={() => handleSort(String(column.key))}
                        className="h-auto p-0 font-medium"
                      >
                        {column.label}
                        <ArrowUpDown className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      column.label
                    )}
                  </TableHead>
                ))}
                {renderRowActions && <TableHead className="text-center">الإجراءات</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (renderRowActions ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="h-5 w-5 animate-spin" />
                      جاري التحميل...
                    </div>
                  </TableCell>
                </TableRow>
              )}

              {!isLoading && isError && (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (renderRowActions ? 1 : 0)}
                    className="h-32 text-center text-destructive"
                  >
                    {errorMessage}
                  </TableCell>
                </TableRow>
              )}

              {!isLoading &&
                !isError &&
                paginatedData.map((row, index) => (
                  <TableRow
                    onClick={() => onRowClick?.(row)}
                    key={(row as any).id || index}
                    className={cn(
                      onRowClick && "cursor-pointer",
                      getRowClassName?.(row),
                    )}
                  >
                    {visibleColumns.map((column) => (
                      <TableCell key={String(column.key)}>
                        {renderCellContent(row, column)}
                      </TableCell>
                    ))}
                    {renderRowActions && <TableCell>{renderRowActions(row)}</TableCell>}
                  </TableRow>
                ))}

              {!isLoading && !isError && paginatedData.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={visibleColumns.length + (renderRowActions ? 1 : 0)}
                    className="h-32 text-center text-muted-foreground"
                  >
                    لا توجد بيانات مطابقة
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">عدد الصفوف</span>
            <select
              className="rounded-md border bg-background px-2 py-1 text-sm"
              value={pageSize}
              onChange={(event) => {
                setPageSize(Number(event.target.value));
                setCurrentPage(1);
              }}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              صفحة {currentPage} من {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage >= totalPages}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
