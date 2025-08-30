// Core application types
export interface CompanyData {
  name: string;
  description?: string;
  industry?: string;
  logoUrl?: string;
  website?: string;
}

export interface AnalysisResult {
  id: string;
  companyName: string;
  outsourcingLikelihood: 'High' | 'Medium' | 'Low';
  reasoning: string;
  possibleServices: string[];
  logoUrl?: string;
  createdAt: Date;
}

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// External API Response Types

// DuckDuckGo Instant Answer API Response
export interface DuckDuckGoResponse {
  Abstract: string;
  AbstractText: string;
  AbstractSource: string;
  AbstractURL: string;
  Image: string;
  Heading: string;
  Answer: string;
  AnswerType: string;
  Definition: string;
  DefinitionSource: string;
  DefinitionURL: string;
  RelatedTopics: Array<{
    FirstURL: string;
    Icon: {
      URL: string;
      Height: string;
      Width: string;
    };
    Result: string;
    Text: string;
  }>;
  Results: Array<{
    FirstURL: string;
    Icon: {
      URL: string;
      Height: string;
      Width: string;
    };
    Result: string;
    Text: string;
  }>;
  Type: string;
  Redirect: string;
}

// Wikipedia API Response
export interface WikipediaResponse {
  type: string;
  title: string;
  displaytitle: string;
  namespace: {
    id: number;
    text: string;
  };
  wikibase_item: string;
  titles: {
    canonical: string;
    normalized: string;
    display: string;
  };
  pageid: number;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  originalimage?: {
    source: string;
    width: number;
    height: number;
  };
  lang: string;
  dir: string;
  revision: string;
  tid: string;
  timestamp: string;
  description: string;
  description_source: string;
  content_urls: {
    desktop: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
    mobile: {
      page: string;
      revisions: string;
      edit: string;
      talk: string;
    };
  };
  extract: string;
  extract_html: string;
}

// Clearbit Logo API - Simple URL response
export interface ClearbitLogoResponse {
  url: string;
}

// OpenAI API Response Types
export interface OpenAIAnalysisRequest {
  companyName: string;
  companyData: CompanyData;
}

export interface OpenAIAnalysisResponse {
  outsourcingLikelihood: 'High' | 'Medium' | 'Low';
  reasoning: string;
  possibleServices: string[];
  confidence: number;
}

// Database Types
export interface DatabaseCompanyResult {
  id: string;
  company_name: string;
  analysis: {
    outsourcingLikelihood: 'High' | 'Medium' | 'Low';
    reasoning: string;
    possibleServices: string[];
    logoUrl?: string;
    confidence?: number;
  };
  created_at: string;
}

// Error Types
export enum ErrorType {
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  EXTERNAL_API_ERROR = 'EXTERNAL_API_ERROR',
  OPENAI_API_ERROR = 'OPENAI_API_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_ERROR = 'RATE_LIMIT_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

export interface AppError {
  type: ErrorType;
  message: string;
  details?: string;
  statusCode?: number;
  retryable?: boolean;
}

export interface ValidationError extends AppError {
  type: ErrorType.VALIDATION_ERROR;
  field?: string;
}

export interface ExternalApiError extends AppError {
  type: ErrorType.EXTERNAL_API_ERROR;
  apiName: 'DuckDuckGo' | 'Wikipedia' | 'Clearbit' | 'OpenAI';
  statusCode: number;
}

export interface DatabaseError extends AppError {
  type: ErrorType.DATABASE_ERROR;
  operation: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
}

// Form and UI Types
export interface CompanyFormData {
  companyName: string;
}

export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface RecentSearch {
  id: string;
  companyName: string;
  outsourcingLikelihood: 'High' | 'Medium' | 'Low';
  createdAt: Date;
}

// API Endpoint Types
export interface AnalyzeRequest {
  companyName: string;
}

export type AnalyzeResponse = ApiResponse<AnalysisResult>;

export type RecentSearchesResponse = ApiResponse<RecentSearch[]>;

// Utility Types
export type OutsourcingLikelihood = 'High' | 'Medium' | 'Low';

export type ApiStatus = 'idle' | 'loading' | 'success' | 'error';

export interface ComponentProps {
  className?: string;
  children?: React.ReactNode;
}
