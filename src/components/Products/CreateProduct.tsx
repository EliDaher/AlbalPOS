import React from "react";
import { DataTable } from "../dashboard/DataTable";
import { Button } from "../ui/button";

export default function CreateProduct({setIsOpen, selectedItems}) {
  // إعداد الأعمدة للجدول
  const columns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "needQty", label: "الكمية المستخدمة", sortable: true },
    { key: "costPerUnit", label: "سعر الواحدة", sortable: true },
    { key: "cost", label: "السعر النهائي", sortable: true },
  ];
  return (
    <div>
      <DataTable
        titleButton={
          <Button
            variant="outline"
            className="w-1/4 mr-auto"
            onClick={() => setIsOpen(false)}
          >
            رجوع
          </Button>
        }
        searchable={false}
        defaultPageSize={3}
        title={`المجموع`}
        pageSizeOptions={[3]}
        data={
          selectedItems
            ? selectedItems.map((item) => ({
                ...item,
                cost: item.costPerUnit * item.needQty,
              }))
            : []
        }
        columns={columns}
      />
    </div>
  );
}
