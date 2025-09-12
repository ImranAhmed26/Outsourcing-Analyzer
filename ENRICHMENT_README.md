# Email Company Enrichment Feature

This feature integrates Parallel AI's Task API into the Next.js application to provide comprehensive company data enrichment based on email addresses.

## Overview

The enrichment feature allows users to:
- Input email addresses manually or upload CSV/text files
- Automatically identify companies associated with email domains
- Retrieve structured company information including:
  - Company name and description
  - Industry and employee count
  - Founding year and headquarters
  - Revenue and funding information
  - Technology stack and subsidiaries

## Architecture

### Frontend Components

- **`/src/app/enrich/page.tsx`** - Main enrichment page with form and results
- **`/src/components/enrichment/EmailInputForm.tsx`** - Email input with manual entry and file upload
- **`/src/components/enrichment/LoadingIndicator.tsx`** - Loading states during processing
- **`/src/components/enrichment/EnrichmentResults.tsx`** - Results display in grid/table format

### Backend API

- **`/src/app/api/enrich/route.ts`** - Main enrichment API endpoint
- **`/src/app/api/test-parallel/route.ts`** - API connection test endpoint

### Type Definitions

- **`/src/types/enrichment.ts`** - TypeScript interfaces for all enrichment data structures

## API Integration

### Parallel AI Task API

The application uses Parallel AI's Task API with the following configuration:

```typescript
const taskSpec = {
  input_schema: {
    type: "json",
    json_schema: {
      type: "object",
      properties: {
        email: {
          type: "string",
          description: "Email address to analyze and find company information for"
        }
      }
    }
  },
  output_schema: {
    // Structured schema for company data fields
  }
}
```

### Environment Variables

Add to your `.env.local`:

```bash
PARALLEL_AI_API=your_parallel_ai_api_key_here
```

## Usage

### 1. Access the Enrichment Page

Navigate to `/enrich` in your application or click the "Enrich" link in the navigation.

### 2. Input Email Addresses

**Manual Entry:**
- Type or paste email addresses separated by commas, spaces, or new lines
- Maximum 50 emails per request

**File Upload:**
- Upload CSV or TXT files containing email addresses
- Drag and drop or browse to select files

### 3. Process Enrichment

- Click "Start Enrichment" to begin processing
- Processing time: 30 seconds to 5 minutes per email
- Real-time loading indicators show progress

### 4. View Results

**Grid View:**
- Card-based layout showing key company information
- Click any card for detailed view

**Table View:**
- Tabular format for easy scanning
- Export to CSV functionality

**Detailed Modal:**
- Complete company information
- Technology stack and subsidiaries
- Financial and funding details

## Features

### Input Validation
- Email format validation
- Duplicate detection and removal
- File format validation (CSV/TXT only)
- Rate limiting (max 50 emails per request)

### Error Handling
- API connection errors
- Individual email processing failures
- Network timeout handling
- User-friendly error messages

### Performance Optimization
- Concurrent processing with batching (5 emails at a time)
- Polling mechanism for long-running tasks
- Progress indicators and status updates

### Data Export
- CSV export with all enriched data
- Formatted data structure for analysis
- Error information included

## Data Fields Retrieved

For each email, the system attempts to retrieve:

### Required Fields
- **Company Name** - Official company name
- **Company Description** - 2-4 sentence business description
- **Industry** - Primary business sector
- **Employee Count** - Standardized ranges (1-10, 11-50, etc.)
- **Year Founded** - Company founding year
- **Headquarters** - Main office location

### Optional Fields
- **Revenue** - Annual revenue if publicly available
- **Funding Raised** - Total funding amount and stage
- **Funding Stage** - Current investment stage
- **Tech Stack** - Key technologies and platforms used
- **Subsidiaries** - Owned companies and divisions

## Error Handling

The system handles various error scenarios:

- **Invalid Email Format** - Real-time validation feedback
- **API Rate Limits** - Automatic retry with backoff
- **Network Timeouts** - Configurable timeout periods
- **Data Not Found** - Graceful degradation with partial results
- **Service Unavailable** - Clear error messaging

## Testing

### API Connection Test

Visit `/api/test-parallel` to verify Parallel AI API connectivity.

### Manual Testing

1. Navigate to `/enrich`
2. Enter test emails (e.g., `ceo@apple.com`, `info@google.com`)
3. Verify enrichment process and results
4. Test file upload with sample CSV
5. Validate export functionality

## Configuration

### Rate Limiting
- Maximum 50 emails per request
- 5 concurrent API calls to Parallel AI
- Configurable timeouts and retry logic

### Processing Options
- **Processor Type**: `base` (balanced quality/speed)
- **Timeout**: 5 minutes per email maximum
- **Polling Interval**: 5 seconds between status checks

## Troubleshooting

### Common Issues

1. **API Key Invalid**
   - Check `PARALLEL_AI_API` environment variable
   - Visit `/api/test-parallel` to verify connection

2. **Slow Processing**
   - Normal for comprehensive data gathering
   - Processing time varies by data availability
   - Consider reducing batch size for faster results

3. **Incomplete Results**
   - Some companies may have limited public data
   - Results marked as successful with available information
   - Check individual result status for details

4. **File Upload Issues**
   - Ensure file format is CSV or TXT
   - Check file contains valid email addresses
   - Maximum file size limitations apply

## Future Enhancements

Potential improvements for the enrichment feature:

- **Bulk Processing** - Handle larger datasets (100+ emails)
- **Scheduled Jobs** - Background processing for large batches
- **Data Caching** - Store results to avoid reprocessing
- **Enhanced Filters** - Filter results by industry, size, etc.
- **API Webhooks** - Real-time status updates for long processes
- **Integration Options** - Export to CRM systems
- **Analytics Dashboard** - Usage statistics and data insights

## Security Considerations

- API keys stored securely in environment variables
- Input validation prevents injection attacks
- Rate limiting prevents abuse
- Error messages don't expose sensitive information
- File uploads validated and sanitized

## Support

For issues or questions about the enrichment feature:

1. Check API connectivity with test endpoint
2. Verify environment variables are configured
3. Review error messages for specific issues
4. Check Parallel AI documentation for API limits
5. Contact support with specific error details
