import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';

const Navbar = () => {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="sticky top-0 z-50 w-full border-b-2 bg-black backdrop-blur-md border-white">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo/Title */}
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold text-white">ASTRA GRID</h1>
          </div>

          {/* Navigation Tabs */}
          <div className="absolute left-1/2 transform -translate-x-1/2">
            <Tabs value={currentPath} className="w-auto">
            <TabsList className="bg-black p-1 h-auto">
              <TabsTrigger 
                value="/" 
                disabled
                className="opacity-40 cursor-not-allowed px-4 py-2 text-sm font-semibold text-white"
              >
                Dashboard
              </TabsTrigger>
              
              <TabsTrigger 
                value="/prediction" 
                asChild
                className="data-[state=active]:bg-white data-[state=active]:text-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800 transition-colors"
              >
                <Link to="/prediction">Prediction</Link>
              </TabsTrigger>
            </TabsList>
            </Tabs>
          </div>
          
          {/* Empty div for spacing */}
          <div className="w-[200px]"></div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
