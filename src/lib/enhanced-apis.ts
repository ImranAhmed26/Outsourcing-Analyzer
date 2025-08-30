import { CompanyData, NewsItem, JobPosting, KeyPerson, WebsiteContent, SocialMediaData } from '@/types';
import { fetchWithTimeout, createExternalApiError } from './external-apis';

// Configuration constants
const NEWS_API_TIMEOUT = 15000; // 15 seconds for news APIs
const SCRAPING_TIMEOUT = 20000; // 20 seconds for website scraping

/**
 * Fetches recent news about the company using NewsAPI
 */
export async function fetchCompanyNews(companyName: string): Promise<NewsItem[]> {
  try {
    // Using NewsAPI.org (requires API key in production)
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
      console.warn('NEWS_API_KEY not configured, skipping news fetch');
      return [];
    }

    const encodedQuery = encodeURIComponent(`"${companyName}" AND (outsourcing OR offshore OR contract OR vendor OR supplier)`);
    const url = `https://newsapi.org/v2/everything?q=${encodedQuery}&sortBy=publishedAt&pageSize=10&language=en&apiKey=${apiKey}`;

    const response = await fetchWithTimeout(url, {}, NEWS_API_TIMEOUT);

    if (!response.ok) {
      throw createExternalApiError('NewsAPI', `NewsAPI returned ${response.status}`, response.status);
    }

    const data = await response.json();

    return (
      data.articles?.map(
        (article: {
          title: string;
          description?: string;
          content?: string;
          url: string;
          publishedAt: string;
          source: { name: string };
        }) => ({
          title: article.title,
          summary: article.description || article.content?.substring(0, 200) + '...',
          url: article.url,
          publishedAt: article.publishedAt,
          source: article.source.name,
          sentiment: analyzeSentiment(article.title + ' ' + article.description),
        })
      ) || []
    );
  } catch (error) {
    console.warn('Failed to fetch company news:', error);
    return [];
  }
}

/**
 * Fetches job postings from multiple sources
 */
export async function fetchJobPostings(companyName: string, _website?: string): Promise<JobPosting[]> {
  const jobPostings: JobPosting[] = [];

  // Try multiple job sources
  const sources = [
    () => fetchJobsFromLinkedIn(companyName),
    () => fetchJobsFromIndeed(companyName),
    () => fetchJobsFromGlassdoor(companyName),
  ];

  const results = await Promise.allSettled(sources.map((source) => source()));

  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      jobPostings.push(...result.value);
    } else {
      console.warn(`Job source ${index} failed:`, result.reason);
    }
  });

  return jobPostings.slice(0, 20); // Limit to 20 most recent
}

/**
 * Scrapes company website for additional insights
 */
export async function scrapeCompanyWebsite(website: string): Promise<WebsiteContent> {
  try {
    if (!website) return {};

    // Ensure proper URL format
    const url = website.startsWith('http') ? website : `https://${website}`;

    const response = await fetchWithTimeout(
      url,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; OutsourcingAnalyzer/1.0)',
        },
      },
      SCRAPING_TIMEOUT
    );

    if (!response.ok) {
      throw new Error(`Website returned ${response.status}`);
    }

    const html = await response.text();

    return extractWebsiteContent(html);
  } catch (error) {
    console.warn('Failed to scrape website:', error);
    return {};
  }
}

/**
 * Fetches key people information and predicts email addresses
 */
export async function fetchKeyPeople(companyName: string, website?: string): Promise<KeyPerson[]> {
  const keyPeople: KeyPerson[] = [];

  try {
    // Try LinkedIn company page scraping (simplified approach)
    const linkedinPeople = await fetchLinkedInPeople(companyName);
    keyPeople.push(...linkedinPeople);

    // Try company website team page
    if (website) {
      const websitePeople = await fetchWebsitePeople(website);
      keyPeople.push(...websitePeople);
    }

    // Predict email addresses for found people
    keyPeople.forEach((person) => {
      if (!person.email && website) {
        person.predictedEmail = predictEmailAddress(person.name, website);
      }
    });

    return keyPeople.slice(0, 10); // Limit to top 10 key people
  } catch (error) {
    console.warn('Failed to fetch key people:', error);
    return [];
  }
}

/**
 * Fetches social media data
 */
export async function fetchSocialMediaData(companyName: string): Promise<SocialMediaData> {
  const socialData: SocialMediaData = {};

  try {
    // LinkedIn company data (would need LinkedIn API in production)
    const linkedinData = await fetchLinkedInCompanyData(companyName);
    if (linkedinData) {
      socialData.linkedin = linkedinData;
    }

    // Twitter data (would need Twitter API in production)
    const twitterData = await fetchTwitterData(companyName);
    if (twitterData) {
      socialData.twitter = twitterData;
    }
  } catch (error) {
    console.warn('Failed to fetch social media data:', error);
  }

  return socialData;
}

// Helper functions

function analyzeSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const positiveWords = ['growth', 'expansion', 'success', 'innovation', 'partnership', 'investment'];
  const negativeWords = ['layoffs', 'closure', 'bankruptcy', 'lawsuit', 'scandal', 'decline'];

  const lowerText = text.toLowerCase();
  const positiveCount = positiveWords.filter((word) => lowerText.includes(word)).length;
  const negativeCount = negativeWords.filter((word) => lowerText.includes(word)).length;

  if (positiveCount > negativeCount) return 'positive';
  if (negativeCount > positiveCount) return 'negative';
  return 'neutral';
}

