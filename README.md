# 🎰 TracFin Module - Casino Monitoring System

Monitoring and analysis module for french casino groups, compliant with TRACFIN obligations (Treatment of Intelligence and Action against Clandestine Financial Circuits).

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Database](#-database)
- [Development](#-development)
- [Project Structure](#-project-structure)
- [Technologies](#-technologies)
- [Test Data](#-test-data)

## 🎯 Overview

This module enables:
- Tracking player transactions across casinos
- Detecting suspicious transactions (money laundering, high amounts)
- Analyzing game sessions and behavioral patterns
- Managing player profiles and identity documents
- Monitoring TITO tickets and cash transactions
- Applying automatic CSG taxation on winnings


## 🚀 Quick Start

## 🚀 Quick Start

### Prerequisites

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **pnpm** ([Installation](https://pnpm.io/installation))
- **Docker Desktop** ([Download](https://www.docker.com/products/docker-desktop/))

### Setup in 3 commands

```bash
# 1. Install dependencies
pnpm install

# 2. Start PostgreSQL database
pnpm run db:up

# 3. Build the Rust seeder image and generate 40,000 players
pnpm run db:seed:build
```

**✨ OR in a single command:**

```bash
pnpm install && pnpm run db:full
```

### Start the application

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

## 🗄️ Database

### PostgreSQL with Docker

The database contains **40,000 players** with all their data:
- 40,000 complete player profiles
- ~80,000 bank accounts (French IBANs, 1–2 accounts per resident player)
- ~630,000 game sessions
- ~1,260,000 TITO transactions
- ~1,200,000 cash transactions

### Access

**PostgreSQL** (for the application)
```
Host: localhost
Port: 5432
Database: tracfin
User: tracfin_user
Password: tracfin_password
```

**pgAdmin** (web interface)
```
URL: http://localhost:5050
Email: admin@example.com
Password: admin
```

### Database commands

```bash
# Start PostgreSQL + pgAdmin
pnpm run db:up

# Stop
pnpm run db:down

# Complete reset (deletes everything)
pnpm run db:reset

# Generate 40,000 players (uses pre-built Docker image)
pnpm run db:seed

# Rebuild the Rust seeder image, then seed
pnpm run db:seed:build

# Complete setup (reset + seed)
pnpm run db:full

# View logs
pnpm run db:logs

# Check container status
pnpm run db:status

# Open a psql shell
pnpm run db:connect

# Dump the database to backup.sql
pnpm run db:backup

# Check if PostgreSQL is accepting connections
pnpm run test:connection
```

### Complete documentation

See [database/README.md](database/README.md) for:
- Table structure
- Useful SQL queries
- Views and analytics
- Advanced configuration

## 💻 Development

### Available scripts

```bash
# Next.js development
pnpm dev          # Start in development mode
pnpm build        # Production build
pnpm start        # Start in production
pnpm lint         # Lint the code

# Database
pnpm run db:up          # Start PostgreSQL + pgAdmin
pnpm run db:down        # Stop PostgreSQL
pnpm run db:reset       # Complete reset
pnpm run db:seed        # Generate data (pre-built image)
pnpm run db:seed:build  # Rebuild Rust seeder image, then seed
pnpm run db:full        # Reset + Seed
pnpm run db:status      # Check container status
pnpm run db:connect     # Open psql shell
pnpm run db:backup      # Dump DB to backup.sql
pnpm run test:connection # Check DB readiness
```

### Environment variables

The `.env` file contains default values:

```env
DB_HOST=localhost
DB_PORT=5432
DB_NAME=tracfin
DB_USER=tracfin_user
DB_PASSWORD=tracfin_password
```

For local modifications, create a `.env.local` file (ignored by git).

## 📁 Project Structure

```
tracfin-module-example/
├── app/                      # Next.js Pages (App Router)
│   ├── layout.tsx
│   ├── page.tsx
│   └── globals.css
├── src/
│   ├── actions/             # Server actions
│   │   ├── countries.ts
│   │   └── exchange-register.action.ts
│   ├── components/          # React components
│   │   ├── main-component.tsx
│   │   ├── cards/          # Cards (player info, filters)
│   │   ├── tables/         # Data tables
│   │   │   ├── bwr/        # Betting Win Report
│   │   │   ├── cash-transactions/
│   │   │   ├── exchange/   # Exchange register (flat & grouped)
│   │   │   └── tito/
│   │   ├── custom/         # Business components
│   │   └── ui/             # UI components (shadcn)
│   ├── data/
│   │   └── types.ts        # TypeScript types
│   ├── lib/
│   │   ├── rules.ts        # Business rules (CSG, thresholds)
│   │   └── utils.ts        # Utilities
│   └── views/              # Business views
│       ├── summary-view.tsx
│       ├── bwr-view.tsx
│       ├── cash-transactions-view.tsx
│       ├── checks-cc-view.tsx
│       ├── exchange-register-view.tsx
│       ├── tito-view.tsx
│       ├── csg-view.tsx
│       ├── banks-view.tsx
│       └── ...
├── database/
│   ├── init/
│   │   └── 01-schema.sql   # PostgreSQL schema
│   ├── rust-seeder/        # High-performance Rust seeder
│   │   ├── src/
│   │   │   └── main.rs
│   │   ├── Cargo.toml
│   │   └── Dockerfile
│   └── README.md
├── docker-compose.yml       # PostgreSQL + pgAdmin
├── .env                     # Environment variables
└── package.json
```

## 🛠️ Technologies

### Frontend
- **Next.js 16.2** (App Router)
- **React 19**
- **TypeScript 5**
- **Tailwind CSS 4**
- **shadcn/ui** (components)
- **TanStack Table v8** (data tables)
- **TanStack Query v5** (server-state / server actions)
- **TanStack Virtual** (row virtualisation)
- **Zod** (validation)

### Backend
- **PostgreSQL 16** (database)
- **node-postgres (pg)** (driver)
- **Docker** (containerization)

### Dev Tools
- **ESLint** (linting)
- **pnpm** (package manager)
- **Rust** (high-performance data seeder)

## 📊 Test Data

### Features

**40,000 players** generated with:
- ✅ Coherent information (French names, 88% France-based addresses)
- ✅ 12% expatriates (Switzerland, Belgium, Luxembourg, Monaco, etc.)
- ✅ Valid identity documents (passport, ID card, driver's license)
- ✅ 1–2 bank accounts per French-resident player (real French banks, valid FR76 IBANs)
- ✅ ~630,000 game sessions over 18 months (540 days)
- ✅ 5–50 cash transactions per player
- ✅ **Automatic CSG taxation** (13.7% on winnings ≥ €1,500)
- ✅ **5 player profiles**: Occasional, Regular, Regular+, VIP, Pathological
- ✅ **Cheque payments** (buy ≥ €2,000) with CHEQUE_RETURN on jackpot win
- ✅ **ANPR** (5%) and **gaming ban / IM** (8%) flags

### Business rules

#### Taxation on winnings
- **GAINMAS** ≥ €1,500 → Taxable at 13.7% (CSG)
- **JACKPOT** → Always taxable
- **GAINJT** → Non-taxable

#### Cheque payments
- Session buy ≥ **€2,000** → payment issued as a cheque
- Jackpot win that exceeds the cage cheque → **CHEQUE_RETURN** with a negative value (casino returns the cheque to the winner) followed by a WIN payment for the remaining net amount
- WIN payments use the casino's own bank account (Crédit Coopératif)

#### Player profiles
| Profile | Share | Visit frequency | Budget range |
|---|---|---|---|
| Occasional | 62.75% | ~3.5 visits / 18 months | €20–€100 |
| Regular | 19% | ~20 visits / 18 months | €50–€200 |
| Regular+ | 10% | ~35 visits / 18 months | €100–€500 |
| VIP | 2% | ~50 visits / 18 months | €500–€1,000 |
| Pathological | 6% | ~28 visits / 18 months (loss-chase) | €50–€200 (escalating) |

#### Special flags
- **ANPR** (5%): Casino's ban list
- **IM** (8%): Gaming ban

### Data example

```typescript
// WIN transaction with taxation
{
  transaction: "WIN",
  subtransaction: "GAINMAS",
  amount_before_tax: 2000.00,
  tax_amount: 274.00,        // 13.7%
  amount_after_tax: 1726.00,
  is_taxable: true
}

// Cheque buy
{
  transaction: "BUY",
  subtransaction: "CHEQUE",
  value: 2500.00,
  bank_name: "BNP Paribas",
  account_number: "FR7612345678901234567890123"
}

// Casino returns cheque on jackpot win (negative value = red line in Checks & CC view)
{
  transaction: "CHEQUE",
  subtransaction: "CHEQUE_RETURN",
  value: -2500.00,            // same cheque number as the original buy
  bank_name: "Crédit Coopératif",
  account_number: "FR7642559900003571759003414"
}
```

## 🔍 Useful SQL Queries

### Top players by stake

```sql
SELECT 
  p.firstname, p.lastname, 
  SUM(gs.coin_in) as total_coin_in,
  COUNT(gs.id) as sessions
FROM players p
JOIN game_sessions gs ON p.client_id = gs.client_id
GROUP BY p.client_id, p.firstname, p.lastname
ORDER BY total_coin_in DESC
LIMIT 10;
```

### Suspicious transactions

```sql
SELECT * FROM suspicious_transactions
WHERE DATE(gamedate) = CURRENT_DATE
ORDER BY GREATEST(buy, sell) DESC;
```

See [database/README.md](database/README.md) for more examples.

## 🐛 Troubleshooting

### Docker won't start

```bash
# Check that Docker Desktop is running
docker --version

# Check logs
pnpm run db:logs

# Complete reset
pnpm run db:reset
```

### Port 5432 already in use

```bash
# Windows
netstat -ano | findstr :5432

# Mac/Linux
lsof -i :5432
```

Then stop the process or change the port in the Compose file (`docker-compose.yml`).

### Seeding is slow

This is normal! Generating 40K players + ~2M transactions takes **3–7 minutes**.

### Database connection error

Wait for PostgreSQL to be fully started (15-20 seconds after `db:up`).

```bash
# Check if DB is ready
docker compose exec postgres pg_isready -U tracfin_user
```

## 📝 License

This project is a development example. All data is 100% fictional.

## 🤝 Contributing

To test this project:
1. Fork the repository
2. Follow installation instructions
3. Database auto-configures
4. No manual configuration needed!

---

**Made with ❤️ by Tony J**
