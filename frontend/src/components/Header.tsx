
import React from 'react';
import { APP_TITLE } from '@/constants';

const Header: React.FC = () => {
  return (
    <header className="bg-slate-800 shadow-md">
      <div className="container mx-auto px-4 py-6">
        <h1 className="text-3xl font-bold text-sky-400">{APP_TITLE}</h1>
        <p className="text-slate-300 text-sm">Crafting eLearning experiences with AI</p>
      </div>
    </header>
  );
};

export default Header;