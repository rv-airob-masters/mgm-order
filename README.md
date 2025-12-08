# MGM Packing Assistant

A comprehensive order management and packing calculation system designed for small-scale food manufacturing units that produce sausages, burgers, and similar products. The application streamlines the process of calculating packing requirements based on customer orders.

## 🎯 Overview

The MGM Packing Assistant helps manufacturing units:
- Manage customer information and their specific packing preferences
- Create and track orders with automatic packing calculations
- Calculate the number of trays, tubs, and boxes needed for each order
- Apply customer-specific packing rules and rounding logic
- Track order status from creation to completion

## ✨ Features

### Dashboard (Home Page)
- Today's order summary with live updates
- Key metrics displayed: Total Orders, Confirmed, Completed counts
- Totals for kg, Trays, Tubs, Boxes, and Labels
- Quick access tiles for New Order and Order History

### Customer Management
- Add and manage customer profiles
- Set default pack types (tray or tub) per customer
- Configure special packing instructions for each customer
- Define regular product lists for quick order creation

### Order Creation
- **Date Picker**: Select order date (defaults to today)
- Select from predefined regular items based on customer preferences
- Add additional products on-demand
- **Pack Type Toggle**: Switch between Tray/Tub per product (override customer default)
- **Use Boxes Toggle**: Enable/disable box calculation per order (for customers who use crates instead)
- Automatic calculation of:
  - Number of trays or tubs based on product weight
  - Number of boxes based on packing rules
  - Total weight per order
  - Label count (1 label per tray + 1 per tub + 1 per box)
- Support for different tub sizes (2kg and 5kg)

### Edit Orders
- Click any order in Order History to view details
- Edit quantities, pack types, date, and box settings
- Real-time recalculation of packing requirements

### Packing Calculations
- **Tray Packing**: Products packed in 400g trays, with configurable trays per box
- **Tub Packing**: Products packed in 2kg or 5kg tubs, with configurable tubs per box
- **Burger Packing**: Special calculations for burger products (typically 12 per tray)
- **Meatball Packing**: Count-based packing (configurable count per tub)
- **Rounding Rules**: Support for rounding up, down, or to specific multiples
- **No-Box Option**: Toggle to disable boxes for customers using crates
- **Label Count**: Automatic calculation of labels needed (trays + tubs + boxes)
- **Halalnivore Special Rule**: If remainder < 3 when dividing tubs by 3, redistributes to boxes of 4

### Order Management
- View complete order history
- **Group By Dropdown**: Group orders by Date, Status, or Customer
- **Filter by Customer**: Show orders for a specific customer
- **Filter by Status**: Show orders with a specific status
- Customer name displayed prominently on order cards (order number secondary)
- Order status tracking:
  - **Draft**: Order being prepared
  - **Confirmed**: Order confirmed for production
  - **Completed**: Order delivered
  - **Cancelled**: Order cancelled
- View detailed order breakdown including all items, calculations, and label count

## 🛠️ Tech Stack

### Frontend (Web Application)
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **Zustand** for state management with localStorage persistence
- **React Router** for navigation
- **PWA Support** for offline capability

### Backend (API Server)
- **Node.js** with Express
- **TypeScript** for type safety
- RESTful API design

### Shared Package
- Common types and interfaces
- Calculation engine for packing logic
- Shared utilities

## 📁 Project Structure

```
mgm-packing-assistant/
├── apps/
│   ├── web/                 # React web application
│   │   ├── src/
│   │   │   ├── pages/       # Page components
│   │   │   ├── store/       # Zustand store
│   │   │   └── App.tsx      # Main app component
│   │   └── package.json
│   └── api/                 # Express API server
│       ├── src/
│       │   ├── routes/      # API routes
│       │   └── index.ts     # Server entry point
│       └── package.json
├── packages/
│   └── shared/              # Shared types and utilities
│       ├── src/
│       │   ├── types/       # TypeScript interfaces
│       │   └── calculations/# Packing calculation logic
│       └── package.json
└── package.json             # Root package.json (npm workspaces)
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm 9+

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mgm-packing-assistant
```

2. Install dependencies:
```bash
npm install
```

3. Build the shared package:
```bash
npm run build:shared
```

### Running the Application

**Development Mode (Web App):**
```bash
npm run dev:web
```
The web app will be available at `http://localhost:5173` (or next available port)

**Development Mode (API Server):**
```bash
npm run dev:api
```
The API server will run at `http://localhost:3001`

**Run Both:**
```bash
npm run dev
```

## 📖 Usage Guide

### Creating a New Order

1. Navigate to **New Order** from the home page
2. Select a customer from the dropdown
3. The system automatically loads the customer's regular products
4. Enter quantities for each product (in kg, count, or trays depending on product type)
5. Toggle between tray/tub pack types if applicable
6. For products with size options (2kg/5kg tubs), select the appropriate size
7. Use **Add Other Item** to include additional products not in the regular list
8. Review the calculated trays/tubs and boxes
9. Click **Save Order** to confirm


