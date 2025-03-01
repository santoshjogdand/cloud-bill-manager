import React, { useState } from 'react';

const Payments = () => {
  const [filters, setFilters] = useState({
    amount: '',
    date: '',
    fromDate: '',
    toDate: '',
  });

  const handleFilterChange = (key, value) => {
    setFilters((prevFilters) => ({
      ...prevFilters,
      [key]: value,
    }));
  };

  return (
    <div className='main bg-blue-100 w-full h-full'>
       {/* Title */}
       <div className='title text-xl flex justify-center py-5 font-bold'>Payments</div>
      {/* Filter Section */}
      <div className='filters flex justify-around items-center mb-5'>
        {/* Amount Filter */}
        <div className='filter-option'>
          <label htmlFor='amount' className='block text-sm font-medium mb-1'>Amount</label>
          <select
            id='amount'
            className='p-1 border border-gray-300 rounded w-36 text-sm'
            value={filters.amount}
            onChange={(e) => handleFilterChange('amount', e.target.value)}
          >
            <option value=''>Select</option>
            <option value='low-high'>Low to High</option>
            <option value='high-low'>High to Low</option>
          </select>
        </div>

        {/* Date Filter */}
        <div className='filter-option'>
          <label htmlFor='date' className='block text-sm font-medium mb-1'>Date</label>
          <select
            id='date'
            className='p-1 border border-gray-300 rounded w-36 text-sm'
            value={filters.date}
            onChange={(e) => handleFilterChange('date', e.target.value)}
          >
            <option value=''>Select</option>
            <option value='newest'>Newest</option>
            <option value='oldest'>Oldest</option>
          </select>
        </div>

        {/* From Date Filter */}
        <div className='filter-option'>
          <label htmlFor='fromDate' className='block text-sm font-medium mb-1'>From Date</label>
          <input
            type='date'
            id='fromDate'
            className='p-1 border border-gray-300 rounded w-36 text-sm'
            value={filters.fromDate}
            onChange={(e) => handleFilterChange('fromDate', e.target.value)}
          />
        </div>

        {/* To Date Filter */}
        <div className='filter-option'>
          <label htmlFor='toDate' className='block text-sm font-medium mb-1'>To Date</label>
          <input
            type='date'
            id='toDate'
            className='p-1 border border-gray-300 rounded w-36 text-sm'
            value={filters.toDate}
            onChange={(e) => handleFilterChange('toDate', e.target.value)}
          />
        </div>
      </div>

     

      {/* Display Payments */}
      <div className='payments-list mt-5'>
        <p className='text-center text-gray-500'>No payments to display</p>
      </div>
    </div>
  );
};

export default Payments;
