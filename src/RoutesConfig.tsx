import React from "react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import SupplierDetails from "./pages/SupplierDetails";
import TableDetails from "./pages/TableDetails";
import InventoryDetails from "./pages/InventoryItemDetails";

// Lazy Loading للصفحات
const Products = React.lazy(() => import("@/pages/Products"));
const Dashboard = React.lazy(() => import("@/pages/Dashboard"));
const NotFound = React.lazy(() => import("@/pages/NotFound"));
const Login = React.lazy(() => import("@/pages/Login"));
const SignUp = React.lazy(() => import("@/pages/SignUp"));
const Suppliers = React.lazy(() => import("@/pages/Suppliers"));
const Customers = React.lazy(() => import("@/pages/Customers"));
const UnauthorizedPage = React.lazy(() => import("@/pages/Unauthorized"));
const ProductDetails = React.lazy(() => import("@/pages/ProductDetails"));
const CustomerDetails = React.lazy(() => import("@/pages/CustomerDetails"));
const Inventory = React.lazy(() => import("@/pages/Inventory"));
const Tables = React.lazy(() => import("@/pages/Tables"));
const Balance = React.lazy(() => import("@/pages/Balance"));

const adminOnly = ["admin"];
const cashierRoles = ["admin", "dealer"];
const protect = (element: React.ReactNode, allowedRoles = adminOnly) => (
  <PrivateRoute allowedRoles={allowedRoles}>{element}</PrivateRoute>
);

export const routesConfig = [
  { path: "/login", element: <Login /> },
  { path: "/signUp", element: <SignUp /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/", element: protect(<Dashboard />, cashierRoles) },
  { path: "/Products", element: protect(<Products />) },
  { path: "/products", element: protect(<Products />) },
  { path: "/suppliers", element: protect(<Suppliers />) },
  { path: "/Customers", element: protect(<Customers />, cashierRoles) },
  { path: "/customers", element: protect(<Customers />, cashierRoles) },
  { path: "/inventory", element: protect(<Inventory />) },
  { path: "/tables", element: protect(<Tables />, cashierRoles) },
  { path: "/tableDetails/:id", element: protect(<TableDetails />, cashierRoles) },
  {
    path: "/dashboard",
    element: protect(<Dashboard />, cashierRoles),
  },
  { path: "/productDetails", element: protect(<ProductDetails />) },
  { path: "/inventoryDetails", element: protect(<InventoryDetails />) },
  { path: "/SupplierDetails", element: protect(<SupplierDetails />) },
  { path: "/customerDetails", element: protect(<CustomerDetails />, cashierRoles) },
  { path: "/Balance", element: protect(<Balance />) },
  { path: "/balance", element: protect(<Balance />) },
  { path: "*", element: <NotFound /> },
];
