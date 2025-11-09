import { DashboardLayout } from "@/components/layout/DashboardLayout";
import TopTable from "@/components/Tables/TopTable";
import { Button } from "@/components/ui/button";
import FormInput from "@/components/ui/custom/FormInput";
import PopupForm from "@/components/ui/custom/PopupForm";
import getAllTables, {
  createTables,
  updateTableState,
} from "@/services/tables";
import { Table } from "@/Types/POSTypes";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  Loader2,
  PlusCircle,
  AlertTriangle,
  LayoutGrid,
  TableIcon,
} from "lucide-react";
import { inventoryUser } from "@/components/layout/Header";
import { useNavigate } from "react-router-dom";

export default function Tables() {
  const [inventoryUser, setInventoryUser] = useState<inventoryUser>();
  useEffect(() => {
    const temUser = JSON.parse(localStorage.getItem("InventoryUser") || "null");
    setInventoryUser(temUser);
  }, []);

  const [isOpen, setIsOpen] = useState(false);
  const [activeTable, setActiveTable] = useState<Table | null>(null);
  const [state, setState] = useState<
    "available" | "occupied" | "reserved" | "closed"
  >("available");
  const [formData, setFormData] = useState({
    name: "",
    location: "",
    capacity: 1,
  });
  const [note, setNote] = useState("");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table"); // ✅ الوضع الافتراضي جدول
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const {
    data: tables,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["tables-table"],
    queryFn: getAllTables,
  });

  const addTableMutation = useMutation({
    mutationFn: (table: Table) => createTables({ table }),
    onSuccess: () => {
      setFormData({ name: "", location: "", capacity: 1 });
      alert("تمت العملية بنجاح");
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
    },
    onError: () => alert("حدث خطأ أثناء إضافة الطاولة"),
  });

  const updateTableMutation = useMutation({
    mutationFn: (dataToSend: {
      id: string;
      state: string;
      note: string;
      user: string;
    }) => updateTableState(dataToSend),
    onSuccess: () => {
      alert("تم تعديل حالة الطاولة بنجاح");
      setActiveTable(null);
      queryClient.invalidateQueries({ queryKey: ["tables-table"] });
    },
    onError: () => alert("حدث خطأ أثناء تعديل حالة الطاولة"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const { name, location, capacity } = formData;
    if (!name.trim()) return alert("يرجى إدخال اسم الطاولة");
    addTableMutation.mutate({
      name,
      location,
      capacity,
      status: "available",
    } as Table);
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* ✅ العنوان + زر الإضافة + خيارات العرض */}
        <div className="flex justify-between items-center flex-wrap gap-3">
          <h1 className="text-2xl font-bold text-gray-800">إدارة الطاولات</h1>

          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "table" ? "default" : "outline"}
              onClick={() => setViewMode("table")}
              className="flex items-center gap-2"
            >
              <TableIcon className="w-4 h-4" />
              عرض كجدول
            </Button>
            <Button
              variant={viewMode === "grid" ? "default" : "outline"}
              onClick={() => setViewMode("grid")}
              className="flex items-center gap-2"
            >
              <LayoutGrid className="w-4 h-4" />
              عرض كبطاقات
            </Button>

            <PopupForm
              title="إضافة طاولة جديدة"
              isOpen={isOpen}
              setIsOpen={setIsOpen}
              trigger={
                <Button className="flex items-center gap-2">
                  <PlusCircle className="w-4 h-4" />
                  إضافة طاولة
                </Button>
              }
            >
              <form onSubmit={handleSubmit} className="space-y-4">
                <FormInput
                  label="اسم الطاولة"
                  placeholder="مثل: طاولة 1"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, name: e.target.value }))
                  }
                />
                <FormInput
                  label="الموقع"
                  placeholder="الزاوية اليمنى - القسم الداخلي"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData((p) => ({ ...p, location: e.target.value }))
                  }
                />
                <FormInput
                  label="عدد المقاعد في كل جهة"
                  type="number"
                  min={1}
                  value={formData.capacity}
                  onChange={(e) =>
                    setFormData((p) => ({
                      ...p,
                      capacity: Number(e.target.value),
                    }))
                  }
                />
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addTableMutation.isPending}
                >
                  {addTableMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "تأكيد الإضافة"
                  )}
                </Button>
              </form>
            </PopupForm>
          </div>
        </div>

        {/* ✅ تحميل / خطأ */}
        {isLoading && (
          <div className="flex justify-center py-10">
            <Loader2 className="w-6 h-6 animate-spin text-gray-600" />
          </div>
        )}
        {isError && (
          <div className="flex justify-center items-center gap-2 py-10 text-red-500">
            <AlertTriangle className="w-5 h-5" />
            <span>فشل في تحميل الطاولات</span>
          </div>
        )}

        {/* ✅ عرض الطاولات */}
        {tables && viewMode === "grid" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {tables.map((t: Table) => (
              <div key={t.id} className="flex flex-col">
                <div
                  onClick={() => {
                    setActiveTable(t);
                    setState(t.status);
                  }}
                >
                  <TopTable
                    tableName={t.name}
                    chairsPerSide={t.capacity}
                    state={t.status}
                    location={t.location}
                  />
                </div>
                <Button
                  variant="outline"
                  className="mt-2"
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/tableDetails/${t.id}`, { state: t });
                  }}
                >
                  تفاصيل
                </Button>
              </div>
            ))}
          </div>
        )}

        {tables && viewMode === "table" && (
          <div className="overflow-x-auto rounded-lg shadow-sm border border-gray-200">
            <table className="min-w-full text-sm text-right">
              <thead className="bg-gray-100 text-gray-700 font-semibold">
                <tr>
                  <th className="p-3">الاسم</th>
                  <th className="p-3">الموقع</th>
                  <th className="p-3">السعة</th>
                  <th className="p-3">الحالة</th>
                  <th className="p-3">إجراءات</th>
                </tr>
              </thead>
              <tbody>
                {tables.map((t: Table) => (
                  <tr
                    key={t.id}
                    className="border-t hover:bg-gray-50 transition cursor-pointer"
                    onClick={() => setActiveTable(t)}
                  >
                    <td className="p-3">{t.name}</td>
                    <td className="p-3">{t.location || "-"}</td>
                    <td className="p-3 text-center">{t.capacity * 2}</td>
                    <td
                      className={`p-3 font-medium ${
                        t.status === "available"
                          ? "text-green-600"
                          : t.status === "occupied"
                            ? "text-red-600"
                            : t.status === "reserved"
                              ? "text-yellow-600"
                              : "text-gray-600"
                      }`}
                    >
                      {t.status === "available"
                        ? "متاحة"
                        : t.status === "occupied"
                          ? "مشغولة"
                          : t.status === "reserved"
                            ? "محجوزة"
                            : "مغلقة"}
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/tableDetails/${t.id}`, { state: t });
                        }}
                      >
                        تفاصيل
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* ✅ نافذة تعديل الحالة */}
        {activeTable && (
          <PopupForm
            title={`تعديل حالة ${activeTable.name}`}
            isOpen={!!activeTable}
            setIsOpen={() => setActiveTable(null)}
            trigger
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                updateTableMutation.mutate({
                  id: activeTable.id,
                  state,
                  note,
                  user: inventoryUser?.username || "غير معروف",
                });
              }}
            >
              <div className="flex gap-2 mb-4 justify-center items-center">
                <Button
                  type="button"
                  className="w-full"
                  variant={state === "available" ? "accent" : "outline"}
                  onClick={() => setState("available")}
                >
                  متاحة
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  variant={state === "reserved" ? "accent" : "outline"}
                  onClick={() => setState("reserved")}
                >
                  محجوزة
                </Button>
                <Button
                  type="button"
                  className="w-full"
                  variant={state === "occupied" ? "accent" : "outline"}
                  onClick={() => setState("occupied")}
                >
                  مشغولة
                </Button>
              </div>
              <FormInput
                label="ملاحظات"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <Button
                type="submit"
                className="w-full mt-4"
                disabled={updateTableMutation.isPending}
              >
                {updateTableMutation.isPending ? "جاري الحفظ ..." : "حفظ"}
              </Button>
            </form>
          </PopupForm>
        )}

        {!isLoading && tables?.length === 0 && (
          <p className="text-center text-gray-500 py-10">
            لا توجد طاولات حالياً — قم بإضافة طاولة جديدة.
          </p>
        )}
      </div>
    </DashboardLayout>
  );
}
