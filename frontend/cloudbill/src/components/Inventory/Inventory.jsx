import React, { useState, useEffect, useReducer, useCallback } from "react";
import Header from "../Header/Header";
import { API } from "../../Api";
import { AlertCircle, Search, Plus } from "lucide-react";

// Product form initial state
const initialProductState = {
  productName: "",
  category: "",
  stock_quantity: 0.00,
  unitOfMeasure: "",
  conversion_rate: 0.00,
  alternate_unit: "",
  tax_rate: 0.00,
  tax_type: "",
  supplier: "",
  batch_number: "",
  manufacturer: "",
  description: "",
  cost_price: 0.00,
  sales_price: 0.00,
  discount: 0.00,
  reorder_quantity: "",
};

// Form validation function
const validateForm = (product) => {
  const errors = {};
  
  if (!product.productName?.trim()) errors.productName = "Product name is required";
  if (!product.category?.trim()) errors.category = "Category is required";
  if (!product.unitOfMeasure?.trim()) errors.unitOfMeasure = "Unit of measure is required";
  if (!product.tax_type?.trim()) errors.tax_type = "Tax type is required";
  
  if (!product.sales_price || Number(product.sales_price) <= 0) 
    errors.sales_price = "Sales price must be greater than 0";
  
  if (!product.cost_price || Number(product.cost_price) <= 0) 
    errors.cost_price = "Cost price must be greater than 0";
  
  if (product.stock_quantity === "" || Number(product.stock_quantity) < 0) 
    errors.stock_quantity = "Stock quantity must be 0 or greater";
  
  if (product.tax_rate === "" || Number(product.tax_rate) < 0) 
    errors.tax_rate = "Tax rate must be 0 or greater";
  
  if (product.alternate_unit?.trim() && (product.conversion_rate === "" || Number(product.conversion_rate) <= 0)) 
    errors.conversion_rate = "Conversion rate is required for alternate unit";
  
  return errors;
};

// Reducer for product form state
const productReducer = (state, action) => {
  switch (action.type) {
    case 'SET_PRODUCT':
      return { ...action.payload };
    case 'UPDATE_FIELD':
      return { ...state, [action.field]: action.value };
    case 'RESET':
      return { ...initialProductState };
    default:
      return state;
  }
};

