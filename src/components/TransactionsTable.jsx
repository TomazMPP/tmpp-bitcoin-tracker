import React from 'react';
import { ArrowDownUp, TrendingUp, TrendingDown } from 'lucide-react';

const TransactionsTable = ({ transactions, currentBtcPrice, currency }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat(currency === 'USD' ? 'en-US' : 'pt-BR', {
      style: 'currency',
      currency: currency,
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

  const formatPercentage = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'percent',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleString(currency === 'USD' ? 'en-US' : 'pt-BR', {
      timeZone: 'UTC',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: currency === 'USD'
    }) + ' UTC';
  };

  // Sort transactions by date (newest first)
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  // Calculate totals
  const totals = transactions.reduce((acc, transaction) => {
    const amount = currency === 'USD' ? transaction.usdAmount : transaction.brlAmount;
    const currentValue = transaction.btcAmount * currentBtcPrice;
    return {
      btcAmount: acc.btcAmount + transaction.btcAmount,
      cost: acc.cost + amount,
      currentValue: acc.currentValue + currentValue,
    };
  }, { btcAmount: 0, cost: 0, currentValue: 0 });

  // Calculate dollar cost average
  const dollarCostAverage = totals.cost / totals.btcAmount;
  
  // Calculate total P/L
  const totalPL = totals.currentValue - totals.cost;
  const totalPLPercentage = (totalPL / totals.cost);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
      <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
        <div className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center gap-2">
            <ArrowDownUp className="w-5 h-5" />
            Transaction History
          </h2>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    When (UTC)
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Purchase Price
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount (BTC)
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cost
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Current Value
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    P/L
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedTransactions.map((transaction, idx) => {
                  const amount = currency === 'USD' ? transaction.usdAmount : transaction.brlAmount;
                  const purchasePrice = currency === 'USD' ? transaction.btcPrice : transaction.brlAmount / transaction.btcAmount;
                  const currentValue = transaction.btcAmount * currentBtcPrice;
                  const pl = currentValue - amount;
                  const plPercentage = pl / amount;
                  const isPositive = pl >= 0;

                  return (
                    <tr key={idx} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDateTime(transaction.date)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(purchasePrice)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatBtc(transaction.btcAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                        {formatCurrency(currentValue)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                        <div className={`flex items-center justify-end gap-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isPositive ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span className="font-medium">
                            {formatCurrency(Math.abs(pl))}
                          </span>
                          <span className="text-xs">
                            ({formatPercentage(Math.abs(plPercentage))})
                          </span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {/* Totals row */}
                <tr className="bg-gray-50 font-medium">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold uppercase">
                    TOTAL
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    <div className="text-xs text-gray-500">average price</div>
                    {formatCurrency(dollarCostAverage)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    <div className="text-xs text-gray-500">amount</div>
                    ₿{formatBtc(totals.btcAmount)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    <div className="text-xs text-gray-500">cost</div>
                    {formatCurrency(totals.cost)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    <div className="text-xs text-gray-500">current value</div>
                    {formatCurrency(totals.currentValue)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                    <div className={`flex items-center justify-end gap-1 ${totalPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {totalPL >= 0 ? (
                        <TrendingUp className="w-4 h-4" />
                      ) : (
                        <TrendingDown className="w-4 h-4" />
                      )}
                      <span className="font-medium">
                        {formatCurrency(Math.abs(totalPL))}
                      </span>
                      <span className="text-xs">
                        ({formatPercentage(Math.abs(totalPLPercentage))})
                      </span>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransactionsTable;