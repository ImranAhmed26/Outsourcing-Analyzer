import { NextRequest, NextResponse } from 'next/server';
import { verifyEmailWithHunter, predictAndVerifyEmail } from '@/lib/enhanced-apis';

interface EmailVerificationResult {
  email: string;
  isValid: boolean;
  confidence: number;
  result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  source: 'hunter' | 'fallback';
}

interface EmailPredictionResult {
  email: string;
  isVerified: boolean;
  confidence: number;
  source: 'hunter' | 'fallback';
}

interface PersonInput {
  name: string;
  company: string;
  website?: string;
}

interface TestResult {
  type: 'emailVerification' | 'emailPredictionAndVerification';
  input: string | PersonInput;
  result: EmailVerificationResult | EmailPredictionResult;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const name = searchParams.get('name');
    const company = searchParams.get('company');
    const website = searchParams.get('website');

    if (!email && (!name || !company)) {
      return NextResponse.json(
        {
          error: 'Either email parameter or both name and company parameters are required',
          usage: {
            verifyEmail: '/api/test-hunter?email=john.doe@company.com',
            predictAndVerify: '/api/test-hunter?name=John Doe&company=Test Company&website=https://testcompany.com',
          },
        },
        { status: 400 }
      );
    }

    const results: {
      timestamp: string;
      hunterApiConfigured: boolean;
      emailVerification?: EmailVerificationResult;
      emailPredictionAndVerification?: EmailPredictionResult;
    } = {
      timestamp: new Date().toISOString(),
      hunterApiConfigured: !!process.env.HUNTER_API_KEY,
    };

    if (email) {
      // Test email verification
      console.log(`Testing Hunter.io verification for email: ${email}`);
      const verificationResult = await verifyEmailWithHunter(email);
      results.emailVerification = verificationResult;
    }

    if (name && company) {
      // Test email prediction and verification
      console.log(`Testing email prediction and verification for: ${name} at ${company}`);
      const predictionResult = await predictAndVerifyEmail(name, company, website || undefined);
      results.emailPredictionAndVerification = predictionResult;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Hunter.io test endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { emails, people } = body;

    if (!emails && !people) {
      return NextResponse.json(
        {
          error: 'Either emails array or people array is required',
          example: {
            emails: ['john.doe@company.com', 'jane.smith@company.com'],
            people: [
              { name: 'John Doe', company: 'Test Company', website: 'https://testcompany.com' },
              { name: 'Jane Smith', company: 'Another Company' },
            ],
          },
        },
        { status: 400 }
      );
    }

    const results: {
      timestamp: string;
      hunterApiConfigured: boolean;
      results: TestResult[];
    } = {
      timestamp: new Date().toISOString(),
      hunterApiConfigured: !!process.env.HUNTER_API_KEY,
      results: [],
    };

    if (emails && Array.isArray(emails)) {
      console.log(`Testing Hunter.io verification for ${emails.length} emails`);

      for (const email of emails) {
        if (typeof email === 'string') {
          const verificationResult = await verifyEmailWithHunter(email);
          results.results.push({
            type: 'emailVerification',
            input: email,
            result: verificationResult,
          });
        }
      }
    }

    if (people && Array.isArray(people)) {
      console.log(`Testing email prediction and verification for ${people.length} people`);

      for (const person of people) {
        if (person.name && person.company) {
          const predictionResult = await predictAndVerifyEmail(person.name, person.company, person.website || undefined);
          results.results.push({
            type: 'emailPredictionAndVerification',
            input: person,
            result: predictionResult,
          });
        }
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('Hunter.io batch test endpoint error:', error);

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
