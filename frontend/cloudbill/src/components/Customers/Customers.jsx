import React, { useState, useEffect, useReducer, useCallback } from "react";
import Header from "../Header/Header";
import { API } from "../../Api";
import { AlertCircle, Search, Plus, X } from "lucide-react";

// Customer form initial state
const initialCustomerState = {
  name: "",
  email: "",
  phone: "",
  address: ""
};

// Form validation function
const validateForm = (customer) => {
  const errors = {};
  
  if (!customer.name?.trim()) errors.name = "Name is required";
  if (!customer.email?.trim()) errors.email = "Email is required";
  if (!customer.phone?.trim()) errors.phone = "Phone number is required";
  if (!customer.address?.trim()) errors.address = "Address is required";
  
  return errors;
};

// Reducer for customer form state
const customerReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CUSTOMER':
      return { ...action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialCustomerState };
    default:
      return state;
  }
};

// Main Customers component
const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [popup, setPopup] = useState({ message: "", type: "" });
  
  const [customerForm, dispatchCustomerForm] = useReducer(customerReducer, initialCustomerState);

  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await API.get("Customers");
      if (!response.data.data) {
        throw new Error("Invalid response format");
      }
      setCustomers(response.data.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error fetching customers";
      showPopup(errorMessage, "error");
      console.error("Error fetching customers:", error);
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm("");
  };

  const searchCustomers = async () => {
    if (!searchTerm.trim()) return;
    
    setLoading(true);
    try {
      const response = await API.post("/Customers", { customerName: searchTerm });
      if (response.data.data.Customers) {
        setCustomers(response.data.data.Customers);
      }
    } catch (error) {
      showPopup("Error searching customers", "error");
      console.error("Error searching customers:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter(customer => 
    customer?.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatchCustomerForm({ 
      type: 'UPDATE_FIELD', 
      field: name, 
      value 
    });
    
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  const addCustomerHandler = () => {
    dispatchCustomerForm({ type: 'RESET' });
    setEditingId(null);
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditCustomer = (customer, e) => {
    if (e) e.stopPropagation();
    dispatchCustomerForm({ type: 'SET_CUSTOMER', payload: customer });
    setEditingId(customer._id);
    setFormErrors({});
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormErrors({});
  };

  const handleSubmit = async () => {
    const errors = validateForm(customerForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      if (editingId) {
        await API.put(`customer/${editingId}`, customerForm);
        showPopup("Customer updated successfully");
        setCustomers(customers.map(c => 
          c._id === editingId ? { ...customerForm, _id: editingId } : c
        ));
      } else {
        await API.post("createCustomer", customerForm);
        showPopup("Customer added successfully");
        await fetchCustomers();
      }
      closeModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (editingId ? "Error updating customer" : "Error adding customer");
      showPopup(errorMessage, "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this customer?")) {
      return;
    }
    
    setLoading(true);
    try {
      await API.delete(`customer/${id}`);
      showPopup("Customer deleted successfully");
      setCustomers(customers.filter(customer => customer._id !== id));
      
      if (showModal && editingId === id) {
        closeModal();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error deleting customer";
      showPopup(errorMessage, "error");
      console.error("Error deleting customer:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      
      {popup.message && (
        <div 
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 flex items-center ${
            popup.type === "success" ? "bg-green-500" : "bg-red-500"
          }`}
        >
          <AlertCircle className="mr-2" size={18} />
          {popup.message}
        </div>
      )}
      
      <div className="container mx-auto p-4 w-full">
        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Customer Management</h1>
          <div className="relative mb-4 md:mb-0 md:w-1/3">
            <input
              type="text"
              placeholder="Search Customers"
              value={searchTerm}
              onChange={handleSearchChange}
              onKeyDown={(e) => e.key === 'Enter' && searchCustomers()}
              className="p-2 pl-10 border rounded w-full"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            {searchTerm && (
              <X 
                className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600" 
                size={18} 
                onClick={clearSearch}
              />
            )}
          </div>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
            onClick={addCustomerHandler}
            disabled={loading}
          >
            <Plus className="mr-1" size={18} />
            Add Customer
          </button>
        </div>

        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}

        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-blue-600 text-white text-lg">
                <th className="border px-4 py-2 text-left">Name</th>
                <th className="border px-4 py-2 text-left">Email</th>
                <th className="border px-4 py-2 text-left">Phone</th>
                <th className="border px-4 py-2 text-left">Address</th>
                <th className="border px-4 py-2 text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length > 0 ? (
                filteredCustomers.map((customer) => (
                  <tr 
                    key={customer._id} 
                    className="text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                    onClick={() => handleEditCustomer(customer)}
                  >
                    <td className="border px-4 py-2">{customer.name}</td>
                    <td className="border px-4 py-2">{customer.email}</td>
                    <td className="border px-4 py-2">{customer.phone || "N/A"}</td>
                    <td className="border px-4 py-2">{customer.address}</td>
                    <td className="border px-4 py-2">
                      <div className="flex justify-center gap-4">
                        <button 
                          className="text-blue-600 hover:text-blue-800 transition"
                          onClick={(e) => handleEditCustomer(customer, e)}
                          aria-label="Edit customer"
                        >
                          Edit
                        </button>
                        <button 
                          className="text-red-600 hover:text-red-800 transition"
                          onClick={(e) => handleDelete(customer._id, e)}
                          aria-label="Delete customer"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border px-4 py-8 text-center text-gray-500">
                    {searchTerm ? "No customers match your search" : "No customers found. Add your first customer!"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <h2 className="text-xl font-bold mb-4">{editingId ? "Edit Customer" : "Add New Customer"}</h2>
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                  <input 
                    type="text" 
                    name="name" 
                    value={customerForm.name} 
                    onChange={handleInputChange} 
                    className={`p-2 border rounded w-full ${formErrors.name ? 'border-red-500' : ''}`}
                  />
                  {formErrors.name && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.name}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email*</label>
                  <input 
                    type="email" 
                    name="email" 
                    value={customerForm.email} 
                    onChange={handleInputChange} 
                    className={`p-2 border rounded w-full ${formErrors.email ? 'border-red-500' : ''}`}
                  />
                  {formErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.email}</p>
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone*</label>
                  <input 
                    type="text" 
                    name="phone" 
                    value={customerForm.phone} 
                    onChange={handleInputChange} 
                    className={`p-2 border rounded w-full ${formErrors.phone ? 'border-red-500' : ''}`}
                  />
                  {formErrors.phone && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.phone}</p>
                  )}
                </div>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Address*</label>
                  <input 
                    type="text" 
                    name="address" 
                    value={customerForm.address} 
                    onChange={handleInputChange} 
                    className={`p-2 border rounded w-full ${formErrors.address ? 'border-red-500' : ''}`}
                  />
                  {formErrors.address && (
                    <p className="text-red-500 text-xs mt-1">{formErrors.address}</p>
                  )}
                </div>
                <div className="flex justify-end gap-3 mt-6">
                  <button 
                    type="button"
                    onClick={closeModal}
                    className="px-4 py-2 bg-gray-400 text-white rounded hover:bg-gray-500 transition"
                    disabled={loading}
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
                    disabled={loading}
                  >
                    {loading ? 'Saving...' : 'Save Customer'}
                  </button>
                  {editingId && (
                    <button 
                      type="button"
                      onClick={(e) => handleDelete(editingId, e)}
                      className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition"
                      disabled={loading}
                    >
                      Delete
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Customers;