import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { API } from "../../Api";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(""); // Store error message
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault(); // ✅ Prevent default form refresh

    try {
      console.log("Submitting login request..."); // ✅ Debugging log

      // 🔹 Send login request
      const response = await API.post("login", { email, password });

      console.log("Response status:", response.status); // ✅ Debugging log

      if (response.status === 200) {
        // ✅ Store authentication status
        localStorage.setItem("authenticated", "true");
        const data = response.data.data
        console.log(data)
              // ✅ Store organization details in localStorage
      localStorage.setItem("orgId", data._id);
      localStorage.setItem("orgName", data.name);
      localStorage.setItem("orgEmail", data.email);
      localStorage.setItem("orgPhone", JSON.stringify(data.phone)); // Convert array to string
      localStorage.setItem("ownerName", data.ownername);
      localStorage.setItem("orgAddress", JSON.stringify(data.address)); // Store full address as JSON
      localStorage.setItem("GSTNumber", data.GSTIN); // Key contains spaces, use bracket notation
      localStorage.setItem("orgWebsite", data.website);
      localStorage.setItem("orgCategory", data.category);
      localStorage.setItem("orgDescription", data.description);
      localStorage.setItem("orgCurrency", data.currency);
      localStorage.setItem("orgTerms", JSON.stringify(data.terms_conditions)); // Convert array to string
      localStorage.setItem("invoicePrefix", data.invoicePrefix);

        // ✅ Redirect to home page
        navigate("/home");
      }
    } catch (error) {
      console.error("Login error:", error); // ✅ Debugging log

      // ❌ Handle error more effectively
      if (error.response) {
        setError(error.response.data.message || "Login failed!");
      } else {
        setError("Network error! Please try again.");
      }
    }
  };

  return (
    <div className="flex justify-center items-center h-screen bg-blue-100">
      <form onSubmit={handleLogin} className="bg-gray-50 p-6 shadow-md rounded-md">
        <h2 className="text-2xl font-bold mb-4">Login</h2>

        {error && <p className="text-red-500 mb-2">{error}</p>} {/* Show error */}

        <input
          type="email"
          name="email" // ✅ Helps browser remember input
          placeholder="Email"
          className="border p-2 mb-2 w-full"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />

        <input
          type="password"
          name="password" // ✅ Helps browser save password
          placeholder="Password"
          className="border p-2 mb-2 w-full"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          autoComplete="current-password"
        />

        <button
          className="bg-blue-500 text-white px-4 py-2 w-full"
          type="submit"
          onClick={() => console.log("Login button clicked")} // ✅ Debugging click event
        >
          Login
        </button>

        <p className="mt-2 text-sm">
          Don't have an account? <a href="/signup" className="text-blue-600">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
