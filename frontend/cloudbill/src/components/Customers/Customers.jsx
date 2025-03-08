import React, { useState, useEffect, useReducer, useCallback, useMemo } from "react";
import Header from "../Header/Header";
import { API } from "../../Api";
import { AlertCircle, Search, Plus, X } from "lucide-react";

// Customer form initial state
const initialCustomerState = {
  name: "",
  email: "",
  phone: "",
  address: "",
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
    case "SET_CUSTOMER":
      return { ...action.payload };
    case "UPDATE_FIELD":
      return { ...state, [action.field]: action.value };
    case "RESET":
      return { ...initialCustomerState };
    default:
      return state;
  }
};

// Main Customers component
const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [popup, setPopup] = useState({ message: "", type: "" });
  const [filters, setFilters] = useState({
    searchTerm: "",
    fromDate: "",
    toDate: "",
    sortBy: "",
  });
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

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

  const handleFilterChange = useCallback((key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      fromDate: "",
      toDate: "",
      sortBy: "",
    });
  }, []);

  const filteredCustomers = useMemo(() => {
    let result = [...customers];

    // Search filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter((customer) => {
        const name = customer.name?.toLowerCase() || "";
        const email = customer.email?.toLowerCase() || "";
        const phone = customer.phone?.toLowerCase() || "";
        const address = customer.address?.toLowerCase() || "";

        return (
          name.includes(searchLower) ||
          email.includes(searchLower) ||
          phone.includes(searchLower) ||
          address.includes(searchLower)
        );
      });
    }

    // Date range filter
    if (filters.fromDate || filters.toDate) {
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      const toDate = filters.toDate ? new Date(filters.toDate) : null;

      result = result.filter((customer) => {
        const customerDate = new Date(customer.createdAt);
        const afterFromDate = !fromDate || customerDate >= fromDate;
        const beforeToDate = !toDate || customerDate <= toDate;
        return afterFromDate && beforeToDate;
      });
    }

    // Sorting
    if (filters.sortBy) {
      result.sort((a, b) => {
        if (filters.sortBy === "name-asc") {
          return a.name.localeCompare(b.name);
        } else if (filters.sortBy === "name-desc") {
          return b.name.localeCompare(a.name);
        } else if (filters.sortBy === "date-asc") {
          return new Date(a.createdAt) - new Date(b.createdAt);
        } else if (filters.sortBy === "date-desc") {
          return new Date(b.createdAt) - new Date(a.createdAt);
        }
        return 0;
      });
    }

    return result;
  }, [customers, filters]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatchCustomerForm({
      type: "UPDATE_FIELD",
      field: name,
      value,
    });

    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const addCustomerHandler = () => {
    dispatchCustomerForm({ type: "RESET" });
    setEditingId(null);
    setFormErrors({});
    setShowModal(true);
  };

  const handleEditCustomer = (customer, e) => {
    if (e) e.stopPropagation();
    dispatchCustomerForm({ type: "SET_CUSTOMER", payload: customer });
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
        setCustomers(customers.map((c) =>
          c._id === editingId ? { ...customerForm, _id: editingId } : c
        ));
      } else {
        await API.post("createCustomer", customerForm);
        showPopup("Customer added successfully");
        await fetchCustomers();
      }
      closeModal();
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
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
      setCustomers(customers.filter((customer) => customer._id !== id));

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
        <div className="text-center text-2xl font-bold mb-5">Customer Management</div>

        <div className="flex flex-col md:flex-row justify-between items-center mb-6">
          <div className="relative mb-4 md:mb-0 md:w-1/3">
            <input
              type="text"
              placeholder="Search Customers"
              value={filters.searchTerm}
              onChange={(e) => handleFilterChange("searchTerm", e.target.value)}
              className="p-2 pl-10 border rounded w-full"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
            {filters.searchTerm && (
              <X
                className="absolute right-3 top-2.5 text-gray-400 cursor-pointer hover:text-gray-600"
                size={18}
                onClick={() => handleFilterChange("searchTerm", "")}
              />
            )}
          </div>
          {/* <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            aria-expanded={isFilterExpanded}
            aria-controls="filter-panel"
          >
            <span>Filters</span>
            <svg
              className={`w-4 h-4 transition-transform ${isFilterExpanded ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button> */}
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
            onClick={addCustomerHandler}
            disabled={loading}
          >
            <Plus className="mr-1" size={18} />
            Add Customer
          </button>
        </div>

        {isFilterExpanded && (
          <div id="filter-panel" className="bg-white p-4 rounded-lg shadow-md mb-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col">
                <label htmlFor="fromDate" className="text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  className="p-2 border rounded"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange("fromDate", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="toDate" className="text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  id="toDate"
                  className="p-2 border rounded"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange("toDate", e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="sortBy" className="text-sm font-medium mb-1">Sort By</label>
                <select
                  id="sortBy"
                  className="p-2 border rounded"
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="date-desc">Date (Newest)</option>
                </select>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={clearFilters}
              >
                Clear Filters
              </button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto bg-white rounded-lg shadow-lg">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Showing {filteredCustomers.length} of {customers.length} customers
                </div>
                {Object.values(filters).some((val) => val !== "") && (
                  <button
                    className="text-sm text-red-500 hover:text-red-700"
                    onClick={clearFilters}
                  >
                    Clear all filters
                  </button>
                )}
              </div>
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
                        {filters.searchTerm
                          ? "No customers match your search"
                          : "No customers found. Add your first customer!"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6 relative">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "Edit Customer" : "Add New Customer"}
              </h2>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSubmit();
                }}
              >
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name*</label>
                  <input
                    type="text"
                    name="name"
                    value={customerForm.name}
                    onChange={handleInputChange}
                    className={`p-2 border rounded w-full ${formErrors.name ? "border-red-500" : ""}`}
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
                    className={`p-2 border rounded w-full ${formErrors.email ? "border-red-500" : ""}`}
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
                    className={`p-2 border rounded w-full ${formErrors.phone ? "border-red-500" : ""}`}
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
                    className={`p-2 border rounded w-full ${formErrors.address ? "border-red-500" : ""}`}
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
                    {loading ? "Saving..." : "Save Customer"}
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