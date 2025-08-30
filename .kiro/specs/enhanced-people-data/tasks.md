# Implementation Plan

- [x] 1. Enhance TypeScript interfaces for people data

  - Add KeyPerson interface with name, position, email, linkedin, and department fields
  - Extend AnalysisResult interface to include keyPeople array and dataSourcesUsed object
  - Update API response types to include enhanced people data structure
  - _Requirements: 1.4, 3.2_

- [x] 2. Implement LinkedIn API integration via RapidAPI

  - Create fetchLinkedInPeople function that queries linkedin-api8.p.rapidapi.com
  - Add proper authentication headers with RAPIDAPI_KEY environment variable
  - Implement response parsing to extract name, position, and LinkedIn profile URL
  - Add error handling and timeout logic for API failures
  - _Requirements: 1.1, 4.2, 5.4_

- [x] 3. Build Crunchbase API integration for startup data

  - Implement fetchCrunchbasePeople function using Crunchbase API v4
  - Add authentication with X-cb-user-key header using CRUNCHBASE_API_KEY
  - Parse executive and founder data from API responses
  - Handle rate limiting and API quota management
  - _Requirements: 1.2, 4.2, 5.4_

- [x] 4. Create website scraping functionality for team pages

  - Build fetchWebsitePeople function that scrapes common team page URLs
  - Implement regex patterns to extract executive names and positions from HTML
  - Add parsePersonText helper to handle various name-position formats
  - Include error handling for website access failures and parsing errors
  - _Requirements: 1.3, 4.2_

- [x] 5. Develop email prediction and pattern generation system

  - Create predictEmail function that generates common corporate email patterns
  - Implement domain extraction from company website URLs
  - Build email pattern variations: firstname.lastname, firstnamelastname, f.lastname formats
  - Add name cleaning and validation logic for email generation
  - _Requirements: 2.1, 2.4, 2.5_

- [x] 6. Integrate Hunter.io email verification service

  - Implement verifyEmailWithHunter function using Hunter.io API
  - Add email deliverability checking with confidence scoring
  - Handle API rate limits and verification failures gracefully
  - Return verified emails when available, fallback to predicted patterns
  - _Requirements: 2.2, 2.3, 4.4_

- [x] 7. Build multi-source data aggregation system

  - Create fetchKeyPeople main function that coordinates all data sources
  - Implement parallel execution of LinkedIn, Crunchbase, and website scraping
  - Add deduplication logic to remove duplicate people across sources
  - Limit results to top 5 people and enhance with email prediction
  - _Requirements: 1.1, 1.2, 1.3, 4.5_

- [x] 8. Add basic department classification

  - Create simple extractDepartment function with basic position-to-department mapping
  - Map common titles to Executive, Technology, Sales, Marketing departments
  - _Requirements: 3.2_

- [x] 9. Create demo data fallback

  - Build getDemoKeyPeople function with 3-5 realistic executives
  - Use when all APIs fail to maintain consistent UI
  - _Requirements: 1.5, 4.1_

- [x] 10. Integrate people data into main analysis API

  - Add fetchKeyPeople call to /api/analyze route
  - Include keyPeople array in response
  - Store in existing Supabase analysis JSON
  - _Requirements: 3.1, 3.2_

- [x] 11. Update AnalysisCard to show key people

  - Add "Key People" section to AnalysisCard component
  - Display name, position, email with simple styling
  - Show LinkedIn links when available
  - _Requirements: 3.1, 3.2, 3.3_

- [x] 12. Update environment configuration

  - Add new API keys to .env.example
  - Basic setup documentation
  - _Requirements: 4.1_
