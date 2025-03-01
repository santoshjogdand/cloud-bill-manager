import React, { useState, useEffect } from "react";
import Header from "../Header/Header";
import { API } from "../../Api";
import { Cone } from "lucide-react";

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [editingIndex, setEditingIndex] = useState(null);
  const [showAddProductForm, setShowAddProductForm] = useState(false);
  const [newProduct, setNewProduct] = useState({
    productName: "",
    category: "",
    stock_quantity: "",
    unitOfMeasure: "",
    conversion_rate: "",
    alternate_unit: "",
    tax_rate: "",
    tax_type: "",
    supplier: "",
    batch_number: "",
    manufacturer: "",
    description: "",
    cost_price: "",
    sales_price: "",
    discount: "",
    reorder_quantity: "",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await API.get("getProducts");

      if (!Array.isArray(response.data.data)) {
        console.error("Invalid response format:", response.data);
        return;
      }

      setProducts(response.data.data);
    } catch (error) {
      console.error("Error fetching products:", error);
      setProducts([]); // ✅ Prevents undefined error
    }
  };


  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({ ...newProduct, [name]: value });
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`product/${id}`);
      setProducts(products.filter((product) => product._id !== id));
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  const handleEditProduct = (product, index) => {
    setNewProduct(product);
    setEditingIndex(index);
    setShowAddProductForm(true);
  };

  const addOrUpdateProduct = async () => {
    try {
      if (editingIndex !== null) {
        const productId = products[editingIndex]._id;
        await API.put(`product/${productId}`, newProduct);
        const updatedProducts = [...products];
        updatedProducts[editingIndex] = { ...newProduct, _id: productId };
        setProducts(updatedProducts);
      } else {
        const response = await API.post("addProduct", newProduct);

        // ✅ Ensure response contains the product
        console.log()
        if (!response.data.data.productName) {
          console.error("Invalid response format:", response.data);
          return;
        }
        fetchProducts()

        // setProducts([...products, response.data.product]);
      }
      setEditingIndex(null);
      setShowAddProductForm(false);
      resetForm();
    } catch (error) {
      console.error("Error adding/updating product:", error);
    }
  };


  const resetForm = () => {
    setNewProduct({
      productName: "",
      category: "",
      stock_quantity: "",
      unitOfMeasure: "",
      conversion_rate: "",
      alternate_unit: "",
      tax_rate: "",
      tax_type: "",
      supplier: "",
      batch_number: "",
      manufacturer: "",
      description: "",
      cost_price: "",
      sales_price: "",
      discount: "",
      reorder_quantity: "",
    });
  };

  return (
    <div className="h-screen md:flex flex-col">
      <Header />
      <div className='Main w-full h-full bg-gray-100 p-5'>
          <div className='title text-center text-2xl font-bold mb-5'>Inventory</div>
          <div className='flex justify-between items-center mb-5'>
            <input
              type='text'
              placeholder='Search Product'
              className='p-2 border rounded w-1/3 outline-none'
            />
            <button
              className='bg-blue-600 text-white px-4 py-2 rounded'
              onClick={() => setShowAddProductForm(true)}
            >
              + Add Product
            </button>
          </div>
          <table className='w-full border-collapse shadow-lg rounded-lg overflow-hidden'>
            <thead>
              <tr className='bg-blue-600 text-whitebg-blue-600 text-white text-lg'>
                <th className='border px-4 py-2'>Product Name</th>
                <th className='border px-4 py-2'>Quantity</th>
                <th className='border px-4 py-2'>Cost Price</th>
                <th className='border px-4 py-2'>Selling Price</th>
                <th className='border px-4 py-2'>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products?.map((product, index) => (
                product ? ( // ✅ Ensure product is defined
                  <tr key={index} className='text-center cursor-pointer hover:bg-gray-200 transition-all'>
                    <td className='border px-4 py-2'>{product.productName}</td>
                    <td className='border px-4 py-2'>{product.stock_quantity}</td>
                    <td className='border px-4 py-2'>{product.cost_price}</td>
                    <td className='border px-4 py-2'>{product.sales_price}</td>
                    <td className='border px-4 py-2 flex justify-center gap-4'>
                      <button className='text-blue-600' onClick={() => handleEditProduct(product, index)}>Edit</button>
                      <button className='text-red-600' onClick={() => handleDelete(product._id)}>Delete</button>
                    </td>
                  </tr>
                ) : null
              ))}
            </tbody>

          </table>
        {showAddProductForm && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
            <div className="bg-white p-4 rounded w-1/3 max-h-[80vh] overflow-y-auto shadow-lg">
              <h2 className="text-lg font-bold mb-3">{editingIndex !== null ? "Edit" : "Add"} Product</h2>

              <div className="grid grid-cols-2 gap-2">
                <input type="text" name="productName" placeholder="Product Name*" value={newProduct.productName} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="text" name="category" placeholder="Category*" value={newProduct.category} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="number" name="stock_quantity" placeholder="Quantity*" value={newProduct.stock_quantity} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="text" name="unitOfMeasure" placeholder="Unit*" value={newProduct.unitOfMeasure} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="text" name="alternate_unit" placeholder="Alt Unit" value={newProduct.alternate_unit} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="number" name="conversion_rate" placeholder="Conv. Rate" value={newProduct.conversion_rate} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="number" name="tax_rate" placeholder="Tax Rate (%)" value={newProduct.tax_rate} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="text" name="tax_type" placeholder="Tax Type" value={newProduct.tax_type} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="text" name="supplier" placeholder="Supplier" value={newProduct.supplier} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="text" name="batch_number" placeholder="Batch #" value={newProduct.batch_number} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="text" name="manufacturer" placeholder="Manufacturer" value={newProduct.manufacturer} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="number" name="reorder_quantity" placeholder="Reorder Qty" value={newProduct.reorder_quantity} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="number" name="cost_price" placeholder="Cost Price*" value={newProduct.cost_price} onChange={handleInputChange} className="p-1 border rounded w-full" />
                <input type="number" name="sales_price" placeholder="Selling Price*" value={newProduct.sales_price} onChange={handleInputChange} className="p-1 border rounded w-full" />

                <input type="number" name="discount" placeholder="Discount (%)" value={newProduct.discount} onChange={handleInputChange} className="p-1 border rounded w-full" />
              </div>

              <textarea name="description" placeholder="Description" value={newProduct.description} onChange={handleInputChange} className="p-1 border rounded w-full mt-2 h-16 resize-none"></textarea>

              <div className="flex justify-end gap-2 mt-3">
                <button className="px-3 py-1 bg-gray-400 text-white rounded" onClick={() => setShowAddProductForm(false)}>Cancel</button>
                <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={addOrUpdateProduct}>Save</button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Inventory;
