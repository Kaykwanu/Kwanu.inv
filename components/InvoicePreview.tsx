import React from 'react';
import { InvoiceData } from '../types';

interface InvoicePreviewProps {
  data: InvoiceData;
}

export const InvoicePreview: React.FC<InvoicePreviewProps> = ({ data }) => {
  const serviceItems = data.items.filter(i => i.category === 'Service');
  const optionalItems = data.items.filter(i => i.category === 'Optional');

  const subtotalServices = serviceItems.reduce((acc, item) => acc + item.amount, 0);
  const subtotalOptional = optionalItems.reduce((acc, item) => acc + item.amount, 0);
  const total = subtotalServices + subtotalOptional;
  const exchangeRate = data.exchangeRate || 1;
  const secondaryTotal = data.secondaryCurrency ? total * exchangeRate : 0;

  const formatCurrency = (amount: number, symbol?: string) => {
    const cur = symbol || data.currency;
    return cur + ' ' + amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };
  
  // Helper to ensure we have a valid hex before adding opacity
  const themeColor = data.themeColor || '#4F46E5';
  
  // Simple opacity helper for hex
  const addAlpha = (color: string, opacity: number) => {
      // Ensure hex is in #RRGGBB format
      let hex = color.replace('#', '');
      if (hex.length === 3) {
          hex = hex.split('').map(char => char + char).join('');
      }
      const alphaVal = Math.round(opacity * 255).toString(16).padStart(2, '0');
      return `#${hex}${alphaVal}`;
  };

  return (
    <div className="bg-white dark:bg-gray-900 shadow-2xl ring-1 ring-gray-900/5 dark:ring-gray-800 mx-auto max-w-[210mm] min-h-[297mm] text-gray-800 dark:text-gray-200 transition-colors duration-200 print:shadow-none print:w-[210mm] print:max-w-none print:m-0 print:ring-0 print:bg-white print:text-gray-900 print:min-h-[297mm] relative flex flex-col" id="invoice-preview">
      
      {/* Decorative Top Bar */}
      <div 
        className="h-3 w-full print-color-adjust-exact"
        style={{ backgroundColor: themeColor }}
      ></div>

      <div className="p-12 md:p-16 print:p-10 flex-grow">
        
        {/* Logo Section */}
        <div className="mb-10 print:mb-6 break-inside-avoid">
             {data.logo ? (
                <img 
                    src={data.logo} 
                    alt="Company Logo" 
                    className="h-24 print:h-20 w-auto object-contain"
                />
              ) : (
                <div 
                    className="text-3xl print:text-2xl font-bold tracking-tight"
                    style={{ color: themeColor }}
                >
                    {data.fromName.split(' ')[0] || 'Brand'}
                </div>
              )}
        </div>

        {/* 3-Column Header Details - Forced grid for print */}
        <div className="grid grid-cols-1 md:grid-cols-3 print:grid-cols-3 gap-8 print:gap-4 mb-12 print:mb-8 break-inside-avoid items-start">
            
            {/* Column 1: From */}
            <div className="print:col-span-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 print:mb-2 print:text-[10px]">From</h3>
                <div className="space-y-1 text-sm print:text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 leading-relaxed">
                    <p className="font-bold text-gray-900 dark:text-white print:text-black text-base print:text-sm">{data.fromName}</p>
                    <p className="whitespace-pre-wrap">{data.fromAddress}</p>
                    <p className="font-medium pt-1" style={{ color: themeColor }}>{data.fromContact}</p>
                </div>
            </div>

            {/* Column 2: Bill To */}
            <div className="print:col-span-1">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3 print:mb-2 print:text-[10px]">Bill To</h3>
                <div className="space-y-1 text-sm print:text-xs text-gray-600 dark:text-gray-400 print:text-gray-700 leading-relaxed">
                    <p className="font-bold text-gray-900 dark:text-white print:text-black text-base print:text-sm">{data.toName}</p>
                    <p className="whitespace-pre-wrap">{data.toAddress}</p>
                </div>
            </div>

            {/* Column 3: Invoice Metadata */}
            <div className="md:text-right print:text-right print:col-span-1">
                <h1 className="text-4xl print:text-3xl font-light text-gray-300 dark:text-gray-700 print:text-gray-300 tracking-tighter mb-4 print:mb-2">INVOICE</h1>
                <div className="space-y-2 text-sm print:text-xs">
                    <div className="flex md:justify-end print:justify-end items-center gap-4">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-xs print:text-[10px]">No.</span>
                        <span className="font-bold text-gray-900 dark:text-white print:text-black">{data.invoiceNo}</span>
                    </div>
                    <div className="flex md:justify-end print:justify-end items-center gap-4">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-xs print:text-[10px]">Issued</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 print:text-gray-700">{formatDateDisplay(data.date)}</span>
                    </div>
                    <div className="flex md:justify-end print:justify-end items-center gap-4">
                        <span className="font-bold text-gray-400 uppercase tracking-wider text-xs print:text-[10px]">Due</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300 print:text-gray-700">{formatDateDisplay(data.dueDate)}</span>
                    </div>
                </div>
            </div>
        </div>

        {/* Services Table */}
        {serviceItems.length > 0 && (
          <div className="mb-10 print:mb-6">
            <div className="bg-gray-50 dark:bg-gray-800/50 print:bg-gray-50 rounded-t-lg border-b border-gray-200 dark:border-gray-700 px-6 print:px-4 py-3 grid grid-cols-12 gap-4 print-color-adjust-exact">
                <div className="col-span-6 text-xs font-bold text-gray-500 uppercase tracking-wider">Description</div>
                <div className="col-span-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Category</div>
                <div className="col-span-2 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Amount</div>
            </div>
            
            <div className="divide-y divide-gray-100 dark:divide-gray-800 border-b border-gray-100 dark:border-gray-800">
                {serviceItems.map((item) => (
                    <div key={item.id} className="px-6 print:px-4 py-4 print:py-2 grid grid-cols-12 gap-4 items-start hover:bg-gray-50/30 transition-colors break-inside-avoid">
                        <div className="col-span-6">
                            <p className="font-bold text-gray-900 dark:text-white print:text-black text-sm print:text-xs mb-1">{item.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 print:text-gray-600 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                        </div>
                        <div className="col-span-4">
                             <span 
                                className="inline-block px-2 py-1 rounded text-[10px] font-semibold uppercase tracking-wide border print:border-gray-200 print-color-adjust-exact"
                                style={{ 
                                    backgroundColor: addAlpha(themeColor, 0.1),
                                    color: themeColor,
                                    borderColor: addAlpha(themeColor, 0.2)
                                }}
                             >
                                Service
                             </span>
                        </div>
                        <div className="col-span-2 text-right font-medium text-gray-900 dark:text-white print:text-black tabular-nums text-sm print:text-xs">
                            {formatCurrency(item.amount)}
                        </div>
                    </div>
                ))}
            </div>
            <div className="px-6 print:px-4 py-3 flex justify-end break-inside-avoid">
                <div className="flex gap-8 items-center">
                    <span className="text-sm print:text-xs font-medium text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white print:text-black text-sm print:text-xs">{formatCurrency(subtotalServices)}</span>
                </div>
            </div>
          </div>
        )}

        {/* Optional Table */}
        {optionalItems.length > 0 && (
          <div className="mb-10 print:mb-6">
             <h3 className="text-sm font-bold text-gray-900 dark:text-white print:text-black mb-3 flex items-center gap-2 break-inside-avoid">
                Additional Items
                <span className="px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-xs font-medium border border-emerald-100 print:bg-emerald-50 print-color-adjust-exact">Optional</span>
             </h3>
             <div className="divide-y divide-gray-100 dark:divide-gray-800 border-t border-b border-gray-200 dark:border-gray-700">
                {optionalItems.map((item) => (
                    <div key={item.id} className="px-6 print:px-4 py-3 print:py-2 grid grid-cols-12 gap-4 items-center break-inside-avoid">
                        <div className="col-span-6">
                            <p className="font-medium text-gray-900 dark:text-white print:text-black text-sm print:text-xs">{item.name}</p>
                        </div>
                        <div className="col-span-4 text-xs text-gray-500 print:text-gray-600">{item.description || '-'}</div>
                        <div className="col-span-2 text-right font-medium text-gray-900 dark:text-white print:text-black tabular-nums text-sm print:text-xs">
                            {formatCurrency(item.amount)}
                        </div>
                    </div>
                ))}
             </div>
             <div className="px-6 print:px-4 py-3 flex justify-end break-inside-avoid">
                <div className="flex gap-8 items-center">
                    <span className="text-sm print:text-xs font-medium text-gray-500">Subtotal</span>
                    <span className="font-bold text-gray-900 dark:text-white print:text-black text-sm print:text-xs">{formatCurrency(subtotalOptional)}</span>
                </div>
            </div>
          </div>
        )}

        {/* Totals & Footer */}
        <div className="flex flex-col md:flex-row print:flex-row gap-12 print:gap-8 mt-auto break-inside-avoid">
            <div className="w-full md:w-7/12 print:w-7/12 space-y-6 print:space-y-4">
                {data.paymentDetails && (
                    <div>
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-wider mb-2">Payment Details</h4>
                        <p className="text-lg font-bold text-gray-700 dark:text-gray-300 print:text-gray-800 whitespace-pre-wrap leading-relaxed">{data.paymentDetails}</p>
                    </div>
                )}
                {data.notes && (
                    <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white print:text-black uppercase tracking-wider mb-2">Notes</h4>
                        <div className="p-3 bg-gray-50 dark:bg-gray-800/30 print:bg-gray-50 rounded-lg border border-gray-100 dark:border-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 print:text-gray-800 italic print-color-adjust-exact whitespace-pre-wrap">
                             {data.notes}
                        </div>
                    </div>
                )}
            </div>

            <div className="w-full md:w-5/12 print:w-5/12">
                <div 
                    className="rounded-xl p-6 print:p-4 text-white shadow-lg print:shadow-none print-color-adjust-exact"
                    style={{ backgroundColor: themeColor }}
                >
                    <div className="flex justify-between items-center mb-2 opacity-80 text-sm print:text-xs">
                        <span className="font-medium">Subtotal</span>
                        <span>{formatCurrency(subtotalServices)}</span>
                    </div>
                    {subtotalOptional > 0 && (
                        <div className="flex justify-between items-center mb-2 opacity-80 text-sm print:text-xs">
                            <span className="font-medium">Optional</span>
                            <span>+ {formatCurrency(subtotalOptional)}</span>
                        </div>
                    )}
                    <div className="h-px bg-white/20 my-4 print:my-2"></div>
                    {data.secondaryCurrency && exchangeRate !== 1 && (
                        <div className="flex justify-between items-center mb-2 opacity-80 text-[10px] uppercase tracking-wider font-bold">
                            <span>Exchange Rate</span>
                            <span>1 {data.currency} = {exchangeRate} {data.secondaryCurrency}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-end">
                        <span className="font-bold text-lg opacity-90 print:text-base">Total Due</span>
                        <div className="text-right">
                            <span className="block font-bold text-3xl print:text-2xl tracking-tight leading-none">{formatCurrency(total)}</span>
                            {data.secondaryCurrency && exchangeRate !== 1 && (
                                <span className="block text-sm print:text-xs font-bold opacity-100 mt-1">
                                    {formatCurrency(secondaryTotal, data.secondaryCurrency)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </div>
      
      {/* Decorative Bottom */}
      <div className="h-2 bg-gray-100 dark:bg-gray-800 print:bg-gray-100 w-full mt-8 print-color-adjust-exact"></div>
    </div>
  );
};