import { DataTable } from "@/components/dashboard/DataTable";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/custom/FormInput";
import PopupForm from "@/components/ui/custom/PopupForm";
import { Input } from "@/components/ui/input";
import getAllInventoryItems from "@/services/inventory";
import createNewProduct, { getAllProducts } from "@/services/products";
import { InventoryItem, Product } from "@/Types/POSTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/pos";

type IngredientDraft = {
  itemId: string;
  itemName: string;
  quantity: number;
};

export default function Products() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [available, setAvailable] = useState(true);
  const [search, setSearch] = useState("");
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);

  const { data: products = [], isLoading, isError } = useQuery<Product[]>({
    queryKey: ["products-table"],
    queryFn: getAllProducts,
  });

  const { data: items = [], isLoading: itemsLoading } = useQuery<InventoryItem[]>({
    queryKey: ["items-table"],
    queryFn: getAllInventoryItems,
  });

  const createProductMutation = useMutation({
    mutationFn: (data: Product) => createNewProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-table"] });
      setName("");
      setCategory("");
      setPrice("");
      setIngredients([]);
      setAvailable(true);
      setIsOpen(false);
      toast.success("تم إنشاء المنتج بنجاح");
    },
    onError: () => toast.error("حدث خطأ أثناء إضافة المنتج"),
  });

  const filteredItems = useMemo(
    () =>
      items.filter((item) =>
        item.name.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [items, search],
  );

  const costPrice = useMemo(
    () =>
      ingredients.reduce((total, ingredient) => {
        const item = items.find((stockItem) => stockItem.id === ingredient.itemId);
        return total + Number(ingredient.quantity || 0) * Number(item?.costPerUnit || 0);
      }, 0),
    [ingredients, items],
  );

  const suggestedSellPrice = useMemo(
    () =>
      ingredients.reduce((total, ingredient) => {
        const item = items.find((stockItem) => stockItem.id === ingredient.itemId);
        return total + Number(ingredient.quantity || 0) * Number(item?.sellPerUnit || 0);
      }, 0),
    [ingredients, items],
  );

  const addIngredient = (item: InventoryItem) => {
    setIngredients((prev) => {
      const exists = prev.find((ingredient) => ingredient.itemId === item.id);
      if (exists) {
        return prev.map((ingredient) =>
          ingredient.itemId === item.id
            ? { ...ingredient, quantity: ingredient.quantity + 1 }
            : ingredient,
        );
      }
      return [
        ...prev,
        {
          itemId: item.id || "",
          itemName: item.name,
          quantity: 1,
        },
      ];
    });
    setSearch("");
  };

  const updateIngredient = (
    index: number,
    key: keyof IngredientDraft,
    value: string | number,
  ) => {
    setIngredients((prev) =>
      prev.map((ingredient, currentIndex) =>
        currentIndex === index ? { ...ingredient, [key]: value } : ingredient,
      ),
    );
  };

  const handleCreateProduct = () => {
    if (!name.trim() || !category.trim() || !price) {
      toast.error("يجب تعبئة اسم المنتج والصنف وسعر البيع");
      return;
    }

    if (ingredients.length === 0) {
      toast.error("الرجاء اختيار مكون واحد على الأقل");
      return;
    }

    createProductMutation.mutate({
      id: crypto.randomUUID(),
      name,
      category,
      cost: Number(costPrice),
      price: Number(price),
      prepTime: 1,
      timesSold: 0,
      ingredients,
      available,
      createdAt: new Date().toISOString(),
    });
  };

  const columns = [
    { key: "name", label: "الاسم", sortable: true },
    { key: "category", label: "الصنف", sortable: true },
    { key: "prepTime", label: "وقت التحضير", sortable: true },
    { key: "cost", label: "التكلفة", sortable: true },
    { key: "price", label: "سعر البيع", sortable: true },
    { key: "timesSold", label: "مرات البيع", sortable: true },
    {
      key: "available",
      label: "الحالة",
      sortable: true,
      render: (row: Product) => (row.available ? "متوفر" : "غير متوفر"),
      exportValue: (row: Product) => (row.available ? "متوفر" : "غير متوفر"),
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <PopupForm
          title="إنشاء منتج"
          isOpen={isOpen}
          setIsOpen={setIsOpen}
        >
          <div className="grid grid-cols-1 gap-3 p-1 md:grid-cols-2">
            <FormInput
              label="اسم المنتج"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
            <FormInput
              label="الصنف"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
            <FormInput
              label="التكلفة التقديرية"
              type="number"
              value={costPrice}
              readOnly
            />
            <FormInput
              label="سعر البيع"
              placeholder={String(suggestedSellPrice)}
              type="number"
              value={price}
              onChange={(event) => setPrice(Number(event.target.value))}
            />
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={available}
                onChange={() => setAvailable((value) => !value)}
              />
              متاح للبيع
            </label>
          </div>

          <div className="mt-4 rounded-md border p-3">
            <div className="mb-2 font-semibold">المكونات</div>
            <Input
              placeholder={
                itemsLoading ? "جاري تحميل المستودع..." : "ابحث عن مادة لإضافتها..."
              }
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="mb-2 text-right"
            />

            {search && filteredItems.length > 0 && (
              <div className="mb-4 max-h-40 overflow-y-auto rounded border p-2">
                {filteredItems.map((item) => (
                  <button
                    type="button"
                    key={item.id}
                    className="flex w-full justify-between rounded p-2 text-right hover:bg-muted"
                    onClick={() => addIngredient(item)}
                  >
                    <span>{item.name} ({item.category})</span>
                    <span>{formatCurrency(item.sellPerUnit)}</span>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {ingredients.map((ingredient, index) => (
                <div
                  key={`${ingredient.itemId}-${index}`}
                  className="grid grid-cols-1 gap-2 rounded-md bg-muted/40 p-2 md:grid-cols-[1fr_120px_auto]"
                >
                  <FormInput label="اسم المادة" value={ingredient.itemName} readOnly />
                  <FormInput
                    label="الكمية"
                    type="number"
                    min={0}
                    step="0.01"
                    value={ingredient.quantity}
                    onChange={(event) =>
                      updateIngredient(index, "quantity", Number(event.target.value))
                    }
                  />
                  <div className="flex items-end">
                    <Button
                      type="button"
                      variant="destructive"
                      size="icon"
                      onClick={() =>
                        setIngredients((prev) =>
                          prev.filter((_, currentIndex) => currentIndex !== index),
                        )
                      }
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button
            className="mt-4 w-full"
            onClick={handleCreateProduct}
            loading={createProductMutation.isPending}
          >
            إنشاء المنتج
          </Button>
        </PopupForm>

        <DataTable
          title="المنتجات"
          titleButton={
            <Button onClick={() => setIsOpen(true)}>
              <Plus className="h-4 w-4" />
              إنشاء منتج جديد
            </Button>
          }
          data={products}
          columns={columns}
          isLoading={isLoading}
          isError={isError}
          exportFilename="المنتجات"
          renderRowActions={(row) => (
            <Button
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                navigate("/productDetails", { state: { ...row } });
              }}
            >
              التفاصيل
            </Button>
          )}
        />
      </div>
    </DashboardLayout>
  );
}
