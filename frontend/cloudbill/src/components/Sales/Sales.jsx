import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Header from '../Header/Header';
import { API } from '../../Api';
import html2pdf from 'html2pdf.js'; // Import html2pdf
import { AlertCircle, Search, Plus, X } from "lucide-react";


const orgName = localStorage.getItem("orgName");
const orgEmail = localStorage.getItem("orgEmail");
const orgPhone = JSON.parse(localStorage.getItem("orgPhone"));
const ownerName = localStorage.getItem("ownerName");
const orgAddressObj = JSON.parse(localStorage.getItem("orgAddress"));
const GSTNumber = localStorage.getItem("GSTNumber");
const orgWebsite = localStorage.getItem("orgWebsite");
const orgCategory = localStorage.getItem("orgCategory");
const orgDescription = localStorage.getItem("orgDescription");
const orgCurrency = localStorage.getItem("orgCurrency");
const orgTerms = JSON.parse(localStorage.getItem("orgTerms"));
const invoicePrefix = localStorage.getItem("invoicePrefix");

const Sales = () => {
  const deleteInvoice = useCallback(async (selectedInvoice) => {
    console.log("Delete invoice called", selectedInvoice);
    if (!window.confirm("Are you sure you want to delete this invoice?")) {
      return;
    }
    setLoading(true); // Start loading
    try {
      const res = await API.delete(`/removeinvoice/${selectedInvoice}`);
      console.log(res);

      // Check if the response indicates success
      if (res.status === 200) {
        // Update the sales state to remove the deleted invoice
        setSales((prevSales) => prevSales.filter(sale => sale._id !== selectedInvoice));
        console.log("Invoice deleted successfully");
        fetchSales()
        showPopup("Invoice deleted successfully")
        setSelectedSale(null)
      } else {
        console.error("Failed to delete invoice");
      }
    } catch (error) {
      console.error("Error deleting invoice:", error);
    } finally {
      setLoading(false); // Stop loading
    }
  }, []);
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
      console.log(response);
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

    // Search filter
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

    // Date range filter
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

    // Amount sorting
    if (filters.amount) {
      result.sort((a, b) => {
        const aAmount = parseFloat(a.total_amount) || 0;
        const bAmount = parseFloat(b.total_amount) || 0;
        return filters.amount === 'low-high' ? aAmount - bAmount : bAmount - aAmount;
      });
    }

    // Date sorting
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

  const generatePDF = () => {
    const element = document.getElementById('invoice-template');
    element.style.display = "block";

    const opt = {
      margin: 10,
      filename: `invoice_${selectedSale.invoice_number}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 5 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(element).save().then(() => {
      element.style.display = "none";
    });
  };
  const [popup, setPopup] = useState({ message: "", type: "" });
  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      {popup.message && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 flex items-center ${popup.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
        >
          <AlertCircle className="mr-2" size={18} />
          {popup.message}
        </div>
      )}
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
              </div >
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
              <div className="flex space-x-2">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded"
                  onClick={generatePDF}
                >
                  Print
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteInvoice(selectedSale.invoice_number)}
                >
                  Delete
                </button>
                <button
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => setSelectedSale(null)}
                >
                  Close
                </button>
              </div>
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

      {/* Hidden Invoice Template for PDF Generation - Only render when selectedSale is not null */}
      {selectedSale && (
        <div id="invoice-template" style={{ display: 'none', width: '190mm', height: '100%', margin: '0', padding: '0', fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', height: '100%' }}>
            <thead>
              <tr>
                <th colSpan="7" style={{ textAlign: 'center', fontSize: '18px', padding: '8px', borderBottom: '1px solid #ccc' }}>
                  {orgName || 'Billing System Invoice'}
                </th>
              </tr>
              <tr>
                <th colSpan="7" style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ccc', fontWeight: 'normal' }}>
                  <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{orgName || 'Billing System Invoice'}</p>
                  <p style={{ margin: '5px 0' }}>{orgAddressObj ? `${orgAddressObj.street}, ${orgAddressObj.city}, ${orgAddressObj.state}` : 'Gat No 123 ABC Road Hanumanwadi, Alandi, Pune'}</p>
                  <p style={{ margin: '5px 0' }}>
                    <span>Cell: {orgPhone ? orgPhone.join(' / ') : '1234567890 / 0000000000'}</span>
                    <span style={{ marginLeft: '15px' }}>E-mail: {orgEmail || 'abcxyz1123@gmail.com'}</span>
                    {orgWebsite && <span style={{ marginLeft: '15px' }}>Website: {orgWebsite}</span>}
                  </p>
                </th>
              </tr>
              <tr>
                <th colSpan="7" style={{ textAlign: 'center', padding: '5px', borderBottom: '1px solid #ccc', fontWeight: 'normal' }}>
                  <strong>Debit Memo</strong> &nbsp;&nbsp; <strong>TAX INVOICE</strong> &nbsp;&nbsp; <strong>Original</strong>
                </th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td rowSpan="2" colSpan="4" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
                  <div style={{ fontWeight: 'bold' }}>Customer Info</div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>M/s. :</strong> <span>{selectedSale.customer_name}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <span>{selectedSale.customer_address}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Place of Supply :</strong> <span>27-Maharashtra</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Mob No.:</strong> <span>{selectedSale.customer_phone}</span>
                  </div>
                  <div>
                    <strong>GSTIN No. :</strong> <span></span>
                  </div>
                </td>
                <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Invoice No. :</strong> <span>{selectedSale.invoice_number}</span>
                  </div>
                  <div>
                    <strong>Date:</strong> <span>{formatDate(selectedSale.createdAt)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="3" style={{ height: '20px', border: '1px solid #ccc' }}></td>
              </tr>
              <tr style={{ alignItems: 'center', textAlign: 'center' }}>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>Sr No</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '20%', fontWeight: 'normal' }}>Product Name</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '15%', fontWeight: 'normal' }}>Unit</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>QTY</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>Rate</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>GST%</th>
                <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '25%', fontWeight: 'normal' }}>Amount</th>
              </tr>
              {selectedSale.line_items && selectedSale.line_items.map((item, index) => (
                <tr key={index} style={{ textAlign: 'center', alignItems: 'center', width: '100%', height: '100%' }}>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{index + 1}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{item.product_name}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{item.unit}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{item.qty}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{item.unit_price}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{item.tax}</td>
                  <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{(item.unit_price * item.qty).toFixed(2)}</td>
                </tr>
              ))}
              <tr>
                <td colSpan="4" style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <strong>GSTIN No.:</strong> <span style={{ paddingLeft: '5px' }}>{GSTNumber || 'GS3923929322393'}</span>
                </td>
                <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>
                  <strong>Sub Total:</strong> <span>{calculateSubtotal(selectedSale.line_items).toFixed(2)}</span>
                </td>
              </tr>
              <tr>
                <td colSpan="4" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Bank Name:</strong> <span>{localStorage.getItem('bankName') || ''}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Bank A/C No.:</strong> <span>{localStorage.getItem('bankAccount') || ''}</span>
                  </div>
                  <div>
                    <strong>RTGS/IFSC Code:</strong> <span>{localStorage.getItem('bankIFSC') || ''}</span>
                  </div>
                </td>
                <td colSpan="3" rowSpan="2" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Taxable Amount:</strong> <span>{calculateSubtotal(selectedSale.line_items).toFixed(2)}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>SGST:</strong> <span>{(calculateTaxAmount(selectedSale) / 2)}</span>
                  </div>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>CGST:</strong> <span>{(calculateTaxAmount(selectedSale) / 2)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="4" style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <div style={{ marginBottom: '3px' }}>
                    <strong>Total GST:</strong> <span>{calculateTaxAmount(selectedSale)}</span>
                  </div>
                  <div>
                    <strong>Bill Amount:</strong> <span>{selectedSale.total_amount.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="4" rowSpan="2" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
                  <div>
                    <h4 style={{ margin: '5px 0', fontWeight: 'normal' }}>Rate Wise Summary:</h4>
                    <table style={{ width: '100%', margin: '5px 0', textAlign: 'center', borderCollapse: 'collapse', border: '1px solid #ccc', fontSize: '9pt' }}>
                      <thead>
                        <tr>
                          <th style={{ border: '1px solid #ccc', padding: '3px', fontWeight: 'normal' }}>Taxable Value</th>
                          <th style={{ border: '1px solid #ccc', padding: '3px', fontWeight: 'normal' }}>CGST Amount</th>
                          <th style={{ border: '1px solid #ccc', padding: '3px', fontWeight: 'normal' }}>SGST Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <td style={{ border: '1px solid #ccc', padding: '3px' }}>{calculateSubtotal(selectedSale.line_items).toFixed(2)}</td>
                          <td style={{ border: '1px solid #ccc', padding: '3px' }}>{(calculateTaxAmount(selectedSale) / 2)}</td>
                          <td style={{ border: '1px solid #ccc', padding: '3px' }}>{(calculateTaxAmount(selectedSale) / 2)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </td>
                <td colSpan="3" rowSpan="1" style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <div>
                    <h4 style={{ margin: '5px 0', fontWeight: 'normal' }}>Grand Total</h4>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{selectedSale.total_amount.toFixed(2)}</span>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <div>
                    <strong>Note: </strong>
                    <p style={{ margin: '2px 0', fontSize: '9pt' }}></p>
                  </div>
                </td>
              </tr>
              <tr>
                <td colSpan="7" style={{ border: '1px solid #ccc', padding: '5px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div style={{ width: '60%' }}>
                      <strong>Terms & Conditions: </strong>
                      <ol type="1" style={{ fontSize: '9pt', margin: '5px 0 5px 20px', paddingLeft: '0' }}>
                        {orgTerms && orgTerms.length > 0 ?
                          orgTerms.map((term, index) => <li key={index}>{term}</li>) :
                          <>
                            <li>Goods once sold will not be taken back.</li>
                            <li>Interest @18% p.a. will be charged if payment is not made within due date.</li>
                            <li>Our risk and responsibility ceases as soon as the goods leave our premises.</li>
                            <li>"Subject to 'Pune' Jurisdiction only. E.&.O.E"</li>
                          </>
                        }
                      </ol>
                    </div>
                    <div style={{ textAlign: 'center', width: '30%', marginTop: '20px' }}>
                      <div style={{ borderTop: '1px solid #ccc', paddingTop: '5px', width: '150px', margin: '0 auto' }}>
                        <div> For {orgName || ''}</div>
                        <div style={{ fontSize: '9pt', marginTop: '2px' }}> (Authorised Signatory)</div>
                      </div>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Sales;