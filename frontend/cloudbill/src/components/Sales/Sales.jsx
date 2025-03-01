import React, { useState, useEffect } from 'react';
import Header from '../Header/Header';
import { API } from '../../Api';

const Sales = () => {
  const [filters, setFilters] = useState({
    amount: '',
    date: '',
    fromDate: '',
    toDate: '',
  });
  const [sales, setSales] = useState([]);
  const [selectedSale, setSelectedSale] = useState(null);

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await API.get('getInvoices');
      setSales(response.data.data);
    } catch (error) {
      console.error('Error fetching sales:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  return (
    <div className="md:flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4 w-full">
        <h1 className="text-2xl font-bold text-center mb-6">Sales</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {['amount', 'date', 'fromDate', 'toDate'].map((key) => (
            <div key={key} className="flex flex-col">
              <label htmlFor={key} className="text-sm font-medium mb-1 capitalize">{key.replace(/([A-Z])/g, ' $1')}</label>
              {key.includes('Date') ? (
                <input
                  type="date"
                  id={key}
                  className="p-2 border rounded"
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                />
              ) : (
                <select
                  id={key}
                  className="p-2 border rounded"
                  value={filters[key]}
                  onChange={(e) => handleFilterChange(key, e.target.value)}
                >
                  <option value="">Select</option>
                  {key === 'amount' ? (
                    <>
                      <option value="low-high">Low to High</option>
                      <option value="high-low">High to Low</option>
                    </>
                  ) : (
                    <>
                      <option value="newest">Newest</option>
                      <option value="oldest">Oldest</option>
                    </>
                  )}
                </select>
              )}
            </div>
          ))}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse bg-white shadow-lg rounded-md">
            <thead>
              <tr className="bg-blue-600 text-white text-sm md:text-base">
                <th className="px-4 py-2 border">Date</th>
                <th className="px-4 py-2 border">Customer Name</th>
                <th className="px-4 py-2 border">Total Amount</th>
                <th className="px-4 py-2 border">Invoice Number</th>
              </tr>
            </thead>
            <tbody>
              {sales.length > 0 ? (
                sales.map((sale, index) => (
                  <tr key={index} className="text-center hover:bg-gray-100 cursor-pointer" onClick={() => setSelectedSale(sale)}>
                    <td className="border px-4 py-2">{sale.createdAt}</td>
                    <td className="border px-4 py-2">{sale.customer_name}</td>
                    <td className="border px-4 py-2">{sale.total_amount}</td>
                    <td className="border px-4 py-2">{sale.invoice_number}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="text-center py-4">No sales records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full max-h-[80vh] overflow-y-auto p-6 relative">
            <button
              className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded"
              onClick={() => setSelectedSale(null)}
            >
              Close
            </button>
            <h2 className="text-xl font-bold mb-4">Invoice Details</h2>
            <p><strong>Date:</strong> {selectedSale.createdAt}</p>
            <p><strong>Customer Name:</strong> {selectedSale.customer_name}</p>
            <p><strong>Total Amount:</strong> {selectedSale.total_amount}</p>
            <p><strong>Invoice Number:</strong> {selectedSale.invoice_number}</p>

            <h3 className="text-lg font-semibold mt-4 mb-2">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300 text-sm">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="border border-gray-300 px-3 py-2">Sr No.</th>
                    <th className="border border-gray-300 px-3 py-2">Product Name</th>
                    <th className="border border-gray-300 px-3 py-2">QTY</th>
                    <th className="border border-gray-300 px-3 py-2">Nos</th>
                    <th className="border border-gray-300 px-3 py-2">Tax (%)</th>
                    <th className="border border-gray-300 px-3 py-2">Unit Price</th>
                    <th className="border border-gray-300 px-3 py-2">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.line_items && selectedSale.line_items.length > 0 ? (
                    selectedSale.line_items.map((item, index) => (
                      <tr key={index} className="text-center border border-gray-300">
                        <td className="border border-gray-300 px-3 py-2">{item.sr_no}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.product_name}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.QTY}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.nos}</td>
                        <td className="border border-gray-300 px-3 py-2">{item.tax}%</td>
                        <td className="border border-gray-300 px-3 py-2">₹{item.unit_price}</td>
                        <td className="border border-gray-300 px-3 py-2">₹{item.total_price}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4">No items listed</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}
    </div>
  );
};

export default Sales;
