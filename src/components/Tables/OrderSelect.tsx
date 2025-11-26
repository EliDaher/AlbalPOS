import React, { useState, useMemo, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { InventoryItem, OrderItem, OrderProducts, Product } from "@/Types/POSTypes";
import getAllInventoryItems from "@/services/inventory";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/services/products";
import { DataTable } from "../dashboard/DataTable";


interface ItemTableProps {
  onChange: (selected: OrderItem[]) => void;
  setAmount: any;
  selectedItems: OrderItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  selectedProducts: OrderProducts[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<OrderProducts[]>>;
}

const OrderSelect: React.FC<ItemTableProps> = ({
  onChange,
  setAmount,
  selectedItems,
  setSelectedItems,
  selectedProducts,
  setSelectedProducts
}) => {
  const [search, setSearch] = useState("");

  // ✅ جلب جميع المنتجات
  const { data: inventoryItems, isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventoryItems-table"],
    queryFn: getAllInventoryItems,
  });

  const { data: products, isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products-table"],
    queryFn: getAllProducts,
  });

  // البحث عن المنتجات
  const filteredItem = useMemo(
    () =>
      products?.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      ),
    [products, search],
  );

  // إضافة منتج
  const addProduct = (product: Product) => {
    setSelectedProducts(prev => [...prev, {
      productId: product.id || "",
      productName: product.name,
      quantity: 1,
      total: product.price,
    }]);
    setSelectedItems((prev) => {
      let updated = [...prev];

      product.ingredients.forEach((ing) => {
        const inventoryItem = inventoryItems.find(
          (item) => item.id === ing.itemId,
        );
        if (!inventoryItem) return;

        const existsIndex = updated.findIndex(
          (item) => item.itemId === ing.itemId,
        );

        if (existsIndex !== -1) {
          // تحديث الكمية
          updated[existsIndex] = {
            ...updated[existsIndex],
            quantity: updated[existsIndex].quantity + ing.quantity,
            total:
              (updated[existsIndex].quantity + ing.quantity) *
              updated[existsIndex].price,
          };
        } else {
          // إضافة عنصر جديد
          updated.push({
            itemId: ing.itemId,
            itemName: ing.itemName,
            quantity: ing.quantity,
            price: inventoryItem.sellPerUnit,
            total: inventoryItem.sellPerUnit * ing.quantity,
          });
        }
      });

      onChange(updated);
      return updated;
    });
  };

  // تحديث الكمية
  const updateQty = (id: string, qty: number) => {
    const newSelected = selectedItems
      .map((p) => (p.itemId === id ? { ...p, quantity: qty } : p))
      .filter((p) => p.quantity >= 0);
    setSelectedItems(newSelected);
    onChange(newSelected);
  };


  // تحديث الكمية المنتجات  
  const updateProductQty = (id: string, qty: number) => {
    const newSelected = selectedProducts
      .map((p) => (p.productId === id ? { ...p, quantity: qty } : p))
      .filter((p) => p.quantity >= 0);
    setSelectedProducts(newSelected);
  };

  // حذف المنتج
  const removeProduct = (id: string) => {
    const newSelected = selectedProducts.filter((p) => p.productId !== id);
    setSelectedProducts(newSelected);
  };

  // إجمالي الفاتورة
  const total = selectedProducts.reduce(
    (sum, p) =>
      sum +
      p.total *
        p.quantity,
    0,
  );
  useEffect(() => {
    setAmount(total);
  }, [total]);

  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="text-lg font-bold mb-2">اختيار المنتجات</h3>

      <Input
        disabled={itemsLoading || productsLoading}
        placeholder={
          itemsLoading || productsLoading
            ? "جاري تحميل المنتجات..."
            : "ابحث عن المنتج بالاسم أو الكود..."
        }
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-2"
      />

      {/* قائمة البحث */}
      {search && filteredItem.length > 0 && (
        <div className="max-h-40 overflow-y-auto border p-2 rounded mb-4">
          {filteredItem.map((p) => (
            <div
              key={p.id}
              className="flex justify-between inventoryItems-center p-1 hover:bg-gray-100 cursor-pointer"
              onClick={() => addProduct(p)}
            >
              <span>
                {p.name} ({p.category}) - ${p.price}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* جدول المنتجات المختارة */}
      {selectedProducts.length > 0 && (
        <div>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-1">المنتج</th>
                <th className="border p-1">السعر</th>
                <th className="border p-1">الكمية</th>
                <th className="border p-1">المجموع</th>
                <th className="border p-1">حذف</th>
              </tr>
            </thead>
            <tbody>
              {selectedProducts.map((p) => (
                <tr key={p.productId}>
                  <td className="border p-1">{p.productName}</td>
                  <td className="border p-1">${p.total.toFixed(2)}</td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={(e) =>
                        updateProductQty(p.productId, Number(e.target.value))
                      }
                      className="w-16"
                    />
                  </td>
                  <td className="border p-1">
                    ${(p.total * p.quantity).toFixed(2)}
                  </td>
                  <td className="border p-1 text-center">
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => removeProduct(p.productId)}
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
          
          <table className="w-full border-collapse mt-6">
            <thead>
              <tr>
                <th className="border p-1">المنتج</th>
                <th className="border p-1">السعر</th>
                <th className="border p-1">الكمية</th>
                <th className="border p-1">المجموع</th>
                {/* <th className="border p-1">حذف</th> */}
              </tr>
            </thead>
            <tbody>
              {selectedItems?.map((p) => (
                <tr key={p.itemId}>
                  <td className="border p-1">{p.itemName}</td>
                  <td className="border p-1">${(inventoryItems.find(item => item.id === p.itemId)?.sellPerUnit).toFixed(0)}</td>
                  <td className="border p-1">
                    <Input
                      type="number"
                      min={1}
                      value={p.quantity}
                      onChange={(e) =>
                        updateQty(p.itemId, Number(e.target.value))
                      }
                      className="w-20"
                    />
                  </td>
                  <td className="border p-1">
                    ${(inventoryItems.find(item => item.id === p.itemId)?.sellPerUnit * p.quantity).toFixed(0)}
                  </td>
                  {/*
                    <td className="border p-1 text-center">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => removeProduct(p.itemId)}
                      >
                        <X />
                      </Button>
                    </td> 
                  */}
                </tr>
              ))}
            </tbody>
          </table>
          
        </div>
      )}
    </div>
  );
};

export default OrderSelect;
