import React, { useEffect, useState, useCallback } from 'react';
import Header from '../Header/Header';
import { API } from '../../Api';
import { AlertCircle } from "lucide-react";
import { Navigate, useNavigate } from 'react-router-dom';
import deleteIcon from "../../assets/delete.svg";
import html2pdf from 'html2pdf.js'; // Import html2pdf

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

const Invoice = () => {
  const navigate = useNavigate();
  const [customerDetails, setCustomerDetails] = useState({
    _id: '',
    phone: '',
    name: '',
    date: new Date().toISOString().split('T')[0], // Set today's date
    address: '',
  });

  const [receivedAmount, setReceivedAmount] = useState(0);
  const [plates, setPlates] = useState([]); // State to store the list of plates
  const [invoiceNumber, setInvoiceNumber] = useState(''); // For Dynamic Invoice Number
  const [products, setProducts] = useState([]); // State to store products
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [searchTerm, setSearchTerm] = useState(''); // For product search
  const [filteredProducts, setFilteredProducts] = useState([]); // For displaying search results
  const [customers, setCustomers] = useState([]); // For displaying customer search results
  const [filteredCustomers, setFilteredCustomers] = useState([]); // For displaying customer search results
  const [searchCustomerTerm, setSearchCustomerTerm] = useState(''); // For customer search
  const [error, setError] = useState(''); // State to store error messages
  const [isLoading, setIsLoading] = useState(false); // Loading state for individual API calls
  const [paymentMethod, setPaymentMethod] = useState('Cash'); // Default payment method
  const [popup, setPopup] = useState({ message: "", type: "" });

  const showPopup = useCallback((message, type = "success") => {
    setPopup({ message, type });
    setTimeout(() => setPopup({ message: "", type: "" }), 3000);
  }, []);

  // Calculate invoice totals dynamically
  const calculateSubtotal = () => {
    return plates.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);
  };

  const calculateTax = () => {
    return plates.reduce((sum, item) => {
      const itemPrice = item.unit_price * item.qty;
      const taxAmount = itemPrice * (item.tax / 100);
      return sum + taxAmount;
    }, 0);
  };

  const calculateTotal = (subtotal, tax, discount) => {
    return (subtotal + tax) - discount;
  };

  const subtotal = calculateSubtotal();
  const taxTotal = calculateTax();
  const discount = 0; // Placeholder for future discount logic
  const total = calculateTotal(subtotal, taxTotal, discount);
  const dueAmount = total - receivedAmount;

  // Generate invoice number dynamically
  // In the useEffect for invoice number generation
  useEffect(() => {
    const invoicePrefix = localStorage.getItem('invoicePrefix') || 'INV';
    setInvoiceNumber(`${invoicePrefix}-${Date.now()}`);
    fetchProducts();
    fetchCustomers();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await API.get('/getProducts'); // Adjust the endpoint as necessary
      setProducts(response.data.data); // Assuming the response structure
      showPopup("", "error");
    } catch (error) {
      console.error("Error fetching products:", error);
      showPopup("Error fetching products:", "error");
      setError("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await API.get('/Customers'); // Get all customers
      setCustomers(response.data.data); // Assuming the response structure
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearAllInputs = () => {
    // Reset all form data
    setCustomerDetails({
      _id: '',
      phone: '',
      name: '',
      date: new Date().toISOString().split('T')[0], // Reset to today's date
      address: '',
    });
    setPlates([]);
    setReceivedAmount(0);
    setPaymentMethod('Cash');

    // Generate new invoice number
    const invoicePrefix = localStorage.getItem('invoicePrefix') || 'INV';
    setInvoiceNumber(`${invoicePrefix}-${Date.now()}`);
  };

  // Handle adding a new plate with structured data
  const handleAddPlate = () => {
    setPlates([...plates, {
      productName: '',
      category: '',
      unit_price: 0,
      qty: 1,
      tax: 0,
      total: 0,
      unit: 'Base'
    }]);
  };

  // Handle removing a plate
  const handleRemovePlate = (index) => {
    setPlates(plates.filter((_, i) => i !== index));
  };

  // Handle plate input change
  const handlePlateChange = (index, field, value) => {
    const updatedPlates = [...plates];
    updatedPlates[index][field] = value;

    // If the unit is changed, update the unit_price based on the selected unit
    if (field === 'unit') {
      const product = products.find(p => p.productName === updatedPlates[index].productName);
      if (product) {
        updatedPlates[index].unit_price = value === product.unitOfMeasure ? product.sales_price : product.alternate_unit_sales_price;
      }
    }

    // Recalculate total for the item
    const unit_price = parseFloat(updatedPlates[index].unit_price) || 0;
    const qty = parseInt(updatedPlates[index].qty) || 1;
    const tax = parseFloat(updatedPlates[index].tax) || 0;

    updatedPlates[index].total = (unit_price * qty) + (unit_price * qty * tax / 100);
    setPlates(updatedPlates);
  };

  // Generate PDF from the invoice template
  // Modify the generatePDF function
  const generatePDF = () => {
    const element = document.getElementById('invoice-template');
    // First make sure it's visible when generating
    element.style.display = "block";

    const opt = {
      margin: 10,
      filename: `invoice_${invoiceNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 5 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    // Use a Promise to hide the element after PDF generation is complete
    html2pdf().set(opt).from(element).save().then(() => {
      // Hide the element after PDF is generated
      element.style.display = "none";
    });
  };

  const handleSubmitInvoice = async () => {
    if (!/^\d{10}$/.test(customerDetails.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (!customerDetails._id) {
      setError("Please select a valid customer.");
      return;
    }
    if (receivedAmount < 0) {
      setError("Received amount cannot be negative.");
      return;
    }
    if (plates.length === 0) {
      setError("Please add at least one product.");
      return;
    }

    // Format line items to match backend expectations
    const formattedLineItems = plates.map((item, index) => ({
      sr_no: index + 1,
      product_name: item.productName,
      unit: item.unit ? item.unit.toString() : "N/A",
      qty: parseInt(item.qty) || 1,
      tax: parseFloat(item.tax) || 0,
      unit_price: parseFloat(item.unit_price) || 0,
      total_price: parseFloat(item.unit_price * item.qty) || 0
    }));

    const invoiceData = {
      customer_id: customerDetails._id,
      customer_name: customerDetails.name,
      invoice_number: invoiceNumber,
      sub_total: subtotal,
      tax_amount: taxTotal,
      total_amount: total,
      discount: discount,
      payment_method: paymentMethod,
      payment_status: receivedAmount >= total ? "Paid" : "Pending",
      line_items: formattedLineItems
    };

    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await API.post('/createInvoice', invoiceData);
      console.log("Invoice created successfully:", response.data);

      showPopup("Invoice created successfully!", "success");

      // Generate PDF after successful invoice creation
      generatePDF();

      // Clear all form inputs after successful invoice creation
      clearAllInputs();

      // Optional: navigate to another page or reload the current one
      // navigate('/invoices'); // Navigate to invoices list
    } catch (error) {
      console.error("Error creating invoice:", error);
      if (error.response && error.response.data && error.response.data.message) {
        setError(`Failed to create invoice: ${error.response.data.message}`);
      } else {
        setError("Failed to create invoice. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle product search
  const handleProductSearch = (e) => {
    setSearchTerm(e.target.value);
    if (e.target.value) {
      const filtered = products.filter(product =>
        product.productName.toLowerCase().includes(e.target.value.toLowerCase())
      );
      setFilteredProducts(filtered);
    } else {
      setFilteredProducts([]);
    }
  };

  // Handle selecting a product
  const handleSelectProduct = (product) => {
    setPlates([...plates, {
      productName: product.productName,
      unit_price: product.sales_price, // Use sales_price from the product object
      category: product.category,
      qty: 1,
      tax: product.tax_rate, // Use tax_rate from the product object
      total: product.sales_price,
      unit: product.unitOfMeasure, // Assuming product has a unit field
      alternate_unit: product.alternate_unit,
      alternate_unit_sales_price: product.alternate_unit_sales_price,
      unitOfMeasure: product.unitOfMeasure
    }]);
    setSearchTerm(''); // Clear search input
    setFilteredProducts([]); // Clear search results
  };

  // Handle customer search
  const handleCustomerSearch = async (e) => {
    setSearchCustomerTerm(e.target.value);
    if (e.target.value) {
      try {
        const response = await API.post('/Customers', { customerName: e.target.value });
        setFilteredCustomers(response.data.data);
      } catch (error) {
        console.error("Error searching customers:", error);
        setError("Failed to search customers. Please try again.");
      }
    } else {
      setFilteredCustomers([]);
    }
  };

  const handleSelectCustomer = (customer) => {
    setCustomerDetails({
      _id: customer._id,
      phone: customer.phone,
      name: customer.name,
      address: customer.address,
      date: new Date().toISOString().split('T')[0]
    });
    setSearchCustomerTerm(''); // Clear search input
    setFilteredCustomers([]); // Clear search results
  };

  const handlePaymentMethodChange = (method) => {
    setPaymentMethod(method);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      {error && (
        <div className="fixed top-5 left-1/2 transform -translate-x-1/2 text-red-500 text-center p-2 bg-red-50 border border-red-200 rounded shadow-md z-50">
          {error}
        </div>
      )}
      {popup.message && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded shadow-lg text-white z-50 flex items-center ${popup.type === "success" ? "bg-green-500" : "bg-red-500"
            }`}
        >
          <AlertCircle className="mr-2" size={18} />
          {popup.message}
        </div>
      )}
      <div className='main w-full h-fit pb-16 sm:pb-[50vh] bg-blue-100 flex flex-col lg:flex-row'>
        {/* Left Section */}
        <div className='left w-full lg:w-[60%] xl:w-[65%] h-full p-2 sm:p-4'>
          <div className='customer bg-white p-3 rounded shadow-md'>
            <div className='title flex flex-col sm:flex-row justify-between mb-4 gap-2'>
              <div className='text-lg font-semibold'>CUSTOMER DETAILS</div>
              <div className='customer_search relative w-full sm:w-auto'>
                <input
                  type="text"
                  placeholder="Search Customer"
                  value={searchCustomerTerm}
                  onChange={handleCustomerSearch}
                  className="border border-gray-300 p-2 rounded w-full outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                />
                {filteredCustomers?.length > 0 && (
                  <div className="absolute z-10 bg-white border border-gray-300 w-full max-h-60 overflow-y-auto">
                    {filteredCustomers.map((customer, index) => (
                      <div key={index} className="p-2 cursor-pointer hover:bg-gray-200" onClick={() => handleSelectCustomer(customer)}>
                        {customer.name} - {customer.phone}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Customer Name"
                className="border border-gray-300 p-2 rounded w-full sm:w-auto outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
              />
            </div>
            <div className='customer_info flex flex-col sm:flex-row justify-between gap-4'>
              <div className='customer_info_left w-full sm:w-1/2 bg-white p-4 rounded shadow-md'>
                <div className='flex justify-between mb-2'>
                  <div>
                    <div>INVOICE NO</div>
                    <div>{invoiceNumber}</div>
                  </div>
                  <div>
                    <div>CONTACT NO</div>
                    <input
                      type="tel"
                      placeholder="Enter mobile number"
                      pattern="[0-9]{10}"
                      maxLength="10"
                      value={customerDetails.phone}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, phone: e.target.value })}
                      className="border border-gray-300 p-2 rounded w-full outline-none"
                    />
                  </div>
                </div>
                <div className='border-t border-gray-300 my-2'></div>
                <div>
                  <div>DATE</div>
                  <input
                    type="date"
                    value={customerDetails.date}
                    readOnly // Make date non-editable
                    className="border border-gray-300 p-2 rounded w-full outline-none" />
                </div>
              </div>

              <div className='customer_info_right w-full sm:w-1/2 bg-white p-4 rounded shadow-md'>
                <div className='flex justify-between mb-2'>
                  <div className="w-full">
                    <div>ADDRESS</div>
                    <input
                      type="text"
                      placeholder="Enter address"
                      maxLength="50"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                      className="border border-gray-300 p-2 rounded w-full outline-none"
                    />
                  </div>
                  <div>
                    <img
                      src={deleteIcon}
                      alt="Delete"
                      onClick={clearAllInputs}
                      className="cursor-pointer w-5 h-5 ml-2"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-gray-400 my-3'></div>

          <div className='Product_details bg-white p-4 rounded shadow-md'>
            <div className='title flex flex-col sm:flex-row justify-between mb-4 gap-2'>
              <div className='text-lg font-semibold'>PRODUCT CART</div>
              <div className="relative w-full sm:w-auto">
                <input
                  type="text"
                  placeholder="Search Product"
                  value={searchTerm}
                  onChange={handleProductSearch}
                  className="border border-gray-300 p-2 rounded w-full outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                />
                {filteredProducts?.length > 0 && (
                  <div className="absolute z-10 bg-white border border-gray-300 w-full max-h-60 overflow-y-auto">
                    {filteredProducts.map((product, index) => (
                      <div key={index} className="p-2 cursor-pointer hover:bg-gray-200" onClick={() => handleSelectProduct(product)}>
                        {product.productName}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={handleAddPlate}
                className='bg-blue-500 text-white font-medium py-2 px-4 rounded hover:bg-blue-600 focus:outline-none'
              >
                Add
              </button>
            </div>
            <div className='border-t border-gray-400 my-3'></div>
            <div className='product_list overflow-x-auto'>
              <div className="field_name flex justify-between px-2 sm:px-4 items-center text-xs sm:text-sm">
                <div className='w-1/4 sm:w-auto'>Product Name</div>
                <div className='w-1/6 sm:w-auto text-center'>Rate</div>
                <div className='w-1/6 sm:w-auto text-center'>Unit of Measure</div>
                <div className='w-1/6 sm:w-auto text-center'>QTY</div>
                <div className='w-1/6 sm:w-auto text-center'>Tax % </div>
                <div className='w-1/6 sm:w-auto text-center'>Total</div>
                <div></div>
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto">
              {plates.map((plate, index) => (
                <div key={index} className="white_plate flex flex-wrap sm:flex-nowrap justify-between items-center mt-2 bg-white p-2 rounded shadow-md gap-1">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={plate.productName}
                    onChange={(e) => handlePlateChange(index, 'productName', e.target.value)}
                    className='border border-gray-300 p-1 sm:p-2 rounded w-full sm:w-1/4 text-xs sm:text-sm'
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={plate.unit_price}
                    onChange={(e) => handlePlateChange(index, 'unit_price', e.target.value)}
                    className='border border-gray-300 p-1 sm:p-2 rounded w-1/2 sm:w-1/6 text-xs sm:text-sm'
                  />
                  <select
                    value={plate.unit}
                    onChange={(e) => handlePlateChange(index, 'unit', e.target.value)}
                    className='border border-gray-300 p-1 sm:p-2 rounded w-1/2 sm:w-1/6 text-xs sm:text-sm'
                  >
                    <option value={plate.unitOfMeasure}>{plate.unitOfMeasure}</option>
                    {plate.alternate_unit && <option value={plate.alternate_unit}>{plate.alternate_unit}</option>}
                  </select>
                  <input
                    type="number"
                    placeholder="qty"
                    value={plate.qty}
                    onChange={(e) => handlePlateChange(index, 'qty', e.target.value)}
                    className='border border-gray-300 p-1 sm:p-2 rounded w-1/3 sm:w-1/6 text-xs sm:text-sm'
                  />
                  <input
                    type="number"
                    placeholder="Tax %"
                    value={plate.tax}
                    onChange={(e) => handlePlateChange(index, 'tax', e.target.value)}
                    className='border border-gray-300 p-1 sm:p-2 rounded w-1/3 sm:w-1/6 text-xs sm:text-sm'
                  />
                  <div className='w-1/3 sm:w-1/6 text-center font-bold text-xs sm:text-sm'>{(plate.unit_price * plate.qty).toFixed(2)}</div>
                  <div onClick={() => handleRemovePlate(index)} className='cursor-pointer flex justify-center w-6'>
                    <img src="../src/assets/cross.png" alt="Close" className="h-4 sm:h-5" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Section */}
        <div className='right w-full lg:w-[40%] xl:w-[35%] h-auto bg-gray-50 p-4 lg:fixed lg:right-0 lg:top-16 lg:bottom-0 lg:overflow-y-auto'>
          <div className='detail_payment'>
            <div className="title text-xl my-3">Invoice</div>
            <div className='calculations'>
              <div className='sub_total flex justify-between text-sm'>
                <div>Sub Total</div>
                <div>{subtotal.toFixed(2)}</div>
              </div>
              <div className='Taxes flex justify-between text-sm'>
                <div>Taxes</div>
                <div>{taxTotal.toFixed(2)}</div>
              </div>
              <div className='Discounts flex justify-between text-sm'>
                <div>Discount</div>
                <div>{discount.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className='border-t border-gray-300 my-5'></div>

          <div className='accepting_payments'>
            <div className="payment_mode grid grid-cols-2 sm:flex sm:justify-around gap-2 mb-5">
              <div
                className={`h-10 ${paymentMethod === 'Cash' ? 'bg-blue-500 text-white' : 'bg-gray-200'} w-full sm:w-auto p-2 px-4 sm:px-6 rounded cursor-pointer text-center`}
                onClick={() => handlePaymentMethodChange('Cash')}
              >
                CASH
              </div>
              <div
                className={`h-10 ${paymentMethod === 'Credit Card' ? 'bg-blue-500 text-white' : 'bg-gray-200'} w-full sm:w-auto p-2 px-4 sm:px-6 rounded cursor-pointer text-center`}
                onClick={() => handlePaymentMethodChange('Credit Card')}
              >
                CARD
              </div>
              <div
                className={`h-10 ${paymentMethod === 'UPI' ? 'bg-blue-500 text-white' : 'bg-gray-200'} w-full sm:w-auto p-2 px-4 sm:px-6 rounded cursor-pointer text-center`}
                onClick={() => handlePaymentMethodChange('UPI')}
              >
                UPI
              </div>
              <div
                className={`h-10 ${paymentMethod === 'Bank Transfer' ? 'bg-blue-500 text-white' : 'bg-gray-200'} w-full sm:w-auto p-2 px-4 sm:px-6 rounded cursor-pointer text-center`}
                onClick={() => handlePaymentMethodChange('Bank Transfer')}
              >
                WALLET
              </div>
            </div>
            <div className='recived_payment flex justify-center'>
              <input
                type="number"
                placeholder="Received Amount"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(parseFloat(e.target.value) || 0)}
                className="pl-5 w-full max-w-xs p-2 border border-gray-300 rounded outline-none text-sm text-gray-700 focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          <div className='border-t border-gray-300 my-5'></div>

          <div className='amount mt-5 sm:mt-10'>
            <div className='flex flex-col sm:flex-row justify-between gap-4 sm:gap-0 mt-5'>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-full sm:w-5/12 rounded">
                <div className="text-sm">Collected Amount</div>
                <div className="text-sm font-bold mt-1">{receivedAmount}</div>
              </div>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-full sm:w-5/12 rounded">
                <div className="text-sm">Due Amount</div>
                <div className="text-sm font-bold mt-1">{dueAmount.toFixed(2)}</div>
              </div>
            </div>
            <div className='flex justify-center mt-5'>
              <button
                className="bg-blue-500 text-white text-center shadow-md p-2 w-full max-w-xs rounded cursor-pointer hover:bg-blue-600 transition-colors"
                onClick={handleSubmitInvoice}
                disabled={isLoading}
              >
                {isLoading ? "Processing..." : "Create Invoice"}
              </button>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white p-4 rounded shadow-lg">
          <div className="text-center font-semibold">Processing...</div>
        </div>
      </div>}

      // Fixed invoice template section

// The main issues in the current template:
// 1. Too much bold text
// 2. Poor spacing and alignment
// 3. Potential overflow issues

// Replace the existing hidden invoice template section with this improved version:

{/* Hidden Invoice Template for PDF Generation */}
<div id="invoice-template" style={{ display: 'none', width: '190mm', height:'100%', margin: '0', padding: '0', fontFamily: 'Arial, sans-serif', fontSize: '10pt' }}>
  <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', height:'100%' }}>
    <thead>
      <tr>
        <th colSpan="7" style={{ textAlign: 'center', fontSize: '18px', padding: '8px', borderBottom: '1px solid #ccc' }}>
        {orgName || 'Billing System Invoice'}
        </th>
      </tr>
      <tr>
        <th colSpan="7" style={{ textAlign: 'center', padding: '8px', borderBottom: '1px solid #ccc', fontWeight: 'normal' }}>
          <p style={{ margin: '5px 0', fontWeight: 'bold' }}>{(orgName) || 'Billing System Invoice'}</p>
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
    <tbody >
      <tr>
        <td rowSpan="2" colSpan="4" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
          <div style={{ fontWeight: 'bold' }}>Customer Info</div>
          <div style={{ marginBottom: '3px' }}>
            <strong>M/s. :</strong> <span>{customerDetails.name}</span>
          </div>
          <div style={{ marginBottom: '3px' }}>
            <span>{customerDetails.address}</span>
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>Place of Supply :</strong> <span>27-Maharashtra</span>
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>Mob No.:</strong> <span>{customerDetails.phone}</span>
          </div>
          <div>
            <strong>GSTIN No. :</strong> <span></span>
          </div>
        </td>
        <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px', verticalAlign: 'top' }}>
          <div style={{ marginBottom: '3px' }}>
            <strong>Invoice No. :</strong> <span>{invoiceNumber}</span>
          </div>
          <div>
            <strong>Date:</strong> <span>{customerDetails.date}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan="3" style={{ height: '20px', border: '1px solid #ccc' }}></td>
      </tr>
      <tr style={{alignItems: 'center', textAlign:'center'}} >
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>Sr No</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '20%', fontWeight: 'normal' }}>Product Name</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '15%', fontWeight: 'normal' }}>Category</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>QTY</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>Rate</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '10%', fontWeight: 'normal' }}>GST%</th>
        <th style={{ border: '1px solid #ccc', paddingBottom: '6px', backgroundColor: '#f2f2f2', width: '25%', fontWeight: 'normal' }}>Amount</th>
      </tr>
      {plates.map((plate, index) => (
        <tr key={index} style={{textAlign:'center', alignItems:'center',width:'100%',height:'100%'}}>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{index + 1}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{plate.productName}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{plate.category}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{plate.qty}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{plate.unit_price}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{plate.tax}</td>
          <td style={{ textAlign: 'center', border: '1px solid #ccc', paddingBottom: '5px' }}>{(plate.unit_price * plate.qty).toFixed(2)}</td>
        </tr>
      ))}
      <tr>
        <td colSpan="4" style={{ border: '1px solid #ccc', padding: '5px' }}>
          <strong>GSTIN No.:</strong> <span style={{ paddingLeft: '5px' }}>{GSTNumber || 'GS3923929322393'}</span>
        </td>
        <td colSpan="3" style={{ border: '1px solid #ccc', padding: '5px', textAlign: 'right' }}>
          <strong>Sub Total:</strong> <span>{subtotal.toFixed(2)}</span>
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
            <strong>Taxable Amount:</strong> <span>{subtotal.toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>SGST:</strong> <span>{(taxTotal / 2).toFixed(2)}</span>
          </div>
          <div style={{ marginBottom: '3px' }}>
            <strong>CGST:</strong> <span>{(taxTotal / 2).toFixed(2)}</span>
          </div>
        </td>
      </tr>
      <tr>
        <td colSpan="4" style={{ border: '1px solid #ccc', padding: '5px' }}>
          <div style={{ marginBottom: '3px' }}>
            <strong>Total GST:</strong> <span>{taxTotal.toFixed(2)}</span>
          </div>
          <div>
            <strong>Bill Amount:</strong> <span>{total.toFixed(2)}</span>
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
                  <td style={{ border: '1px solid #ccc', padding: '3px' }}>{subtotal.toFixed(2)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '3px' }}>{(taxTotal / 2).toFixed(2)}</td>
                  <td style={{ border: '1px solid #ccc', padding: '3px' }}>{(taxTotal / 2).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </td>
        <td colSpan="3" rowSpan="1" style={{ border: '1px solid #ccc', padding: '5px' }}>
          <div>
            <h4 style={{ margin: '5px 0', fontWeight: 'normal' }}>Grand Total</h4>
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{total.toFixed(2)}</span>
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
                <div>For {orgName || ''}</div>
                <div style={{ fontSize: '9pt', marginTop: '2px' }}> (Authorised Signatory)</div>
              </div>
            </div>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</div>
    </div>
  );
};

export default Invoice;