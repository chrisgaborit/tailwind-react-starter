
import React from 'react';
import { APP_TITLE } from '@/constants';

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  return (
    <footer className="bg-slate-800 text-slate-400 py-6 text-center shadow-md mt-auto">
      <div className="container mx-auto px-4">
        <p>&copy; {currentYear} {APP_TITLE}. All rights reserved.</p>
        <p className="text-xs mt-1">Powered by Generative AI</p>
      </div>
    </footer>
  );
};

export default Footer;