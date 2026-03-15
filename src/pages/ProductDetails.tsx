import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import Loading from "@/components/ui/custom/Loading";
import {
  deleteProduct,
  getProductById,
  updateProduct,
  uploadImage,
} from "@/services/products";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Plus, Trash2, Save, Package } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type Ingredient = {
  itemId: string;
  itemName: string;
  quantity: number;
};

type Product = {
  id: string;
  name: string;
  category: string;
  cost: number;
  price: number;
  prepTime: number;
  available: boolean;
  imageUrl: string;
  timesSold: number;
  createdAt: string;
  ingredients: Ingredient[];
};

const emptyProduct: Product = {
  id: "",
  name: "",
  category: "",
  cost: 0,
  price: 0,
  prepTime: 0,
  available: true,
  imageUrl: "",
  timesSold: 0,
  createdAt: "",
  ingredients: [],
};

function normalizeProductResponse(res: any): Product {
  const product = res?.data ?? res ?? {};
  return {
    id: product.id ?? "",
    name: product.name ?? "",
    category: product.category ?? "",
    cost: Number(product.cost ?? 0),
    price: Number(product.price ?? 0),
    prepTime: Number(product.prepTime ?? 0),
    available: Boolean(product.available),
    imageUrl: product.imageUrl ?? "",
    timesSold: Number(product.timesSold ?? 0),
    createdAt: product.createdAt ?? "",
    ingredients: Array.isArray(product.ingredients)
      ? product.ingredients.map((item: any) => ({
          itemId: item.itemId ?? "",
          itemName: item.itemName ?? "",
          quantity: Number(item.quantity ?? 0),
        }))
      : [],
  };
}

function formatDate(date?: string) {
  if (!date) return "-";
  const parsed = new Date(date);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("en-GB");
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <label className="text-sm font-medium text-muted-foreground">
      {children}
    </label>
  );
}

function StatCard({ title, value }: { title: string; value: string | number }) {
  return (
    <div className="rounded-2xl border bg-background p-4 shadow-sm">
      <p className="text-sm text-muted-foreground">{title}</p>
      <p className="mt-2 text-xl font-bold">{value}</p>
    </div>
  );
}

