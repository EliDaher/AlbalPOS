import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InventoryItem } from "@/Types/POSTypes";


interface ProductsTableProps {
  products: InventoryItem[];
  onChange: (selected) => void;
  setAmount: any;
  selectedProducts, 
  setSelectedProducts
}

const OrderSelect: React.FC<ProductsTableProps> = ({
  products,
  onChange,
  setAmount,
  selectedProducts,
  setSelectedProducts,
}) => {
  const [search, setSearch] = useState("");

  // البحث عن المنتجات
  const filteredProducts = useMemo(
    () =>
      products.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  // إضافة منتج
  const addProduct = (product: InventoryItem) => {
    const exists = selectedProducts.find((p) => p.id === product.id);
    if (exists) {
      updateQty(product.id, exists.qty + 1);
    } else {
      const newSelected = [...selectedProducts, { ...product, qty: 1 }];
      setSelectedProducts(newSelected);
      onChange(newSelected);
    }
  };

  // تحديث الكمية
  const updateQty = (id: string, qty: number) => {
    if (qty > products.find((p) => p.id === id)?.quantity!) {
      alert("الكمية المطلوبة غير متوفرة في المخزون");
      return;
    }
    const newSelected = selectedProducts
      .map((p) => (p.id === id ? { ...p, qty } : p))
      .filter((p) => p.qty >= 0);
    setSelectedProducts(newSelected);
    onChange(newSelected);
  };

  // حذف المنتج
  const removeProduct = (id: string) => {
    const newSelected = selectedProducts.filter((p) => p.id !== id);
    setSelectedProducts(newSelected);
    onChange(newSelected);
  };

  // إجمالي الفاتورة
  const total = selectedProducts.reduce(
    (sum, p) => sum + p.sellPerUnit * p.qty,
    0,
  );
  useEffect(() => {
    setAmount(total);
  }, [total]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">اختيار المنتجات</h3>

      <Input
        placeholder="ابحث عن المنتج بالاسم أو الكود..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />

      {/* قائمة البحث */}
      {search && filteredProducts.length > 0 && (
        <div className="max-h-40 overflow-y-auto border p-2 rounded mb-4">
          {filteredProducts.map((p) => (
            <div
              key={p.id}
              className="flex justify-between items-center p-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => addProduct(p)}
            >
              <span>
                {p.name} ({p.category}) - ${p.sellPerUnit}
              </span>
              <span>المخزون: {p.quantity}</span>
            </div>
          ))}
        </div>
      )}

      {/* جدول المنتجات المختارة */}
      {selectedProducts.length > 0 && (
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-1">المنتج</th>
              <th className="border p-1">الكود</th>
              <th className="border p-1">السعر</th>
              <th className="border p-1">الكمية</th>
              <th className="border p-1">المجموع</th>
              <th className="border p-1">حذف</th>
            </tr>
          </thead>
          <tbody>
            {selectedProducts.map((p) => (
              <tr key={p.id}>
                <td className="border p-1">{p.name}</td>
                <td className="border p-1">{p.category}</td>
                <td className="border p-1">${p.sellPerUnit}</td>
                <td className="border p-1">
                  <Input
                    type="number"
                    min={1}
                    value={p.qty}
                    onChange={(e) => updateQty(p.id, Number(e.target.value))}
                    className="w-16"
                  />
                </td>
                <td className="border p-1">
                  ${(p.sellPerUnit * p.qty).toFixed(2)}
                </td>
                <td className="border p-1 text-center">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => removeProduct(p.id)}
                  >
                    <X />
                  </Button>
                </td>
              </tr>
            ))}
            <tr>
              <td colSpan={4} className="border p-1 font-bold text-right">
                الإجمالي
              </td>
              <td colSpan={2} className="border p-1 font-bold">
                ${total.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>
      )}
    </div>
  );
};

export default OrderSelect;
