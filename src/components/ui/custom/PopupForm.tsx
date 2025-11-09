import React, { useState, ReactNode } from "react";
import { X } from "lucide-react";

type PopupFormProps = {
  title?: string;
  trigger: ReactNode;
  children: ReactNode;
  isOpen: any;
  setIsOpen: any;
};

export default function PopupForm({ title = "نموذج", trigger, children, isOpen, setIsOpen }: PopupFormProps) {

  return (
    <>
      {/* الزر المحفز */}
      <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
        {trigger}
      </div>

      {/* الخلفية والنموذج */}
      {isOpen && (
        <>
          {/* الخلفية المظللة */}
          <div
            className="fixed inset-0 bg-black/50 z-50"
            onClick={() => setIsOpen(false)}
          />

          {/* محتوى البوب أب */}
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl p-6 relative animate-fade-in">
              <div className="flex flex-row-reverse justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-800">{title}</h2>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-red-500 transition"
                  aria-label="إغلاق"
                >
                  <X size={24} />
                </button>
              </div>

              {/* الحقول أو أي عناصر أخرى */}
              <div className="space-y-4">{children}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