export default function ProductDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string>("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  const productStateId = location.state?.id as string | undefined;

  const [formData, setFormData] = useState<Product>(emptyProduct);
  const [isDirty, setIsDirty] = useState(false);

  const {
    data: productResponse,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["product", productStateId],
    queryFn: () => getProductById(productStateId as string),
    enabled: !!productStateId,
  });

  const productData = useMemo(() => {
    if (!productResponse) return null;
    return normalizeProductResponse(productResponse);
  }, [productResponse]);

  useEffect(() => {
    if (!productStateId) {
      toast.error("لم يتم العثور على معرف المنتج");
      navigate("/products");
    }
  }, [productStateId, navigate]);

  useEffect(() => {
    if (productData) {
      setFormData(productData);
      setPreviewImage(productData.imageUrl || "");
      setIsDirty(false);
    }
  }, [productData]);

  useEffect(() => {
    if (isError) {
      console.error(error);
      toast.error("حدث خطأ أثناء جلب بيانات المنتج");
      navigate("/products");
    }
  }, [isError, error, navigate]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة فقط");
      return;
    }

    setSelectedImage(file);
    setPreviewImage(URL.createObjectURL(file));
    setIsDirty(true);
  };

  const updateMutation = useMutation({
    mutationFn: async (payload: Product) => {
      let finalImageUrl = payload.imageUrl;

      if (selectedImage) {
        setIsUploadingImage(true);
        finalImageUrl = await uploadImage(selectedImage);
        setIsUploadingImage(false);
      }

      const updatedPayload = {
        ...payload,
        imageUrl: finalImageUrl,
      };

      const response = await updateProduct(payload.id, updatedPayload);

      return {
        response,
        updatedPayload,
      };
    },
    onSuccess: ({ updatedPayload }) => {
      setFormData(updatedPayload);
      setPreviewImage(updatedPayload.imageUrl || "");
      setSelectedImage(null);
      setIsDirty(false);

      toast.success("تم حفظ التعديلات بنجاح");
      queryClient.invalidateQueries({ queryKey: ["product", productStateId] });
      queryClient.invalidateQueries({ queryKey: ["products-table"] });
    },
    onError: (err: any) => {
      setIsUploadingImage(false);
      console.error(err);
      toast.error(err?.message || "حدث خطأ أثناء حفظ التعديلات");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteProduct(id),
    onSuccess: () => {
      toast.success("تم حذف المنتج بنجاح");
      queryClient.invalidateQueries({ queryKey: ["products-table"] });
      navigate("/products");
    },
    onError: (err: any) => {
      console.error(err);
      toast.error(err?.message || "فشل حذف المنتج");
    },
  });

  const handleChange = <K extends keyof Product>(key: K, value: Product[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleIngredientChange = (
    index: number,
    key: keyof Ingredient,
    value: string | number,
  ) => {
    setFormData((prev) => {
      const updatedIngredients = [...prev.ingredients];
      updatedIngredients[index] = {
        ...updatedIngredients[index],
        [key]: key === "quantity" ? Number(value) : value,
      };
      return { ...prev, ingredients: updatedIngredients };
    });
    setIsDirty(true);
  };

  const addIngredient = () => {
    setFormData((prev) => ({
      ...prev,
      ingredients: [
        ...prev.ingredients,
        {
          itemId: "",
          itemName: "",
          quantity: 0,
        },
      ],
    }));
    setIsDirty(true);
  };

  const removeIngredient = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
    setIsDirty(true);
  };

  const isFormValid =
    formData.name.trim() !== "" &&
    formData.category.trim() !== "" &&
    formData.cost >= 0 &&
    formData.price >= 0 &&
    formData.prepTime >= 0 &&
    formData.ingredients.every(
      (item) =>
        item.itemName.trim() !== "" &&
        item.itemId.trim() !== "" &&
        Number(item.quantity) >= 0,
    );

  const estimatedProfit = useMemo(() => {
    return Number(formData.price || 0) - Number(formData.cost || 0);
  }, [formData.price, formData.cost]);

  if (isLoading) {
    return (
      <DashboardLayout>
        <Loading />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Card>
          <CardHeader className="flex flex-row-reverse items-center justify-between gap-4">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="ml-2 h-4 w-4" />
              رجوع
            </Button>
            <CardTitle className="text-xl">تفاصيل المنتج</CardTitle>
          </CardHeader>
        </Card>

        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>المعلومات الأساسية</CardTitle>
              </CardHeader>

              <CardContent className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <FieldLabel>اسم المنتج</FieldLabel>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="أدخل اسم المنتج"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>الفئة</FieldLabel>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => handleChange("category", e.target.value)}
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="أدخل الفئة"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>التكلفة</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={formData.cost}
                    onChange={(e) =>
                      handleChange("cost", Number(e.target.value))
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>السعر</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={formData.price}
                    onChange={(e) =>
                      handleChange("price", Number(e.target.value))
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>وقت التحضير بالدقائق</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={formData.prepTime}
                    onChange={(e) =>
                      handleChange("prepTime", Number(e.target.value))
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="0"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>صورة المنتج</FieldLabel>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                  />
                </div>

                <div className="space-y-2">
                  <FieldLabel>حالة التوفر</FieldLabel>
                  <select
                    value={String(formData.available)}
                    onChange={(e) =>
                      handleChange("available", e.target.value === "true")
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                  >
                    <option value="true">متوفر</option>
                    <option value="false">غير متوفر</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <FieldLabel>عدد مرات البيع</FieldLabel>
                  <input
                    type="number"
                    min="0"
                    value={formData.timesSold}
                    onChange={(e) =>
                      handleChange("timesSold", Number(e.target.value))
                    }
                    className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                    placeholder="0"
                    disabled
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <FieldLabel>تاريخ الإنشاء</FieldLabel>
                  <input
                    type="text"
                    value={formatDate(formData.createdAt)}
                    disabled
                    className="w-full rounded-xl border bg-muted px-3 py-2 text-muted-foreground"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row-reverse items-center justify-between">
                <Button variant="outline" onClick={addIngredient}>
                  <Plus className="ml-2 h-4 w-4" />
                  إضافة مكوّن
                </Button>
                <CardTitle>المكونات</CardTitle>
              </CardHeader>

              <CardContent className="space-y-4">
                {formData.ingredients.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
                    لا توجد مكونات حالياً
                  </div>
                ) : (
                  formData.ingredients.map((ingredient, index) => (
                    <div
                      key={`${ingredient.itemId}-${index}`}
                      className="grid grid-cols-1 gap-3 rounded-2xl border p-4 md:grid-cols-12"
                    >
                      <div className="space-y-2 md:col-span-4">
                        <FieldLabel>اسم المكوّن</FieldLabel>
                        <input
                          type="text"
                          value={ingredient.itemName}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "itemName",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                          placeholder="مثال: لبنة"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-4">
                        <FieldLabel>معرّف المكوّن</FieldLabel>
                        <input
                          type="text"
                          value={ingredient.itemId}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "itemId",
                              e.target.value,
                            )
                          }
                          className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                          placeholder="item id"
                        />
                      </div>

                      <div className="space-y-2 md:col-span-3">
                        <FieldLabel>الكمية</FieldLabel>
                        <input
                          type="number"
                          step="0.01"
                          min="0"
                          value={ingredient.quantity}
                          onChange={(e) =>
                            handleIngredientChange(
                              index,
                              "quantity",
                              Number(e.target.value),
                            )
                          }
                          className="w-full rounded-xl border bg-background px-3 py-2 outline-none focus:ring-2"
                          placeholder="0"
                        />
                      </div>

                      <div className="flex items-end md:col-span-1">
                        <Button
                          type="button"
                          variant="destructive"
                          className="w-full"
                          onClick={() => removeIngredient(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>معاينة المنتج</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt={formData.name}
                    className="h-56 w-full rounded-2xl border object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).style.display =
                        "none";
                    }}
                  />
                ) : (
                  <div className="flex h-56 items-center justify-center rounded-2xl border bg-muted">
                    <div className="text-center text-muted-foreground">
                      <Package className="mx-auto mb-2 h-10 w-10" />
                      لا توجد صورة للمنتج
                    </div>
                  </div>
                )}

                <div className="grid gap-3">
                  <StatCard title="السعر" value={formData.price} />
                  <StatCard title="التكلفة" value={formData.cost} />
                  <StatCard title="الربح المتوقع" value={estimatedProfit} />
                  <StatCard title="مرات البيع" value={formData.timesSold} />
                  <StatCard
                    title="الحالة"
                    value={formData.available ? "متوفر" : "غير متوفر"}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>الإجراءات</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full"
                  onClick={() => updateMutation.mutate(formData)}
                  disabled={
                    !isDirty ||
                    !isFormValid ||
                    updateMutation.isPending ||
                    isUploadingImage
                  }
                >
                  <Save className="ml-2 h-4 w-4" />
                  {updateMutation.isPending || isUploadingImage
                    ? "جارٍ حفظ التعديلات..."
                    : "حفظ التعديلات"}
                </Button>

                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteMutation.isPending}
                  onClick={() => {
                    const confirmed = window.confirm(
                      `هل أنت متأكد من حذف المنتج "${formData.name}" ؟`,
                    );
                    if (confirmed) {
                      deleteMutation.mutate(formData.id);
                    }
                  }}
                >
                  <Trash2 className="ml-2 h-4 w-4" />
                  {deleteMutation.isPending ? "جارٍ الحذف..." : "حذف المنتج"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
