import React from "react";
import * as Tooltip from "@radix-ui/react-tooltip";
import clsx from "clsx";

export default function TopTable({
  chairsPerSide = 2,
  state = "available",
  tableNumber = 1,
  tableName = "",
  location = "",
}: {
  chairsPerSide?: number;
  state?: any;
  tableNumber?: number;
  tableName?: string;
  location?: string;
}) {
  const chairArray = Array.from({ length: chairsPerSide });
  const tableHeight = chairsPerSide * 20 + 40;

  // 🎨 لون الطاولة حسب الحالة
  const tableColor =
    state === "available"
      ? "bg-green-100 border-green-600"
      : state === "occupied"
        ? "bg-red-100 border-red-600"
        : state === "reserved"
          ? "bg-yellow-100 border-yellow-500"
          : "bg-gray-200 border-gray-500";

  // 🏷️ ترجمة الحالة
  const getStateLabel = (s: string) => {
    switch (s) {
      case "available":
        return "متاحة";
      case "occupied":
        return "مشغولة";
      case "reserved":
        return "محجوزة";
      case "closed":
        return "مغلقة";
      default:
        return s;
    }
  };

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <div className="flex items-center justify-center cursor-pointer hover:scale-105 transition-transform duration-300">
            {/* 🪑 الطاولة */}
            <div
              className={clsx(
                "relative flex items-center justify-center rounded-xl shadow-md border-2",
                tableColor,
              )}
              style={{ width: "96px", height: `${tableHeight}px` }}
            >
              {/* رقم الطاولة */}
              <span className="absolute text-2xl font-bold text-gray-800">
                {tableName || `#${tableNumber}`}
              </span>

              {/* الكراسي اليسار */}
              {chairArray.map((_, i) => {
                const spacing = 100 / (chairsPerSide + 1);
                return (
                  <div
                    key={`left-${i}`}
                    className="absolute w-3 h-6 bg-gray-700 rounded-md"
                    style={{
                      left: "-12px",
                      top: `${spacing * (i + 1)}%`,
                      transform: "translateY(-50%)",
                    }}
                  ></div>
                );
              })}

              {/* الكراسي اليمين */}
              {chairArray.map((_, i) => {
                const spacing = 100 / (chairsPerSide + 1);
                return (
                  <div
                    key={`right-${i}`}
                    className="absolute w-3 h-6 bg-gray-700 rounded-md"
                    style={{
                      right: "-12px",
                      top: `${spacing * (i + 1)}%`,
                      transform: "translateY(-50%)",
                    }}
                  ></div>
                );
              })}
            </div>
          </div>
        </Tooltip.Trigger>

        {/* 💬 Tooltip - معلومات الطاولة */}
        <Tooltip.Portal>
          <Tooltip.Content
            className="rounded-lg bg-gray-900 px-3 py-2 text-sm text-white shadow-lg space-y-1 text-right z-50"
            side="top"
            sideOffset={5}
          >
            <div>
              <strong>الطاولة:</strong> {tableName || `#${tableNumber}`}
            </div>
            {location && (
              <div>
                <strong>الموقع:</strong> {location}
              </div>
            )}
            <div>
              <strong>الحالة:</strong> {getStateLabel(state)}
            </div>
            <div>
              <strong>عدد المقاعد/جهة:</strong> {chairsPerSide}
            </div>
            <Tooltip.Arrow className="fill-gray-900" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
