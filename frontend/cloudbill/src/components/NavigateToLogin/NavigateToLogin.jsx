import { Navigate } from "react-router-dom";

// Force logout on refresh
const NavigateToLogin = () => {
  localStorage.removeItem("authenticated"); // Clear authentication on refresh
  return <Navigate to="/login" />;
};

export default NavigateToLogin;
