import React, { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Minus, Plus, Search, X } from "lucide-react";
import {
  InventoryItem,
  OrderItem,
  OrderProduct,
  Product,
} from "@/Types/POSTypes";
import getAllInventoryItems from "@/services/inventory";
import { useQuery } from "@tanstack/react-query";
import { getAllProducts } from "@/services/products";
import {
  deriveOrderItemsFromProducts,
  formatCurrency,
  getProductUnitPrice,
  mergeProductSelection,
} from "@/lib/pos";

interface ItemTableProps {
  onChange: (selected: OrderItem[]) => void;
  setAmount: (amount: number) => void;
  selectedItems: OrderItem[];
  setSelectedItems: React.Dispatch<React.SetStateAction<OrderItem[]>>;
  selectedProducts: OrderProduct[];
  setSelectedProducts: React.Dispatch<React.SetStateAction<OrderProduct[]>>;
}

const OrderSelect: React.FC<ItemTableProps> = ({
  onChange,
  setAmount,
  selectedItems,
  setSelectedItems,
  selectedProducts,
  setSelectedProducts,
}) => {
  const [search, setSearch] = useState("");

  const { data: inventoryItems = [], isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["inventoryItems-table"],
    queryFn: getAllInventoryItems,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery<Product[]>({
    queryKey: ["products-table"],
    queryFn: getAllProducts,
  });

  const filteredProducts = useMemo(() => {
    const term = search.trim().toLowerCase();
    return products
      .filter((product) => product.available !== false)
      .filter((product) =>
        !term
          ? true
          : product.name.toLowerCase().includes(term) ||
            product.category.toLowerCase().includes(term),
      );
  }, [products, search]);

  const total = useMemo(
    () =>
      selectedProducts.reduce(
        (sum, product) => sum + getProductUnitPrice(product) * product.quantity,
        0,
      ),
    [selectedProducts],
  );

  useEffect(() => {
    const derivedItems = deriveOrderItemsFromProducts(
      selectedProducts,
      products,
      inventoryItems,
    );
    setSelectedItems(derivedItems);
    onChange(derivedItems);
    setAmount(total);
  }, [inventoryItems, onChange, products, selectedProducts, setAmount, setSelectedItems, total]);

  const addProduct = (product: Product) => {
    setSelectedProducts((prev) => mergeProductSelection(prev, product));
    setSearch("");
  };

  const updateProductQty = (id: string, qty: number) => {
    const quantity = Math.max(Number(qty || 0), 0);
    setSelectedProducts((prev) =>
      prev
        .map((product) =>
          product.productId === id
            ? {
                ...product,
                quantity,
                total: getProductUnitPrice(product) * quantity,
              }
            : product,
        )
        .filter((product) => product.quantity > 0),
    );
  };

  const removeProduct = (id: string) => {
    setSelectedProducts((prev) => prev.filter((product) => product.productId !== id));
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="mb-2 text-lg font-bold">اختيار المنتجات</h3>
        <div className="relative">
          <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            disabled={itemsLoading || productsLoading}
            placeholder={
              itemsLoading || productsLoading
                ? "جاري تحميل المنتجات..."
                : "ابحث باسم المنتج أو الصنف..."
            }
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="pr-9 text-right"
          />
        </div>
      </div>

      <div className="grid max-h-72 gap-3 overflow-y-auto sm:grid-cols-2">
        {filteredProducts.slice(0, 12).map((product) => (
          <button
            type="button"
            key={product.id}
            onClick={() => addProduct(product)}
            className="rounded-md border bg-card p-3 text-right transition hover:border-primary hover:bg-primary/5"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-semibold">{product.name}</p>
                <p className="text-xs text-muted-foreground">{product.category}</p>
              </div>
              <Badge variant="secondary">{formatCurrency(product.price)}</Badge>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              {product.ingredients?.length || 0} مكونات
            </p>
          </button>
        ))}
      </div>

      {selectedProducts.length > 0 && (
        <div className="space-y-3 rounded-md border p-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">سلة الطلب</h4>
            <span className="text-sm text-muted-foreground">
              {selectedProducts.length} منتجات
            </span>
          </div>

          {selectedProducts.map((product) => (
            <div
              key={product.productId}
              className="grid grid-cols-[1fr_auto] items-center gap-3 rounded-md bg-muted/40 p-2"
            >
              <div>
                <p className="font-medium">{product.productName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatCurrency(getProductUnitPrice(product))} × {product.quantity}
                </p>
              </div>
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateProductQty(product.productId, product.quantity - 1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={product.quantity}
                  onChange={(event) =>
                    updateProductQty(product.productId, Number(event.target.value))
                  }
                  className="h-10 w-16 text-center"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => updateProductQty(product.productId, product.quantity + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() => removeProduct(product.productId)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}

          <div className="flex items-center justify-between border-t pt-3 text-lg font-bold">
            <span>الإجمالي</span>
            <span>{formatCurrency(total)}</span>
          </div>
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="rounded-md border p-3">
          <h4 className="mb-2 font-semibold">المواد التي ستخصم من المخزون</h4>
          <div className="grid gap-2 text-sm sm:grid-cols-2">
            {selectedItems.map((item) => (
              <div key={item.itemId} className="flex justify-between rounded bg-muted/40 p-2">
                <span>{item.itemName}</span>
                <span className="font-medium">{item.quantity}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderSelect;
