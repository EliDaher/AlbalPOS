import { DataTable } from "@/components/dashboard/DataTable";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AddItemForm from "@/components/Products/AddItemForm";
import MakeProduct from "@/components/Products/MakeProduct";
import { Button } from "@/components/ui/button";
import getAllInventoryItems, { updateInventoryItem } from "@/services/inventory";
import { InventoryItem } from "@/Types/POSTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Boxes, PackageCheck, Plus, Minus } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export default function Inventory() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [openForm, setOpenForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState<InventoryItem[]>([]);
  const [row, setRow] = useState<InventoryItem | null>(null);
  const [stockFilter, setStockFilter] = useState<"all" | "low" | "ok">("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const {
    data: items = [],
    isLoading,
    isError,
  } = useQuery<InventoryItem[]>({
    queryKey: ["items-table"],
    queryFn: getAllInventoryItems,
  });

  const categories = useMemo(
    () => Array.from(new Set(items.map((item) => item.category).filter(Boolean))),
    [items],
  );

  const filteredItems = useMemo(
    () =>
      items.filter((item) => {
        const isLow = Number(item.quantity || 0) <= Number(item.minQuantity || 0);
        const matchesStock =
          stockFilter === "all" || (stockFilter === "low" ? isLow : !isLow);
        const matchesCategory =
          categoryFilter === "all" || item.category === categoryFilter;
        return matchesStock && matchesCategory;
      }),
    [categoryFilter, items, stockFilter],
  );

  const lowStockCount = items.filter(
    (item) => Number(item.quantity || 0) <= Number(item.minQuantity || 0),
  ).length;

  const adjustQuantityMutation = useMutation({
    mutationFn: ({ item, change }: { item: InventoryItem; change: number }) =>
      updateInventoryItem(item.id as string, {
        quantity: Math.max(Number(item.quantity || 0) + change, 0),
      }),
    onSuccess: () => {
      toast.success("تم تحديث الكمية");
      queryClient.invalidateQueries({ queryKey: ["items-table"] });
      queryClient.invalidateQueries({ queryKey: ["inventoryItems-table"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    },
    onError: () => toast.error("تعذر تحديث الكمية"),
  });

  const columns = [
    { key: "name", label: "الاسم", sortable: true },
    { key: "category", label: "الصنف", sortable: true },
    {
      key: "quantity",
      label: "الكمية",
      sortable: true,
      render: (item: InventoryItem) => {
        const isLow = Number(item.quantity || 0) <= Number(item.minQuantity || 0);
        return (
          <span className={isLow ? "font-bold text-destructive" : "font-medium"}>
            {item.quantity} {item.unit}
          </span>
        );
      },
      exportValue: (item: InventoryItem) => item.quantity,
    },
    { key: "minQuantity", label: "حد التنبيه", sortable: true },
    { key: "sellPerUnit", label: "سعر البيع", sortable: true },
    { key: "costPerUnit", label: "التكلفة", sortable: true },
    { key: "lastUpdated", label: "آخر تعديل", sortable: true },
  ];

  const isRowSelected = (selected: InventoryItem) =>
    selectedRows.some((item) => item.id === selected.id);

  const toggleRowSelection = (selected: InventoryItem) => {
    setSelectedRows((prev) =>
      isRowSelected(selected)
        ? prev.filter((item) => item.id !== selected.id)
        : [...prev, selected],
    );
  };

  useEffect(() => {
    if (!openForm) setRow(null);
  }, [openForm]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">المستودع</h1>
            <p className="text-sm text-muted-foreground">
              راقب الكميات واشتر المزيد أو حضر منتجات من المواد
            </p>
          </div>
          <AddItemForm isOpen={openForm} setIsOpen={setOpenForm} row={row} />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <StatsCard title="إجمالي المواد" value={items.length} icon={Boxes} />
          <StatsCard title="مواد منخفضة" value={lowStockCount} icon={AlertTriangle} />
          <StatsCard
            title="مواد ضمن الحد"
            value={items.length - lowStockCount}
            icon={PackageCheck}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            ["all", "كل المخزون"],
            ["low", "منخفض"],
            ["ok", "ضمن الحد"],
          ].map(([key, label]) => (
            <Button
              key={key}
              variant={stockFilter === key ? "default" : "outline"}
              onClick={() => setStockFilter(key as "all" | "low" | "ok")}
            >
              {label}
            </Button>
          ))}
          <select
            value={categoryFilter}
            onChange={(event) => setCategoryFilter(event.target.value)}
            className="rounded-md border bg-background px-3 py-2 text-sm"
          >
            <option value="all">كل الأصناف</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>

        <DataTable
          title="قائمة مواد المستودع"
          columns={columns}
          data={filteredItems}
          isLoading={isLoading}
          isError={isError}
          exportFilename="المستودع"
          onRowClick={(selected) => toggleRowSelection(selected)}
          getRowClassName={(selected) =>
            isRowSelected(selected)
              ? "bg-green-50 hover:bg-green-100"
              : Number(selected.quantity || 0) <= Number(selected.minQuantity || 0)
                ? "bg-red-50/70"
                : ""
          }
          renderRowActions={(selected) => (
            <div className="flex flex-wrap justify-center gap-1">
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  adjustQuantityMutation.mutate({ item: selected, change: -1 });
                }}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  adjustQuantityMutation.mutate({ item: selected, change: 1 });
                }}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate("/inventoryDetails", { state: { ...selected } });
                }}
              >
                تفاصيل
              </Button>
              <Button
                size="sm"
                onClick={(event) => {
                  event.stopPropagation();
                  setOpenForm(true);
                  setRow(selected);
                }}
              >
                شراء
              </Button>
            </div>
          )}
        />

        {selectedRows.length > 0 && (
          <MakeProduct
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            products={selectedRows}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
