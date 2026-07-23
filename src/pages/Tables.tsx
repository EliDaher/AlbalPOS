import { DashboardLayout } from "@/components/layout/DashboardLayout";
import TopTable from "@/components/Tables/TopTable";
import { DataTable } from "@/components/dashboard/DataTable";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/custom/FormInput";
import PopupForm from "@/components/ui/custom/PopupForm";
import getAllTables, { createTables } from "@/services/tables";
import { Table, TableStatus } from "@/Types/POSTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import {
  AlertTriangle,
  LayoutGrid,
  List,
  Loader2,
  PlusCircle,
  TableIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const statusLabels: Record<TableStatus, string> = {
  available: "متاحة",
  occupied: "مشغولة",
  reserved: "محجوزة",
  closed: "مغلقة",
};

export default function Tables() {
  const [isOpen, setIsOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"table" | "grid">("grid");
  const [statusFilter, setStatusFilter] = useState<TableStatus | "all">("all");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: 1,
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: tables = [],
    isLoading,
    isError,
  } = useQuery<Table[]>({
    queryKey: ["tables-table"],
    queryFn: getAllTables,
    refetchInterval: 30_000,
  });

  const filteredTables = useMemo(
    () =>
      statusFilter === "all"
        ? tables
        : tables.filter((table) => table.status === statusFilter),
    [statusFilter, tables],
  );

  const counts = useMemo(
    () => ({
      total: tables.length,
      available: tables.filter((table) => table.status === "available").length,
      occupied: tables.filter((table) => table.status === "occupied").length,
      reserved: tables.filter((table) => table.status === "reserved").length,
      closed: tables.filter((table) => table.status === "closed").length,
    }),
    [tables],
  );

  const addTableMutation = useMutation({
    mutationFn: (table: Table) => createTables({ table }),
    onSuccess: () => {
      setFormData({ name: "", location: "", capacity: 1 });
      toast.success("تمت إضافة الطاولة بنجاح");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة الطاولة"),
  });

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const { name, location, capacity } = formData;
    if (!name.trim()) return toast.error("يرجى إدخال اسم الطاولة");
    addTableMutation.mutate({
      name,
      location,
      capacity,
      status: "available",
    } as Table);
  };

  const tableColumns = [
    { key: "name", label: "الاسم", sortable: true },
    { key: "location", label: "الموقع", sortable: true },
    {
      key: "capacity",
      label: "السعة",
      sortable: true,
      render: (row: Table) => `${Number(row.capacity || 0) * 2} مقاعد`,
    },
    {
      key: "status",
      label: "الحالة",
      sortable: true,
      render: (row: Table) => statusLabels[row.status],
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">إدارة الطاولات</h1>
            <p className="text-sm text-muted-foreground">
              راقب حالة الصالة وافتح الطلبات بسرعة
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <PopupForm
              title="إضافة طاولة جديدة"
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              trigger={
                <Button>
                  <PlusCircle className="h-4 w-4" />
                  إضافة طاولة
                </Button>
              }
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="اسم الطاولة"
                  placeholder="مثال: طاولة 1"
                  value={formData.name}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, name: event.target.value }))
                  }
                />
                <FormInput
                  label="الموقع"
                  placeholder="الصالة الداخلية، الشرفة..."
                  value={formData.location}
                  onChange={(event) =>
                    setFormData((prev) => ({ ...prev, location: event.target.value }))
                  }
                />
                <FormInput
                  label="عدد المقاعد في كل جهة"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(event) =>
                    setFormData((prev) => ({
                      ...prev,
                      capacity: Number(event.target.value),
                    }))
                  }
                />
                <Button
                  type="submit"
                  className="w-full"
                  loading={addTableMutation.isPending}
                >
                  تأكيد الإضافة
                </Button>
              </form>
            </PopupForm>

            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("grid")}
              title="عرض كبطاقات"
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              size="icon"
              onClick={() => setViewMode("table")}
              title="عرض كجدول"
            >
              <List className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          {[
            ["all", "الكل", counts.total],
            ["available", "متاحة", counts.available],
            ["occupied", "مشغولة", counts.occupied],
            ["reserved", "محجوزة", counts.reserved],
            ["closed", "مغلقة", counts.closed],
          ].map(([key, label, count]) => (
            <button
              type="button"
              key={String(key)}
              onClick={() => setStatusFilter(key as TableStatus | "all")}
              className={`rounded-md border p-3 text-right transition ${
                statusFilter === key ? "border-primary bg-primary/10" : "bg-card"
              }`}
            >
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-bold">{count}</p>
            </button>
          ))}
        </div>

        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        {isError && (
          <div className="flex items-center justify-center gap-2 py-10 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span>فشل في تحميل الطاولات</span>
          </div>
        )}

        {!isLoading && !isError && viewMode === "grid" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredTables.map((table) => (
              <button
                type="button"
                key={table.id}
                className="text-right"
                onClick={() => navigate(`/tableDetails/${table.id}`, { state: table })}
              >
                <TopTable
                  tableName={table.name}
                  chairsPerSide={table.capacity}
                  state={table.status}
                  location={table.location}
                />
                <div className="mt-2 flex items-center justify-between rounded-md border bg-card px-3 py-2 text-sm">
                  <span>{statusLabels[table.status]}</span>
                  <span>تفاصيل</span>
                </div>
              </button>
            ))}
          </div>
        )}

        {!isLoading && !isError && viewMode === "table" && (
          <DataTable
            title="الطاولات"
            data={filteredTables}
            columns={tableColumns}
            onRowClick={(row) => navigate(`/tableDetails/${row.id}`, { state: row })}
            renderRowActions={(row) => (
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/tableDetails/${row.id}`, { state: row });
                }}
              >
                <TableIcon className="h-4 w-4" />
                تفاصيل
              </Button>
            )}
          />
        )}

        {!isLoading && !isError && filteredTables.length === 0 && (
          <p className="py-10 text-center text-muted-foreground">
            لا توجد طاولات ضمن هذا الفلتر
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