function extractWebsiteContent(html: string): WebsiteContent {
  const content: WebsiteContent = {};

  try {
    // Extract title
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    if (titleMatch) {
      content.title = titleMatch[1].trim();
    }

    // Extract meta description
    const descMatch = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["']/i);
    if (descMatch) {
      content.description = descMatch[1].trim();
    }

    // Extract services (look for common service-related keywords)
    const serviceKeywords = ['consulting', 'development', 'design', 'marketing', 'support', 'maintenance', 'integration'];
    const services = serviceKeywords.filter((keyword) => html.toLowerCase().includes(keyword));
    if (services.length > 0) {
      content.services = services;
    }

    // Extract technologies (look for tech stack mentions)
    const techKeywords = ['react', 'node', 'python', 'java', 'aws', 'azure', 'docker', 'kubernetes'];
    const technologies = techKeywords.filter((tech) => html.toLowerCase().includes(tech));
    if (technologies.length > 0) {
      content.technologies = technologies;
    }

    // Extract about text (simplified)
    const aboutMatch = html.match(/about[^>]*>([^<]{100,500})/i);
    if (aboutMatch) {
      content.aboutText = aboutMatch[1].trim().substring(0, 300);
    }
  } catch (error) {
    console.warn('Error extracting website content:', error);
  }

  return content;
}

function predictEmailAddress(name: string, website: string): string {
  const domain = website
    .replace(/^https?:\/\//, '')
    .replace(/^www\./, '')
    .split('/')[0];
  const nameParts = name.toLowerCase().split(' ');

  if (nameParts.length >= 2) {
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];

    // Common email patterns
    const patterns = [
      `${firstName}.${lastName}@${domain}`,
      `${firstName}${lastName}@${domain}`,
      `${firstName.charAt(0)}${lastName}@${domain}`,
      `${firstName}@${domain}`,
    ];

    return patterns[0]; // Return most common pattern
  }

  return `${name.toLowerCase().replace(/\s+/g, '.')}@${domain}`;
}

// Placeholder functions for external APIs (would need real API keys in production)

async function fetchJobsFromLinkedIn(_companyName: string): Promise<JobPosting[]> {
  // In production, this would use LinkedIn Jobs API
  return [];
}

async function fetchJobsFromIndeed(_companyName: string): Promise<JobPosting[]> {
  // In production, this would use Indeed API or scraping
  return [];
}

async function fetchJobsFromGlassdoor(_companyName: string): Promise<JobPosting[]> {
  // In production, this would use Glassdoor API
  return [];
}

async function fetchLinkedInPeople(_companyName: string): Promise<KeyPerson[]> {
  // In production, this would use LinkedIn People API
  return [];
}

async function fetchWebsitePeople(_website: string): Promise<KeyPerson[]> {
  // In production, this would scrape team/about pages
  return [];
}

async function fetchLinkedInCompanyData(
  _companyName: string
): Promise<{ followers: number; employees: number; industry: string } | null> {
  // In production, this would use LinkedIn Company API
  return null;
}

async function fetchTwitterData(_companyName: string): Promise<{ followers: number; handle: string } | null> {
  // In production, this would use Twitter API
  return null;
}

/**
 * Main function to fetch all enhanced company data
 */
export async function fetchEnhancedCompanyData(companyName: string, basicData: CompanyData): Promise<CompanyData> {
  console.log(`Fetching enhanced data for ${companyName}...`);

  // Check if we have API keys configured, otherwise use demo data
  const hasApiKeys = process.env.NEWS_API_KEY || process.env.LINKEDIN_API_KEY;

  if (!hasApiKeys) {
    console.log('No API keys configured, using demo data...');
    const { fetchDemoEnhancedData } = await import('./demo-data');
    return fetchDemoEnhancedData(companyName, basicData);
  }

  const enhancedData: CompanyData = { ...basicData };

  // Fetch all enhanced data in parallel
  const dataPromises = [
    fetchCompanyNews(companyName),
    fetchJobPostings(companyName, basicData.website),
    fetchKeyPeople(companyName, basicData.website),
    fetchSocialMediaData(companyName),
    basicData.website ? scrapeCompanyWebsite(basicData.website) : Promise.resolve({}),
  ];

  const results = await Promise.allSettled(dataPromises);

  // Process results
  if (results[0].status === 'fulfilled') {
    enhancedData.recentNews = results[0].value as NewsItem[];
  }

  if (results[1].status === 'fulfilled') {
    enhancedData.jobPostings = results[1].value as JobPosting[];
  }

  if (results[2].status === 'fulfilled') {
    enhancedData.keyPeople = results[2].value as KeyPerson[];
  }

  if (results[3].status === 'fulfilled') {
    enhancedData.socialMedia = results[3].value;
  }

  if (results[4].status === 'fulfilled') {
    enhancedData.websiteContent = results[4].value;
  }

  console.log(`Enhanced data fetched for ${companyName}:`, {
    news: enhancedData.recentNews?.length || 0,
    jobs: enhancedData.jobPostings?.length || 0,
    people: enhancedData.keyPeople?.length || 0,
    hasWebsiteContent: !!enhancedData.websiteContent?.title,
  });

  return enhancedData;
}
