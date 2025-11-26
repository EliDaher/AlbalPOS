export interface Supplier {
  id?: string; //s1,
  name: string; //شركة الأرزاق الغذائية,
  phone: string; //0934111222,
  balance: number; //توريد أسبوعي للدجاج والخبز,
  notes: string; //توريد أسبوعي للدجاج والخبز,
  createdAt?: string; //2025-10-09T10:00:00Z
}

export interface Payment {
  id?: string;
  invoiceId?: string;
  type: "purchase" | "sale";
  relatedId: string;
  amount: number;
  method: string;
  date: string;
  note: string;
  createdBy: string;
}

export interface InventoryItem {
  id?: string; // "i1",
  name: string; // "دجاج",
  category: string; //"لحوم"
  unit: string; // "kg",
  quantity: number; // 10,
  minQuantity: number; // 2,
  costPerUnit: number; // 20000,
  sellPerUnit: number;
  lastUpdated: string;
}

export interface InventoryLog {
  id?: string; // "log1",
  itemId?: string; // "i1",
  type: "in" | "out" | "adjust";
  quantity: number; // 2,
  reason: string; // "تحضير وجبة شاورما",
  relatedOrderId?: string; // "o12",
  createdAt?: string;
}

export interface invoiceData {
  id?: string; //inv1,
  type: "purchase" | "purchase" | "sale";
  relatedId: string; //s1, // supplierId أو customerId حسب النوع
  items: [
    {
      itemId?: string; //i1,
      quantity: number; //5,
      cost: number; //100000
    },
  ];
  subTotal: number; //109000,
  discount: number; //0,
  total: number; //109000,
  paidAmount: number; //50000,
  remainingAmount: number; //59000,
  status: "unpaid" | "partial" | "paid";
  paymentMethod: string; //bank transfer,
  dueDate: string; //2025-10-20,
  notes: string; //دفعة ثانية بعد أسبوع,
  createdBy: string; //u1,
  createdAt?: string; //"2025-10-13T12:00:00Z"
}

export interface customer {
  id?: string; //s1,
  name: string; //شركة الأرزاق الغذائية,
  phone: string; //0934111222,
  balance: number; //توريد أسبوعي للدجاج والخبز,
  notes: string; //توريد أسبوعي للدجاج والخبز,
  createdAt?: string; //2025-10-09T10:00:00Z
}

export interface OrderItem {
  itemId: string; // "p1",
  itemName: string;
  quantity: number; // 2,
  price: number; // 4500,
  total: number;
}

export interface OrderProducts {
  productId: string;
  productName: string;
  quantity: number;
  total: number;
}

export interface Order {
  id?: string;
  tableId?: string | null;
  type: "dine-in" | "takeaway" | "delivery";
  items: OrderItem[];
  products: OrderProducts[];
  subTotal: number;
  discount: number;
  tax: number;
  total: number;
  status: "open" | "paid" | "cancelled";
  paymentMethod: string;
  createdBy: string;
  notes?: string;
  customerName?: string;
  createdAt: string;
  updatedAt: string;
  closedBy?: string;
}

export interface Table {
  id?: string; // "t1"
  name: string; // "طاولة 1"
  status: "available" | "occupied" | "reserved" | "closed";
  currentOrderId?: string; // "o12"
  capacity: number;
  location?: string;
  createdAt?: string;
}

export interface Product {
  id?:  string; // "p1",
  name: string; // "شاورما دجاج",
  category: string; // "وجبات",
  imageUrl?: string; //"/images/products/shawarma.jpg"
  prepTime?: number;
  cost: number; // 2500,
  price: number; // 4500,
  timesSold: number; //125
  ingredients:
    {
      itemId: string; // "i1",
      itemName: string;
      quantity: number; // 0.1
    }[];
  available: boolean; //true,
  createdAt: string;
}
