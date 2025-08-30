# Design Document

## Overview

The Outsourcing Analyzer is a Next.js 15 application using the App Router architecture. The app follows a simple, linear workflow: user input → data fetching → AI analysis → result display → data persistence. The design prioritizes speed and simplicity for hackathon development while maintaining a professional user experience.

## Architecture

### Technology Stack

- **Frontend**: Next.js 15 with App Router, TypeScript, TailwindCSS
- **Backend**: Next.js API routes for server-side operations
- **Database**: Supabase (PostgreSQL with real-time features)
- **AI**: OpenAI GPT API for outsourcing analysis
- **External APIs**: DuckDuckGo Instant Answer, Wikipedia, Clearbit Logo

### Application Structure

```
app/
├── page.tsx                 # Main application page
├── api/
│   ├── analyze/route.ts     # Main analysis endpoint
│   └── recent/route.ts      # Recent searches endpoint
├── components/
│   ├── CompanyForm.tsx      # Input form component
│   ├── AnalysisCard.tsx     # Result display component
│   ├── RecentSearches.tsx   # Recent searches component
│   └── LoadingSpinner.tsx   # Loading indicator
├── lib/
│   ├── supabaseClient.ts    # Supabase client configuration
│   └── external-apis.ts     # External API integrations
└── types/
    └── index.ts             # TypeScript type definitions
```

## Components and Interfaces

### Core Types

```typescript
interface CompanyData {
  name: string;
  description?: string;
  industry?: string;
  logoUrl?: string;
}

interface AnalysisResult {
  id: string;
  companyName: string;
  outsourcingLikelihood: 'High' | 'Medium' | 'Low';
  reasoning: string;
  possibleServices: string[];
  logoUrl?: string;
  createdAt: Date;
}
```

### API Endpoints

#### POST /api/analyze

- **Input**: `{ companyName: string }`
- **Process**:
  1. Fetch company data from external APIs
  2. Send data to OpenAI for analysis
  3. Save result to Supabase
  4. Return analysis result
- **Output**: `AnalysisResult`

#### GET /api/history

- **Input**: Query parameters for pagination
- **Output**: `{ analyses: AnalysisResult[], total: number }`

### External API Integration

#### DuckDuckGo Instant Answer API

- **Endpoint**: `https://api.duckduckgo.com/?q={company}&format=json&no_html=1`
- **Purpose**: Basic company information and description
- **Fallback**: Continue without this data if unavailable

#### Wikipedia API

- **Endpoint**: `https://en.wikipedia.org/api/rest_v1/page/summary/{company}`
- **Purpose**: Additional company context and industry information
- **Fallback**: Use DuckDuckGo data only

#### Clearbit Logo API

- **Endpoint**: `https://logo.clearbit.com/{domain}`
- **Purpose**: Company logo for visual presentation
- **Fallback**: Default placeholder logo

### OpenAI Integration

- **Model**: GPT-4 or GPT-3.5-turbo for cost efficiency
- **Prompt Strategy**: Structured prompt with company data and specific outsourcing analysis criteria
- **Output Format**: JSON with probability score (0-100) and reasoning text

## Data Models

### Supabase Schema

#### company_results table

```sql
CREATE TABLE company_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name TEXT NOT NULL,
  analysis JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_company_results_created_at ON company_results(created_at DESC);
```

## Error Handling

### API Error Handling Strategy

1. **External API Failures**: Graceful degradation - continue with available data
2. **OpenAI API Failures**: Return user-friendly error message, don't save incomplete analysis
3. **Supabase Failures**: Show analysis result but warn user about history saving failure
4. **Network Timeouts**: 10-second timeout for external APIs, 30-second timeout for OpenAI

### User Experience Error Handling

- Loading states for all async operations
- Clear error messages without technical jargon
- Retry mechanisms for transient failures
- Fallback UI states for missing data

## Testing Strategy

### Unit Testing

- API route handlers with mocked external dependencies
- Component rendering with various data states
- Utility functions for data transformation

### Integration Testing

- End-to-end user workflow from input to result display
- Database operations with test data
- External API integration with mock responses

### Manual Testing Checklist

- Company analysis with valid company names
- Error handling with invalid/non-existent companies
- History functionality with multiple analyses
- Responsive design on mobile and desktop
- Loading states and error messages

## Performance Considerations

### Optimization Strategies

- Server-side API calls to avoid CORS issues and improve security
- Caching of company logos and basic data (client-side)
- Pagination for analysis history
- Debounced input to prevent excessive API calls
- Lazy loading of history components

### Scalability Notes

- Supabase handles database scaling automatically
- OpenAI API rate limiting handled with exponential backoff
- External API calls can be cached with Redis if needed for production
- Static assets served via Next.js optimization

## Security Considerations

### API Security

- Environment variables for all API keys
- Server-side API calls to protect credentials
- Input validation and sanitization
- Rate limiting on analysis endpoint

### Data Privacy

- No personal data collection beyond company analysis
- Company data stored in structured format
- Optional contact emails only stored if provided by APIs
- GDPR-compliant data handling practices
