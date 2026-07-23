import { ReactNode } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type PopupFormProps = {
  title?: string;
  trigger?: ReactNode;
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
      {trigger && (
        <div onClick={() => setIsOpen(true)} className="inline-block cursor-pointer">
          {trigger}
        </div>
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/50"
              onClick={() => setIsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <motion.div
              className="fixed inset-0 z-50 flex items-center justify-center px-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <motion.div
                dir="rtl"
                className="relative w-full max-w-lg rounded-lg border bg-card p-6 shadow-xl"
                initial={{ scale: 0.96, y: 24, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.96, y: 24, opacity: 0 }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                onClick={(event) => event.stopPropagation()}
              >
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-foreground">{title}</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="text-muted-foreground transition hover:text-destructive"
                    aria-label="إغلاق"
                  >
                    <X size={22} />
                  </button>
                </div>

                <div className="max-h-[80vh] space-y-4 overflow-y-auto p-1">
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
