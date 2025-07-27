# 🚀 M.R.S. Holdings Affiliate Platform

A comprehensive affiliate management system for **The Military Gift Shop** with multi-platform integration and advanced analytics.

## 🌟 Overview

This platform provides a complete solution for managing affiliate programs across multiple platforms including GoAffPro, GHL (Go High Level), Mighty Networks, and Shopify. Built with modern web technologies and designed for scalability and security.

**Repository**: [https://github.com/MyAiAd/mc.git](https://github.com/MyAiAd/mc.git)

## ✨ Key Features

### 🎯 Multi-Platform Integration
- **GoAffPro**: Complete affiliate tracking and commission management
- **GHL (Go High Level)**: CRM integration and lead management  
- **Mighty Networks**: Community-based affiliate tracking
- **Shopify**: E-commerce integration for The Military Gift Shop
- **PayPal**: Payment processing and webhook integration

### 📊 Advanced Analytics
- Real-time affiliate performance tracking
- Commission calculations and reporting
- Multi-level affiliate structures (Aligned, Advocate, Ambassador, etc.)
- Performance leaderboards and rankings

### 🔐 Security & Authentication
- Supabase authentication with Row Level Security (RLS)
- Secure API key management
- Environment-based configuration
- Comprehensive data sanitization

### 🤖 AI-Powered Features
- AI chat integration for customer support
- RAG (Retrieval-Augmented Generation) document system
- Intelligent data analysis and insights

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Vite** for build tooling
- **React Router** for navigation
- **Chart.js** for analytics visualization

### Backend
- **Supabase** (PostgreSQL, Auth, RLS, Edge Functions)
- **Node.js** for server-side operations
- **RESTful APIs** for data integration

### Integrations
- **GoAffPro API** for affiliate management
- **GHL API** for CRM operations
- **Shopify API** for e-commerce data
- **Mighty Networks** via Zapier webhooks
- **PayPal Webhooks** for payment processing

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account
- API keys for integrated platforms

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/MyAiAd/mc.git
   cd mc
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   ```bash
   cp env.example .env
   # Edit .env with your actual API keys and configuration
   ```

4. **Start development server**
   ```bash
   npm run dev
   ```

## 🔧 Configuration

### Required Environment Variables

```env
# Supabase Configuration
VITE_SUPABASE_URL=<YOUR_SUPABASE_URL>
VITE_SUPABASE_ANON_KEY=<YOUR_SUPABASE_ANON_KEY>
VITE_SUPABASE_SERVICE_ROLE_KEY=<YOUR_SUPABASE_SERVICE_ROLE_KEY>

# GoAffPro Configuration
VITE_GOAFFPRO_ACCESS_TOKEN=<YOUR_GOAFFPRO_ACCESS_TOKEN>
VITE_GOAFFPRO_PUBLIC_TOKEN=<YOUR_GOAFFPRO_PUBLIC_TOKEN>

# GHL Configuration
VITE_GHL_API_KEY=<YOUR_GHL_API_KEY>
VITE_GHL_LOCATION_ID=<YOUR_GHL_LOCATION_ID>

# Mighty Networks Configuration
VITE_MIGHTY_NETWORKS_ZAPIER=<YOUR_MIGHTY_NETWORKS_ZAPIER>

# Shopify Configuration (The Military Gift Shop)
SHOPIFY_SHOP_DOMAIN=themilitarygiftshop.myshopify.com
SHOPIFY_ACCESS_TOKEN=<YOUR_SHOPIFY_ACCESS_TOKEN>
```

## 📁 Project Structure

```
mc/
├── src/
│   ├── components/          # React components
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── contexts/           # React contexts
│   └── utils/              # Utility functions
├── supabase/
│   ├── functions/          # Edge functions
│   └── migrations/         # Database migrations
├── scripts/                # Automation scripts
├── standalone-chat-app/    # Standalone AI chat application
└── docs/                   # Documentation
```

## 🔄 Data Sync & Import

The platform supports automated data synchronization from multiple sources:

- **GoAffPro**: Real-time affiliate and order sync
- **GHL**: Contact and campaign data import
- **Mighty Networks**: Community member tracking
- **Shopify**: Product and order synchronization

## 📈 Analytics & Reporting

- **Performance Dashboards**: Real-time affiliate metrics
- **Commission Tracking**: Automated calculation and reporting  
- **Multi-Level Structures**: Support for complex affiliate hierarchies
- **Export Capabilities**: CSV and PDF report generation

## 🛡️ Security Features

- **Row Level Security (RLS)** on all database tables
- **API Key Encryption** for sensitive credentials
- **Environment-based Configuration** for different deployment stages
- **Comprehensive Input Validation** and sanitization

## 🚀 Deployment

### Vercel Deployment
1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy with automatic builds on push

### Supabase Setup
1. Create new Supabase project
2. Run database migrations
3. Configure authentication settings
4. Deploy edge functions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is private and proprietary to M.R.S. Holdings.

## 🆘 Support

For support and questions, please contact the development team or create an issue in the repository.

---

**Built with ❤️ for The Military Gift Shop affiliate program** 