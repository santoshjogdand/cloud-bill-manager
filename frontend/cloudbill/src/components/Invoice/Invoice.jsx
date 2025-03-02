import React, { useEffect, useState } from 'react';
import Header from '../Header/Header';
import { API } from '../../Api'; // Assuming you have an API utility for making requests
import jsPDF from 'jspdf';

const calculateSubtotal = (lineItems) => {
  return lineItems.reduce((sum, item) => sum + item.total, 0);
};

const calculateTax = (lineItems) => {
  return lineItems.reduce((sum, item) => sum + (item.total - (item.unit_price * item.nos)), 0);
};

const calculateTotal = (subtotal, tax, discount) => {
  return (subtotal + tax) - discount;
};

const validateItemsData = (item) => {
  const unitPrice = item.unit_price;
  const nos = item.nos;
  const totalPrice = item.total;
  return unitPrice * nos === totalPrice;
};

const validateTotal = (reqTotal, actualTotal) => {
  return reqTotal !== actualTotal;
};

const Invoice = () => {
  const [customerDetails, setCustomerDetails] = useState({
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

  // Generate invoice number dynamically
  useEffect(() => {
    const invoicePrefix = localStorage.getItem('invoicePrefix') || 'INV';
    setInvoiceNumber(`${invoicePrefix}-${Date.now()}`);
    fetchProducts(); // Fetch products on component mount
    fetchCustomers(); // Fetch customers on component mount
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await API.get('/getProducts'); // Adjust the endpoint as necessary
      setProducts(response.data.data); // Assuming the response structure
    } catch (error) {
      console.error("Error fetching products:", error);
      setError("Failed to fetch products. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    setLoading(true);
    setError(''); // Clear previous errors
    try {
      const response = await API.get('Customers'); // Adjust the endpoint as necessary
      setCustomers(response.data.data); // Assuming the response structure
    } catch (error) {
      console.error("Error fetching customers:", error);
      setError("Failed to fetch customers. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const clearInputs = () => {
    setCustomerDetails({
      phone: '',
      name: '',
      date: new Date().toISOString().split('T')[0], // Reset to today's date
      address: '',
    });
  };

  // Handle adding a new plate with structured data
  const handleAddPlate = () => {
    setPlates([...plates, { 
      productName: '', 
      unit_price: 0, 
      quantity: 0, 
      nos: 1, 
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
    const nos = parseInt(updatedPlates[index].nos) || 1;
    const tax = parseFloat(updatedPlates[index].tax) || 0;

    updatedPlates[index].total = (unit_price * nos) + (unit_price * nos * tax / 100);
    setPlates(updatedPlates);
  };

  // Calculate invoice totals dynamically
  const subtotal = calculateSubtotal(plates);
  const taxTotal = calculateTax(plates);
  const discount = 0; // Placeholder for future discount logic
  const total = calculateTotal(subtotal, taxTotal, discount);
  const dueAmount = total - receivedAmount;

  const handleSubmitInvoice = async () => {
    if (!/^\d{10}$/.test(customerDetails.phone)) {
      setError("Please enter a valid 10-digit phone number.");
      return;
    }
    if (receivedAmount < 0) {
      setError("Received amount cannot be negative.");
      return;
    }

    const invoiceData = {
      customer_id: customerDetails._id, // Assuming mobile number is used as ID
      customer_name: customerDetails.name,
      invoice_number: invoiceNumber,
      sub_total: subtotal,
      tax_amount: taxTotal,
      total_amount: total,
      discount,
      line_items: plates,
    };
    console.log(customerDetails._id)
    setIsLoading(true);
    setError(''); // Clear previous errors
    try {
      console.log(invoiceData)
      const response = await API.post('/createInvoice', invoiceData);
      console.log("Invoice created successfully:", response.data);
      // Optionally, reset the form or show a success message
    } catch (error) {
      
      console.error("Error creating invoice:", error);
      setError("Failed to create invoice. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePrintInvoice = async () => {
    await handleSubmitInvoice();
    const invoiceData = {
      customer_id: customerDetails._id,
      customer_name: customerDetails.name,
      invoice_number: invoiceNumber,
      sub_total: subtotal,
      tax_amount: taxTotal,
      total_amount: total,
      discount,
      line_items: plates,
    };

    // Generate the PDF invoice
    const doc = new jsPDF();
    doc.text('Invoice', 10, 10);
    doc.text(`Invoice Number: ${invoiceNumber}`, 10, 20);
    doc.text(`Customer Name: ${customerDetails.name}`, 10, 30);
    doc.text(`Customer Phone: ${customerDetails.phone}`, 10, 40);
    doc.text(`Date: ${customerDetails.date}`, 10, 50);

    // Add the items to the PDF invoice
    let y = 60;
    plates.forEach((plate) => {
      doc.text(`Product Name: ${plate.productName}`, 10, y);
      doc.text(`Unit Price: ${plate.unit_price}`, 10, y + 10);
      doc.text(`Quantity: ${plate.quantity}`, 10, y + 20);
      doc.text(`Tax: ${plate.tax}`, 10, y + 30);
      doc.text(`Total: ${plate.total}`, 10, y + 40);
      y += 50;
    });

    // Add the totals to the PDF invoice
    doc.text(`Subtotal: ${subtotal}`, 10, y);
    doc.text(`Tax: ${taxTotal}`, 10, y + 10);
    doc.text(`Total: ${total}`, 10, y + 20);

    // Save the PDF invoice
    doc.save(`invoice_${invoiceNumber}.pdf`);
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
      quantity: 0,
      nos: 1,
      tax: product.tax_rate, // Use tax_rate from the product object
      total: product.sales_price + (product.sales_price * product.tax_rate / 100),
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
        const response = await API.post('Customers', { customerName: e.target.value });
        console.log(response.data.data);
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
    });
    setSearchCustomerTerm(''); // Clear search input
    setFilteredCustomers([]); // Clear search results
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Header />
      {error && <div className="text-red-500 text-center">{error}</div>}
      <div className='main w-full h-fit pb-[50vh] bg-blue-100 flex'>
        <div className='left w-full md:w-[55vw] h-full p-4'>
          <div className='customer bg-white p-4 rounded shadow-md'>
            <div className='title flex justify-between mb-4'>
              <div className='text-lg font-semibold'>CUSTOMER DETAILS</div>
              <div className='customer_search'>
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
                        {customer.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <input
                type="text"
                placeholder="Customer Name"
                className="border border-gray-300 p-2 rounded w-full max-w-xs outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                value={customerDetails.name}
                onChange={(e) => setCustomerDetails({ ...customerDetails, name: e.target.value })}
              />
            </div>
            <div className='customer_info flex justify-between'>
              <div className='customer_info_left w-full md:w-[23vw] bg-white p-4 rounded shadow-md'>
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

              <div className='customer_info_right w-full md:w-[23vw] bg-white p-4 rounded shadow-md'>
                <div className='flex justify-between mb-2'>
                  <div>
                    <div>ADDRESS</div>
                    <input
                      type="text"
                      placeholder="Enter address"
                      maxLength="50"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                      className="border border-gray-300 p 2 rounded w-full outline-none"
                    />
                  </div>
                  <div>
                    <img
                      src='../src/assets/delete.svg'
                      alt="Delete"
                      onClick={clearInputs}
                      className="cursor-pointer w-5 h-5"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='border-t border-gray-400 my-3'></div>

          <div className='Product_details bg-white p-4 rounded shadow-md'>
            <div className='title flex justify-between mb-4'>
              <div className='text-lg font-semibold'>PRODUCT CART</div>
              <div className="relative w-full max-w-xs">
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
            <div className='product_list'>
              <div className="field_name flex justify-between px-4 items-center">
                <div className=''>Product Name</div>
                <div className=''>Rate</div>
                <div>Unit</div>
                <div>NOS</div>
                <div>Tax</div>
                <div>Total</div>
              </div>
            </div>
            {plates.map((plate, index) => (
              <div key={index} className="white_plate flex justify-between items-center mt-2 bg-white p-2 rounded shadow-md">
                <input
                  type="text"
                  placeholder="Product Name"
                  value={plate.productName}
                  onChange={(e) => handlePlateChange(index, 'productName', e.target.value)}
                  className='border border-gray-300 p-2 rounded w-1/3'
                />
                <input
                  type="number"
                  placeholder="Rate"
                  value={plate.unit_price}
                  onChange={(e) => handlePlateChange(index, 'unit_price', e.target.value)}
                  className='border border-gray-300 p-2 rounded w-1/6'
                />
                <select
                  value={plate.unit}
                  onChange={(e) => handlePlateChange(index, 'unit', e.target.value)}
                  className='border border-gray-300 p-2 rounded w-1/6'
                >
                  <option value={plate.unitOfMeasure}>{plate.unitOfMeasure}</option>
                  {plate.alternate_unit && <option value={plate.alternate_unit}>{plate.alternate_unit}</option>}
                </select>
                <input
                  type="number"
                  placeholder="NOS"
                  value={plate.nos}
                  onChange={(e) => handlePlateChange(index, 'nos', e.target.value)}
                  className='border border-gray-300 p-2 rounded w-1/6'
                />
                <input
                  type="number"
                  placeholder="Tax %"
                  value={plate.tax}
                  onChange={(e) => handlePlateChange(index, 'tax', e.target.value)}
                  className='border border-gray-300 p-2 rounded w-1/6'
                />
                <div className='w-1/6 text-center font-bold'>{plate.total.toFixed(2)}</div>
                <div onClick={() => handleRemovePlate(index)} className='cursor-pointer'>
                  <img src="../src/assets/cross.png" alt="Close" className="h-5" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='right w-full md:w-[31vw] h-full bg-gray-50 p-4 fixed right-0'>
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
            <div className="payment_mode flex justify-around mb-5">
              <div className='h-10 bg-gray-200 w-auto p-2 px-6 rounded'>CASH</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6 rounded'>CARD</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6 rounded'>UPI</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6 rounded'>WALLET</div>
            </div>
            <div className='recived_payment flex justify-center gap-10'>
              <input
                type="text"
                placeholder="Received Amount"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="pl-5 w-[12vw] p-2 border border-gray-300 rounded outline-none text-sm text-gray-700 focus:ring-1 focus:ring-gray-400"
              />
            </div>
          </div>

          <div className='border-t border-gray-300 my-5'></div>

          <div className='amount mt-10'>
            <div className='flex justify-between mt-5'>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[12vw] rounded">
                <div className="text-sm">Collected Amount</div>
                <div className="text-sm font-bold mt-1">{receivedAmount}</div>
              </div>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[12vw] rounded">
                <div className="text-sm">Due Amount</div>
                <div className="text-sm font-bold mt-1">{dueAmount.toFixed(2)}</div>
              </div>
            </div>
            <div className='flex justify-center mt-5'>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[10vw] rounded">
                <button onClick={handlePrintInvoice}>Print Invoice</button>
              </div>
            </div>
          </div>
        </div>
      </div>
      {isLoading && <div className="text-center">Loading...</div>}
    </div>
  );
};

export default Invoice;