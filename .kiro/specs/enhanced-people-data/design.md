# Design Document

## Overview

The Enhanced People Data Integration extends the existing outsourcing analyzer with real-time executive data fetching, email prediction, and verification capabilities. The design follows a multi-source data aggregation pattern with intelligent fallbacks, ensuring reliable functionality regardless of API availability. The system integrates seamlessly with the existing analysis workflow while maintaining performance and user experience standards.

## Architecture

### Data Source Strategy

The system employs a cascading data source approach:

1. **Primary Sources**: LinkedIn API (via RapidAPI), Crunchbase API
2. **Secondary Source**: Website scraping of team/about pages
3. **Fallback**: Demo data for consistent UI experience

### Email Prediction & Verification Pipeline

```
Person Data → Email Pattern Generation → Verification (Hunter.io) → Validated Email
     ↓                    ↓                        ↓                    ↓
Name/Company → Multiple Patterns → Deliverability Check → Best Pattern
```

### Integration Points

The enhanced people data integrates with existing components:

- **AnalysisCard**: Extended to display key people section
- **API Route**: Enhanced `/api/analyze` endpoint includes people data
- **Database**: People data stored as part of analysis JSON in Supabase

## Components and Interfaces

### Enhanced Type Definitions

```typescript
interface KeyPerson {
  name: string;
  position: string;
  email: string;
  linkedin?: string;
  department: string;
}

interface EnhancedAnalysisResult extends AnalysisResult {
  keyPeople: KeyPerson[];
  dataSourcesUsed: {
    linkedin: boolean;
    crunchbase: boolean;
    website: boolean;
    emailVerification: boolean;
  };
}
```

### Data Fetching Architecture

#### Multi-Source Aggregation

```typescript
async function fetchKeyPeople(companyName: string, website?: string): Promise<KeyPerson[]> {
  // Parallel execution of data sources
  const sources = [fetchLinkedInPeople(companyName), fetchCrunchbasePeople(companyName), fetchWebsitePeople(website)];

  // Combine and deduplicate results
  // Enhance with email prediction
  // Return top 5 people
}
```

#### Email Prediction System

```typescript
async function predictEmail(name: string, companyName: string, website?: string): Promise<string> {
  // Extract domain from website or generate from company name
  // Generate common email patterns
  // Verify with Hunter.io if available
  // Return most likely valid email
}
```

### API Integration Design

#### LinkedIn API (RapidAPI)

- **Endpoint**: `linkedin-api8.p.rapidapi.com/search/people`
- **Authentication**: RapidAPI key in headers
- **Rate Limiting**: Built-in timeout and error handling
- **Data Mapping**: Profile data to KeyPerson interface

#### Crunchbase API

- **Endpoint**: `api.crunchbase.com/api/v4/searches/people`
- **Authentication**: X-cb-user-key header
- **Focus**: Executive and founder data
- **Fallback**: Graceful degradation on API limits

#### Website Scraping

- **Target Pages**: `/team`, `/about`, `/leadership`, `/management`
- **Method**: Regex patterns for executive information
- **Parsing**: HTML content analysis for name-position pairs
- **Limitations**: Best-effort extraction with error handling

#### Hunter.io Email Verification

- **Endpoint**: `api.hunter.io/v2/email-verifier`
- **Purpose**: Validate predicted email addresses
- **Scoring**: Deliverability score and confidence rating
- **Fallback**: Use predicted pattern if verification unavailable

## Data Models

### Enhanced Database Schema

The existing `company_results` table analysis JSON field is extended:

```json
{
  "companyName": "string",
  "outsourcingLikelihood": "High|Medium|Low",
  "reasoning": "string",
  "possibleServices": ["string"],
  "keyPeople": [
    {
      "name": "string",
      "position": "string",
      "email": "string",
      "linkedin": "string|null",
      "department": "string"
    }
  ],
  "dataSourcesUsed": {
    "linkedin": "boolean",
    "crunchbase": "boolean",
    "website": "boolean",
    "emailVerification": "boolean"
  }
}
```

### Environment Configuration

```bash
# Required
OPENAI_API_KEY=your_openai_key

# Optional - Enhanced People Data
RAPIDAPI_KEY=your_rapidapi_key          # LinkedIn data
CRUNCHBASE_API_KEY=your_crunchbase_key  # Startup executive data
HUNTER_API_KEY=your_hunter_key          # Email verification
```

## Error Handling

### Cascading Fallback Strategy

1. **API Failures**: Continue with remaining data sources
2. **Network Timeouts**: 10-second timeout per API call
3. **Rate Limiting**: Exponential backoff and graceful degradation
4. **Data Quality**: Validation and sanitization of all inputs
5. **Complete Failure**: Demo data ensures UI consistency

### Error Recovery Patterns

```typescript
// Example error handling pattern
try {
  const linkedinData = await fetchLinkedInPeople(company);
  people.push(...linkedinData);
} catch (error) {
  console.log('LinkedIn API unavailable, continuing with other sources');
  // Continue execution - don't fail entire operation
}
```

## Testing Strategy

### Unit Testing

- **Email Pattern Generation**: Test various name formats and domain extraction
- **Data Deduplication**: Verify duplicate removal across sources
- **API Response Parsing**: Mock API responses and validate data mapping
- **Fallback Logic**: Test behavior when APIs are unavailable

### Integration Testing

- **Multi-Source Aggregation**: Test combining data from multiple APIs
- **Email Verification**: Test Hunter.io integration with various email patterns
- **Website Scraping**: Test HTML parsing with different website structures
- **End-to-End**: Complete workflow from company input to people display

### Test Endpoint

- **Route**: `/api/test-people`
- **Purpose**: Validate API configurations and data quality
- **Output**: Sample results from each configured data source
- **Monitoring**: API health and response quality metrics

## Performance Considerations

### Optimization Strategies

- **Parallel Execution**: Simultaneous API calls to multiple sources
- **Timeout Management**: Prevent slow APIs from blocking entire operation
- **Caching**: Client-side caching of people data during session
- **Rate Limiting**: Respect API limits with exponential backoff
- **Data Limits**: Maximum 5 people per company to control response size

### Scalability Considerations

- **API Quotas**: Monitor usage across all integrated services
- **Response Times**: Target <15 seconds for complete people data fetch
- **Memory Usage**: Efficient data structures for large result sets
- **Error Recovery**: Graceful degradation maintains system availability

## Security Considerations

### API Security

- **Environment Variables**: All API keys stored securely
- **Server-Side Calls**: Protect credentials from client exposure
- **Input Validation**: Sanitize all company names and URLs
- **Rate Limiting**: Prevent abuse of external APIs

### Data Privacy

- **Public Data Only**: Use only publicly available business information
- **No Personal Storage**: Don't persist personal contact data beyond session
- **GDPR Compliance**: Business contact information handling
- **Opt-out Respect**: Honor any API-level privacy controls

### Email Verification Ethics

- **Business Use Only**: Focus on professional business contacts
- **Verification Purpose**: Confirm deliverability, not harvest emails
- **Rate Limiting**: Respect Hunter.io usage limits
- **Data Retention**: Don't store verification results permanently

## Monitoring and Observability

### Logging Strategy

- **API Success Rates**: Track successful calls per data source
- **Fallback Usage**: Monitor when demo data is used
- **Email Verification**: Track verification success rates
- **Performance Metrics**: Response times and error rates

### Health Checks

- **API Connectivity**: Regular health checks for all external services
- **Data Quality**: Monitor accuracy of predicted vs verified emails
- **User Experience**: Track complete workflow success rates
- **Error Patterns**: Identify common failure modes for improvement
