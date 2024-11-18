import React, { useState, useEffect, useCallback } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { DollarSign, Coins } from 'lucide-react';
import transactionsData from '../../data/transactions.json';
import TransactionsTable from '../TransactionsTable';

const BitcoinTracker = () => {
  const [chartData, setChartData] = useState([]);
  const [currentBtcPrice, setCurrentBtcPrice] = useState({ usd: 0, brl: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [currency, setCurrency] = useState('USD');
  const [performance, setPerformance] = useState({
    daily: { priceChange: 0, priceChangePercent: 0, portfolioChange: 0, portfolioChangePercent: 0 },
    weekly: { priceChange: 0, priceChangePercent: 0, portfolioChange: 0, portfolioChangePercent: 0 }
  });
  
  const { transactions } = transactionsData;

  // Calculate total BTC
  const totalBtc = transactions.reduce((sum, t) => sum + t.btcAmount, 0);
  
  // Calculate DCA for both currencies
  const totalInvestedUsd = transactions.reduce((sum, t) => sum + t.usdAmount, 0);
  const totalInvestedBrl = transactions.reduce((sum, t) => sum + t.brlAmount, 0);
 
  const getDcaForDate = (date) => {
  const relevantTransactions = transactions
    .filter(t => t.date <= date);
  
  const totalBtc = relevantTransactions
    .reduce((sum, t) => sum + t.btcAmount, 0);
  
  const totalUsd = relevantTransactions
    .reduce((sum, t) => sum + t.usdAmount, 0);
  
  const totalBrl = relevantTransactions
    .reduce((sum, t) => sum + t.brlAmount, 0);
    
  return {
    dcaUsd: totalBtc > 0 ? totalUsd / totalBtc : null,
    dcaBrl: totalBtc > 0 ? totalBrl / totalBtc : null
  };
};

  // Get current values based on selected currency
  const getCurrentPrice = useCallback(() => 
    currency === 'USD' ? currentBtcPrice.usd : currentBtcPrice.brl
  , [currency, currentBtcPrice]);

  const getCurrentDca = useCallback(() => {
    const { dcaUsd, dcaBrl } = getDcaForDate(new Date().toISOString().split('T')[0]);
    return currency === 'USD' ? dcaUsd : dcaBrl;
  }, [currency]);

  // Calculate performance metrics
  const calculatePerformanceMetrics = useCallback((data, currentPrice) => {
    if (data.length > 0) {
      const previousDayPrice = data[data.length - 2]?.[currency === 'USD' ? 'priceUsd' : 'priceBrl'] || currentPrice;
      const previousWeekPrice = data[data.length - 8]?.[currency === 'USD' ? 'priceUsd' : 'priceBrl'] || currentPrice;

      // Daily changes
      const dailyPriceChange = currentPrice - previousDayPrice;
      const dailyPriceChangePercent = (dailyPriceChange / previousDayPrice) * 100;
      const dailyPortfolioChange = dailyPriceChange * totalBtc;
      const dailyPortfolioChangePercent = dailyPriceChangePercent;

      // Weekly changes
      const weeklyPriceChange = currentPrice - previousWeekPrice;
      const weeklyPriceChangePercent = (weeklyPriceChange / previousWeekPrice) * 100;
      const weeklyPortfolioChange = weeklyPriceChange * totalBtc;
      const weeklyPortfolioChangePercent = weeklyPriceChangePercent;

      return {
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
      };
    }
    return null;
  }, [currency, totalBtc]);

  // Função para buscar apenas o preço atual do Bitcoin
  const fetchCurrentPrice = async () => {
    try {
      const [usdResponse, brlResponse] = await Promise.all([
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd'),
        fetch('https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=brl')
      ]);

      const usdData = await usdResponse.json();
      const brlData = await brlResponse.json();

      const newPrices = {
        usd: usdData.bitcoin.usd,
        brl: brlData.bitcoin.brl
      };

      setCurrentBtcPrice(newPrices);

      // Atualizar o último ponto do gráfico com o novo preço
      setChartData(prevData => {
        if (prevData.length === 0) return prevData;
        
        const newData = [...prevData];
        const lastPoint = { 
          ...newData[newData.length - 1],
          priceUsd: newPrices.usd,
          priceBrl: newPrices.brl,
          date: new Date().toISOString().split('T')[0]
        };
        newData[newData.length - 1] = lastPoint;
        
        // Recalcular performance com os novos preços
        const dailyPerf = calculatePerformanceMetrics(newData, newPrices[currency.toLowerCase()]);
        if (dailyPerf) {
          setPerformance(dailyPerf);
        }
        
        return newData;
      });
    } catch (error) {
      console.error('Error fetching current Bitcoin price:', error);
    }
  };

  // Calculate P/L
  const pl = totalBtc * (getCurrentPrice() - getCurrentDca());
  
  // Calculate current portfolio value
  const portfolioValue = totalBtc * getCurrentPrice();

  // Format functions
  const formatCurrency = (value) => {
    if (!value) return '-';
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value / 100);
  };

  const formatBtc = (value) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 8,
      maximumFractionDigits: 8,
    }).format(value);
  };

  // Effects
  useEffect(() => {
    // Primeira atualização imediata
    fetchCurrentPrice();

    // Configurar o intervalo de 10 segundos
    const interval = setInterval(fetchCurrentPrice, 5000);

    // Limpar o intervalo quando o componente for desmontado
    return () => clearInterval(interval);
  }, []); // Dependência vazia para executar apenas na montagem

  // Efeito principal para buscar dados históricos
  useEffect(() => {
    const fetchBitcoinData = async () => {
      try {
        const firstTransactionDate = new Date(transactions[0].date);
        const startDate = new Date(firstTransactionDate);
        startDate.setDate(startDate.getDate() - 15);
        
        const today = new Date();
        const daysDiff = Math.ceil((today - startDate) / (1000 * 60 * 60 * 24));

        const [usdResponse, brlResponse] = await Promise.all([
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=usd&days=${daysDiff}&interval=daily`),
          fetch(`https://api.coingecko.com/api/v3/coins/bitcoin/market_chart?vs_currency=brl&days=${daysDiff}&interval=daily`)
        ]);

        const usdData = await usdResponse.json();
        const brlData = await brlResponse.json();

        let totalBtc = 0;
        let totalUsd = 0;
        let totalBrl = 0;
        
        const formattedData = usdData.prices.map(([timestamp, usdPrice], index) => {
          const date = new Date(timestamp).toISOString().split('T')[0];
          const { dcaUsd, dcaBrl } = getDcaForDate(date);
          const brlPrice = brlData.prices[index][1];
          const transaction = transactions.find(t => t.date === date);
          
          if (transaction) {
            totalBtc += transaction.btcAmount;
            totalUsd += transaction.usdAmount;
            totalBrl += transaction.brlAmount;
          }
          
          return {
            date,
            priceUsd: usdPrice,
            priceBrl: brlPrice,
            isTransaction: !!transaction,
            transaction,
            dcaUsd,
            dcaBrl
          };
        });

        const filteredData = formattedData.filter(
          item => new Date(item.date) >= startDate
        );

        setChartData(filteredData);
        
        // Set initial current price
        const lastDataPoint = filteredData[filteredData.length - 1];
        setCurrentBtcPrice({
          usd: lastDataPoint.priceUsd,
          brl: lastDataPoint.priceBrl
        });

        // Calculate initial performance metrics
        const initialPerf = calculatePerformanceMetrics(
          filteredData,
          currency === 'USD' ? lastDataPoint.priceUsd : lastDataPoint.priceBrl
        );
        if (initialPerf) {
          setPerformance(initialPerf);
        }

        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching Bitcoin data:', error);
        setIsLoading(false);
      }
    };

    fetchBitcoinData();
  }, [transactions, currency, calculatePerformanceMetrics]);

  // Efeito para atualizar métricas quando a moeda muda
  useEffect(() => {
    if (chartData.length > 0) {
      const currentPrice = getCurrentPrice();
      const newPerformance = calculatePerformanceMetrics(chartData, currentPrice);
      if (newPerformance) {
        setPerformance(newPerformance);
      }
    }
  }, [currency, chartData, getCurrentPrice, calculatePerformanceMetrics]);

  // Components
  const CurrencyToggle = () => (
    <button
      onClick={() => setCurrency(prev => prev === 'USD' ? 'BRL' : 'USD')}
      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 shadow-md"
    >
      {currency === 'USD' ? (
        <>
          <Coins className="w-4 h-4" />
          <span>Change to BRL</span>
        </>
      ) : (
        <>
          <DollarSign className="w-4 h-4" />
          <span>Change to USD</span>
        </>
      )}
    </button>
  );

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

  const calculatePortfolioData = () => {
    // Criar um mapa para acumular BTC por data
    const btcAccumulated = new Map();
    let runningBtcTotal = 0;
    
    // Primeiro, calcular o BTC acumulado para cada data
    transactions.forEach(t => {
      runningBtcTotal += t.btcAmount;
      btcAccumulated.set(t.date, runningBtcTotal);
    });
    
    // Calcular o investimento acumulado para cada data
    const investmentAccumulated = new Map();
    let runningInvestment = 0;
    transactions.forEach(t => {
      runningInvestment += currency === 'USD' ? t.usdAmount : t.brlAmount;
      investmentAccumulated.set(t.date, runningInvestment);
    });
    
    // Mapear os dados do gráfico com os valores acumulados
    return chartData.map(dataPoint => {
      const date = dataPoint.date;
      // Encontrar o último valor de BTC acumulado antes ou igual a esta data
      const lastBtcTotal = Array.from(btcAccumulated.entries())
        .filter(([accDate]) => accDate <= date)
        .reduce((latest, [accDate, total]) => 
          latest.date <= accDate ? { date: accDate, total } : latest,
          { date: '', total: 0 }
        ).total;
      
      // Encontrar o último valor investido antes ou igual a esta data
      const lastInvestment = Array.from(investmentAccumulated.entries())
        .filter(([accDate]) => accDate <= date)
        .reduce((latest, [accDate, total]) => 
          latest.date <= accDate ? { date: accDate, total } : latest,
          { date: '', total: 0 }
        ).total;
      
      const price = currency === 'USD' ? dataPoint.priceUsd : dataPoint.priceBrl;
      
      return {
        date,
        invested: lastInvestment,
        portfolioValue: lastBtcTotal * price,
        totalBtcAtDate: lastBtcTotal
      };
    });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      const transaction = data.transaction;
      const price = currency === 'USD' ? data.priceUsd : data.priceBrl;
      const dca = currency === 'USD' ? data.dcaUsd : data.dcaBrl;
      
      return (
        <div className="bg-white p-4 border rounded shadow">
          <p className="font-bold">{label}</p>
          <p className="text-blue-600">
            Price: {formatCurrency(price)}
          </p>
          {dca && (
            <p className="text-green-600">
              DCA: {formatCurrency(dca)}
            </p>
          )}
          {transaction && (
            <div className="mt-2 space-y-1 border-t pt-2">
              <p className="font-semibold text-gray-800">Transaction Details:</p>
              <p className="text-gray-700">
                <strong>Amount:</strong> ₿ {formatBtc(transaction.btcAmount)}
              </p>
              <p className="text-gray-700">
                <strong>Price:</strong> {formatCurrency(currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount)}
              </p>
              <p className="text-gray-700">
                <strong>Cost:</strong> {formatCurrency(currency === 'USD' ? transaction.usdAmount : transaction.brlAmount)}
              </p>
              <p className="text-gray-700">
                <strong>Current Value:</strong> {formatCurrency(transaction.btcAmount * getCurrentPrice())}
              </p>
              {getCurrentPrice() > 0 && (
                <p className={`font-semibold ${(getCurrentPrice() - (currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount)) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  P/L: {formatCurrency((getCurrentPrice() - (currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount)) * transaction.btcAmount)}
                  {' '}
                  ({formatPercentage((getCurrentPrice() - (currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount)) / (currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount))})
                </p>
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
        {/* Header */}
        <div className="mb-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            TMPP Bitcoin Tracker
            <span className="animate-pulse">💎₿</span>
          </h1>
          <CurrencyToggle />
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
                  {formatCurrency(portfolioValue)}
                </p>
                <p className="text-xl font-semibold text-blue-600">
                  ₿{formatBtc(totalBtc)}
                </p>
                <div className="pt-4 border-t border-gray-100">
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>🪙 Current Price:</span>
                    <span className="font-medium">{formatCurrency(getCurrentPrice())}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>📊 DCA:</span>
                    <span className="font-medium">{formatCurrency(getCurrentDca())}</span>
                  </p>
                  <p className="text-sm text-gray-600 flex justify-between">
                    <span>✅ P/L:</span>
                    <span className={`font-medium ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(pl)}
                    </span>
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
                    tickFormatter={(value) => {
                      return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
                        style: 'currency',
                        currency: currency,
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                      }).format(value);
                    }}
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
      <br />
      <TransactionsTable 
        transactions={transactions}
        currentBtcPrice={getCurrentPrice()}
        currency={currency}
      />
    </div>
  );
};

export default BitcoinTracker;