import { NextRequest, NextResponse } from 'next/server';
import { fetchEnhancedCompanyData } from '@/lib/enhanced-apis';

export async function POST(request: NextRequest) {
  try {
    const { companyName } = await request.json();

    if (!companyName) {
      return NextResponse.json({ success: false, error: 'Company name is required' }, { status: 400 });
    }

    // Basic company data (simulated)
    const basicData = {
      name: companyName,
      description: `${companyName} is a technology company.`,
      website: `${companyName.toLowerCase().replace(/\s+/g, '')}.com`,
    };

    // Fetch enhanced data
    const enhancedData = await fetchEnhancedCompanyData(companyName, basicData);

    return NextResponse.json({
      success: true,
      data: enhancedData,
    });
  } catch (error) {
    console.error('Test enhanced API error:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch enhanced data' }, { status: 500 });
  }
}