// Main Inventory component
const Inventory = () => {
  // State declarations
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [popup, setPopup] = useState({ message: "", type: "" });
  
  // Use reducer for product form state
  const [productForm, dispatchProductForm] = useReducer(productReducer, initialProductState);

  // Popup notification handler
  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  }, []);

  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Fetch products from API
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await API.get("getProducts");
      
      if (!Array.isArray(response.data.data)) {
        throw new Error("Invalid response format");
      }
      
      setProducts(response.data.data);
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error fetching products";
      showPopup(errorMessage, "error");
      console.error("Error fetching products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  // Handle search input changes
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Filter products based on search term
  const filteredProducts = products.filter(product => 
    product?.productName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    dispatchProductForm({ 
      type: 'UPDATE_FIELD', 
      field: name, 
      value 
    });
    
    // Clear error for this field when user types
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: "" }));
    }
  };

  // Open modal for adding new product
  const addProductHandler = () => {
    dispatchProductForm({ type: 'RESET' });
    setEditingId(null);
    setFormErrors({});
    setShowModal(true);
  };

  // Open modal for editing product
  const handleEditProduct = (product, e) => {
    if (e) e.stopPropagation();
    dispatchProductForm({ type: 'SET_PRODUCT', payload: product });
    setEditingId(product._id);
    setFormErrors({});
    setShowModal(true);
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setFormErrors({});
  };

  // Handle form submission
  const handleSubmit = async () => {
    // Validate form
    const errors = validateForm(productForm);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    setLoading(true);
    try {
      if (editingId) {
        // Update existing product
        await API.put(`product/${editingId}`, productForm);
        showPopup("Product updated successfully");
        
        // Update local state
        setProducts(products.map(p => 
          p._id === editingId ? { ...productForm, _id: editingId } : p
        ));
      } else {
        // Add new product
        const response = await API.post("addProduct", productForm);
        
        if (!response.data.data) {
          throw new Error("Invalid response format");
        }
        
        showPopup("Product added successfully");
        await fetchProducts(); // Refresh products list
      }
      
      closeModal();
    } catch (error) {
      const errorMessage = error.response?.data?.message || 
        (editingId ? "Error updating product" : "Error adding product");
      showPopup(errorMessage, "error");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Handle product deletion
  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }
    
    setLoading(true);
    try {
      await API.delete(`product/${id}`);
      showPopup("Product deleted successfully");
      
      // Update local state
      setProducts(products.filter(product => product._id !== id));
      
      if (showModal && editingId === id) {
        closeModal();
      }
    } catch (error) {
      const errorMessage = error.response?.data?.message || "Error deleting product";
      showPopup(errorMessage, "error");
      console.error("Error deleting product:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      {/* Notification popup */}
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
      
      <div className="flex-1 w-full bg-gray-100 p-5">
        <div className="text-center text-2xl font-bold mb-5">Inventory Management</div>
        
        {/* Search and Add controls */}
        <div className="flex justify-between items-center mb-5">
          <div className="relative w-1/3">
            <input
              type="text"
              placeholder="Search Products"
              value={searchTerm}
              onChange={handleSearchChange}
              className="p-2 pl-10 border rounded w-full outline-none"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
          </div>
          
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded flex items-center hover:bg-blue-700 transition"
            onClick={addProductHandler}
            disabled={loading}
          >
            <Plus className="mr-1" size={18} />
            Add Product
          </button>
        </div>
        
        {/* Loading indicator */}
        {loading && (
          <div className="text-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-700 mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading...</p>
          </div>
        )}
        
        {/* Products table */}
        {!loading && (
          <div className="overflow-x-auto rounded-lg shadow">
            <div className="text-sm text-gray-500 py-2 px-2">
            Showing {filteredProducts.length} of {products.length} invoices
          </div>
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-blue-600 text-white text-lg">
                  <th className="border px-4 py-2 text-left">Product Name</th>
                  <th className="border px-4 py-2 text-right">Quantity</th>
                  <th className="border px-4 py-2 text-right">Cost Price</th>
                  <th className="border px-4 py-2 text-right">Selling Price</th>
                  <th className="border px-4 py-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product) => (
                    <tr 
                      key={product._id} 
                      className="text-gray-700 hover:bg-gray-100 transition cursor-pointer"
                      onClick={() => handleEditProduct(product)}
                    >
                      <td className="border px-4 py-2">{product.productName}</td>
                      <td className="border px-4 py-2 text-right">
                        {product.stock_quantity} {product.unitOfMeasure}
                      </td>
                      <td className="border px-4 py-2 text-right">
                      ₹{Number(product.cost_price).toFixed(2)}
                      </td>
                      <td className="border px-4 py-2 text-right">
                      ₹{Number(product.sales_price).toFixed(2)}
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex justify-center gap-4">
                          <button 
                            className="text-blue-600 hover:text-blue-800 transition"
                            onClick={(e) => handleEditProduct(product, e)}
                            aria-label="Edit product"
                          >
                            Edit
                          </button>
                          <button 
                            className="text-red-600 hover:text-red-800 transition"
                            onClick={(e) => handleDelete(product._id, e)}
                            aria-label="Delete product"
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
                      {searchTerm ? "No products match your search" : "No products found. Add your first product!"}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Product form modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-40">
            <div className="bg-white p-6 rounded w-full max-w-3xl max-h-[90vh] overflow-y-auto shadow-xl">
              <h2 className="text-xl font-bold mb-4">
                {editingId ? "Edit Product" : "Add New Product"}
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                {/* Required fields section */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-700">Required Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Product Name*</label>
                      <input 
                        type="text" 
                        name="productName" 
                        value={productForm.productName} 
                        onChange={handleInputChange} 
                        className={`p-2 border rounded w-full ${formErrors.productName ? 'border-red-500' : ''}`}
                      />
                      {formErrors.productName && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.productName}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Category*</label>
                      <input 
                        type="text" 
                        name="category" 
                        value={productForm.category} 
                        onChange={handleInputChange} 
                        className={`p-2 border rounded w-full ${formErrors.category ? 'border-red-500' : ''}`}
                      />
                      {formErrors.category && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.category}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Unit of Measure*</label>
                      <input 
                        type="text" 
                        name="unitOfMeasure" 
                        value={productForm.unitOfMeasure} 
                        onChange={handleInputChange} 
                        className={`p-2 border rounded w-full ${formErrors.unitOfMeasure ? 'border-red-500' : ''}`}
                      />
                      {formErrors.unitOfMeasure && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.unitOfMeasure}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax Type*</label>
                      <input 
                        type="text" 
                        name="tax_type" 
                        value={productForm.tax_type} 
                        onChange={handleInputChange} 
                        className={`p-2 border rounded w-full ${formErrors.tax_type ? 'border-red-500' : ''}`}
                      />
                      {formErrors.tax_type && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.tax_type}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Cost Price (₹)*</label>
                      <input 
                        type="number" 
                        name="cost_price" 
                        value={productForm.cost_price} 
                        onChange={handleInputChange} 
                        step="0.01"
                        min="0.01"
                        className={`p-2 border rounded w-full ${formErrors.cost_price ? 'border-red-500' : ''}`}
                      />
                      {formErrors.cost_price && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.cost_price}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Selling Price (₹)*</label>
                      <input 
                        type="number" 
                        name="sales_price" 
                        value={productForm.sales_price} 
                        onChange={handleInputChange} 
                        step="0.01"
                        min="0.01"
                        className={`p-2 border rounded w-full ${formErrors.sales_price ? 'border-red-500' : ''}`}
                      />
                      {formErrors.sales_price && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.sales_price}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Quantity*</label>
                      <input 
                        type="number" 
                        name="stock_quantity" 
                        value={productForm.stock_quantity} 
                        onChange={handleInputChange} 
                        min="0"
                        className={`p-2 border rounded w-full ${formErrors.stock_quantity ? 'border-red-500' : ''}`}
                      />
                      {formErrors.stock_quantity && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.stock_quantity}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Tax Rate (%)*</label>
                      <input 
                        type="number" 
                        name="tax_rate" 
                        value={parseFloat(productForm.tax_rate)} 
                        onChange={handleInputChange} 
                        min="0"
                        step="0.01"
                        className={`p-2 border rounded w-full ${formErrors.tax_rate ? 'border-red-500' : ''}`}
                      />
                      {formErrors.tax_rate && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.tax_rate}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Optional fields section */}
                <div className="mb-4">
                  <h3 className="font-medium mb-2 text-gray-700">Additional Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Alternate Unit</label>
                      <input 
                        type="text" 
                        name="alternate_unit" 
                        value={productForm.alternate_unit} 
                        onChange={handleInputChange} 
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Conversion Rate</label>
                      <input 
                        type="number" 
                        name="conversion_rate" 
                        value={productForm.conversion_rate} 
                        onChange={handleInputChange} 
                        min="0"
                        step="0.01"
                        className={`p-2 border rounded w-full ${formErrors.conversion_rate ? 'border-red-500' : ''}`}
                      />
                      {formErrors.conversion_rate && (
                        <p className="text-red-500 text-xs mt-1">{formErrors.conversion_rate}</p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Supplier</label>
                      <input 
                        type="text" 
                        name="supplier" 
                        value={productForm.supplier} 
                        onChange={handleInputChange} 
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Batch Number</label>
                      <input 
                        type="text" 
                        name="batch_number" 
                        value={productForm.batch_number} 
                        onChange={handleInputChange} 
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manufacturer</label>
                      <input 
                        type="text" 
                        name="manufacturer" 
                        value={productForm.manufacturer} 
                        onChange={handleInputChange} 
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Reorder Quantity</label>
                      <input 
                        type="number" 
                        name="reorder_quantity" 
                        value={productForm.reorder_quantity} 
                        onChange={handleInputChange} 
                        min="0"
                        className="p-2 border rounded w-full"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Discount (%)</label>
                      <input 
                        type="number" 
                        name="discount" 
                        value={productForm.discount} 
                        onChange={handleInputChange} 
                        min="0"
                        max="100"
                        step="0.01"
                        className="p-2 border rounded w-full"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea 
                    name="description" 
                    value={productForm.description} 
                    onChange={handleInputChange} 
                    className="p-2 border rounded w-full h-20 resize-none"
                  ></textarea>
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
                    {loading ? 'Saving...' : 'Save Product'}
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

export default Inventory;