## ⚙️ Configuration

### Customer Rules

Customer-specific packing rules can be configured in `apps/web/src/store/index.ts`:

```typescript
{
  customerId: 'customer-id',
  customerName: 'Customer Name',
  regularProducts: [
    { productId: 'chicken-sausage', packType: 'tray' },
    { productId: 'beef-burger', packType: 'tray' }
  ],
  packingRules: {
    traysPerBox: 20,           // Number of trays per box
    tubsPerBox5kg: 3,          // Number of 5kg tubs per box
    tubsPerBox2kg: 7,          // Number of 2kg tubs per box
    roundingRule: 'down',      // 'up', 'down', or 'nearest'
    roundToMultiple: 20,       // Round to multiple of this number
    noBoxes: false,            // If true, don't calculate boxes
    extraTubRule: 'pack4'      // Special rule for extra tubs
  },
  specialInstructions: 'Customer-specific notes'
}
```

### Product Configuration

Products are defined in the `ALL_PRODUCTS` array:

```typescript
{
  id: 'product-id',
  name: 'Product Name',
  category: 'sausage',        // 'sausage', 'burger', or 'meatball'
  weightPerTray: 0.4,         // Weight in kg per tray
  weightPerTub: 5,            // Weight in kg per tub (for tub products)
  traysPerBox: 25,            // Default trays per box
  tubsPerBox: 3,              // Default tubs per box
  defaultPackType: 'tray'     // 'tray' or 'tub'
}
```

## 📊 Calculation Logic

### Tray Calculations
- **Trays Needed** = Order Weight (kg) ÷ Weight per Tray (typically 0.4kg)
- **Boxes Needed** = Trays Needed ÷ Trays per Box

### Tub Calculations
- **Tubs Needed** = Order Weight (kg) ÷ Tub Size (2kg or 5kg)
- **Boxes Needed** = Tubs Needed ÷ Tubs per Box

### Rounding Rules
- **Round Up**: Always round to the next whole number
- **Round Down**: Always round to the lower whole number
- **Round to Multiple**: Round to nearest multiple (e.g., multiples of 20)

### Special Cases
- **Meatballs**: Calculated by count rather than weight
- **No-Box Customers**: Trays/tubs delivered without boxing
- **Extra Tub Rule**: Special handling for remaining tubs that don't fill a complete box

## 🔌 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |
| GET | `/api/v1/products` | Get all products |
| POST | `/api/v1/calculate/single` | Calculate packing for single product |
| POST | `/api/v1/calculate/order` | Calculate packing for entire order |

### Example: Calculate Single Product

```bash
curl -X POST http://localhost:3001/api/v1/calculate/single \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Chicken Sausage",
    "productType": "sausage",
    "quantityKg": 10,
    "packType": "tray"
  }'
```

## 💾 Data Persistence

The web application uses **localStorage** for data persistence through Zustand's persist middleware. Data is stored under the key `mgm-packing-store`.

### Clearing Data
To reset all data (customers and orders):
1. Open browser DevTools (F12)
2. Go to **Application** → **Local Storage**
3. Delete the `mgm-packing-store` entry
4. Refresh the page

## 🎨 UI Components

### Home Page (Dashboard)
- Today's order statistics with live updates
- Metrics: Total Orders, Confirmed, Completed, Total kg, Trays, Tubs, Boxes, Labels
- Quick access tiles for New Order and Order History

### New Order Page
- Customer selection dropdown
- **Order Settings**: Date picker, Use Boxes toggle
- Regular items pre-loaded based on customer
- Per-item quantity input with **Tray/Tub toggle buttons**
- Real-time calculation display
- Order summary with totals (kg, Trays, Tubs, Boxes, Labels)

### Edit Order Page
- All features of New Order page
- Pre-populated with existing order data
- Save changes with recalculated packing

### Order History Page
- **Group By dropdown**: Date, Status, or Customer
- **Filter by Customer**: Show specific customer's orders
- **Filter by Status**: Filter by order status
- Customer name prominently displayed on cards
- Click-to-view order details modal
- Status management (Confirmed, Completed, Draft, Cancelled)
- Edit order button in detail modal

### Customers Page
- List of all customers
- Add new customer modal
- Customer details display

## 📱 Progressive Web App (PWA)

The application is configured as a PWA, allowing:
- Installation on mobile devices and desktops
- Offline access to previously loaded data
- App-like experience

## 🔧 Development

### Building for Production

```bash
# Build all packages
npm run build

# Build only shared package
npm run build:shared

# Build only web app
npm run build:web
```

### Project Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Run all apps in development mode |
| `npm run dev:web` | Run web app only |
| `npm run dev:api` | Run API server only |
| `npm run build` | Build all packages |
| `npm run build:shared` | Build shared package |

## 📝 License

This project is proprietary software developed for MGM Packing operations.

---

*Built with ❤️ for efficient packing operations*

