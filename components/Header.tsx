
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="h-16 bg-white shadow-md flex items-center justify-between px-6">
      <div className="text-lg font-semibold text-primary">
        Bem-vindo, Usuário!
      </div>
      <div>
        {/* Placeholder for user profile, notifications, etc. */}
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
      </div>
    </header>
  );
};

export default Header;
