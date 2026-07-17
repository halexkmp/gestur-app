# Gestur App

A robust management system for tourism and business operations, built with React, TypeScript, and Vite.

## 🚀 Tech Stack

- **Framework**: [React 18+](https://reactjs.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Language**: [TypeScript](https://www.typescript.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **State Management**: React Context API
- **Backend Integration**: Native `fetch` wrapper with Firebase Auth

## ✨ Key Features

- **Sales Management**: Track and manage sales operations.
- **HR & Employee Management**: Handle employee records, salaries, and advances.
- **Inventory & Stock Control**: Monitor product levels and stock movements.
- **Business Analytics**: Comprehensive reports and business insights.
- **Partner/Buggyman Management**: Manage external partners and services.
- **Audit Trails**: Security and activity monitoring.
- **User Permissions**: Role-based access control (SuperAdmin, HR, etc.).

## 📁 Project Structure

```text
src/
├── assets/         # Static assets (images, fonts)
├── components/     # UI components organized by feature
├── contexts/       # React Context providers (Auth, etc.)
├── hooks/          # Custom React hooks
├── lib/            # Shared utilities and API client
├── services/       # Domain-specific API communication logic
└── types/          # TypeScript interfaces and type definitions
```

## 🛠️ Getting Started

### Prerequisites

- Node.js (Latest LTS recommended)
- npm or yarn

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd gestur-app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables:
   Create a `.env` file in the root directory and add:
   ```env
   VITE_API_URL=http://your-api-url
   ```

### Development

Run the development server:
```bash
npm run dev
```

### Build

Create a production-ready build:
```bash
npm run build
```

## 📜 Development Guidelines

This project follows strict coding standards to ensure quality and maintainability, including:

- TypeScript strictness (No `any`, explicit return types)
- Component architecture (150-line limit, functional components)
- State management strategy
- Styling conventions with Tailwind CSS
- Error handling and quality control

## 📝 License

This project is private and intended for internal use.
