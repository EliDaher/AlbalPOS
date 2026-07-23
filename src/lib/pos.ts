import {
  InventoryItem,
  InvoiceStatus,
  OrderItem,
  OrderProduct,
  PaymentMode,
  Product,
} from "@/Types/POSTypes";

export function formatCurrency(value: number | string | undefined) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ar-SY", {
    numberingSystem: "latn",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(value: number | string | undefined, maximumFractionDigits = 2) {
  const amount = Number(value || 0);
  return new Intl.NumberFormat("ar-SY", {
    numberingSystem: "latn",
    maximumFractionDigits,
  }).format(amount);
}

export function formatDateTime(value: string | number | Date | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("ar-SY-u-nu-latn");
}

export function formatMonthLabel(value: string | number | Date | undefined) {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "-";
  return parsed.toLocaleString("ar-SY-u-nu-latn", {
    month: "short",
    year: "2-digit",
  });
}

export function getProductUnitPrice(product: Product | OrderProduct) {
  return "price" in product ? Number(product.price || 0) : Number(product.unitPrice || product.total || 0);
}

export function mergeProductSelection(products: OrderProduct[], product: Product): OrderProduct[] {
  const unitPrice = getProductUnitPrice(product);
  const existing = products.find((item) => item.productId === product.id);
  if (existing) {
    return products.map((item) =>
      item.productId === product.id
        ? { ...item, quantity: item.quantity + 1, total: unitPrice * (item.quantity + 1) }
        : item,
    );
  }

  return [
    ...products,
    {
      productId: product.id || "",
      productName: product.name,
      quantity: 1,
      unitPrice,
      total: unitPrice,
    },
  ];
}

export function deriveOrderItemsFromProducts(
  products: OrderProduct[],
  menu: Product[] = [],
  inventory: InventoryItem[] = [],
): OrderItem[] {
  const byItemId = new Map<string, OrderItem>();

  for (const selectedProduct of products) {
    const product = menu.find((item) => item.id === selectedProduct.productId);
    if (!product) continue;

    for (const ingredient of product.ingredients || []) {
      const stockItem = inventory.find((item) => item.id === ingredient.itemId);
      const quantity = Number(ingredient.quantity || 0) * Number(selectedProduct.quantity || 0);
      const price = Number(stockItem?.sellPerUnit || 0);
      const current = byItemId.get(ingredient.itemId);

      if (current) {
        const nextQuantity = current.quantity + quantity;
        byItemId.set(ingredient.itemId, {
          ...current,
          quantity: nextQuantity,
          total: nextQuantity * current.price,
        });
      } else {
        byItemId.set(ingredient.itemId, {
          itemId: ingredient.itemId,
          itemName: ingredient.itemName || stockItem?.name || "مكون غير معروف",
          quantity,
          price,
          total: price * quantity,
        });
      }
    }
  }

  return Array.from(byItemId.values());
}

export function calculateOrderTotals({
  products,
  discount = 0,
  paidAmount = 0,
}: {
  products: OrderProduct[];
  discount?: number;
  paidAmount?: number;
}) {
  const subTotal = products.reduce(
    (sum, item) => sum + getProductUnitPrice(item) * Number(item.quantity || 0),
    0,
  );
  const normalizedDiscount = Math.min(Math.max(Number(discount || 0), 0), subTotal);
  const total = Math.max(subTotal - normalizedDiscount, 0);
  const normalizedPaid = Math.min(Math.max(Number(paidAmount || 0), 0), total);

  return {
    subTotal,
    discount: normalizedDiscount,
    total,
    paidAmount: normalizedPaid,
    remainingAmount: total - normalizedPaid,
  };
}

export function calculatePaymentState({
  subTotal,
  discount = 0,
  mode,
  paidAmount = 0,
}: {
  subTotal: number;
  discount?: number;
  mode: PaymentMode;
  paidAmount?: number;
}) {
  const normalizedSubTotal = Math.max(Number(subTotal || 0), 0);
  const normalizedDiscount = Math.min(
    Math.max(Number(discount || 0), 0),
    normalizedSubTotal,
  );
  const total = Math.max(normalizedSubTotal - normalizedDiscount, 0);
  const paid =
    mode === "cash"
      ? total
      : mode === "debt"
        ? 0
        : Math.min(Math.max(Number(paidAmount || 0), 0), total);
  const remainingAmount = Math.max(total - paid, 0);
  const status: InvoiceStatus =
    remainingAmount === 0 ? "paid" : paid > 0 ? "partial" : "unpaid";

  return {
    subTotal: normalizedSubTotal,
    discount: normalizedDiscount,
    total,
    paidAmount: paid,
    remainingAmount,
    status,
  };
}

export function validatePaymentSelection({
  mode,
  total,
  paidAmount = 0,
  relatedId,
}: {
  mode: PaymentMode;
  total: number;
  paidAmount?: number;
  relatedId?: string;
}) {
  if ((mode === "debt" || mode === "part") && !relatedId) {
    return "يجب اختيار زبون/مورد عند الدفع الجزئي أو الدين";
  }
  if (mode === "part" && (paidAmount <= 0 || paidAmount >= total)) {
    return "الدفعة الجزئية يجب أن تكون أكبر من صفر وأقل من الإجمالي";
  }
  return "";
}

export function describeCustomerBalance(balance: number) {
  if (balance < 0) return `عليه ${formatCurrency(Math.abs(balance))}`;
  if (balance > 0) return `له ${formatCurrency(balance)}`;
  return "متوازن";
}

export function describeSupplierBalance(balance: number) {
  if (balance > 0) return `له ${formatCurrency(balance)}`;
  if (balance < 0) return `مدفوع زيادة ${formatCurrency(Math.abs(balance))}`;
  return "متوازن";
}
