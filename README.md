# SudhaarNow

A civic engagement platform built with SvelteKit that connects citizens with local authorities to report and track community issues. Features include role-based authentication, gamification system, real-time issue tracking, and public transparency wall.

## Tech Stack

- **Frontend**: SvelteKit with Svelte 5 syntax
- **Authentication**: Lucia Auth
- **Database**: Turso (SQLite-compatible) with Drizzle ORM
- **Styling**: Tailwind CSS 4+ with Shadcn Components
- **File Storage**: Vercel Blob Storage
- **Maps**: Google Maps API*

## Prerequisites

- Node.js 22.x
- npm or bun
- Turso account (for database)
- Vercel account (for blob storage)
- Google Maps API key (optional, for location features)

## Environment Setup

1. Copy the environment template:
   ```bash
   cp env.example .env
   ```

2. Fill in your environment variables in `.env`:

   ```env
   # Vercel Blob Storage - Get your token from https://vercel.com/dashboard
   BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

   # Database (Turso) - Get these from https://turso.tech
   TURSO_DATABASE_URL=libsql://your-database-name.turso.io
   TURSO_AUTH_TOKEN=your_turso_auth_token_here

   # Google Maps API Key (for location features)
   GOOGLE_MAPS_API_KEY=your_google_maps_api_key_here
   ```

## Getting Required API Keys

### Vercel Blob Storage
1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Navigate to your project or create a new one
3. Go to Settings > Environment Variables
4. Add a new variable:
   - Name: `BLOB_READ_WRITE_TOKEN`
   - Value: Your Vercel Blob token (starts with `vercel_blob_rw_`)

### Turso Database
1. Sign up at [Turso](https://turso.tech)
2. Create a new database
3. Get your database URL and auth token from the dashboard
4. Add them to your `.env` file

### Google Maps API (Required for Location Features)
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select an existing one
3. Enable the following APIs:
   - Maps JavaScript API
   - Places API (for search functionality)
   - Geocoding API (for address lookup)
4. Create credentials (API Key)
5. Restrict the API key to your domain for security
6. Add it to your `.env` file as `GOOGLE_MAPS_API_KEY`

## Installation & Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up the database:**
   ```bash
   # Push database schema to Turso
   npm run db:push
   
   # Seed the database with initial data
   npm run db:seed
   ```

3. **Start the development server:**
   ```bash
   npm run dev
   ```

4. **Open your browser:**
   Navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run db:push` - Push database schema changes
- `npm run db:generate` - Generate database migrations
- `npm run db:migrate` - Run database migrations
- `npm run db:studio` - Open Drizzle Studio (database GUI)
- `npm run db:seed` - Seed database with initial data
- `npm run fix:badges` - Fix badge assignments

## Test Accounts

The application comes with pre-seeded test accounts:

- **Citizen**: `citizen@test.com` / `Test123!`
- **Authority**: `authority@test.com` / `Test123!`
- **Admin**: `admin@test.com` / `Test123!`

## Features

### For Citizens
- Report community issues with photos and location
- Track issue status and progress
- Earn points and badges for participation
- View public transparency wall

### For Authorities
- Manage assigned issue categories
- Update issue status and progress
- Bulk actions for multiple issues
- View performance metrics and leaderboards

### For Admins
- Manage user roles and permissions
- Configure issue categories and departments
- View system-wide analytics
- Manage gamification settings

## Database Management

### View Database
```bash
npm run db:studio
```
This opens Drizzle Studio in your browser for database inspection.

### Reset Database
```bash
# Drop and recreate database
npm run db:push
npm run db:seed
```

## Deployment

The application is configured for deployment on Vercel. Make sure to set all environment variables in your Vercel project settings.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the APGL License.
