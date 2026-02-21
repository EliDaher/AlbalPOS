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
import { X } from "lucide-react";
import { useMemo, useState } from "react";

export default function Products() {
  const [isOpen, setIsOpen] = useState(false);

  // Form Inputs
  const [name, setName] = useState("");
  const [category, setCategory] = useState("");
  const [price, setPrice] = useState<number | "">("");
  const [available, setAvailable] = useState(true);
  const [search, setSearch] = useState("");

  // Ingredients
  const [ingredients, setIngredients] = useState([]);

  const queryClient = useQueryClient();

  // Fetch Products
  const { data: products } = useQuery({
    queryKey: ["products-table"],
    queryFn: getAllProducts,
  });

  const { data: items, isLoading: itemsLoading } = useQuery({
    queryKey: ["items-table"],
    queryFn: getAllInventoryItems,
  });

  // Create Product
  const createProductMutation = useMutation({
    mutationFn: (data: Product) => createNewProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["products-table"] });

      // Reset fields
      setName("");
      setCategory("");
      setPrice("");
      setIngredients([]);
      setAvailable(true);
      setIsOpen(false);
    },
    onError: () => {
      alert("حدث خطأ أثناء إضافة المنتج");
    },
  });

  // Update ingredient
  const updateIngredient = (index: number, key: string, value: any) => {
    setIngredients((prev) => {
      const copy = [...prev];
      copy[index][key] = value;
      return copy;
    });
  };

  // Add new ingredient
  const addIngredient = ({ itemId, itemName, quantity }) => {
    setIngredients((prev) => {
      const exists = prev.find((p) => p.itemId === itemId);

      if (exists) {
        return prev.map((p) =>
          p.itemId === itemId
            ? { ...p, quantity: Number(p.quantity) + Number(quantity) }
            : p,
        );
      }

      return [...prev, { itemId, itemName, quantity: Number(quantity) || 0 }];
    });

    setSearch(""); 
  };

  const filteredItem = useMemo(
    () =>
      items?.filter((p) => p.name.toLowerCase().includes(search.toLowerCase())),
    [items, search],
  );

  const costPrice = useMemo(() => {
    return ingredients.reduce((total, ing) => {
      const item: InventoryItem = items?.find((i) => i.id === ing.itemId);
      if (!item) return total;
      return total + ing.quantity * item.costPerUnit; // أو costPerUnit لديك
    }, 0);
  }, [ingredients, items]);
  
  const sellPrice = useMemo(() => {
    return ingredients.reduce((total, ing) => {
      const item: InventoryItem = items?.find((i) => i.id === ing.itemId);
      if (!item) return total;
      return total + ing.quantity * item.sellPerUnit; // أو costPerUnit لديك
    }, 0);
  }, [ingredients, items]);

  // Delete ingredient
  const deleteIngredient = (index: number) => {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  };

  const handleCreateProduct = () => {
    if (!name || !category || !costPrice || !price) {
      alert("يجب تعبئة جميع الحقول الأساسية");
      return;
    }

    if (ingredients.length <= 0) {
      alert("الرجاء اختيار مكون واحد على الاقل");
      return;
    }

    const newProduct: Product = {
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
    };

    createProductMutation.mutate(newProduct);
  };

  const ProductsColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "category", label: "الصنف", sortable: true },
    { key: "prepTime", label: "وقت التحضير", sortable: true },
    { key: "cost", label: "التكلفة", sortable: true },
    { key: "price", label: "سعر المبيع", sortable: true },
    { key: "timesSold", label: "مرات البيع", sortable: true },
  ];

  return (
    <DashboardLayout>
      {/* Popup Form */}
      <PopupForm
        title="إنشاء منتج"
        isOpen={isOpen}
        setIsOpen={setIsOpen}
        trigger={null}
      >
        <div className="grid grid-cols-2 gap-2 p-2">
          <FormInput
            label="اسم المنتج"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />

          <FormInput
            label="الصنف"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />

          <FormInput
            label="التكلفة (تحسب تلقائيا)"
            type="number"
            value={costPrice}
          />

          <FormInput
            label="سعر المبيع"
            placeholder={sellPrice.toString()}
            type="number"
            value={price}
            onChange={(e) => setPrice(Number(e.target.value))}
          />

          {/* Available */}
          <div className="flex items-center gap-2">
            <label>متاح للبيع؟</label>
            <input
              type="checkbox"
              checked={available}
              onChange={() => setAvailable(!available)}
            />
          </div>
        </div>

        {/* Ingredients Section */}
        <div className="border p-3 rounded-md max-h-64 overflow-y-auto mt-3">
          <div className="font-semibold mb-2">المكونات</div>
          <Input
            placeholder="ابحث عن المنتج بالاسم أو الكود..."
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
                  className="flex justify-between items-center p-1 hover:bg-gray-100 cursor-pointer"
                  onClick={() =>
                    addIngredient({
                      itemId: p.id,
                      itemName: p.name,
                      quantity: 1,
                    })
                  }
                >
                  <span>
                    {p.name} ({p.category}) - ${p.sellPerUnit}
                  </span>
                </div>
              ))}
            </div>
          )}
          {ingredients.map((ing, i) => (
            <div
              key={i}
              className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-3 items-end"
            >
              <FormInput label="اسم المادة" value={ing.itemName} />
              <div className="flex items-center gap-2">
                <FormInput
                  label="الكمية"
                  type="number"
                  value={ing.quantity}
                  onChange={(e) =>
                    updateIngredient(i, "quantity", Number(e.target.value))
                  }
                />
                <FormInput
                  label="مبيع الواحدة"
                  type="number"
                  value={
                    ing.itemId
                      ? items?.find((it) => it.id === ing.itemId)?.sellPerUnit
                      : 0
                  }
                />

                {/* Delete Ingredient */}
                {ingredients.length > 1 && (
                  <Button
                    variant="destructive"
                    className="h-10 mt-6"
                    size="icon"
                    onClick={() => deleteIngredient(i)}
                  >
                    <X />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>

        <Button className="mt-4 w-full" onClick={handleCreateProduct}>
          إنشاء المنتج
        </Button>
      </PopupForm>

      {/* Products Table */}
      <div>
        <DataTable
          title="المنتجات"
          titleButton={
            <Button onClick={() => setIsOpen(true)}>إنشاء منتج جديد</Button>
          }
          data={products || []}
          columns={ProductsColumns}
        />
      </div>
    </DashboardLayout>
  );
}
