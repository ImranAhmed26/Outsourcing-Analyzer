# Requirements Document

## Introduction

The Outsourcing Analyzer is a hackathon web application that helps users quickly assess whether a company is likely to outsource services. The app provides an intuitive interface where users can enter a company name and receive an AI-powered analysis with supporting data, displayed in an attractive card format. All results are stored for future reference, creating a searchable history of analyzed companies.

## Requirements

### Requirement 1

**User Story:** As a business analyst, I want to enter a company name and get an outsourcing likelihood analysis, so that I can quickly assess potential outsourcing opportunities.

#### Acceptance Criteria

1. WHEN a user enters a company name in the input field THEN the system SHALL accept text input of at least 2 characters
2. WHEN a user submits a company name THEN the system SHALL fetch company information from external APIs
3. WHEN company data is retrieved THEN the system SHALL send the data to OpenAI API for outsourcing analysis
4. WHEN the analysis is complete THEN the system SHALL display the result as a styled card with company logo, outsourcing probability, and reasoning

### Requirement 2

**User Story:** As a user, I want to see comprehensive company information in the analysis result, so that I can make informed decisions about outsourcing potential.

#### Acceptance Criteria

1. WHEN displaying analysis results THEN the system SHALL show the company logo from Clearbit API
2. WHEN displaying analysis results THEN the system SHALL show outsourcing likelihood as High/Medium/Low with colored badge (green/yellow/red)
3. WHEN displaying analysis results THEN the system SHALL provide 1-2 sentence reasoning for the analysis
4. WHEN displaying analysis results THEN the system SHALL list possible services they might outsource
5. WHEN no company logo is found THEN the system SHALL display a default placeholder image

### Requirement 3

**User Story:** As a user, I want to see my recent company analyses, so that I can quickly reference previous research.

#### Acceptance Criteria

1. WHEN a user completes an analysis THEN the system SHALL save the result to Supabase `company_results` table
2. WHEN a user visits the application THEN the system SHALL display the last 5 searches in a "Recent Searches" section
3. WHEN viewing recent searches THEN the system SHALL show company name, outsourcing likelihood, and analysis date
4. WHEN saving to database THEN the system SHALL store id, company_name, analysis JSON, and created_at fields

### Requirement 4

**User Story:** As a user, I want a fast and responsive interface, so that I can quickly analyze multiple companies during time-sensitive research.

#### Acceptance Criteria

1. WHEN the application loads THEN the system SHALL display the main interface within 2 seconds
2. WHEN a user submits a company name THEN the system SHALL show a loading indicator
3. WHEN API calls are in progress THEN the system SHALL provide visual feedback to the user
4. WHEN an error occurs THEN the system SHALL display a user-friendly error message
5. WHEN the analysis is complete THEN the system SHALL hide loading indicators and show results

### Requirement 5

**User Story:** As a developer, I want the application to handle API failures gracefully, so that users have a reliable experience even when external services are unavailable.

#### Acceptance Criteria

1. WHEN DuckDuckGo API is unavailable THEN the system SHALL continue with available data sources
2. WHEN Wikipedia API fails THEN the system SHALL proceed with other available company information
3. WHEN Clearbit logo API fails THEN the system SHALL use a default company logo
4. WHEN OpenAI API is unavailable THEN the system SHALL display an appropriate error message
5. WHEN Supabase is unavailable THEN the system SHALL still show analysis results but warn about history saving failure
