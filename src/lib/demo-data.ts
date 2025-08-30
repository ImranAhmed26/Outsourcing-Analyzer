import { CompanyData, NewsItem, JobPosting, KeyPerson } from '@/types';

/**
 * Demo data for testing enhanced features without requiring API keys
 */

export function getDemoNewsData(companyName: string): NewsItem[] {
  const demoNews: Record<string, NewsItem[]> = {
    Apple: [
      {
        title: 'Apple Expands Manufacturing Partnerships in Southeast Asia',
        summary: 'Apple continues to diversify its supply chain by partnering with new manufacturers in Vietnam and Thailand.',
        url: 'https://example.com/apple-manufacturing',
        publishedAt: '2024-01-15T10:00:00Z',
        source: 'Tech News Daily',
        sentiment: 'positive',
      },
      {
        title: 'Apple Invests in AI Customer Support Infrastructure',
        summary: 'The company is reportedly investing heavily in AI-powered customer support systems to handle growing demand.',
        url: 'https://example.com/apple-ai-support',
        publishedAt: '2024-01-10T14:30:00Z',
        source: 'Business Wire',
        sentiment: 'positive',
      },
    ],
    Microsoft: [
      {
        title: 'Microsoft Announces New Cloud Services Partnership',
        summary: 'Microsoft partners with regional cloud providers to expand Azure services globally.',
        url: 'https://example.com/microsoft-cloud',
        publishedAt: '2024-01-12T09:15:00Z',
        source: 'Cloud Computing News',
        sentiment: 'positive',
      },
      {
        title: 'Microsoft Outsources Non-Core IT Functions to Focus on AI',
        summary: 'The tech giant is streamlining operations by outsourcing facilities management and some HR functions.',
        url: 'https://example.com/microsoft-outsourcing',
        publishedAt: '2024-01-08T16:45:00Z',
        source: 'Enterprise Today',
        sentiment: 'neutral',
      },
    ],
  };

  return (
    demoNews[companyName] || [
      {
        title: `${companyName} Explores Strategic Partnerships`,
        summary: `${companyName} is reportedly evaluating various partnership opportunities to optimize operations.`,
        url: 'https://example.com/generic-news',
        publishedAt: '2024-01-10T12:00:00Z',
        source: 'Business News',
        sentiment: 'neutral',
      },
    ]
  );
}

export function getDemoJobPostings(companyName: string): JobPosting[] {
  const demoJobs: Record<string, JobPosting[]> = {
    Apple: [
      {
        title: 'Vendor Management Specialist',
        department: 'Operations',
        location: 'Cupertino, CA',
        type: 'full-time',
        postedAt: '2024-01-14T00:00:00Z',
        isOutsourcingRelated: true,
      },
      {
        title: 'Supply Chain Manager',
        department: 'Operations',
        location: 'Austin, TX',
        type: 'full-time',
        postedAt: '2024-01-12T00:00:00Z',
        isOutsourcingRelated: true,
      },
      {
        title: 'Customer Support Lead',
        department: 'Customer Service',
        location: 'Remote',
        type: 'full-time',
        postedAt: '2024-01-10T00:00:00Z',
        isOutsourcingRelated: false,
      },
    ],
    Microsoft: [
      {
        title: 'Strategic Partnerships Manager',
        department: 'Business Development',
        location: 'Redmond, WA',
        type: 'full-time',
        postedAt: '2024-01-13T00:00:00Z',
        isOutsourcingRelated: true,
      },
      {
        title: 'Facilities Coordinator',
        department: 'Operations',
        location: 'Seattle, WA',
        type: 'contract',
        postedAt: '2024-01-11T00:00:00Z',
        isOutsourcingRelated: true,
      },
    ],
  };

  return (
    demoJobs[companyName] || [
      {
        title: 'Operations Manager',
        department: 'Operations',
        location: 'Various',
        type: 'full-time',
        postedAt: '2024-01-10T00:00:00Z',
        isOutsourcingRelated: false,
      },
    ]
  );
}

export function getDemoKeyPeople(companyName: string): KeyPerson[] {
  const demoPeople: Record<string, KeyPerson[]> = {
    Apple: [
      {
        name: 'Tim Cook',
        position: 'Chief Executive Officer',
        email: 'tcook@apple.com',
        linkedin: 'https://linkedin.com/in/tim-cook',
        department: 'Executive',
      },
      {
        name: 'Luca Maestri',
        position: 'Chief Financial Officer',
        email: 'lmaestri@apple.com',
        linkedin: 'https://linkedin.com/in/luca-maestri',
        department: 'Finance',
      },
      {
        name: 'Jeff Williams',
        position: 'Chief Operating Officer',
        email: 'jwilliams@apple.com',
        linkedin: 'https://linkedin.com/in/jeff-williams',
        department: 'Operations',
      },
    ],
    Microsoft: [
      {
        name: 'Satya Nadella',
        position: 'Chief Executive Officer',
        email: 'satyan@microsoft.com',
        linkedin: 'https://linkedin.com/in/satya-nadella',
        department: 'Executive',
      },
      {
        name: 'Amy Hood',
        position: 'Chief Financial Officer',
        email: 'amyhood@microsoft.com',
        linkedin: 'https://linkedin.com/in/amy-hood',
        department: 'Finance',
      },
    ],
  };

  const domain = companyName.toLowerCase().replace(/\s+/g, '') + '.com';

  return (
    demoPeople[companyName] || [
      {
        name: 'John Smith',
        position: 'Chief Executive Officer',
        email: `j.smith@${domain}`,
        linkedin: 'https://linkedin.com/in/john-smith',
        department: 'Executive',
      },
      {
        name: 'Sarah Johnson',
        position: 'Chief Operating Officer',
        email: `s.johnson@${domain}`,
        linkedin: 'https://linkedin.com/in/sarah-johnson',
        department: 'Operations',
      },
    ]
  );
}

/**
 * Enhanced demo data fetcher that simulates the real API
 */
export async function fetchDemoEnhancedData(companyName: string, basicData: CompanyData): Promise<CompanyData> {
  // Simulate API delay
  await new Promise((resolve) => setTimeout(resolve, 1000));

  const enhancedData: CompanyData = {
    ...basicData,
    recentNews: getDemoNewsData(companyName),
    jobPostings: getDemoJobPostings(companyName),
    keyPeople: getDemoKeyPeople(companyName),
    websiteContent: {
      title: `${companyName} - Official Website`,
      description: `${companyName} is a leading company in technology and innovation.`,
      services: ['consulting', 'development', 'support'],
      technologies: ['cloud', 'ai', 'mobile'],
      aboutText: `${companyName} has been at the forefront of innovation for years.`,
    },
    socialMedia: {
      linkedin: {
        followers: Math.floor(Math.random() * 1000000) + 100000,
        employees: Math.floor(Math.random() * 50000) + 1000,
        industry: 'Technology',
      },
    },
  };

  return enhancedData;
}
