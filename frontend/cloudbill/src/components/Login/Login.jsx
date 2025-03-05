import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../Api";
import SignupModal from "../Signup/Signup";
import ForgotPasswordModal from "../ForgotPassword/ForgotPassword"; // New import
import Cookies from "js-cookie";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const [showForgotPasswordModal, setShowForgotPasswordModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("login", { email, password });
      
      console.log(response.data)
if (response.data.statusCode === 200) {
  Cookies.set("authenticated",true, { expires: 1 })
  // Store organization details in localStorage
  localStorage.setItem("orgName", response.data.data.name || "");
  localStorage.setItem("orgEmail", response.data.data.email || "");
  
  // For items that might be objects or arrays, use JSON.stringify
  localStorage.setItem("orgPhone", JSON.stringify(response.data.data.phone || []));
  localStorage.setItem("ownerName", response.data.data.ownername || "");
  localStorage.setItem("orgAddress", JSON.stringify(response.data.data.address || {}));
  
  localStorage.setItem("GSTNumber", response.data.data.GSTIN || "");
  localStorage.setItem("orgWebsite", response.data.data.website || "");
  localStorage.setItem("orgCategory", response.data.data.category || "");
  localStorage.setItem("orgDescription", response.data.data.description || "");
  localStorage.setItem("orgCurrency", response.data.data.currency || "");
  
  // For terms, ensure it's stringified
  localStorage.setItem("orgTerms", JSON.stringify(response.data.data.terms_conditions || []));
  localStorage.setItem("invoicePrefix", response.data.data.invoicePrefix || "");

  // Navigate to home page
  navigate("/home");
}
    } catch (error) {
      console.log(error)
      setError(error.response?.data?.message || "Login failed!");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-100 px-4">
      <form 
        onSubmit={handleLogin} 
        className="bg-white p-6 shadow-md rounded-md w-full max-w-sm"
      >
        <h2 className="text-2xl font-bold text-center mb-4">Login</h2>

        {error && <p className="text-red-500 mb-2 text-center">{error}</p>}

        <input
          type="email"
          name="email"
          placeholder="Email"
          className="border p-2 mb-2 w-full rounded"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(""); 
          }}
          required
          autoComplete="email"
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          className="border p-2 mb-2 w-full rounded"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(""); 
          }}
          required
          autoComplete="current-password"
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600 transition"
          type="submit"
        >
          Login
        </button>

        <div className="flex justify-between mt-2 text-sm">
          <button 
            type="button"
            onClick={() => setShowForgotPasswordModal(true)}
            className="text-blue-600 underline"
          >
            Forgot Password?
          </button>
          <button 
            type="button"
            onClick={() => setShowSignupModal(true)}
            className="text-blue-600 underline"
          >
            Sign up
          </button>
        </div>
      </form>

      {showSignupModal && <SignupModal onClose={() => setShowSignupModal(false)} />}
      {showForgotPasswordModal && <ForgotPasswordModal onClose={() => setShowForgotPasswordModal(false)} />}
    </div>
  );
};

export default Login;