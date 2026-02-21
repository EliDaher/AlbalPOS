import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PopupFormProps = {
  title?: string;
  trigger: ReactNode;
  children: ReactNode;
  isOpen: boolean;
  setIsOpen: (value: boolean) => void;
};

export default function PopupForm({
  title = "نموذج",
  trigger,
  children,
  isOpen,
  setIsOpen,
}: PopupFormProps) {
  return (
    <>
      {/* الزر المحفز */}
      <div
        onClick={() => setIsOpen(true)}
        className="inline-block cursor-pointer"
      >
        {trigger}
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* الخلفية */}
            <motion.div
              className="fixed inset-0 bg-black/50 z-50"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* محتوى البوب أب */}
            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                className="bg-gradient-to-bl from-primary-100 to-primary-50 w-full max-w-lg rounded-2xl shadow-xl p-6 relative"
                initial={{ scale: 0.9, y: 40, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, y: 40, opacity: 0 }}
                transition={{ duration: 0.25, ease: "easeOut" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex flex-row justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-foreground">
                    {title}
                  </h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-red-500 transition"
                    aria-label="إغلاق"
                  >
                    <X size={24} />
                  </button>
                </div>

                {/* المحتوى */}
                <div className="space-y-4 p-1 max-h-[80vh] overflow-y-auto">
                  {children}
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
