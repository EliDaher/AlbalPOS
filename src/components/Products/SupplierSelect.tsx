import React from "react";
import PopupForm from "../ui/custom/PopupForm";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import getAllSupplier, { addSupplier } from "@/services/supplier";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "../dashboard/DataTable";

type SupplierSelectProps = {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  supplierId: string | number | null;
  setSupplierId: any;
  className?: string;
  withDataTable?: boolean;
};

export default function SupplierSelect({
  isOpen,
  setIsOpen,
  supplierId,
  setSupplierId,
  className,
  withDataTable,
}: SupplierSelectProps) {
  const [supplierName, setSupplierName] = React.useState("");
  const [supplierNumber, setSupplierNumber] = React.useState("");
  const queryClient = useQueryClient();

  const addSupplierMutation = useMutation({
    mutationFn: (newSupplier: any) =>
      addSupplier({ ...newSupplier, balance: 0 }),
    onSuccess: () => {
      setSupplierName("");
      setSupplierNumber("");

      !withDataTable && setIsOpen(false);

      queryClient.invalidateQueries({
        queryKey: ["suppliers-table"],
      });
    },
    onError: (error) => {
      console.error(error);
      alert("حدث خطأ أثناء إضافة المورد");
    },
  });

  const { data: suppliers, isLoading: suppliersLoading } = useQuery({
    queryKey: ["suppliers-table"],
    queryFn: getAllSupplier,
  });

  const supplierColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "phone", label: "الرقم", sortable: true },
  ];

  return (
    <PopupForm
      title="اختيار البائع"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={
        <Button
          type="button"
          variant="outline"
          className={`w-full ${className}`}
        >
          {!supplierId ? "اختيار المورد" : supplierName}
        </Button>
      }
    >
      {withDataTable && (
        <DataTable
          title=""
          pageSizeOptions={[3]}
          defaultPageSize={3}
          onRowClick={(row) => {
            setSupplierId(row.id);
            setSupplierName(row.name);
            setIsOpen(false);
          }}
          columns={supplierColumns}
          data={suppliers ? suppliers : []} /*loading={suppliersLoading}*/
        />
      )}
      <form
        className="space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <FormInput
          id="supplier-name"
          label="اسم المورد"
          value={supplierName}
          onChange={(e) => setSupplierName(e.target.value)}
        />
        <FormInput
          type="number"
          id="supplier-number"
          label="رقم المورد"
          value={supplierNumber}
          onChange={(e) => setSupplierNumber(e.target.value)}
        />

        <Button type="submit" onClick={()=>{
          if (!supplierName || !supplierNumber) {
            alert("يرجى ملء جميع الحقول");
            return;
          }
          addSupplierMutation.mutate({
            name: supplierName,
            number: supplierNumber,
          });
        }} className="w-full">
          {addSupplierMutation.isPending ? "جاري الإضافة..." : "اضافة"}
        </Button>
      </form>
    </PopupForm>
  );
}
