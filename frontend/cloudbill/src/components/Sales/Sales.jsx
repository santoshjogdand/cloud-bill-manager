import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../Header/Header';
import { API } from '../../Api';

const Sales = () => {
  const [filters, setFilters] = useState({
    amount: '',
    date: '',
    fromDate: '',
    toDate: '',
    searchTerm: '',
  });
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState(null);
  const [isFilterExpanded, setIsFilterExpanded] = useState(false);

  // Memoized fetch function to prevent unnecessary re-creation
  const fetchSales = useCallback(async () => {
    try {
      setLoading(true);
      const response = await API.get('getInvoices');
      console.log(response)
      setSales(response.data.data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handleFilterChange = useCallback((key, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      amount: '',
      date: '',
      fromDate: '',
      toDate: '',
      searchTerm: '',
    });
  }, []);

  // Memoized filtering and sorting logic
  const filteredSales = useMemo(() => {
    if (!sales.length) return [];
    
    let result = [...sales];

    // Search filter - optimized with early returns and avoiding toLowerCase() multiple times
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      result = result.filter(sale => {
        const customerName = sale.customer_name?.toLowerCase() || '';
        const invoiceNumber = sale.invoice_number?.toLowerCase() || '';
        const totalAmount = sale.total_amount?.toString() || '';
        
        return customerName.includes(searchLower) || 
               invoiceNumber.includes(searchLower) || 
               totalAmount.includes(searchLower);
      });
    }

    // Date range filter - optimized by pre-calculating dates once
    if (filters.fromDate || filters.toDate) {
      const fromDate = filters.fromDate ? new Date(filters.fromDate) : null;
      let toDate = null;
      
      if (filters.toDate) {
        toDate = new Date(filters.toDate);
        toDate.setHours(23, 59, 59, 999); // Include the entire "to" day
      }
      
      result = result.filter(sale => {
        const saleDate = new Date(sale.createdAt);
        const afterFromDate = !fromDate || saleDate >= fromDate;
        const beforeToDate = !toDate || saleDate <= toDate;
        return afterFromDate && beforeToDate;
      });
    }

    // Amount sorting - optimized by using numerical comparison
    if (filters.amount) {
      result.sort((a, b) => {
        const aAmount = parseFloat(a.total_amount) || 0;
        const bAmount = parseFloat(b.total_amount) || 0;
        return filters.amount === 'low-high' ? aAmount - bAmount : bAmount - aAmount;
      });
    }

    // Date sorting - optimized by pre-parsing dates
    if (filters.date) {
      result.sort((a, b) => {
        const aDate = new Date(a.createdAt).getTime();
        const bDate = new Date(b.createdAt).getTime();
        return filters.date === 'newest' ? bDate - aDate : aDate - bDate;
      });
    }

    return result;
  }, [sales, filters]);

  // Memoized date formatter
  const formatDate = useCallback((dateString) => {
    console.log(dateString)
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }, []);

  // Memoized calculation for invoice details modal
  const calculateTaxAmount = useCallback((sale) => {
  
    const taxAmount = sale.tax_amount;
    return taxAmount.toFixed(2);
  }, []);

  // Memoize subtotal calculation
  const calculateSubtotal = useCallback((lineItems) => {
    if (!lineItems?.length) return 0;
    return lineItems.reduce((sum, item) => sum + (parseFloat(item.total_price) || 0), 0);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      <div className="container mx-auto p-4 w-full">
      <div className="text-center text-2xl font-bold mb-5">Sales Management</div>
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 ">
          <div className="w-full md:w-auto">
            <div className="relative mb-4 md:mb-0">
              <input
                type="text"
                placeholder="Search by customer, invoice or amount..."
                className="w-full p-2 pr-10 border rounded"
                value={filters.searchTerm}
                onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
              />
              {filters.searchTerm && (
                <button
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => handleFilterChange('searchTerm', '')}
                  aria-label="Clear search"
                >
                  ✕
                </button>
              )}
            </div>
          </div>
          <button
            className="w-full md:w-auto bg-blue-500 text-white px-4 py-2 rounded flex items-center justify-center gap-2 mb-4 md:mb-0"
            onClick={() => setIsFilterExpanded(!isFilterExpanded)}
            aria-expanded={isFilterExpanded}
            aria-controls="filter-panel"
          >
            <span>Filters</span>
            <svg
              className={`w-4 h-4 transition-transform ${isFilterExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>

        {isFilterExpanded && (
          <div id="filter-panel" className="bg-white p-4 rounded-lg shadow-md mb-6 animate-fadeIn">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <div className="flex flex-col">
                <label htmlFor="amount" className="text-sm font-medium mb-1">Sort by Amount</label>
                <select
                  id="amount"
                  className="p-2 border rounded"
                  value={filters.amount}
                  onChange={(e) => handleFilterChange('amount', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="low-high">Low to High</option>
                  <option value="high-low">High to Low</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="date" className="text-sm font-medium mb-1">Sort by Date</label>
                <select
                  id="date"
                  className="p-2 border rounded"
                  value={filters.date}
                  onChange={(e) => handleFilterChange('date', e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="newest">Newest</option>
                  <option value="oldest">Oldest</option>
                </select>
              </div>
              <div className="flex flex-col">
                <label htmlFor="fromDate" className="text-sm font-medium mb-1">From Date</label>
                <input
                  type="date"
                  id="fromDate"
                  className="p-2 border rounded"
                  value={filters.fromDate}
                  onChange={(e) => handleFilterChange('fromDate', e.target.value)}
                />
              </div>
              <div className="flex flex-col">
                <label htmlFor="toDate" className="text-sm font-medium mb-1">To Date</label>
                <input
                  type="date"
                  id="toDate"
                  className="p-2 border rounded"
                  value={filters.toDate}
                  onChange={(e) => handleFilterChange('toDate', e.target.value)}
                />
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
                  Showing {filteredSales.length} of {sales.length} invoices
                </div>
                {Object.values(filters).some(val => val !== '') && (
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
                  <tr className="bg-blue-600 text-white text-sm md:text-base">
                    <th className="px-4 py-2 border text-left">Date</th>
                    <th className="px-4 py-2 border text-left">Customer Name</th>
                    <th className="px-4 py-2 border text-right">Total Amount</th>
                    <th className="px-4 py-2 border text-left">Invoice Number</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSales.length > 0 ? (
                    filteredSales.map((sale) => (
                      <tr
                        onClick={() => setSelectedSale(sale)}
                        key={sale._id || sale.invoice_number}
                        className="hover:bg-gray-100 border-b cursor-pointer"
                      >
                        {console.log(sale)}
                        <td className="px-4 py-3 text-sm md:text-base">{formatDate(sale.createdAt)}</td>
                        <td className="px-4 py-3 text-sm md:text-base">{sale.customer_name}</td>
                        <td className="px-4 py-3 text-sm md:text-base text-right font-medium">
                          ₹{(parseFloat(sale.total_amount) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-3 text-sm md:text-base">{sale.invoice_number}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-8 text-gray-500">
                        No sales records found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>

      {/* Invoice Details Modal - Only render when needed */}
      {selectedSale && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50"
          onClick={(e) => {
            if (e.target === e.currentTarget) setSelectedSale(null);
          }}
        >
          <div className="bg-white rounded-lg shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 relative">
            <div className="sticky top-0 bg-white py-2 flex justify-between items-center border-b mb-4">
              <h2 className="text-xl font-bold">Invoice Details</h2>
              <button
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                onClick={() => setSelectedSale(null)}
              >
                Close
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Date:</span>
                  <span>{formatDate(selectedSale.createdAt)}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Invoice Number:</span>
                  <span>{selectedSale.invoice_number}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Customer Name:</span>
                  <span>{selectedSale.customer_name}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Total Amount:</span>
                  <span className="font-semibold text-blue-600">
                    ₹{(parseFloat(selectedSale.total_amount) || 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-3 border-b pb-2">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border text-sm">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="border px-3 py-2 text-left">Sr No.</th>
                    <th className="border px-3 py-2 text-left">Product Name</th>
                    <th className="border px-3 py-2 text-right">Unit</th>
                    <th className="border px-3 py-2 text-right">QTY</th>
                    <th className="border px-3 py-2 text-right">Tax (%)</th>
                    <th className="border px-3 py-2 text-right">Unit Price</th>
                    <th className="border px-3 py-2 text-right">Total Price</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedSale.line_items && selectedSale.line_items.length > 0 ? (
                    selectedSale.line_items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border px-3 py-2">{item.sr_no}</td>
                        <td className="border px-3 py-2">{item.product_name}</td>
                        <td className="border px-3 py-2 text-right">{item.unit}</td>
                        <td className="border px-3 py-2 text-right">{item.qty}</td>
                        <td className="border px-3 py-2 text-right">{item.tax}%</td>
                        <td className="border px-3 py-2 text-right">
                          ₹{(parseFloat(item.unit_price) || 0).toLocaleString()}
                        </td>
                        <td className="border px-3 py-2 text-right font-medium">
                          ₹{(parseFloat(item.total_price) || 0).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center py-4 text-gray-500">No items listed</td>
                    </tr>
                  )}
                </tbody>
                {selectedSale.line_items && selectedSale.line_items.length > 0 && (
                  <tfoot className="bg-gray-50 font-medium">
                    <tr>
                      <td colSpan="5" className="border px-3 py-2 text-right">Subtotal:</td>
                      <td colSpan="2" className="border px-3 py-2 text-right">
                        ₹{calculateSubtotal(selectedSale.line_items).toLocaleString()}
                      </td>
                    </tr>
                    <tr>
                      <td colSpan="5" className="border px-3 py-2 text-right">Tax Amount:</td>
                      <td colSpan="2" className="border px-3 py-2 text-right">
                        ₹{calculateTaxAmount(selectedSale)}
                      </td>
                    </tr>
                    <tr className="font-bold">
                      <td colSpan="5" className="border px-3 py-2 text-right">Total:</td>
                      <td colSpan="2" className="border px-3 py-2 text-right text-blue-600">
                        ₹{(parseFloat(selectedSale.total_amount) || 0).toLocaleString()}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;