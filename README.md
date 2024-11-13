# 💎 TMPP Bitcoin Portfolio Tracker

A sleek and modern Bitcoin portfolio tracking application built with React, featuring real-time price updates and detailed transaction history. This project represents a portion of my cryptocurrency portfolio (the Bitcoin part), while the majority of my holdings are in Solana.

## 🚀 Features

- **Real-Time Portfolio Overview**
  - Current portfolio value
  - Total Bitcoin holdings
  - Dollar Cost Average (DCA)
  - Profit/Loss tracking

- **Performance Metrics**
  - 24-hour performance tracking
  - 7-day performance analysis
  - Percentage changes
  - Value fluctuations

- **Interactive Charts**
  - Bitcoin price history visualization
  - Portfolio value over time
  - DCA line overlay
  - Transaction points markers

- **Detailed Transaction History**
  - Chronological transaction list (UTC)
  - Purchase price tracking
  - Amount per transaction
  - Real-time value calculations
  - Profit/Loss per transaction

## 🛠️ Tech Stack

- **React** - Frontend framework
- **Tailwind CSS** - Styling and UI components
- **Recharts** - Data visualization
- **CoinGecko API** - Real-time Bitcoin price data
- **Lucide React** - Beautiful icons
- **Shadcn/UI** - UI component library

## 📦 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bitcoin-portfolio-tracker.git
```

2. Install dependencies:
```bash
cd bitcoin-portfolio-tracker
npm install
```

3. Create your transactions.json file:
```json
{
  "transactions": [
    {
      "date": "YYYY-MM-DD",
      "usdAmount": 1000.00,
      "btcPrice": 50000.00,
      "btcAmount": 0.02
    }
  ]
}
```

4. Start the development server:
```bash
npm run dev
```

## 🖥️ Usage

The application automatically:
- Fetches current Bitcoin prices
- Calculates your portfolio performance
- Updates values in real-time
- Displays transaction history
- Shows profit/loss metrics

All you need to do is maintain your transactions.json file with your Bitcoin purchases.

## 📊 Data Structure

Each transaction requires:
- `date`: Transaction date (YYYY-MM-DD)
- `usdAmount`: Amount spent in USD
- `btcPrice`: Bitcoin price at purchase
- `btcAmount`: Amount of Bitcoin purchased

## 🔒 Privacy & Security

This project is designed to be transparent about my Bitcoin holdings while maintaining security best practices:
- No private keys or wallet addresses are stored
- Only public transaction data is displayed
- Data is read-only and stored locally

## 🤝 Contributing

Feel free to fork this project and adapt it for your own portfolio tracking needs. If you make improvements, I'd love to see them! Open a PR or issue for discussions.
