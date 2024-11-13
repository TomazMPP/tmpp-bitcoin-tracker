import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import transactionsData from '../../data/transactions.json';
import TransactionsTable from '../TransactionsTable';

const BitcoinTracker = () => {
  const [chartData, setChartData] = useState([]);
  const [currentBtcPrice, setCurrentBtcPrice] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [performance, setPerformance] = useState({
    daily: { priceChange: 0, priceChangePercent: 0, portfolioChange: 0, portfolioChangePercent: 0 },
    weekly: { priceChange: 0, priceChangePercent: 0, portfolioChange: 0, portfolioChangePercent: 0 }
  });
  const { transactions } = transactionsData;

  // Calculate total BTC
  const totalBtc = transactions.reduce((sum, t) => sum + t.btcAmount, 0);
  
  // Calculate DCA
  const totalInvested = transactions.reduce((sum, t) => sum + t.usdAmount, 0);
  const dca = totalInvested / totalBtc;
  const pl = totalBtc * (currentBtcPrice - dca);
  
  // Calculate current portfolio value
  const portfolioValueUsd = totalBtc * currentBtcPrice;

  const ChangeIndicator = ({ value, includeSign = true }) => {
    const isPositive = value > 0;
    const textColorClass = isPositive ? 'text-green-600' : 'text-red-600';
    const sign = isPositive ? '↑' : '↓';
    
    return (
      <span className={`${textColorClass} font-semibold`}>
        {includeSign && sign} {Math.abs(value).toFixed(2)}%
      </span>
    );
  };

  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        const firstTransactionDate = new Date(transactions[0].date);
        const startDate = new Date(firstTransactionDate);
        startDate.setDate(startDate.getDate() - 15);
        
        const today = new Date();
        const daysDiff = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

        const response = await fetch(
          `https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${daysDiff}&interval=daily`
        );
        const data = await response.json();
        
        // Get current price from the last data point
        const currentPrice = data.prices[data.prices.length - 1][1];
        setCurrentBtcPrice(currentPrice);
        
        let totalInvested = 0;
        let totalBtc = 0;
        
        const formattedData = data.prices.map(([timestamp, price]) => {
          const date = new Date(timestamp).toISOString().split('T')[0];
          const transaction = transactions.find(t => t.date === date);
          
          if (transaction) {
            totalInvested += transaction.usdAmount;
            totalBtc += transaction.btcAmount;
          }

          const dca = totalBtc > 0 ? totalInvested / totalBtc : null;
          
          return {
            date,
            price,
            isTransaction: !!transaction,
            transaction: transaction,
            dca
          };
        });

        const filteredData = formattedData.filter(
          item => new Date(item.date) >= startDate
        );

        setChartData(filteredData);
        
        // Calculate performance metrics
        if (filteredData.length > 0) {
          const currentPrice = filteredData[filteredData.length - 1].price;
          const previousDayPrice = filteredData[filteredData.length - 2]?.price || currentPrice;
          const previousWeekPrice = filteredData[filteredData.length - 8]?.price || currentPrice;

          // Calculate daily changes
          const dailyPriceChange = currentPrice - previousDayPrice;
          const dailyPriceChangePercent = (dailyPriceChange / previousDayPrice) * 100;
          const dailyPortfolioChange = dailyPriceChange * totalBtc;
          const dailyPortfolioChangePercent = dailyPriceChangePercent;

          // Calculate weekly changes
          const weeklyPriceChange = currentPrice - previousWeekPrice;
          const weeklyPriceChangePercent = (weeklyPriceChange / previousWeekPrice) * 100;
          const weeklyPortfolioChange = weeklyPriceChange * totalBtc;
          const weeklyPortfolioChangePercent = weeklyPriceChangePercent;

          setPerformance({
            daily: {
              priceChange: dailyPriceChange,
              priceChangePercent: dailyPriceChangePercent,
              portfolioChange: dailyPortfolioChange,
              portfolioChangePercent: dailyPortfolioChangePercent
            },
            weekly: {
              priceChange: weeklyPriceChange,
              priceChangePercent: weeklyPriceChangePercent,
              portfolioChange: weeklyPortfolioChange,
              portfolioChangePercent: weeklyPortfolioChangePercent
            }
          });
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Erro ao buscar dados do Bitcoin:', error);
        setIsLoading(false);
      }
    };

    fetchBitcoinData();
  }, []);

  const calculatePortfolioData = () => {
    let totalBtc = 0;
    let totalInvested = 0;
    return transactions.map(t => {
      totalBtc += t.btcAmount;
      totalInvested += t.usdAmount;
      const pricePoint = chartData.find(p => p.date === t.date);
      return {
        date: t.date,
        invested: totalInvested,
        portfolioValue: totalBtc * (pricePoint?.price || t.btcPrice)
      };
    });
  };

  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatBtc = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(value);
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const transaction = data.transaction;
      
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">{label}</p>
          <p className="text-blue-600">
            Price: {formatCurrency(data.price)}
          </p>
          {data.dca && (
            <p className="text-green-600">
              DCA: {formatCurrency(data.dca)}
            </p>
          )}
          {transaction && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <p className="font-semibold text-gray-800">Details:</p>
              <p className="text-gray-700">
                <strong>Amount:</strong> ₿ {formatBtc(transaction.btcAmount)}
              </p>
              <p className="text-gray-700">
              <strong>Price:</strong> {formatCurrency(transaction.btcPrice)}
              </p>
              <p className="text-gray-700">
              <strong>Cost:</strong> {formatCurrency(transaction.usdAmount)}
              </p>
              <p className="text-gray-700">
              <strong>Current Value:</strong> {formatCurrency(transaction.btcAmount * currentBtcPrice)}
              </p>
              {currentBtcPrice > 0 && (
                <>
                  <p className={`font-semibold ${(currentBtcPrice - transaction.btcPrice) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    P/L: {formatCurrency((currentBtcPrice - transaction.btcPrice) * transaction.btcAmount)}
                    {' '}
                    ({formatPercentage((currentBtcPrice - transaction.btcPrice) / transaction.btcPrice)})
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-lg font-medium text-gray-600 animate-pulse">
          Loading Portfolio data...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            TMPP Bitcoin Tracker
            <span className="animate-pulse">💎₿</span>
          </h1>
        </div>
        
        {/* Grid de Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Portfolio Summary Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">Portfolio Summary</h3>
                <span className="text-2xl">💰</span>
              </div>
              <div className="space-y-2">
                <p className="text-3xl font-bold text-gray-900 tracking-tight">
                  {formatCurrency(portfolioValueUsd)}
                </p>
                <p className="text-xl font-semibold text-blue-600">
                  ₿{formatBtc(totalBtc)}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>🪙 Current Price:</span>
                    <span className="font-medium">{formatCurrency(currentBtcPrice)}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>📊 DCA:</span>
                    <span className="font-medium">{formatCurrency(dca)}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>✅ P/L:</span>
                    <span className="font-medium text-green-600">{formatCurrency(pl)}</span>
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 24h Performance Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">24h Performance</h3>
                <span className="text-2xl">📊</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(performance.daily.portfolioChange)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    Portfolio Change
                    <ChangeIndicator value={performance.daily.portfolioChangePercent} />
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(performance.daily.priceChange)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    Price Change
                    <ChangeIndicator value={performance.daily.priceChangePercent} />
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* 7d Performance Card */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-700">7d Performance</h3>
                <span className="text-2xl">📈</span>
              </div>
              <div className="space-y-4">
                <div>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatCurrency(performance.weekly.portfolioChange)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    Portfolio Change
                    <ChangeIndicator value={performance.weekly.portfolioChangePercent} />
                  </p>
                </div>
                <div className="pt-2 border-t border-gray-100">
                  <p className="text-xl font-semibold text-gray-900">
                    {formatCurrency(performance.weekly.priceChange)}
                  </p>
                  <p className="text-sm text-gray-600 flex items-center gap-1">
                    Price Change
                    <ChangeIndicator value={performance.weekly.priceChangePercent} />
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="space-y-8">
          {/* Price Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Bitcoin Price History</h2>
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
                    tickFormatter={value => formatCurrency(value)}
                    stroke="#9CA3AF"
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="dca" 
                    name="Dollar Cost Average (DCA)"
                    stroke="#10B981" 
                    strokeDasharray="5 5"
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="price" 
                    name="Bitcoin Price"
                    stroke="#3B82F6" 
                    dot={false}
                    strokeWidth={2}
                  />
                  <Line 
                    dataKey={d => d.isTransaction ? d.price : null}
                    name="Buys"
                    type="monotone"
                    stroke="#10B981"
                    strokeWidth={0}
                    dot={{
                      r: 6,
                      fill: '#10B981',
                      stroke: 'white',
                      strokeWidth: 2
                    }}
                    legendType="circle"
                    isAnimationActive={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Portfolio Value Chart */}
          <div className="bg-white rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow duration-300">
            <h2 className="text-xl font-semibold text-gray-900 mb-6">Portfolio Performance</h2>
            <div className="h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart 
                  data={calculatePortfolioData()} 
                  margin={{ top: 5, right: 20, bottom: 5, left: 0 }}
                >
                  <XAxis 
                    dataKey="date"
                    tick={{ fontSize: 12 }}
                    stroke="#9CA3AF"
                  />
                  <YAxis 
                    domain={['auto', 'auto']}
                    tick={{ fontSize: 12 }}
                    tickFormatter={value => formatCurrency(value)}
                    stroke="#9CA3AF"
                  />
                  <Tooltip 
                    formatter={value => formatCurrency(value)}
                    labelFormatter={label => `Date: ${label}`}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="invested" 
                    name="Total Invested" 
                    stroke="#10B981"
                    strokeWidth={2}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="portfolioValue" 
                    name="Portfolio Value" 
                    stroke="#3B82F6"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
      <br></br>
      <TransactionsTable 
          transactions={transactions}
          currentBtcPrice={currentBtcPrice}
        />

    </div>

    
  );
};

export default BitcoinTracker;