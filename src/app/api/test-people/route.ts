import { NextRequest, NextResponse } from 'next/server';
import { fetchKeyPeople, verifyEmailAddress } from '@/lib/enhanced-apis';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company') || 'Apple';
    const website = searchParams.get('website') || 'apple.com';

    console.log(`Testing key people fetch for ${companyName} (${website})`);

    // Test key people fetching
    const keyPeopleResult = await fetchKeyPeople(companyName, website);
    const keyPeople = keyPeopleResult.people;
    const dataSourcesUsed = keyPeopleResult.dataSourcesUsed;

    // Test email verification for found emails
    const verificationResults = await Promise.all(
      keyPeople
        .filter((person) => person.email)
        .slice(0, 3) // Test only first 3 to avoid rate limits
        .map(async (person) => {
          const verification = await verifyEmailAddress(person.email!);
          return {
            email: person.email,
            ...verification,
          };
        })
    );

    return NextResponse.json({
      success: true,
      data: {
        companyName,
        website,
        dataSourcesUsed,
        keyPeople: keyPeople.map((person) => ({
          ...person,
          // Add verification status if email was verified
          emailVerified: verificationResults.find((v) => v.email === person.email),
        })),
        verificationResults,
        summary: {
          totalPeople: keyPeople.length,
          withRealEmails: keyPeople.filter((p) => p.email).length,
          withLinkedInProfiles: keyPeople.filter((p) => p.linkedin).length,
          executiveDepartments: keyPeople.filter((p) => p.department === 'Executive').length,
        },
      },
    });
  } catch (error) {
    console.error('Test people API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      },
      { status: 500 }
    );
  }
}
