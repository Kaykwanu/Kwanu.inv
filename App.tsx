
import React, { useState, useEffect } from 'react';
import { Printer, Layout, Edit3, Moon, Sun, RotateCcw } from 'lucide-react';
import { InvoiceData } from './types';
import { InvoiceEditor } from './components/InvoiceEditor';
import { InvoicePreview } from './components/InvoicePreview';

const STORAGE_KEY = 'kwanu-inv-storage-v1';
const THEME_KEY = 'kwanu-inv-theme-v1';

// Helper for initial date in YYYY-MM-DD
const getToday = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getFutureDate = (days: number) => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const INITIAL_DATA: InvoiceData = {
  invoiceNo: 'INV-001',
  date: getToday(),
  dueDate: getFutureDate(14),
  fromName: '',
  fromAddress: '',
  fromContact: '',
  toName: '',
  toAddress: '',
  currency: '₦',
  secondaryCurrency: '',
  exchangeRate: 1,
  themeColor: '#4F46E5', // Default Indigo
  paymentDetails: '',
  notes: '',
  items: [
    {
      id: '1',
      name: '',
      description: '',
      amount: 0,
      category: 'Service'
    }
  ]
};

const App: React.FC = () => {
  // Initialize state from localStorage if available
  const [data, setData] = useState<InvoiceData>(() => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    } catch (e) {
        console.error("Failed to load saved invoice data", e);
        return INITIAL_DATA;
    }
  });

  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    try {
        const saved = localStorage.getItem(THEME_KEY);
        return saved ? JSON.parse(saved) : false;
    } catch (e) {
        return false;
    }
  });

  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');
  
  // Persist data whenever it changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  // Persist theme whenever it changes and apply to document element
  useEffect(() => {
    localStorage.setItem(THEME_KEY, JSON.stringify(isDarkMode));
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const handlePrint = () => {
    window.print();
  };

  const toggleDarkMode = () => {
    console.log('Toggling dark mode from:', isDarkMode);
    setIsDarkMode(prev => !prev);
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data and start a new invoice? This cannot be undone.")) {
        setData(INITIAL_DATA);
        localStorage.removeItem(STORAGE_KEY);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 font-sans transition-colors duration-200">
      <div className="transition-colors duration-200">
        {/* Navbar - Hidden on print */}
        <nav className="sticky top-0 z-40 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 shadow-sm transition-colors duration-200 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center gap-2">
                <div className="bg-indigo-600 p-2 rounded-lg" style={{ backgroundColor: data.themeColor }}>
                  <Layout className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-xl tracking-tight text-gray-900 dark:text-white">Kwanu Inv</span>
              </div>
              
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={toggleDarkMode}
                  className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                  aria-label="Toggle dark mode"
                >
                  {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button 
                  onClick={handleReset}
                  className="hidden sm:flex items-center gap-2 px-3 py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                  title="Reset to blank invoice"
                >
                  <RotateCcw size={16} />
                  <span>Reset</span>
                </button>
                
                <button 
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors shadow-sm"
                  style={{ backgroundColor: data.themeColor }}
                  title="Print or Save as PDF"
                >
                  <Printer size={16} />
                  <span className="hidden sm:inline">Print / Save PDF</span>
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 print:p-0 print:max-w-none">
          
          {/* Mobile Tabs & Reset */}
          <div className="md:hidden flex flex-col gap-4 mb-6 print:hidden">
              <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                <button 
                    onClick={() => setActiveTab('edit')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'edit' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    style={activeTab === 'edit' ? { color: data.themeColor, backgroundColor: `${data.themeColor}10` } : {}}
                >
                    <Edit3 size={16} /> Editor
                </button>
                <button 
                    onClick={() => setActiveTab('preview')}
                    className={`flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'preview' ? 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                    style={activeTab === 'preview' ? { color: data.themeColor, backgroundColor: `${data.themeColor}10` } : {}}
                >
                    <Layout size={16} /> Preview
                </button>
              </div>
              <button 
                  onClick={handleReset}
                  className="w-full py-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
              >
                  <RotateCcw size={16} /> Reset All Data
              </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 print:block">
            
            {/* Editor Column - Hidden in Print */}
            <div className={`lg:col-span-5 space-y-8 print:hidden ${activeTab === 'preview' ? 'hidden lg:block' : ''}`}>
              <div className="sticky top-24 space-y-8">
                  <InvoiceEditor data={data} onChange={setData} />
              </div>
            </div>

            {/* Preview Column - Full width in Print */}
            <div id="invoice-preview-container" className={`lg:col-span-7 print:w-full print:block ${activeTab === 'edit' ? 'hidden lg:block' : ''}`}>
              <div className="lg:sticky lg:top-24 print:static">
                  <InvoicePreview data={data} />
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
