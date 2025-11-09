import React, { useEffect, useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Button } from "../ui/button";
import SellInventoryItem from "./SellInventoryItem";
import CreateProduct from "./CreateProduct";
import { Badge } from "../ui/badge";

type InventoryUser = { username: string; [key: string]: any };

type ProductRow = {
  id: string;
  name: string;
  unit: string;
  needQty: number;
  costPerUnit: number;
  category: string;
  [key: string]: any;
};

interface MakeProductProps {
  products?: ProductRow[];
  selectedRows: ProductRow[];
  setSelectedRows: React.Dispatch<React.SetStateAction<ProductRow[]>>;
}

export default function MakeProduct({
  products = [],
  selectedRows,
  setSelectedRows,
}: MakeProductProps) {
  const [mode, setMode] = useState<"table" | "sell" | "create">("table");
  const [inventoryUser, setInventoryUser] = useState<InventoryUser | null>(
    null,
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  useEffect(() => {
    const storedUser = JSON.parse(
      localStorage.getItem("InventoryUser") || "null",
    );
    setInventoryUser(storedUser);
  }, []);

  const columns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "unit", label: "الواحدة", sortable: true },
    { key: "needQty", label: "الكمية المستخدمة", sortable: true },
    { key: "costPerUnit", label: "سعر الواحدة", sortable: true },
    { key: "category", label: "الصنف", sortable: true },
  ];

  const handleNeedQtyChange = (id: string, newValue: number) => {
    setSelectedRows((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, needQty: newValue } : item,
      ),
    );
  };

  const toggleRowSelection = (row: ProductRow) => {
    setSelectedRows((prev) => {
      const exists = prev.some((r) => r.id === row.id);
      if (exists) return prev.filter((r) => r.id !== row.id);
      return [...prev, row];
    });
  };

  const renderCellContent = (row: ProductRow, key: string) => {
    const value = row[key];
    if (key === "needQty") {
      return (
        <input
          type="number"
          value={value || ""}
          onChange={(e) => handleNeedQtyChange(row.id, Number(e.target.value))}
          className="w-full border rounded px-1 text-right"
        />
      );
    }
    return value;
  };

  // Pagination
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return selectedRows.slice(start, start + pageSize);
  }, [selectedRows, currentPage, pageSize]);

  // الحالة الرئيسية للعرض
  if (mode === "sell") {
    if (!inventoryUser) return <p>Loading user...</p>;
    return (
      <SellInventoryItem
        createdBy={inventoryUser.username}
        selectedItems={selectedRows}
        isOpen={true}
        setIsOpen={() => setMode("table")}
      />
    );
  }

  if (mode === "create") {
    return (
      <CreateProduct
        setIsOpen={() => setMode("table")}
        selectedItems={selectedRows}
      />
    );
  }

  // الوضع الافتراضي: جدول المنتجات + أزرار
  return (
    <Card>
      <CardHeader>
        <CardTitle>انشاء منتج / بيع مواد</CardTitle>
        <div className="flex gap-4 pt-4">
          <Button
            variant="accent"
            className="w-full"
            onClick={() => setMode("sell")}
          >
            بيع المواد
          </Button>
          {/* <Button className="w-full" onClick={() => setMode("create")}>
            اضافة الى قائمة المنتجات
          </Button> */}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead
                  key={column.key}
                  className={column.hidden ? "hidden" : "text-center"}
                >
                  {column.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length > 0 ? (
              paginatedData.map((row, index) => (
                <TableRow
                  key={index}
                  onDoubleClick={() => toggleRowSelection(row)}
                  className="cursor-pointer hover:bg-muted/50"
                >
                  {columns.map((column) => (
                    <TableCell
                      key={column.key}
                      className={column.hidden ? "hidden" : ""}
                    >
                      {renderCellContent(row, column.key)}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  لا توجد بيانات
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <span>
            الصفحة {currentPage} من{" "}
            {Math.ceil(selectedRows.length / pageSize) || 1}
          </span>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
            >
              السابق
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setCurrentPage((p) =>
                  Math.min(p + 1, Math.ceil(selectedRows.length / pageSize)),
                )
              }
              disabled={
                currentPage >= Math.ceil(selectedRows.length / pageSize)
              }
            >
              التالي
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
