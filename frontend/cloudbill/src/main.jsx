import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import Home from './components/Home/Home.jsx';
import Customers from './components/Customers/Customers.jsx';
import Payments from './components/Payments/Payments.jsx';
import Sales from './components/Sales/Sales.jsx';
import About from './components/About/About.jsx';
import Inventory from './components/Inventory/Inventory.jsx';
import Invoice from './components/Invoice/Invoice.jsx';
import Signup from './components/Signup/Signup.jsx';
import Login from "./components/Login/Login.jsx";
import ProtectedRoute from './components/ProtectedRoute/ProtectedRoute.jsx';
import NavigateToLogin from './components/NavigateToLogin/NavigateToLogin.jsx';
import Logout from './components/Logout/Logout.jsx';

const router = createBrowserRouter([
  { path: "/", element: <Login />  }, // Only logged-in users can access Home
  { path: "/home", element: <ProtectedRoute><Home /></ProtectedRoute> }, // Only logged-in users can access Home
  { path: "/customers", element: <ProtectedRoute><Customers /></ProtectedRoute> },
  { path: "/payments", element: <ProtectedRoute><Payments /></ProtectedRoute> },
  { path: "/invoice", element: <ProtectedRoute><Invoice /></ProtectedRoute> },
  { path: "/sales", element: <ProtectedRoute><Sales /></ProtectedRoute> },
  { path: "/inventory", element: <ProtectedRoute><Inventory /></ProtectedRoute> },
  { path: "/about", element: <ProtectedRoute><About /></ProtectedRoute> },
  { path: "/login", element: <Login /> },
  { path: "/logout", element: <ProtectedRoute><Logout /></ProtectedRoute>}
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>
);
