import React, { useState, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const BitcoinPriceChart = ({ 
  chartData, 
  currency, 
  CustomTooltip, 
  formatCurrency 
}) => {
  const [dotSizeType, setDotSizeType] = useState('normal');

  const calculateDotSize = useCallback((transaction) => {
    if (!transaction) return 6;
    
    switch (dotSizeType) {
      case 'btc': {
        const maxBtc = Math.max(...chartData
          .filter(d => d.transaction)
          .map(d => d.transaction.btcAmount));
        const minBtc = Math.min(...chartData
          .filter(d => d.transaction)
          .map(d => d.transaction.btcAmount));
        
        const scale = (transaction.btcAmount - minBtc) / (maxBtc - minBtc);
        const minSize = 4;
        const maxSize = 20;
        return minSize + (scale * (maxSize - minSize));
      }
      
      case 'fiat': {
        const amount = currency === 'USD' ? transaction.usdAmount : transaction.brlAmount;
        const values = chartData
          .filter(d => d.transaction)
          .map(d => currency === 'USD' ? d.transaction.usdAmount : d.transaction.brlAmount);
        const maxAmount = Math.max(...values);
        const minAmount = Math.min(...values);
        
        const scale = (amount - minAmount) / (maxAmount - minAmount);
        const minSize = 4;
        const maxSize = 20;
        return minSize + (scale * (maxSize - minSize));
      }
      
      default:
        return 6;
    }
  }, [dotSizeType, currency, chartData]);


  const getDotColor = useCallback(() => {
    return dotSizeType === 'btc' ? '#f97316' : '#10B981';  
  }, [dotSizeType]);

  return (
    <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Bitcoin Price History</h2>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Dots Size:</span>
          <select 
            value={dotSizeType}
            onChange={(e) => setDotSizeType(e.target.value)}
            className="px-3 py-2 rounded-md border border-gray-300 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="normal">Normal</option>
            <option value="btc">Sized in BTC</option>
            <option value="fiat">Sized in {currency}</option>
          </select>
        </div>
      </div>
      <div className="h-[400px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
              stroke="#9CA3AF"
            />
            <YAxis 
              domain={['auto', 'auto']}
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => formatCurrency(value)}
              stroke="#9CA3AF"
              width={80}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey={currency === 'USD' ? 'dcaUsd' : 'dcaBrl'}
              name="Dollar Cost Average (DCA)"
              stroke="#10B981" 
              strokeDasharray="5 5"
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone" 
              dataKey={currency === 'USD' ? 'priceUsd' : 'priceBrl'}
              name="Bitcoin Price"
              stroke="#3B82F6" 
              dot={false}
              strokeWidth={2}
            />
            <Line 
              type="monotone"
              dataKey={d => d.isTransaction ? (currency === 'USD' ? d.priceUsd : d.priceBrl) : null}
              name="Buys"
              stroke={getDotColor()}
              strokeWidth={0}
              dot={(props) => {
                const { cx, cy, payload } = props;
                if (!payload.isTransaction) return null;
                
                return (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={calculateDotSize(payload.transaction)}
                    fill={getDotColor()}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              }}
              legendType="circle"
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BitcoinPriceChart;