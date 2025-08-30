# Outsourcing Analyzer

A Next.js web application that helps users quickly assess whether a company is likely to outsource services. The app provides an intuitive interface where users can enter a company name and receive an AI-powered analysis with supporting data.

## Features

- **Company Analysis**: Enter a company name and get AI-powered outsourcing likelihood assessment
- **Enhanced Data Collection**: Real-time fetching of company news, job postings, and key personnel
- **Key People Identification**: Automatically finds executives and decision-makers with contact information
- **Email Discovery & Verification**: Real email addresses with fallback to predicted emails
- **Visual Results**: Display results with company logos, colored badges, and detailed reasoning
- **Recent Searches**: View history of the last 5 analyzed companies
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Error Handling**: Graceful degradation when external services are unavailable

## Tech Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, TailwindCSS
- **Backend**: Next.js API routes
- **Database**: Supabase (PostgreSQL)
- **AI**: OpenAI GPT API
- **External APIs**: DuckDuckGo, Wikipedia, Clearbit Logo API, Hunter.io, NewsAPI
- **Data Sources**: Company websites, LinkedIn, job boards, news sources

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- OpenAI API key

## Setup Instructions

### 1. Clone the Repository

```bash
git clone <repository-url>
cd outsourcing-analyzer
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Copy the example environment file and configure your API keys:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your actual values:

```env
# Supabase Configuration (Required)
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# OpenAI Configuration (Required)
OPENAI_API_KEY=your_openai_api_key

# Optional: Enhanced People Data APIs
RAPIDAPI_KEY=your_rapidapi_key              # For LinkedIn people data
CRUNCHBASE_API_KEY=your_crunchbase_api_key  # For startup executive data
HUNTER_API_KEY=your_hunter_api_key          # For email finding & verification
NEWS_API_KEY=your_news_api_key              # For company news
```

#### API Key Setup Guide

**Required APIs:**

- **Supabase**: Database and authentication - [Get API keys](https://supabase.com)
- **OpenAI**: AI analysis - [Get API key](https://platform.openai.com/api-keys)

**Optional APIs (for enhanced features):**

- **RapidAPI**: LinkedIn people data access - [Get API key](https://rapidapi.com/)
- **Crunchbase**: Startup executive data - [Get API key](https://data.crunchbase.com/docs/using-the-api)
- **Hunter.io**: Email finding and verification - [Get API key](https://hunter.io/api)
- **NewsAPI**: Company news and insights - [Get API key](https://newsapi.org/)

> **Note**: The app will work with just Supabase and OpenAI keys, using demo data for enhanced features. Add optional APIs for real-time data collection.

#### Enhanced People Data Configuration

The enhanced people data feature uses multiple data sources to find key executives and their contact information:

- **RAPIDAPI_KEY**: Enables LinkedIn people search via RapidAPI's linkedin-api8 service
- **CRUNCHBASE_API_KEY**: Provides startup executive and founder data from Crunchbase API v4
- **HUNTER_API_KEY**: Verifies predicted email addresses for deliverability

Without these keys, the system will use realistic demo data to maintain UI consistency.

### 4. Database Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Run the database schema from `database/schema.sql` in your Supabase SQL editor
3. Copy your project URL and anon key to `.env.local`

### 5. OpenAI API Setup

1. Create an account at [OpenAI](https://platform.openai.com)
2. Generate an API key from the API keys section
3. Add the key to your `.env.local` file

### 6. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

## Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build the application for production
- `npm run start` - Start the production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking
- `npm run build:production` - Full production build with type checking and linting

## Testing Enhanced Features

### Test Enhanced People Data

Test the enhanced people data functionality with the dedicated test endpoint:

```bash
# Test people data sources
curl "http://localhost:3000/api/test-people?company=Apple&website=apple.com"
```

This endpoint will show:

- **Data Source Status**: Which APIs are configured and working
- **Sample Results**: Key people found from each data source (LinkedIn, Crunchbase, website scraping)
- **Email Prediction**: Generated email patterns and verification results
- **Fallback Behavior**: Demo data when APIs are unavailable

The test endpoint helps verify your API configuration and data quality before using the main analysis feature.

### Test Enhanced Analysis

The main analysis endpoint now includes:

- Key people information with contact details
- Recent company news and sentiment analysis
- Job postings analysis for outsourcing indicators
- Social media metrics and company insights

## Deployment

### Deploy to Vercel (Recommended)

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)

2. Visit [Vercel](https://vercel.com) and import your repository

3. Configure environment variables in Vercel dashboard:

   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `OPENAI_API_KEY`

4. Deploy! Vercel will automatically build and deploy your application.

### Deploy to Other Platforms

The application can be deployed to any platform that supports Next.js:

- **Netlify**: Use the `npm run build` command
- **Railway**: Connect your Git repository
- **DigitalOcean App Platform**: Use the included `vercel.json` as reference

Make sure to set the required environment variables on your chosen platform.

## Project Structure

```
├── src/
│   ├── app/
│   │   ├── api/           # API routes
│   │   ├── globals.css    # Global styles
│   │   ├── layout.tsx     # Root layout
│   │   └── page.tsx       # Main page
│   ├── components/        # React components
│   ├── lib/              # Utility functions
│   └── types/            # TypeScript definitions
├── database/             # Database schema
├── .env.example          # Environment variables template
├── vercel.json          # Vercel deployment configuration
└── README.md            # This file
```

## API Endpoints

- `POST /api/analyze` - Analyze a company for outsourcing likelihood
- `GET /api/recent` - Get recent company analyses

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and linting
5. Submit a pull request

## License

This project is licensed under the MIT License.
