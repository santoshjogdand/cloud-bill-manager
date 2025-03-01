import React, { useEffect, useState } from 'react';
import Header from '../Header/Header'

const Invoice = () => {

  const [customerDetails, setCustomerDetails] = useState({
    mobileNumber: '',
    customerName: '',
    date: '',
    address: '',
  });

  const [receivedAmount, setReceivedAmount] = useState(0);

  const [plates, setPlates] = useState([]); // State to store the list of plates
  const [invoiceNumber, setInvoiceNumber] = useState(''); //For Dynamic Invoice Number

  // Generate invoice number dynamically
  useEffect(() => {
    setInvoiceNumber(`INV-${Date.now()}`);
  }, []);

  const clearInputs = () => {
    setCustomerDetails({
      mobileNumber: '',
      customerName: '',
      date: '',
      address: '',
    });
  };

  // Handle adding a new plate with structured data
  const handleAddPlate = () => {
    setPlates([...plates, { productName: '', rate: 0, quantity: 0, nos: 1, tax: 0, total: 0 }]);
  };

  // Handle removing a plate
  const handleRemovePlate = (index) => {
    setPlates(plates.filter((_, i) => i !== index));
  };

  // Handle plate input change
  const handlePlateChange = (index, field, value) => {
    const updatedPlates = [...plates];
    updatedPlates[index][field] = value;

    // Recalculate total for the item
    const rate = parseFloat(updatedPlates[index].rate) || 0;
    // const quantity = parseInt(updatedPlates[index].quantity) || 0;
    const nos = parseInt(updatedPlates[index].nos) || 1;
    const tax = parseFloat(updatedPlates[index].tax) || 0;

    updatedPlates[index].total = (rate * nos) + (rate * nos * tax / 100);
    setPlates(updatedPlates);
  };

  // Calculate invoice totals dynamically
  const subtotal = plates.reduce((sum, plate) => sum + plate.total, 0);
  const taxTotal = plates.reduce((sum, plate) => sum + (plate.total - (plate.rate * plate.nos)), 0);
  const discount = 0; // Placeholder for future discount logic
  const total = subtotal - discount;
  const dueAmount = total - receivedAmount;

  return (
    <div>
      <Header />
      <div className='main w-full h-fit pb-[50vh] bg-blue-100 flex pl-[30vh]'>
        <div className='left w-[55vw] h-full'>
          <div className='customer'>
            <div className='title flex justify-between mt-5 px-10'>
              <div>CUSTOMER DETAILS</div>
              <div className="customer_number relative w-full max-w-xs">
                <img
                  src="../src/assets/search.svg"
                  alt="search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Customer Name"
                  className="pl-10 p-2 border border-gray-300 w-full outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className='customer_info flex justify-between mt-10 px-10'>
              <div className='customer_info_left h-fit pb-2 w-[23vw] bg-white'>
                <div className='c_name_contact flex justify-between mt-2 text-sm px-4'>
                  <div className='cname'>
                    <div>INVOICE NO</div>
                    <div>{invoiceNumber}</div>
                  </div>
                  <div className='ccontact'>
                    <div>CONTACT NO</div>
                    <div>
                      <input
                        type="tel"
                        placeholder="Enter mobile number"
                        pattern="[0-9]{10}"
                        maxLength="10"
                        value={customerDetails.mobileNumber}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, mobileNumber: e.target.value })}
                        className="border-none outline-none bg-transparent"
                      />
                    </div>
                  </div>
                </div>
                <div className='separating_line border-t border-gray-300 my-2'></div>
                <div className='c_address px-4 text-sm'>
                  <div className='c_address_title'>DATE</div>
                  <div>
                    <input
                      type="date"
                      value={customerDetails.date}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, date: e.target.value })}
                      className="border-none outline-none bg-transparent" />
                  </div>
                </div>
              </div>

              <div className='customer_info_right h-fit pb-2 w-[23vw] bg-white'>
                <div className='c_name_contact flex justify-between mt-2 text-sm mx-4'>
                  <div className='cname'>
                    <div>CUSTOMER NAME</div>
                    <div>
                      <input
                        type="text"
                        placeholder="Enter customer name"
                        maxLength="50"
                        value={customerDetails.customerName}
                        onChange={(e) => setCustomerDetails({ ...customerDetails, customerName: e.target.value })}
                        className="border-none outline-none bg-transparent"
                      />
                    </div>
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
                <div className='separating_line border-t border-gray-300 my-2'></div>
                <div className='c_address px-4 text-sm'>
                  <div className='c_address_title'>ADDRESS</div>
                  <div>
                    <input
                      type="text"
                      placeholder="Enter address"
                      maxLength="50"
                      value={customerDetails.address}
                      onChange={(e) => setCustomerDetails({ ...customerDetails, address: e.target.value })}
                      className="border-none outline-none bg-transparent"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className='separating_line border-t border-gray-400 my-3'></div>

          <div className='Product_details'>
            <div className='title flex justify-between px-10'>
              <div className='ptitle text-base'>PRODUCT CART</div>
              <div className="product_search relative w-full max-w-xs">
                <img
                  src="../src/assets/search.svg"
                  alt="search"
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400"
                />
                <input
                  type="text"
                  placeholder="Search Product"
                  className="pl-10 p-2 border border-gray-300 w-full outline-none text-sm text-gray-700 focus:ring-1 focus:ring-blue-400"
                />
              </div>
              <div>
                <button
                  onClick={handleAddPlate} // Call the function on button click
                  className='bg-blue-500 text-white font-medium py-2 px-6 text-sm hover:bg-blue-600 focus:outline-none'
                >
                  Add
                </button>
              </div>
            </div>
            <div className='separating_line border-t border-gray-400 my-3'></div>
            <div className='product_list'>
              <div className="field_name flex justify-between px-4 items-center w-[52vw]">
                <div className=''>Product Name</div>
                <div className=''>Rate</div>
                <div>Quantity</div>
                <div>NOS</div>
                <div>Tax</div>
                <div>Total</div>
              </div>
            </div>
            {plates.map((plate, index) => (
              <div key={index} className="white_plate flex justify-center mt-2">
                <div className="w-[52vw] h-[8vh] bg-white flex items-center gap-3 px-4 relative shadow-md justify-between">
                  <input
                    type="text"
                    placeholder="Product Name"
                    value={plate.productName}
                    onChange={(e) => handlePlateChange(index, 'productName', e.target.value)}
                    className='border-none outline-none p-2 w-1/3'
                  />
                  <input
                    type="number"
                    placeholder="Rate"
                    value={plate.rate}
                    onChange={(e) => handlePlateChange(index, 'rate', e.target.value)}
                    className='border-none outline-none p-2 w-1/6'
                  />
                  <input
                    type="number"
                    placeholder="Quantity"
                    value={plate.quantity}
                    onChange={(e) => handlePlateChange(index, 'quantity', e.target.value)}
                    className='border-none outline-none p-2 w-1/6'
                  />
                  <input
                    type="number"
                    placeholder="NOS"
                    value={plate.nos}
                    onChange={(e) => handlePlateChange(index, 'nos', e.target.value)}
                    className='border-none outline-none p-2 w-1/6'
                  />
                  <input
                    type="number"
                    placeholder="Tax %"
                    value={plate.tax}
                    onChange={(e) => handlePlateChange(index, 'tax', e.target.value)}
                    className='border-none outline-none p-2 w-1/6 pl-2'
                  />
                  <div className='w-1/6 text-center font-bold'>{plate.total.toFixed(2)}</div>

                </div>
                <div onClick={() => handleRemovePlate(index)} className=''>
                  <img src="../src/assets/cross.png" alt="Close" className="h-5 cursor-pointer" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className='right w-[31vw] h-full bg-gray-50 fixed ml-[55vw]'>
          <div className='detail_payment mt-5 px-5'>
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
              <div className='Total flex justify-between text-sm font-bold'>
                <div>Total</div>
                <div>{total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className='separating_line border-t border-gray-300 my-5'></div>

          <div className='accepting_payments mt-5'>
            <div className="payment_mode flex justify-around">
              <div className='h-10 bg-gray-200 w-auto p-2 px-6'>CASH</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6'>CARD</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6'>UPI</div>
              <div className='h-10 bg-gray-200 w-auto p-2 px-6'>WALLET</div>
            </div>
            <div className='recived_payment flex justify-center gap-10 mt-5'>
              <input
                type="text"
                placeholder="Received Amount"
                value={receivedAmount}
                onChange={(e) => setReceivedAmount(e.target.value)}
                className="pl-5 w-[12vw] p-2 border border-gray-300 outline-none text-sm text-gray-700 focus:ring-1 focus:ring-gray-400"
              />
              <div>
                {/* <button
                  className='bg-blue-500 text-white font-medium py-2 px-6 text-sm hover:bg-blue-600 focus:outline-none'
                >
                  Done
                </button> */}
              </div>
            </div>
          </div>

          <div className='separating_line border-t border-gray-300 my-5'></div>

          <div className='amount mt-10 px-5'>
            <div className='flex justify-between mt-5'>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[12vw]">
                <div className="text-sm">Collected Amount</div>
                <div className="text-sm font-bold mt-1">{receivedAmount}</div>
              </div>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[12vw]">
                <div className="text-sm">Due Amount</div>
                <div className="text-sm font-bold mt-1">{dueAmount.toFixed(2)}</div>
              </div>
            </div>
            <div className='flex justify-center mt-5'>
              <div className="bg-blue-500 text-white text-center shadow-md p-2 w-[10vw]">
                <div className="text-sm">
                  Print
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default Invoice;
