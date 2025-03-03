import React from "react";
import { Link } from "react-router-dom";
import Header from "../Header/Header";
import invoiceIcon from "../../assets/invoice.png";
import ratingIcon from "../../assets/rating.png";
import profitIcon from "../../assets/profit.png";
import inventoryIcon from "../../assets/inventory.png";
import aboutIcon from "../../assets/about.png";

const Home = () => {
  return (
    <div className="md:flex h-screen flex-col">
      {/* Sidebar */}
      <Header />

      {/* Main Content */}
      <div className="w-full h-full bg-blue-100 flex justify-center items-center px-4 md:px-10">
        <div className="w-full max-w-5xl">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-10 md:gap-16 lg:gap-24 text-center">
            {/* Invoice */}
            <div>
              <Link to="/Invoice">
                <img src={invoiceIcon} alt="bill" className="w-20 sm:w-24 mx-auto" />
              </Link>
              <Link to="/Invoice">
                <p className="mt-2 text-lg font-semibold">Invoice</p>
              </Link>
            </div>

            {/* Customers */}
            <div>
              <Link to="/Customers">
                <img src={ratingIcon} alt="user" className="w-20 sm:w-24 mx-auto" />
              </Link>
              <Link to="/Customers">
                <p className="mt-2 text-lg font-semibold">Customers</p>
              </Link>
            </div>

            {/* Sales */}
            <div>
              <Link to="/Sales">
                <img src={profitIcon} alt="sales" className="w-20 sm:w-24 mx-auto" />
              </Link>
              <Link to="/Sales">
                <p className="mt-2 text-lg font-semibold">Sales</p>
              </Link>
            </div>

            {/* Inventory */}
            <div>
              <Link to="/Inventory">
                <img src={inventoryIcon} alt="inventory" className="w-20 sm:w-24 mx-auto" />
              </Link>
              <Link to="/Inventory">
                <p className="mt-2 text-lg font-semibold">Inventory</p>
              </Link>
            </div>

            {/* Account */}
            <div>
              <Link to="/About">
                <img src={aboutIcon} alt="information" className="w-20 sm:w-24 mx-auto" />
              </Link>
              <Link to="/About">
                <p className="mt-2 text-lg font-semibold">Account</p>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;