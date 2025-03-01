import React, { useState, useEffect, useRef } from 'react';
import { API } from "../../Api.js";
import Header from '../Header/Header';
import { X } from 'lucide-react';


const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: "", email: "", phone: "", address: "" });
  const [isAdding, setIsAdding] = useState(false);
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const searchRef = useRef(null);

  const clearSearch = () => {
    setSearchQuery("");
    setSearchResults([]);
  };


  const searchCustomers = () => {
    if (searchQuery.trim() === "") {
      setSearchResults([]);
      return;
    }
    API.post("/Customers", { customerName: searchQuery })
      .then(response => setSearchResults(response.data.data.Customers))
      .catch(() => showPopup("Error fetching search results.", "error"));
  };

  const handleSearchSelect = (customer) => {
    setSelectedCustomer(customer);
    setSearchQuery(customer.name);
    setSearchResults([]);
  };

  useEffect(() => {
    fetchCustomers();
  }, []);
  useEffect(() => {
    if (selectedCustomer) {
      setFormData({
        name: selectedCustomer.name || "",
        email: selectedCustomer.email || "",
        phone: selectedCustomer.phone || "",
        address: selectedCustomer.address || ""
      });
    }
  }, [selectedCustomer]);

  useEffect(() => {
    if (isAdding) {
      setFormData({
        name: "",
        email: "",
        phone: "",
        address: ""
      });
    }
  }, [isAdding]);

  const showPopup = (message, type) => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  };

  const fetchCustomers = () => {
    API.get("Customers")
      .then(response => setCustomers(response.data.data))
      .catch(() => showPopup("Failed to fetch customers.", "error"));
  };

  const closeModal = () => {
    setSelectedCustomer(null);
    setEditingCustomer(null);
    setIsAdding(false);
  };

  const handleEdit = () => {
    setEditingCustomer(selectedCustomer);
    setFormData({
      name: selectedCustomer.name,
      email: selectedCustomer.email,
      phone: selectedCustomer.phone,
      address: selectedCustomer.address
    });
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const saveCustomer = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      showPopup("All fields are required!", "error");
      return;
    }
    API.put(`/customer/${selectedCustomer._id}`, formData)
      .then(() => {
        fetchCustomers();
        closeModal();
        showPopup("Customer updated successfully!", "success");
      })
      .catch(() => showPopup("Error updating customer.", "error"));
  };

  const deleteCustomer = () => {
    if (window.confirm("Are you sure you want to delete this customer?")) {
      API.delete(`/customer/${selectedCustomer._id}`)
        .then(() => {
          fetchCustomers();
          closeModal();
          showPopup("Customer deleted successfully!", "success");
        })
        .catch(() => showPopup("Error deleting customer.", "error"));
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setSearchResults([]); // Close suggestions when clicking outside
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const saveNewCustomer = () => {
    if (!formData.name || !formData.email || !formData.phone || !formData.address) {
      showPopup("All fields are required!", "error");
      return;
    }
    API.post("/createCustomer", formData)
      .then(() => {
        fetchCustomers();
        closeModal();
        showPopup("Customer added successfully!", "success");
      })
      .catch(() => showPopup("Error adding customer.", "error"));
  };

  return (
    <div className="md:flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className='Main w-full p-10'>
        <h1 className='text-center text-3xl font-bold text-gray-800 mb-6'>Customers</h1>
        {popup.message && (
          <div className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white ${popup.type === "success" ? "bg-green-500" : "bg-red-500"}`}>
            {popup.message}
          </div>
        )}
        <button onClick={() => setIsAdding(true)} className="mb-4 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">Add Customer</button>
        <div className="relative mb-4 flex flex-col gap-2 z-2" ref={searchRef}>
          <div className='w-1/2 h-10 py-4 flex bg-white focus:outline-none focus:ring-0 rounded items-center relative'>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyUp={searchCustomers}
              className="p-2 rounded w-full focus:outline-none focus:ring-0 bg-white"
              placeholder="Search Customers..."
            />
            {searchQuery && (
              <X className="relative right-3 w-10 cursor-pointer text-gray-500 hover:text-black" onClick={clearSearch} />
            )}
          </div>

          {searchResults.length > 0 && (
            <div
              className="absolute bg-white border rounded shadow-md w-1/2 max-h-60 overflow-auto z-10 mt-10"
            >
              {searchResults.map(customer => (
                <div
                  key={customer._id}
                  className="p-2 cursor-pointer hover:bg-gray-200"
                  onClick={() => handleSearchSelect(customer)}
                >
                  {customer.name}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
          <table className="w-full border-collapse shadow-lg rounded-lg overflow-hidden">
            <thead>
              <tr className="bg-blue-600 text-white text-lg">
                <th className="border px-4 py-2">Name</th>
                <th className="border px-4 py-2">Email</th>
                <th className="border px-4 py-2">Phone</th>
                <th className="border px-4 py-2">Address</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer._id}
                  className="text-center cursor-pointer hover:bg-gray-200 transition-all"
                  onClick={() => setSelectedCustomer(customer)}
                >
                  <td className="border px-4 py-2">{customer.name}</td>
                  <td className="border px-4 py-2">{customer.email}</td>
                  <td className="border px-4 py-2">{customer.phone || N / A}</td>
                  <td className="border px-4 py-2">{customer.address}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(selectedCustomer || isAdding) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10">
          <div className="bg-white p-6 rounded-lg shadow-lg w-1/3">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">{isAdding ? "Add Customer" : editingCustomer ? "Edit Customer" : selectedCustomer.name}</h2>
            <input type="text" name="name" value={formData.name} onChange={handleChange} className="w-full p-2 border rounded mb-2" placeholder="Name" />
            <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full p-2 border rounded mb-2" placeholder="Email" />
            <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full p-2 border rounded mb-2" placeholder="Phone" />
            <input type="text" name="address" value={formData.address} onChange={handleChange} className="w-full p-2 border rounded mb-4" placeholder="Address" />
            {isAdding ? (
              <button onClick={saveNewCustomer} className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 transition">Add</button>
            ) : (
              <button onClick={saveCustomer} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition">Save</button>
            )}
            <button onClick={closeModal} className="mt-4 bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600 transition w-full">Close</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;
