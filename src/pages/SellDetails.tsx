import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation, useNavigate } from "react-router-dom";
import { deleteSellById, getAllSellById, updateSellById } from "@/services/sells";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Loader2, Trash2, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function SellDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = location.state as string;

  const { data: sell, isLoading } = useQuery({
    queryKey: ["sell-details", id],
    queryFn: () => getAllSellById(id),
    enabled: !!id,
  });

  const [products, setProducts] = useState<any[]>([]);
  const [editingCell, setEditingCell] = useState<{ row: number; field: string } | null>(null);

  // بمجرد تحميل البيانات، خزّن المنتجات في state المحلي
  if (!isLoading && sell && products.length === 0) {
    setProducts(sell.products);
  }

  const updateSellMutation = useMutation({
    mutationFn: (data: any) => updateSellById(id, data),
    onSuccess: () => {
      alert("تم تحديث الفاتورة بنجاح");
      navigate(-1);
    },
    onError: (error) => {
      console.error(error);
      alert("حدث خطأ أثناء تحديث الفاتورة");
    }
  });
  
  const deleteSellMutation = useMutation({
    mutationFn: (data: any) => deleteSellById(id, data),
    onSuccess: () => {
      alert("تم حذف الفاتورة بنجاح");
      navigate(-1);
    },
    onError: (error) => {
      console.error(error);
      alert("حدث خطأ أثناء حذف الفاتورة");
    }
  });
    
  const handleDoubleClick = (rowIndex: number, field: string) => {
    setEditingCell({ row: rowIndex, field });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>, rowIndex: number, field: string) => {
    const updated = [...products];
    updated[rowIndex][field] = e.target.value;
    setProducts(updated);
  };

  const handleBlur = () => setEditingCell(null);

  const handleDelete = (rowIndex: number) => {
    setProducts(products.filter((_, i) => i !== rowIndex));
  };

  const handleSaveChanges = () => {
    updateSellMutation.mutate({
      id: sell.id,
      data: {products, balance: sell.totalPrice - products.reduce((acc, p) => acc + (p.sellPrice * p.qty), 0) },
    });
  };

  if (isLoading || !sell) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="animate-spin w-8 h-8 text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-6 max-w-5xl mx-auto">
        {/* 🧾 رأس الفاتورة */}
        <Card className="shadow-md">
          <CardHeader className="flex justify-between flex-row-reverse items-center gap-4">
            <Button onClick={() => navigate(-1)} className="w-24" variant="outline">
              <ArrowLeft className="ml-2 w-4 h-4" /> رجوع
            </Button>
            <CardTitle className="text-2xl font-semibold">تفاصيل الفاتورة</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-2">
              <div>
                <span className="text-muted-foreground">اسم الزبون:</span>
                <p className="font-medium">{sell.customerName}</p>
              </div>
              <div>
                <span className="text-muted-foreground">تاريخ العملية:</span>
                <p>{sell.date}</p>
              </div>
              <div>
                <span className="text-muted-foreground">العملة:</span>
                <p>{sell.currency || "غير محددة"}</p>
              </div>
              <div>
                <span className="text-muted-foreground">سعر الصرف:</span>
                <p>{sell.exchangeRate.toLocaleString()}</p>
              </div>
              <div>
                <span className="text-muted-foreground">حالة الدفع:</span>
                <Badge
                  variant={
                    sell.paymentStatus === "cash"
                      ? "default"
                      : sell.paymentStatus === "part"
                      ? "secondary"
                      : "destructive"
                  }
                >
                  {sell.paymentStatus === "cash"
                    ? "مدفوع"
                    : sell.paymentStatus === "part"
                    ? "مدفوع جزئياً"
                    : "دين"}
                </Badge>
              </div>
              <div>
                <Button 
                  variant="destructive"
                  onClick={()=>{
                    deleteSellMutation.mutate({
                      id: sell.id,
                      data: {products, balance: sell.totalPrice - products.reduce((acc, p) => acc + (p.sellPrice * p.qty), 0) },
                    })
                  }}
                >
                  حذف
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 📦 جدول المنتجات */}
        <Card className="shadow-md">
          <CardHeader className="flex justify-between items-center">
            <CardTitle className="text-xl font-semibold">المنتجات المباعة</CardTitle>
            <Button variant="outline" onClick={handleSaveChanges}>
              <Save className="ml-2 w-4 h-4" /> حفظ التعديلات
            </Button>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-right">المنتج</TableHead>
                  <TableHead className="text-right">الكود</TableHead>
                  <TableHead className="text-right">السعر</TableHead>
                  <TableHead className="text-right">الكمية</TableHead>
                  <TableHead className="text-right">الإجمالي</TableHead>
                  <TableHead className="text-center">إجراء</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p, idx) => (
                  <TableRow key={idx}>
                    <TableCell className="text-right">
                      {p.name || "-"}
                    </TableCell>
                    <TableCell className="text-right">
                      {p.code || "-"}
                    </TableCell>
                    {["sellPrice", "qty"].map((field) => (
                      <TableCell
                        key={field}
                        onDoubleClick={() => handleDoubleClick(idx, field)}
                        className="cursor-pointer"
                      >
                        {editingCell?.row === idx && editingCell?.field === field ? (
                          <input
                            autoFocus
                            type={field === "qty" || field === "sellPrice" ? "number" : "text"}
                            value={p[field]}
                            onChange={(e) => handleChange(e, idx, field)}
                            onBlur={handleBlur}
                            className="w-full border rounded px-1 text-right"
                          />
                        ) : (
                          p[field]
                        )}
                      </TableCell>
                    ))}
                    <TableCell className="text-right">
                      {(p.sellPrice * p.qty).toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDelete(idx)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* 💰 ملخص الفاتورة */}
        <Card className="shadow-md">
          <CardContent className="space-y-2 pt-4">
            <div className="flex justify-between">
              <span>المجموع:</span>
              <span className="font-medium">
                {sell.totalPrice.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between">
              <span>المدفوع:</span>
              <span className="font-medium">
                {sell.partValue.toLocaleString()}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-semibold">
              <span>المتبقي:</span>
              <span
                className={
                  sell.remainingDebt > 0 ? "text-red-600" : "text-green-600"
                }
              >
                {sell.remainingDebt.toLocaleString()}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
