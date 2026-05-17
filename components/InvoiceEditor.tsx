import React, { useState, useEffect } from 'react';
import { InvoiceData, LineItem } from '../types';
import { Plus, Trash2, GripVertical, Upload, X, Calendar, Palette } from 'lucide-react';

interface InvoiceEditorProps {
  data: InvoiceData;
  onChange: (newData: InvoiceData) => void;
}

// Helper to extract dominant vibrant color from image
const extractThemeColor = (imageSrc: string): Promise<string> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = imageSrc;
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) return resolve('#4F46E5');
        
        // Resize for performance
        canvas.width = 100;
        canvas.height = 100;
        ctx.drawImage(img, 0, 0, 100, 100);
        
        const imageData = ctx.getImageData(0, 0, 100, 100).data;
        const colorCounts: Record<string, number> = {};
        let maxCount = 0;
        let dominantColor = '#4F46E5';
  
        for (let i = 0; i < imageData.length; i += 4) {
          const r = imageData[i];
          const g = imageData[i + 1];
          const b = imageData[i + 2];
          const a = imageData[i + 3];
  
          if (a < 128) continue; // Skip transparent
          // Skip white/near white background
          if (r > 230 && g > 230 && b > 230) continue;
          // Skip black/near black
          if (r < 30 && g < 30 && b < 30) continue;
  
          // Quantize to reduce noise (round to nearest 20)
          const round = (n: number) => Math.round(n / 20) * 20;
          const key = `${round(r)},${round(g)},${round(b)}`;
          
          colorCounts[key] = (colorCounts[key] || 0) + 1;
          
          if (colorCounts[key] > maxCount) {
            maxCount = colorCounts[key];
            // Convert back to hex
            const toHex = (c: number) => {
              const hex = c.toString(16);
              return hex.length === 1 ? "0" + hex : hex;
            };
            dominantColor = `#${toHex(r)}${toHex(g)}${toHex(b)}`;
          }
        }
        
        resolve(dominantColor);
      };
      img.onerror = () => resolve('#4F46E5');
    });
};

// Internal component to handle money input formatting
const AmountInput: React.FC<{
  value: number;
  onChange: (val: number) => void;
  currency: string;
}> = ({ value, onChange, currency }) => {
  const [isFocused, setIsFocused] = useState(false);
  const [localValue, setLocalValue] = useState(value.toString());

  // Sync local value when prop changes (and not focused to avoid overwriting user typing)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    } else {
        if (parseFloat(localValue) !== value) {
            setLocalValue(value.toString());
        }
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setLocalValue(value === 0 ? '' : value.toString());
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format on blur
    setLocalValue(value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value;
    // Allow digits and one decimal point
    if (/^\d*\.?\d*$/.test(rawVal)) {
        setLocalValue(rawVal);
        const parsed = parseFloat(rawVal);
        onChange(isNaN(parsed) ? 0 : parsed);
    }
  };

  return (
    <div className="w-full md:w-32 flex items-center border-b border-gray-200 dark:border-gray-700 focus-within:border-indigo-500 transition-colors">
      <span className="text-gray-500 dark:text-gray-400 mr-2 text-sm select-none">{currency}</span>
      <input
        type="text"
        inputMode="decimal"
        className="w-full font-medium text-right outline-none pb-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-300"
        value={localValue}
        onChange={handleChange}
        onFocus={handleFocus}
        onBlur={handleBlur}
        placeholder="0.00"
      />
    </div>
  );
};

