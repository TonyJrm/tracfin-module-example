# 🚀 TracFin Module Setup Guide

This guide walks you through installing and configuring the TracFin Module project step-by-step, regardless of your platform (Windows, Mac, Linux).

## ⚡ Automatic Installation (Recommended)

### Windows (PowerShell)

```powershell
# Open PowerShell as administrator, then:
.\setup.ps1
```

### Mac / Linux (Bash)

```bash
# In terminal:
chmod +x setup.sh
./setup.sh
```

The script will:
1. ✅ Check prerequisites (Node.js, pnpm, Docker)
2. ✅ Install npm dependencies
3. ✅ Start PostgreSQL in Docker
4. ✅ Generate 40,000 players with all their data

**Total duration: 5–10 minutes**

---

## 📋 Manual Installation

If you prefer to install manually or if the automatic script fails:

### Step 1: Prerequisites

#### 1.1 Node.js (v18 or higher)

**Windows / Mac:**
- Download from [nodejs.org](https://nodejs.org/)
- Install the LTS version (Long Term Support)

**Linux (Ubuntu/Debian):**
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

**Verify installation:**
```bash
node --version   # Should display v18.x or higher
npm --version
```

#### 1.2 pnpm

**Install globally:**
```bash
npm install -g pnpm
```

**Verify:**
```bash
pnpm --version
```

#### 1.3 Docker Desktop

**Windows / Mac:**
- Download from [docker.com](https://www.docker.com/products/docker-desktop/)
- Install and **start Docker Desktop**

**Linux:**
```bash
# Ubuntu/Debian
sudo apt-get update
sudo apt-get install docker.io

# Start Docker
sudo systemctl start docker
sudo systemctl enable docker

# Add your user to docker group (avoids sudo)
sudo usermod -aG docker $USER
# Then log out/log in
```

**Verify:**
```bash
docker --version
docker ps   # Should work without errors
```

### Step 2: Clone and Configure the Project

```bash
# If not already cloned
git clone <REPO_URL>
cd tracfin-module-example

# Install dependencies
pnpm install
```

### Step 3: Start PostgreSQL

```bash
# Start Docker containers (PostgreSQL + pgAdmin)
pnpm run db:up

# Wait 15-20 seconds for PostgreSQL to start
```

**Verify PostgreSQL is ready:**

**Windows PowerShell:**
```powershell
docker compose exec postgres pg_isready -U tracfin_user
```

**Mac/Linux:**
```bash
docker compose exec postgres pg_isready -U tracfin_user
```

You should see: `postgres:5432 - accepting connections`

### Step 4: Generate Data

```bash
# Generate 40,000 players and their data
pnpm run db:seed
```

**⏱️ Duration: 3–7 minutes**

You'll see progress:
```
📦 Batch 1: Generating 500 players (1-500)...
   ✓ 500/40000 players inserted (150 players/sec, 3.3s elapsed)
...
```

### Step 5: Start the Application

```bash
# Start Next.js in development mode
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🔍 Installation Verification

### Verify PostgreSQL

**pgAdmin (Web interface):**
1. Open http://localhost:5050
2. Log in:
   - Email: `admin@example.com`
   - Password: `admin`
3. Add a server:
   - **General tab:** Name = `TracFin DB`
   - **Connection tab:**
     - Host: `postgres` (important!)
     - Port: `5432`
     - Database: `tracfin`
     - Username: `tracfin_user`
     - Password: `tracfin_password`

**Command line:**

Windows (PowerShell):
```powershell
docker compose exec postgres psql -U tracfin_user -d tracfin -c "SELECT COUNT(*) FROM players;"
```

Mac/Linux:
```bash
docker compose exec postgres psql -U tracfin_user -d tracfin -c "SELECT COUNT(*) FROM players;"
```

Should display: `40000`

### Verify Data

**Record counts:**
```sql
SELECT 
  (SELECT COUNT(*) FROM players) as players,
  (SELECT COUNT(*) FROM banks) as banks,
  (SELECT COUNT(*) FROM game_sessions) as sessions,
  (SELECT COUNT(*) FROM cash_transactions) as cash_trans;
```

Should display approximately:
- players: 40,000
- banks: ~80,000
- sessions: ~630,000
- cash_trans: ~1,200,000

---

## 🛠️ Troubleshooting

### Problem: "Docker is not running"

**Solution:**
1. Open Docker Desktop
2. Wait until it's fully started (stable icon)
3. Restart the script

### Problem: "Port 5432 already in use"

Another PostgreSQL is already running on your machine.

**Windows - Find the process:**
```powershell
netstat -ano | findstr :5432
```

**Mac/Linux:**
```bash
lsof -i :5432
```

**Solutions:**
1. Stop the other PostgreSQL
2. **OR** change the port in `compose.yml`:
   ```yaml
   ports:
     - "5433:5432"  # Instead of 5432:5432
   ```
   Then modify `.env`:
   ```env
   DB_PORT=5433
   ```

### Problem: "pnpm: command not found"

**Solution:**
```bash
npm install -g pnpm
```

If it still doesn't work:
```bash
# Use npx
npx pnpm install
```

### Problem: Seeding is very slow

**This is normal!** Generating 40K players + 2-3M transactions takes time.

**Expected performance:**
- Modern machine (SSD, 16GB RAM): 3–5 minutes
- Older machine: 5–10 minutes

**Speed up:**
Reduce the number of players by passing a parameter to the seeder:
```typescript
const CONFIG = {
  TOTAL_PLAYERS: 10_000,  // Instead of 40_000
};
```

### Problem: "Error: connect ECONNREFUSED"

PostgreSQL is not ready yet.

**Solution:**
1. Wait 20-30 seconds after `pnpm run db:up`
2. Check with `docker compose logs postgres`
3. If necessary, restart: `pnpm run db:reset`

### Problem: Memory error during seeding

**Solution:**
Increase Docker memory:
- Docker Desktop > Settings > Resources > Memory
- Set at least 4GB (8GB recommended)

**OR** reduce the number of players (see above)

### Problem: Permission denied on setup.sh (Mac/Linux)

**Solution:**
```bash
chmod +x setup.sh
./setup.sh
```

---

## 🎯 Useful Post-Installation Commands

```bash
# Start Next.js app
pnpm dev

# View PostgreSQL logs
pnpm run db:logs

# Stop PostgreSQL
pnpm run db:down

# Delete all data and start over
pnpm run db:reset

# Regenerate data (without deleting)
pnpm run db:seed

# Full reset + seed (single command)
pnpm run db:full
```

---

## 📊 Service Access

### Next.js Application
- **URL:** http://localhost:3000
- **Dev mode:** Hot reload enabled

### PostgreSQL (direct connection)
```
Host: localhost
Port: 5432
Database: tracfin
User: tracfin_user
Password: tracfin_password
```

**Connection string:**
```
postgresql://tracfin_user:tracfin_password@localhost:5432/tracfin
```

### pgAdmin (Web interface)
- **URL:** http://localhost:5050
- **Email:** admin@example.com
- **Password:** admin

---

## 🔄 Project Updates

```bash
# Get latest changes
git pull

# Update dependencies
pnpm install

# If DB schema changed, reset
pnpm run db:full
```

---

## 🧹 Uninstallation

### Stop and Remove Everything

```bash
# Stop containers
pnpm run db:down

# Remove Docker volumes (data)
docker compose down -v

# Remove node dependencies
rm -rf node_modules

# Remove pnpm lock
rm pnpm-lock.yaml
```

### Uninstall pnpm (optional)

```bash
npm uninstall -g pnpm
```

---

## 💡 Tips for Testers

### First time with Docker?

Docker is like a lightweight virtual machine that isolates PostgreSQL. Benefits:
- ✅ No need to install PostgreSQL on your machine
- ✅ Automatic configuration
- ✅ Easy to remove (no traces)

### First time with pnpm?

pnpm is a package manager like npm, but faster and more efficient.
All `npm` commands work with `pnpm`:
- `npm install` → `pnpm install`
- `npm run dev` → `pnpm dev`

### Testing without a database?

Not possible for this project, as all data is in PostgreSQL.
But with Docker, it's as simple as:
```bash
pnpm run db:up   # Start DB
pnpm dev         # Start app
```

---

## 📞 Need Help?

1. Read error messages carefully
2. Check logs: `pnpm run db:logs`
3. Consult the [main documentation](README.md)
4. Consult the [database documentation](database/README.md)
5. Restart with full reset: `pnpm run db:full`

---

**Happy installation! 🚀**
