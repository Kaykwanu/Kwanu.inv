import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { InvoiceData } from '../types';

interface CostChartProps {
  data: InvoiceData;
}

const COLORS = ['#4F46E5', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export const CostChart: React.FC<CostChartProps> = ({ data }) => {
  const chartData = useMemo(() => {
    return data.items.map(item => ({
      name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
      value: item.amount,
      fullDescription: item.description
    }));
  }, [data.items]);

  if (data.items.length === 0) return null;

  return (
    <div className="space-y-6">
        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-200">
            <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Cost Distribution</h3>
            <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                    >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} strokeWidth={0} fill={COLORS[index % COLORS.length]} />
                    ))}
                    </Pie>
                    <Tooltip 
                        formatter={(value: number) => `${data.currency}${value.toLocaleString()}`}
                        contentStyle={{ 
                            backgroundColor: '#fff', 
                            borderRadius: '8px', 
                            border: '1px solid #e5e7eb',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#374151' }}
                    />
                    <Legend />
                </PieChart>
                </ResponsiveContainer>
            </div>
        </div>

        <div className="bg-white dark:bg-gray-900 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-colors duration-200">
             <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Phase Breakdown</h3>
             <div className="h-64 w-full text-xs">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ left: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" strokeOpacity={0.2} />
                        <XAxis type="number" hide />
                        <YAxis 
                            dataKey="name" 
                            type="category" 
                            width={100} 
                            tick={{fontSize: 11, fill: '#9CA3AF'}} 
                            interval={0}
                        />
                        <Tooltip 
                            formatter={(value: number) => `${data.currency}${value.toLocaleString()}`}
                            contentStyle={{ 
                                backgroundColor: '#fff', 
                                borderRadius: '8px', 
                                border: '1px solid #e5e7eb',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            cursor={{fill: '#F3F4F6'}}
                        />
                        <Bar dataKey="value" fill="#4F46E5" radius={[0, 4, 4, 0]} barSize={20} />
                    </BarChart>
                </ResponsiveContainer>
             </div>
        </div>
    </div>
  );
};
