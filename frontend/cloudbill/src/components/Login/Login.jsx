import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { API } from "../../Api";
import SignupModal from "../Signup/Signup"; // Adjusted import path
import Cookies from "js-cookie";


const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showSignupModal, setShowSignupModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const response = await API.post("login", { email, password });
      if (response.data.statusCode === 200) {
        Cookies.set("authenticated",true, { expires: 1 })
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
            setError(""); // Clear error when user starts typing
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
            setError(""); // Clear error when user starts typing
          }}
          required
          autoComplete="current-password"
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 w-full rounded hover:bg-blue-600 transition"
          type="submit" // Remove onClick handler, as the form's onSubmit will handle it
        >
          Login
        </button>

        <p className="mt-2 text-sm text-center">
          Don't have an account? 
          <button 
            type="button"
            onClick={() => setShowSignupModal(true)}
            className="text-blue-600 ml-1 underline"
          >
            Sign up
          </button>
        </p>
      </form>

      {showSignupModal && <SignupModal onClose={() => setShowSignupModal(false)} />}
    </div>
  );
};

export default Login;