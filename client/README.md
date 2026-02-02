# E-Commerce Frontend

React-based frontend for the e-commerce application.

## Tech Stack

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Routing**: React Router v7
- **State Management**: TanStack React Query
- **HTTP Client**: Axios
- **Styling**: CSS with CSS Variables

## Prerequisites

- Node.js v18+
- Backend server running on port 3000 (see main README)

## Project Structure

```
client/
├── public/                    # Static assets
├── src/
│   ├── api/
│   │   └── client.ts          # Axios instance and API functions
│   ├── components/
│   │   ├── Navbar.tsx         # Navigation bar
│   │   ├── ProductCard.tsx    # Product card component
│   │   ├── ProtectedRoute.tsx # Auth route wrapper
│   │   └── index.ts           # Component exports
│   ├── context/
│   │   └── AuthContext.tsx    # Authentication context provider
│   ├── pages/
│   │   ├── Home.tsx           # Landing page
│   │   ├── Login.tsx          # Login page
│   │   ├── Signup.tsx         # Registration page
│   │   ├── Products.tsx       # Products listing
│   │   ├── ProductDetail.tsx  # Single product view
│   │   ├── AdminProducts.tsx  # Admin product management
│   │   ├── ProductForm.tsx    # Create/edit product form
│   │   └── index.ts           # Page exports
│   ├── types/
│   │   └── index.ts           # TypeScript interfaces
│   ├── App.tsx                # Main application component
│   ├── App.css                # Global styles
│   ├── main.tsx               # Application entry point
│   └── index.css              # Base CSS reset
├── .env                       # Environment variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

## Getting Started

### 1. Install dependencies

From the `client` directory:

```bash
npm install
```

Or from the root directory:

```bash
npm run client:install
```

### 2. Configure environment

Create a `.env` file in the `client` directory:

```env
VITE_API_URL=http://localhost:3000/api
```

### 3. Start the development server

```bash
npm run dev
```

Or from the root directory:

```bash
npm run start:client
```

The app will be available at `http://localhost:5173`.

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build locally |
| `npm run lint` | Run ESLint |

## Pages and Routes

| Route | Component | Description | Access |
|-------|-----------|-------------|--------|
| `/` | Home | Landing page with welcome message | Public |
| `/login` | Login | User login form | Public |
| `/signup` | Signup | User registration form | Public |
| `/products` | Products | Browse all products | Public |
| `/products/:id` | ProductDetail | View single product | Public |
| `/admin/products` | AdminProducts | Manage products (CRUD) | Admin only |
| `/admin/products/new` | ProductForm | Create new product | Admin only |
| `/admin/products/edit/:id` | ProductForm | Edit existing product | Admin only |

## Authentication

Authentication is handled via JWT tokens stored in localStorage:

- **Token Storage**: `localStorage.getItem('token')`
- **User Storage**: `localStorage.getItem('user')`
- **Auth Header**: Automatically added to requests via Axios interceptor

### Auth Context

The `AuthContext` provides:

```typescript
interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
}
```

Usage in components:

```tsx
import { useAuth } from '../context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, isAdmin, logout } = useAuth();
  // ...
}
```

## API Client

The API client (`src/api/client.ts`) provides typed functions for all backend endpoints:

```typescript
// Auth
authApi.signup({ name, email, password })
authApi.login({ email, password })
authApi.me()

// Products
productsApi.getAll()
productsApi.getById(id)
productsApi.create({ name, description, price, tags })
productsApi.update(id, { name, description, price, tags })
productsApi.delete(id)
```

## Styling

The app uses CSS with CSS Variables for theming. Key variables are defined in `App.css`:

```css
:root {
  --primary-color: #3b82f6;
  --primary-hover: #2563eb;
  --secondary-color: #6b7280;
  --danger-color: #ef4444;
  --success-color: #10b981;
  --background-color: #f9fafb;
  --card-background: #ffffff;
  --text-color: #1f2937;
  --text-light: #6b7280;
  --border-color: #e5e7eb;
  --border-radius: 8px;
}
```

## Protected Routes

Use the `ProtectedRoute` component to restrict access:

```tsx
// Require authentication
<ProtectedRoute>
  <PrivatePage />
</ProtectedRoute>

// Require admin role
<ProtectedRoute requireAdmin>
  <AdminPage />
</ProtectedRoute>
```

## Development Tips

### Adding a new page

1. Create the component in `src/pages/`
2. Export it from `src/pages/index.ts`
3. Add the route in `App.tsx`

### Adding a new API endpoint

1. Add the function to `src/api/client.ts`
2. Create/update types in `src/types/index.ts`

### Debugging

- Check browser DevTools Console for errors
- Use React DevTools for component inspection
- Network tab shows API request/response details

## Building for Production

```bash
npm run build
```

This creates an optimized build in the `dist` folder.

To preview the production build:

```bash
npm run preview
```

## Troubleshooting

### Blank page / Runtime errors
- Open browser DevTools (F12) and check the Console tab
- Ensure the backend server is running on port 3000
- Check that `.env` has the correct `VITE_API_URL`

### CORS errors
- Verify the backend has CORS enabled
- Check that the API URL matches the backend address

### Authentication issues
- Clear localStorage: `localStorage.clear()`
- Check token format in Network tab

### Port already in use
Vite will automatically use the next available port (5174, 5175, etc.)

## ESLint Configuration

For stricter type checking, update `eslint.config.js`:

```js
export default defineConfig([
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      tseslint.configs.recommendedTypeChecked,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
])
```
