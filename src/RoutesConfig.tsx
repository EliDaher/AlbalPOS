import React from "react";
import { PrivateRoute } from "@/components/auth/PrivateRoute";
import SupplierDetails from "./pages/SupplierDetails";
import TableDetails from "./pages/TableDetails";

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


export const routesConfig = [
  { path: "/login", element: <Login /> },
  { path: "/signUp", element: <SignUp /> },
  { path: "/unauthorized", element: <UnauthorizedPage /> },
  { path: "/Products", element: <Products /> },
  { path: "/suppliers", element: <Suppliers /> },
  { path: "/Customers", element: <Customers /> },
  { path: "/inventory", element: <Inventory /> },
  { path: "/tables", element: <Tables /> },
  { path: "/tableDetails/:id", element: <TableDetails /> },
  {
    path: "/dashboard",
    element: (
      <PrivateRoute allowedRoles={["admin", "dealer"]}>
        <Dashboard />
      </PrivateRoute>
    ),
  },
  { path: "/productDetails", element: <ProductDetails /> },
  { path: "/SupplierDetails", element: <SupplierDetails /> },
  { path: "/customerDetails", element: <CustomerDetails /> },
  { path: "/Balance", element: <Balance /> },
  { path: "*", element: <NotFound /> },
];
