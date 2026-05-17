import React, { useState } from 'react';
import { Sparkles, Loader2, X } from 'lucide-react';
import { InvoiceData } from '../types';
import { generateInvoiceFromPrompt } from '../services/geminiService';

interface AIGeneratorProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (data: Partial<InvoiceData>) => void;
  currentData: InvoiceData;
}

export const AIGenerator: React.FC<AIGeneratorProps> = ({ isOpen, onClose, onGenerate, currentData }) => {
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setLoading(true);
    setError(null);
    try {
      const generatedData = await generateInvoiceFromPrompt(prompt, currentData);
      onGenerate(generatedData);
      onClose();
      setPrompt('');
    } catch (err) {
      setError('Failed to generate invoice. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-indigo-50/80 dark:bg-gray-950/80 backdrop-blur-sm transition-colors duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200 border border-white/50 dark:border-gray-800">
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-gradient-to-r from-indigo-50 to-white dark:from-indigo-950/30 dark:to-gray-900">
          <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
            <Sparkles className="w-5 h-5" />
            <h2 className="font-semibold text-lg">AI Invoice Assistant</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Describe the invoice you want to create. Include details like the client, services provided, costs, and dates.
          </p>
          
          <div className="relative">
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Create an invoice for web design services for Acme Corp. Phase 1 is $2000, Phase 2 is $3000. Include hosting for $50/month."
              className="w-full h-32 p-4 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none bg-gray-50 dark:bg-gray-800 focus:bg-white dark:focus:bg-gray-800 transition-all"
              disabled={loading}
            />
            {loading && (
              <div className="absolute inset-0 bg-white/60 dark:bg-gray-900/60 flex items-center justify-center rounded-xl backdrop-blur-[1px]">
                <Loader2 className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-spin" />
              </div>
            )}
          </div>

          {error && (
            <div className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-100 dark:border-red-900/30">
              {error}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            disabled={loading}
          >
            Cancel
          </button>
          <button 
            onClick={handleGenerate}
            disabled={loading || !prompt.trim()}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-600 dark:hover:bg-indigo-500 rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? 'Generating...' : (
                <>
                    <Sparkles size={16} />
                    Auto-Fill Invoice
                </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
