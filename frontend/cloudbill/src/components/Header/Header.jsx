import React, { useState } from "react";
import { Link } from "react-router-dom";
import { FiMenu, FiX } from "react-icons/fi"; // Hamburger & Close icons
import homeIcon from "../../assets/home.svg"
import salesIcon from "../../assets/sales.svg"
import customersIcon from "../../assets/customer.svg"
import inventoryIcon from "../../assets/inventoryIcon.png"
import invoiceIcon from "../../assets/reports.svg"
import aboutIcon from "../../assets/about.svg"
import logoutIcon from "../../assets/logout.svg"
const Header = () => {
  const [isOpen, setIsOpen] = useState(false); // Sidebar is open by default

  return (
    <>
      {/* Top Fixed Header Bar */}
      <div className="fixed top-4 left-0 z-50 flex items-center duration-300">
        <button
          className="ml-4 bg-blue-950 text-white p-2 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
        </button>
      </div>

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-screen bg-blue-950 transition-transform duration-300 ease-in-out 
        ${isOpen ? "translate-x-0" : "-translate-x-full"} w-[250px] md:w-64 z-40`}
      >
        <div className="p-4">
          <p className="mt-10 text-white text-xl font-semibold ml-4">CloudBill Manager</p>
          <ul className="mt-3 space-y-2">
            <NavItem to="/home" icon={homeIcon} label="Home" />
            <NavItem to="/Invoice" icon={invoiceIcon} label="Invoice" />
            <NavItem to="/Customers" icon={customersIcon} label="Customers" />
            <NavItem to="/Inventory" icon={inventoryIcon} label="Inventory" />
            <NavItem to="/Sales" icon={salesIcon} label="Sales" />
            <NavItem to="/About" icon={aboutIcon} label="Account" />
            <NavItem to="/Logout" icon={logoutIcon} label="Logout" />
          </ul>
        </div>
      </div>

      {/* Push Main Content when Sidebar is Open */}
      <div className={` transition-all duration-300 ${isOpen ? "pl-[250px] md:pl-64" : "pl-0"}`}>
        {/* Your page content goes here */}
      </div>
    </>
  );
};

// Reusable NavItem Component
const NavItem = ({ to, icon, label }) => (
  <Link to={to} className="block">
    <li className="flex items-center space-x-3 p-3 hover:bg-blue-800 rounded-lg transition duration-200 text-white">
      <img src={icon} alt="" className="w-6 h-6" />
      <span className="text-lg">{label}</span>
    </li>
  </Link>
);

export default Header;