export const InvoiceEditor: React.FC<InvoiceEditorProps> = ({ data, onChange }) => {
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);

  const handleChange = (field: keyof InvoiceData, value: any) => {
    onChange({ ...data, [field]: value });
  };

  const handleItemChange = (id: string, field: keyof LineItem, value: any) => {
    const newItems = data.items.map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    onChange({ ...data, items: newItems });
  };

  const addItem = () => {
    const newItem: LineItem = {
      id: crypto.randomUUID(),
      name: '',
      description: '',
      amount: 0,
      category: 'Service'
    };
    onChange({ ...data, items: [...data.items, newItem] });
  };

  const removeItem = (id: string) => {
    onChange({ ...data, items: data.items.filter(i => i.id !== id) });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const result = reader.result as string;
        
        // Optimistically update logo
        let newData = { ...data, logo: result };
        
        // Extract color from new logo
        try {
            const extractedColor = await extractThemeColor(result);
            newData.themeColor = extractedColor;
        } catch (err) {
            console.error('Color extraction failed', err);
        }

        onChange(newData);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, index: number) => {
    setDraggedItemIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, dropIndex: number) => {
    e.preventDefault();
    if (draggedItemIndex === null || draggedItemIndex === dropIndex) return;

    const newItems = [...data.items];
    const [draggedItem] = newItems.splice(draggedItemIndex, 1);
    newItems.splice(dropIndex, 0, draggedItem);
    
    onChange({ ...data, items: newItems });
    setDraggedItemIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedItemIndex(null);
  };

  const formatDateForInput = (dateString: string) => {
    if (!dateString) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const calculateTotal = () => {
    return data.items.reduce((sum, item) => sum + item.amount, 0);
  };

  return (
    <div className="space-y-8 p-6 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-200">
      
      {/* Logo & Basic Info */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-800 pb-2">Invoice Details</h2>
        
        {/* Logo Upload & Theme Color */}
        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
            <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 uppercase">Brand Logo</h3>
                <div className="flex items-center gap-2">
                    <Palette size={14} className="text-gray-400"/>
                    <label className="text-xs text-gray-500 cursor-pointer hover:text-indigo-600 flex items-center gap-2">
                        Theme Color
                        <input 
                            type="color" 
                            value={data.themeColor} 
                            onChange={(e) => handleChange('themeColor', e.target.value)}
                            className="w-6 h-6 rounded border-none cursor-pointer overflow-hidden bg-transparent"
                            title="Choose theme color"
                        />
                    </label>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                {data.logo ? (
                    <div className="relative group">
                        <div className="w-16 h-16 border dark:border-gray-600 rounded-lg overflow-hidden bg-white flex items-center justify-center p-1">
                            <img src={data.logo} alt="Logo Preview" className="max-w-full max-h-full object-contain" />
                        </div>
                        <button 
                            onClick={() => handleChange('logo', undefined)}
                            className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        >
                            <X size={12} />
                        </button>
                    </div>
                ) : (
                    <div className="w-16 h-16 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center bg-gray-50 dark:bg-gray-800">
                        <span className="text-xs text-gray-400">No Logo</span>
                    </div>
                )}
                
                <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors shadow-sm">
                    <Upload size={16} className="text-gray-600 dark:text-gray-300"/>
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Upload Image</span>
                    <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                </label>
            </div>
            <p className="text-[10px] text-gray-400 mt-2">Uploading a logo will automatically update the invoice theme color.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Invoice No.</label>
            <input 
              type="text" 
              value={data.invoiceNo} 
              onChange={(e) => handleChange('invoiceNo', e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Primary Currency</label>
             <select 
              value={data.currency} 
              onChange={(e) => handleChange('currency', e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="₦">Naira (₦)</option>
              <option value="$">Dollar ($)</option>
              <option value="£">Pound (£)</option>
              <option value="€">Euro (€)</option>
            </select>
          </div>
          <div>
             <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Secondary Currency (Optional)</label>
             <select 
              value={data.secondaryCurrency || ''} 
              onChange={(e) => handleChange('secondaryCurrency', e.target.value)}
              className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            >
              <option value="">None</option>
              <option value="₦">Naira (₦)</option>
              <option value="$">Dollar ($)</option>
              <option value="£">Pound (£)</option>
              <option value="€">Euro (€)</option>
            </select>
          </div>
          {data.secondaryCurrency && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-indigo-600 dark:text-indigo-400 mb-1">
                Exchange Rate (1 {data.currency} = ? {data.secondaryCurrency})
              </label>
              <input 
                type="number"
                step="0.0001"
                value={data.exchangeRate}
                onChange={(e) => handleChange('exchangeRate', parseFloat(e.target.value) || 0)}
                placeholder={`e.g. 1500 for ${data.currency} to ${data.secondaryCurrency}`}
                className="w-full px-3 py-2 border border-indigo-200 dark:border-indigo-900/50 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-indigo-50/30 dark:bg-indigo-900/10 text-gray-900 dark:text-gray-100 font-medium"
              />
              <p className="text-[10px] text-gray-500 mt-1 italic">Line items remain in {data.currency}. Totals will be converted in the preview.</p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Date</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                </div>
                <input 
                type="date" 
                value={formatDateForInput(data.date)} 
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full pl-10 px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Due Date</label>
            <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Calendar size={16} className="text-gray-400" />
                </div>
                <input 
                type="date" 
                value={formatDateForInput(data.dueDate)} 
                onChange={(e) => handleChange('dueDate', e.target.value)}
                className="w-full pl-10 px-3 py-2 border dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-800 pb-2">Entities</h2>
        <div className="grid grid-cols-1 gap-6">
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">From (You)</h3>
            <div className="space-y-3">
              <input 
                placeholder="Name / Company" 
                value={data.fromName}
                onChange={(e) => handleChange('fromName', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100"
              />
              <textarea 
                placeholder="Address" 
                rows={2}
                value={data.fromAddress}
                onChange={(e) => handleChange('fromAddress', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100"
              />
              <input 
                placeholder="Contact (Email | Phone)" 
                value={data.fromContact}
                onChange={(e) => handleChange('fromContact', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
          
          <div className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-400 mb-3 uppercase">Bill To (Client)</h3>
            <div className="space-y-3">
              <input 
                placeholder="Client Name" 
                value={data.toName}
                onChange={(e) => handleChange('toName', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100"
              />
              <textarea 
                placeholder="Client Address" 
                rows={2}
                value={data.toAddress}
                onChange={(e) => handleChange('toAddress', e.target.value)}
                className="w-full px-3 py-2 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md text-sm text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center border-b dark:border-gray-800 pb-2">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">Line Items</h2>
            <button 
                onClick={addItem}
                className="flex items-center gap-1 text-sm font-medium hover:opacity-80 transition-colors"
                style={{ color: data.themeColor }}
            >
                <Plus size={16} /> Add Item
            </button>
        </div>
        
        <div className="space-y-3">
            {data.items.map((item, index) => (
                <div 
                    key={item.id} 
                    className={`group relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-all ${
                        draggedItemIndex === index ? 'opacity-40 border-dashed' : ''
                    }`}
                    style={draggedItemIndex === index ? { borderColor: data.themeColor } : {}}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                    onDragEnd={handleDragEnd}
                >
                    <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => removeItem(item.id)} className="text-gray-400 hover:text-red-500 p-1">
                            <Trash2 size={16} />
                         </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
                        <div 
                            className="md:col-span-1 flex items-center justify-center pt-2 text-gray-300 dark:text-gray-600 cursor-move transition-colors"
                            style={{ '--hover-color': data.themeColor } as React.CSSProperties}
                            draggable
                            onDragStart={(e) => handleDragStart(e, index)}
                            title="Drag to reorder"
                        >
                            <style>{`.cursor-move:hover { color: ${data.themeColor} !important; }`}</style>
                             <GripVertical size={20} />
                        </div>
                        <div className="md:col-span-11 space-y-3">
                            <div className="flex flex-col md:flex-row gap-3">
                                <input 
                                    className="flex-1 font-medium text-gray-900 dark:text-gray-100 border-b border-gray-200 dark:border-gray-700 outline-none pb-1 bg-transparent"
                                    style={{ '--focus-color': data.themeColor } as React.CSSProperties}
                                    value={item.name}
                                    onChange={(e) => handleItemChange(item.id, 'name', e.target.value)}
                                    placeholder="Item Name (e.g. Logo Design)"
                                />
                                <AmountInput 
                                    value={item.amount}
                                    currency={data.currency}
                                    onChange={(val) => handleItemChange(item.id, 'amount', val)}
                                />
                            </div>
                            <textarea 
                                className="w-full text-sm text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-700 rounded p-2 focus:ring-1 outline-none bg-gray-50/50 dark:bg-gray-900/50"
                                style={{ '--tw-ring-color': data.themeColor } as React.CSSProperties}
                                rows={2}
                                value={item.description}
                                onChange={(e) => handleItemChange(item.id, 'description', e.target.value)}
                                placeholder="Service Description (e.g. Full branding package including logo, typography, and color palette.)"
                            />
                            <div className="flex justify-end">
                                <select 
                                    value={item.category}
                                    onChange={(e) => handleItemChange(item.id, 'category', e.target.value as 'Service' | 'Optional')}
                                    className="text-xs bg-gray-100 dark:bg-gray-700 border-none rounded-full px-3 py-1 text-gray-600 dark:text-gray-200 cursor-pointer hover:bg-gray-200 dark:hover:bg-gray-600"
                                >
                                    <option value="Service">Service</option>
                                    <option value="Optional">Optional</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </div>
            ))}
        </div>
        
        {/* Total Summary Field */}
        <div className="flex justify-end items-center mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
             <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg border border-gray-200 dark:border-gray-700 min-w-[200px]">
                <div className="flex justify-between items-center mb-1">
                     <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Total Amount</span>
                </div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white text-right">
                     {data.currency} {calculateTotal().toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
             </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100 border-b dark:border-gray-800 pb-2">Footer</h2>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Details</label>
            <textarea 
                rows={4}
                value={data.paymentDetails}
                onChange={(e) => handleChange('paymentDetails', e.target.value)}
                placeholder="• 50% upfront before project start&#10;• 50% upon project completion and before launch&#10;• Payment method: Bank Transfer"
                className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <textarea 
                rows={2}
                value={data.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder="• Pricing reflects a freelancer-based estimate and may vary based on scope changes."
                className="w-full px-3 py-2 border dark:border-gray-700 rounded-lg text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
            />
        </div>
      </div>
    </div>
  );
};