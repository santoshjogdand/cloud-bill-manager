import { Navigate } from "react-router-dom";
import Cookies from "js-cookie"

const ProtectedRoute = ({ children }) => {
    const isAuthenticated= Cookies.get("authenticated")
  // const isAuthenticated = localStorage.getItem("authenticated") === "true";
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};


export default ProtectedRoute;
