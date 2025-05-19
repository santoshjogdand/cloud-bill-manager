import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../Api";
import Cookies from 'js-cookie';

const Logout = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const logoutUser = async () => {
      try {
        localStorage.removeItem("authenticated");
        localStorage.clear()
        Cookies.remove("authenticated")
        // 🔹 Send logout request to backend to clear JWT cookie
        await API.post("logout");
        Cookies.remove("authenticated")
        
        // 🔹 Remove authentication status
        localStorage.removeItem("authenticated");
        localStorage.clear()
        // 🔹 Redirect to login page
        navigate("/login");
      } catch (error) {
        console.error("Logout failed!", error);
      }
    };

    logoutUser();
  }, [navigate]);

  return (
    <div className="flex justify-center items-center h-screen bg-blue-100">
      <div className="bg-gray-50 p-6 shadow-md rounded-md text-center">
        <h2 className="text-2xl font-bold mb-4">Logging out...</h2>
        <p className="text-gray-500">Please wait while we sign you out.</p>
      </div>
    </div>
  );
};

export default Logout;
