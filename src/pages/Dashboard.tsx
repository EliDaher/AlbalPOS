import { StatsCard } from "@/components/dashboard/StatsCard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import TopTable from "@/components/Tables/TopTable";
import getAllSupplier from "@/services/supplier";
import { useQuery } from "@tanstack/react-query";
import dayjs from "dayjs";
import { Armchair, ArrowDown } from "lucide-react";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenPay, setIsOpenPay] = useState(false);
  const [balanceDate, setBalanceDate] = useState<{
    month: string;
    year: string;
  }>({
    month: dayjs().format("M"),
    year: "2025",
  });

  const { data: supplier, isLoading: supplierLoading } = useQuery({
    queryKey: ["supplier-table"],
    queryFn: getAllSupplier,
  });

  return (
    <DashboardLayout>
      <div className="space-y-4">
        <div dir="rtl" className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            onClick={() => {}}
            title="إجمالي المقبوضات"
            description={`اليوم: ${100000}`}
            value={0 || 0}
            icon={ArrowDown}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
