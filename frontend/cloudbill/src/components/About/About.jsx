import React, { useState } from 'react';
import Header from '../Header/Header';
import logoIcon from "../../assets/1.png"

const About = () => {
  const [isHeaderOpen, setIsHeaderOpen] = useState(false);

  // Retrieve data from localStorage
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

  return (
    <div className={`bg-gray-50 min-h-screen md:flex flex-col  transition-all duration-300 ${isHeaderOpen ? 'ml-64' : 'ml-0'}`}>
      <Header isOpen={isHeaderOpen} onToggle={() => setIsHeaderOpen(!isHeaderOpen)} />
      
      <div className="flex-grow flex flex-col items-center p-4 overflow-auto max-h-screen">
        <div className="bg-white w-full max-w-2xl rounded-lg shadow-md p-6 border border-gray-300 overflow-auto max-h-[80vh] sm:max-h-[90vh]">
          {/* Logo & Title */}
          <div className="flex flex-col items-center mb-4">
            <img src={logoIcon} alt="logo" className="w-16 h-16 md:w-20 md:h-20 mb-2" />
            {orgName && <h1 className="text-xl md:text-2xl font-bold text-gray-800 text-center">{orgName}</h1>}
            {orgDescription && <p className="text-gray-600 text-center mt-1 text-sm md:text-base">{orgDescription}</p>}
          </div>

          {/* Details Section */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-gray-700 text-sm md:text-base">
            {orgPhone && <p><strong>📞 Contact:</strong> {orgPhone.join(", ")}</p>}
            {orgEmail && <p><strong>📧 Email:</strong> {orgEmail}</p>}
            {ownerName && <p><strong>👤 Owner:</strong> {ownerName}</p>}
            {orgCategory && <p><strong>🏢 Category:</strong> {orgCategory}</p>}
            {GSTNumber && <p><strong>🆔 GSTIN:</strong> {GSTNumber}</p>}
            {invoicePrefix && <p><strong>📝 Invoice Prefix:</strong> {invoicePrefix}</p>}
            {orgCurrency && <p><strong>💰 Currency:</strong> {orgCurrency}</p>}
            {orgWebsite && (
              <p>
                <strong>🌐 Website:</strong> 
                <a href={orgWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline"> {orgWebsite}</a>
              </p>
            )}
          </div>

          {/* Address */}
          {orgAddressObj && (
            <div className="mt-4 text-gray-700">
              <h2 className="text-lg font-semibold">📍 Address</h2>
              <p>{orgAddressObj.street}, {orgAddressObj.city}, {orgAddressObj.state}, {orgAddressObj.country}, {orgAddressObj.zipcode}</p>
            </div>
          )}

          {/* Terms & Conditions */}
          {orgTerms && (
            <div className="mt-4">
              <h2 className="text-lg font-semibold text-gray-800">📜 Terms & Conditions</h2>
              <ul className="list-disc pl-5 text-gray-600 mt-1 space-y-1 max-h-40 overflow-auto">
                {orgTerms.map((term, index) => (
                  <li key={index}>{term}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default About;
