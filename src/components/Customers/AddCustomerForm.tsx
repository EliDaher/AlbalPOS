import React from "react";
import PopupForm from "../ui/custom/PopupForm";
import { Button } from "../ui/button";
import FormInput from "../ui/custom/FormInput";
import getAllCustomer, { addCustomer } from "@/services/customers";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { DataTable } from "../dashboard/DataTable";

export default function CustomerSelect({
  isOpen,
  setIsOpen,
  className,
  customerId,
  setCustomerId,
}) {
  const [customerName, setCustomerName] = React.useState("");
  const [customerNumber, setCustomerNumber] = React.useState("");
  const queryClient = useQueryClient();

  const { data: customers, isLoading: customersLoading } = useQuery({
    queryKey: ["customers-table"],
    queryFn: getAllCustomer,
  });

  const customersColumns = [
    { key: "id", label: "الرمز", sortable: true, hidden: true },
    { key: "name", label: "الاسم", sortable: true },
    { key: "phone", label: "الرقم", sortable: true },
  ];

  const addCustomerMutation = useMutation({
    mutationFn: (newCustomer: any) =>
      addCustomer({ ...newCustomer, balance: 0 }),
    onSuccess: () => {
      setCustomerName("");
      setCustomerNumber("");

      queryClient.invalidateQueries({
        queryKey: ["customers-table"],
      });
    },
    onError: (error) => {
      console.error(error);
      alert("حدث خطأ أثناء إضافة الزبون");
    },
  });

  return (
    <PopupForm
      title="اختيار الزبون"
      isOpen={isOpen}
      setIsOpen={setIsOpen}
      trigger={
        <Button
          type="button"
          variant="default"
          className={`w-full ${className}`}
        >
          {!customerId ? "اختيار الزبون" : customerName}
        </Button>
      }
    >
      <DataTable
        title=""
        pageSizeOptions={[3]}
        defaultPageSize={3}
        onRowClick={(row) => {
          setCustomerId(row.id);
          setCustomerName(row.name);
          setIsOpen(false);
        }}
        columns={customersColumns}
        data={customers ? customers : []} /*loading={suppliersLoading}*/
      />
      <form action="" className="space-y-4">
        <FormInput
          id="customer-name"
          label="اسم الزبون"
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
        />
        <FormInput
          type="number"
          id="customer-number"
          label="رقم الزبون"
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
        />

        <Button
          onClick={(e) => {
            e.preventDefault();
            if (!customerName || !customerNumber) {
              alert("يرجى ملء جميع الحقول");
              return;
            } else {
              addCustomerMutation.mutate({
                name: customerName,
                number: customerNumber,
              });
            }
          }}
          className="w-full"
          disabled={addCustomerMutation.isPending}
        >
          {addCustomerMutation.isPending ? "جاري الإضافة..." : "اضافة"}
        </Button>
      </form>
    </PopupForm>
  );
}
