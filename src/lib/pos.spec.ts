import { describe, expect, it } from "vitest";
import {
  calculatePaymentState,
  calculateOrderTotals,
  describeCustomerBalance,
  describeSupplierBalance,
  deriveOrderItemsFromProducts,
  mergeProductSelection,
  validatePaymentSelection,
} from "./pos";
import { InventoryItem, OrderProduct, Product } from "@/Types/POSTypes";

const inventory: InventoryItem[] = [
  {
    id: "i1",
    name: "دجاج",
    category: "لحوم",
    unit: "kg",
    quantity: 10,
    minQuantity: 2,
    costPerUnit: 100,
    sellPerUnit: 150,
    lastUpdated: "2026-01-01",
  },
  {
    id: "i2",
    name: "خبز",
    category: "مخبوزات",
    unit: "pcs",
    quantity: 20,
    minQuantity: 5,
    costPerUnit: 10,
    sellPerUnit: 15,
    lastUpdated: "2026-01-01",
  },
];

const product: Product = {
  id: "p1",
  name: "شاورما",
  category: "وجبات",
  cost: 120,
  price: 500,
  timesSold: 0,
  ingredients: [
    { itemId: "i1", itemName: "دجاج", quantity: 0.2 },
    { itemId: "i2", itemName: "خبز", quantity: 1 },
  ],
  available: true,
  createdAt: "2026-01-01",
};

describe("POS calculations", () => {
  it("merges repeated product selections and keeps line totals current", () => {
    const selected = mergeProductSelection([], product);
    const merged = mergeProductSelection(selected, product);

    expect(merged).toEqual([
      {
        productId: "p1",
        productName: "شاورما",
        quantity: 2,
        unitPrice: 500,
        total: 1000,
      },
    ]);
  });

  it("multiplies product quantities into ingredient stock deductions", () => {
    const selectedProducts: OrderProduct[] = [
      {
        productId: "p1",
        productName: "شاورما",
        quantity: 3,
        unitPrice: 500,
        total: 1500,
      },
    ];

    const items = deriveOrderItemsFromProducts(selectedProducts, [product], inventory);

    expect(items).toEqual([
      { itemId: "i1", itemName: "دجاج", quantity: 0.6000000000000001, price: 150, total: 90.00000000000001 },
      { itemId: "i2", itemName: "خبز", quantity: 3, price: 15, total: 45 },
    ]);
  });

  it("clamps discounts and partial payments to valid totals", () => {
    const totals = calculateOrderTotals({
      products: [
        {
          productId: "p1",
          productName: "شاورما",
          quantity: 2,
          unitPrice: 500,
          total: 1000,
        },
      ],
      discount: 1200,
      paidAmount: 2000,
    });

    expect(totals).toEqual({
      subTotal: 1000,
      discount: 1000,
      total: 0,
      paidAmount: 0,
      remainingAmount: 0,
    });
  });

  it("calculates cash, partial, and debt payment states consistently", () => {
    expect(
      calculatePaymentState({
        subTotal: 1000,
        discount: 100,
        mode: "cash",
      }),
    ).toMatchObject({
      total: 900,
      paidAmount: 900,
      remainingAmount: 0,
      status: "paid",
    });

    expect(
      calculatePaymentState({
        subTotal: 1000,
        mode: "part",
        paidAmount: 300,
      }),
    ).toMatchObject({
      total: 1000,
      paidAmount: 300,
      remainingAmount: 700,
      status: "partial",
    });

    expect(
      calculatePaymentState({
        subTotal: 1000,
        mode: "debt",
      }),
    ).toMatchObject({
      paidAmount: 0,
      remainingAmount: 1000,
      status: "unpaid",
    });
  });

  it("requires a related customer or supplier for partial and debt payments", () => {
    expect(
      validatePaymentSelection({
        mode: "part",
        total: 1000,
        paidAmount: 250,
      }),
    ).toBeTruthy();

    expect(
      validatePaymentSelection({
        mode: "debt",
        total: 1000,
      }),
    ).toBeTruthy();

    expect(
      validatePaymentSelection({
        mode: "cash",
        total: 1000,
      }),
    ).toBe("");
  });

  it("describes customer and supplier balances using the agreed ledger direction", () => {
    expect(describeCustomerBalance(-500)).toContain("عليه");
    expect(describeSupplierBalance(500)).toContain("له");
    expect(describeCustomerBalance(0)).toBeTruthy();
    expect(describeSupplierBalance(0)).toBeTruthy();
  });
});
