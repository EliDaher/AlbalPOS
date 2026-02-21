import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import AddItemForm from "@/components/Products/AddItemForm";
import MakeProduct from "@/components/Products/MakeProduct";
import { Button } from "@/components/ui/button";
import getAllInventoryItems from "@/services/inventory";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function Inventory() {
  const navigate = useNavigate();
  const [openForm, setOpenForm] = useState(false);
  const [selectedRows, setSelectedRows] = useState<any[]>([]);
  const [row, setRow] = useState<any>(null);

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["items-table"],
    queryFn: getAllInventoryItems,
  });

  const ItemsColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "quantity", label: "الكمية", sortable: true },
    { key: "unit", label: "الواحدة", sortable: true },
    { key: "sellPerUnit", label: "سعر الواحدة", sortable: true },
    { key: "lastUpdated", label: "اخر تعديل", sortable: true },
    { key: "category", label: "الصنف", sortable: true },
  ];

  const isRowSelected = (row: any) => {
    return selectedRows.some((r) => r.id === row.id);
  };

  const toggleRowSelection = (row: any) => {
    setSelectedRows((prev) => {
      const isSelected = isRowSelected(row);
      if (isSelected) {
        return prev.filter((r) => r.id !== row.id);
      } else {
        return [...prev, row];
      }
    });
  };

  useEffect(() => {
    if (!openForm) {
      setRow(null);
    }
  }, [openForm]);

  return (
    <DashboardLayout>
      <div>
        <DataTable
          title="قائمة المنتجات"
          titleButton={
            <AddItemForm isOpen={openForm} setIsOpen={setOpenForm} row={row} />
          }
          columns={ItemsColumns}
          data={items || []}
          onRowClick={(row) => toggleRowSelection(row)}
          getRowClassName={(row) =>
            selectedRows?.some((r) => r == row)
              ? "bg-green-50 hover:bg-green-100"
              : ""
          }
          renderRowActions={(row) => {
            return (
              <div className="flex gap-1">
                <Button
                  variant={"outline"}
                  onClick={(e) => {
                    e.stopPropagation();
                    console.log(row);
                    navigate("/productDetails", {
                      state: { ...row },
                    });
                  }}
                >
                  التفاصيل
                </Button>
                <Button
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenForm(true);
                    setRow(row);
                  }}
                >
                  شراء المزيد
                </Button>
              </div>
            );
          }}
        />
      </div>
      {selectedRows?.length > 0 ? (
        <div>
          <MakeProduct
            selectedRows={selectedRows}
            setSelectedRows={setSelectedRows}
            products={selectedRows}
          />
        </div>
      ) : (
        <div></div>
      )}
    </DashboardLayout>
  );
}
