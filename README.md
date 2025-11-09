# DashboardPro - Professional Web Application

A modern, scalable React dashboard application built with TypeScript, Tailwind CSS, and a comprehensive service-based architecture.

## 🚀 Features

### Core Technologies

- **React 18** with TypeScript for type safety
- **Vite** for blazing fast development and building
- **React Router 6** for client-side routing
- **TailwindCSS 3** with custom design system
- **Axios** for API requests with interceptors
- **React Query** for data fetching and caching
- **Recharts** for beautiful, responsive charts

### Design System

- Complete color palette with **primary**, **secondary**, and **accent** colors (50-950 shades)
- **Dark/Light mode** support with system preference detection
- Responsive design optimized for all screen sizes
- Professional UI components built on **Radix UI** primitives

### Dashboard Features

- **Real-time statistics** with animated counters and trend indicators
- **Interactive charts** (Line, Bar, Pie) with responsive design
- **Data tables** with search, sorting, and filtering
- **Professional navigation** with collapsible sidebar
- **Theme toggle** with smooth transitions
- **Responsive layout** that works on mobile, tablet, and desktop

### Architecture

- **Service-based API layer** with error handling and interceptors
- **Modular component structure** for maximum reusability
- **Clean separation of concerns** between UI, business logic, and data
- **Production-ready** with TypeScript strict mode

## 🎨 Color Palette

### Primary (Modern Blue)

- 50: `hsl(219, 95%, 96%)`
- 500: `hsl(222, 54%, 42%)` (Default)
- 950: `hsl(228, 39%, 10%)`

### Secondary (Elegant Purple)

- 50: `hsl(270, 30%, 96%)`
- 500: `hsl(270, 26%, 39%)` (Default)
- 950: `hsl(270, 34%, 9%)`

### Accent (Vibrant Emerald)

- 50: `hsl(142, 76%, 96%)`
- 500: `hsl(148, 47%, 36%)` (Default)
- 950: `hsl(154, 45%, 9%)`

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/         # Dashboard-specific components
│   │   ├── StatsCard.tsx
│   │   ├── ChartContainer.tsx
│   │   └── DataTable.tsx
│   ├── layout/           # Layout components
│   │   ├── DashboardLayout.tsx
│   │   ├── Header.tsx
│   │   └── Sidebar.tsx
│   └── ui/               # Reusable UI components
├── contexts/             # React contexts
│   └── ThemeProvider.tsx
├── hooks/                # Custom hooks
├── lib/                  # Utilities and configurations
│   ├── axios.ts          # API client setup
│   └── utils.ts          # Helper functions
├── pages/                # Page components
│   ├── Dashboard.tsx     # Main dashboard
│   ├── Analytics.tsx     # Analytics page
│   ├── Users.tsx         # Users management
│   └── NotFound.tsx      # 404 page
├── services/             # API service layer
│   └── api.ts            # API methods and types
└── App.tsx               # Main app component
```

## 🛠️ Development

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

```bash
npm install
```

### Development Server

```bash
npm run dev
```

Starts the development server with hot module replacement.

### Build for Production

```bash
npm run build
```

Creates an optimized production build.

### Type Checking

```bash
npm run typecheck
```

Runs TypeScript compiler to check for type errors.

### Testing

```bash
npm test
```

Runs the test suite using Vitest.

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_BASE_URL=https://your-api-endpoint.com
```

### Theme Customization

Update `tailwind.config.ts` to customize the color palette:

```typescript
// Add your custom colors
colors: {
  primary: {
    500: "hsl(your-custom-hue, saturation%, lightness%)",
    // ... other shades
  }
}
```

### API Configuration

Configure the API client in `src/lib/axios.ts`:

```typescript
export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 10000,
  // Add custom headers, interceptors, etc.
});
```

## 📊 Dashboard Components

### StatsCard

Display key metrics with trend indicators:

```tsx
<StatsCard
  title="Total Users"
  value={1234}
  icon={Users}
  trend={{ value: 12, isPositive: true }}
/>
```

### ChartContainer

Responsive charts with multiple types:

```tsx
<ChartContainer
  title="Revenue Over Time"
  data={chartData}
  type="line"
  dataKey="revenue"
/>
```

### DataTable

Sortable, searchable data tables:

```tsx
<DataTable title="Users" columns={userColumns} data={userData} searchable />
```

## 🌙 Dark Mode

The application includes a complete dark mode implementation:

- System preference detection
- Manual toggle with smooth transitions
- Consistent color schemes across all components
- Automatic persistence of user preference

## 📱 Responsive Design

- **Mobile First**: Optimized for mobile devices
- **Tablet**: Adapted layouts for medium screens
- **Desktop**: Full-featured desktop experience
- **Sidebar**: Collapsible navigation on all screen sizes

## 🚀 Production Deployment

The application is production-ready with:

- Optimized bundle size
- Code splitting
- Tree shaking
- Progressive Web App features
- SEO-friendly routing

## 📄 License

This project is open source and available under the MIT License.

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

Built with ❤️ using modern web technologies for optimal performance and developer experience.
