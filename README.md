# Manufacturing Management System

A comprehensive digital manufacturing and production management application built for a 24-hour hackathon challenge.

## 🎯 Project Overview

This application allows businesses to manage their production process digitally, covering the complete manufacturing workflow from Bill of Materials (BOM) to finished products.

### Core Features

- **Product Management**: Catalog and inventory tracking
- **Bill of Materials (BOM)**: Recipe management for products
- **Manufacturing Orders**: Production planning and execution
- **Work Orders**: Task-level manufacturing operations
- **Stock Management**: Real-time inventory tracking with audit trails
- **Role-based Access Control**: Admin and Operator roles with specific permissions

## 🛠 Tech Stack

- **Framework**: Next.js 14+ with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Backend & Database**: Supabase (PostgreSQL, Auth, RLS)
- **Authentication**: Supabase Auth with email/password and Google OAuth

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### 1. Clone and Install

```bash
git clone <repository-url>
cd odoo-management
npm install
```

### 2. Environment Setup

Create a `.env.local` file:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 3. Database Setup

1. Create a new Supabase project
2. Go to SQL Editor in your Supabase dashboard
3. Copy and paste the contents of `database/schema.sql`
4. Execute the schema to create all tables and policies

### 4. Run the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## 📁 Project Structure

```
├── app/                          # Next.js App Router pages
│   ├── auth/                     # Authentication pages
│   ├── dashboard/                # Main dashboard
│   ├── products/                 # Product management
│   ├── boms/                     # Bill of Materials
│   ├── manufacturing-orders/     # Manufacturing orders
│   ├── work-orders/              # Work order management
│   └── stock/                    # Stock management
├── components/                   # React components
│   ├── auth/                     # Authentication components
│   ├── dashboard/                # Dashboard components
│   ├── forms/                    # Form components
│   ├── layout/                   # Layout components
│   └── ui/                       # shadcn/ui components
├── lib/                          # Utility libraries
│   ├── services/                 # API service layers
│   ├── hooks/                    # Custom React hooks
│   ├── validations/              # Form validation schemas
│   ├── supabase.ts              # Supabase client configuration
│   └── utils.ts                 # Utility functions
├── types/                        # TypeScript type definitions
│   ├── index.ts                 # Main application types
│   └── supabase.ts              # Generated Supabase types
└── database/                     # Database schema and docs
    ├── schema.sql               # Complete database schema
    └── README.md                # Database setup instructions
```

## 👥 User Roles & Permissions

### Admin Role
- Full access to all features
- Can manage users and system settings
- Can create, read, update, and delete all entities
- Can assign work orders to operators

### Operator Role
- Can view all data
- Can create products, BOMs, and manufacturing orders
- Can update only work orders assigned to them
- Can create stock movements

## 🔐 Authentication & Security

- **Authentication**: Email/password and Google OAuth via Supabase Auth
- **Authorization**: Row Level Security (RLS) enforced at database level
- **Role Management**: Database-level role assignment and validation
- **Session Management**: Automatic session handling with Supabase

## 📊 Key Concepts

### Bill of Materials (BOM)
A recipe that defines what components are needed to manufacture a product, including quantities and relationships.

### Manufacturing Order (MO)
A request to produce a specific quantity of a product using a particular BOM. Tracks production progress and status.

### Work Order (WO)
Individual tasks or steps within a Manufacturing Order. Can be assigned to specific operators and tracked for completion.

### Stock Ledger
An immutable audit trail of all inventory movements, providing complete traceability of stock changes.

## 🔧 Development

### Adding New Components

```bash
# Add shadcn/ui components
npx shadcn@latest add [component-name]
```

### Database Migrations

When making schema changes:
1. Update `database/schema.sql`
2. Apply changes in Supabase SQL Editor
3. Regenerate types: `npx supabase gen types typescript --project-id YOUR_PROJECT_ID > types/supabase.ts`

### Code Style

- Use TypeScript for all new code
- Follow the existing folder structure
- Use shadcn/ui components for consistency
- Implement proper error handling
- Add proper TypeScript types

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (primary interface)
- Tablet (secondary interface)
- Mobile (basic functionality)

## 🚀 Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

## 🤝 Contributing

This project was built during a hackathon. For contributions:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Backend powered by [Supabase](https://supabase.com/)
- Icons from [Lucide React](https://lucide.dev/)

---

Built with ❤️ for the Manufacturing Management hackathon challenge.
