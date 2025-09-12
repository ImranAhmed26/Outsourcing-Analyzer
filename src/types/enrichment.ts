// Types for Parallel AI Task API integration

export interface EnrichmentRequest {
  emails: string[];
}

export interface CompanyEnrichmentData {
  companyName: string;
  companyDescription: string;
  industry: string;
  employeeCount: 
    | "1-10 employees"
    | "11-50 employees"
    | "51-200 employees"
    | "201-500 employees"
    | "501-1000 employees"
    | "1001-5000 employees"
    | "5001-10000 employees"
    | "10001+ employees";
  yearFounded: string; // Format: YYYY or MM-YYYY
  headquarters: string;
  revenue: string;
  fundingRaised: string;
  fundingStage: string;
  techStack: string[];
  subsidiaries: string[];
}

export interface EnrichmentResult {
  email: string;
  status: 'success' | 'error' | 'pending';
  data?: CompanyEnrichmentData;
  error?: string;
  runId?: string; // Parallel AI run ID for tracking
}

export interface EnrichmentResponse {
  results: EnrichmentResult[];
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

// Parallel AI Task API types
export interface ParallelTaskInput {
  email: string;
}

export interface ParallelTaskSpec {
  input_schema: {
    type: string;
    json_schema: {
      type: string;
      properties: {
        email: {
          type: string;
          description: string;
        };
      };
      required: string[];
    };
  };
  output_schema: {
    type: string;
    json_schema: {
      type: string;
      properties: {
        companyName: {
          type: string;
          description: string;
        };
        companyDescription: {
          type: string;
          description: string;
        };
        industry: {
          type: string;
          description: string;
        };
        employeeCount: {
          type: string;
          enum: string[];
          description: string;
        };
        yearFounded: {
          type: string;
          description: string;
        };
        headquarters: {
          type: string;
          description: string;
        };
        revenue: {
          type: string;
          description: string;
        };
        fundingRaised: {
          type: string;
          description: string;
        };
        fundingStage: {
          type: string;
          description: string;
        };
        techStack: {
          type: string;
          items: {
            type: string;
          };
          description: string;
        };
        subsidiaries: {
          type: string;
          items: {
            type: string;
          };
          description: string;
        };
      };
      required: string[];
      additionalProperties: boolean;
    };
  };
}

export interface ParallelTaskRunRequest {
  input: ParallelTaskInput;
  task_spec: ParallelTaskSpec;
  processor: 'base' | 'core' | 'pro';
}

export interface ParallelTaskRun {
  run_id: string;
  status: 'queued' | 'running' | 'completed' | 'failed';
  is_active: boolean;
  warnings: string[] | null;
  processor: string;
  metadata: any;
  created_at: string;
  modified_at: string;
}

export interface ParallelTaskResult {
  run: ParallelTaskRun;
  output: {
    content: CompanyEnrichmentData;
    basis: Array<{
      field: string;
      citations: Array<{
        title: string;
        url: string;
        excerpts: string[];
      }>;
      reasoning: string;
      confidence: 'low' | 'medium' | 'high';
    }>;
    type: string;
  };
}

export interface UploadedFile {
  name: string;
  content: string;
  emails: string[];
}
