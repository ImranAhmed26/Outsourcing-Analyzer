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
 * Task 7: Multi-source data aggregation system with parallel execution
 * Requirements: 1.1, 1.2, 1.3, 4.5
 */
export async function fetchKeyPeople(
  companyName: string,
  website?: string
): Promise<{
  people: KeyPerson[];
  dataSourcesUsed: {
    linkedin: boolean;
    crunchbase: boolean;
    website: boolean;
    emailVerification: boolean;
  };
}> {
  try {
    console.log(`Fetching key people for ${companyName} using parallel data source execution...`);

    // Parallel execution of all data sources
    const dataSourcePromises: Promise<KeyPerson[]>[] = [];

    // LinkedIn API integration (Requirements: 1.1)
    dataSourcePromises.push(
      fetchLinkedInPeople(companyName).catch((error) => {
        console.warn('LinkedIn data source failed:', error);
        return [];
      })
    );

    // Crunchbase API integration (Requirements: 1.2)
    dataSourcePromises.push(
      fetchCrunchbasePeople(companyName).catch((error) => {
        console.warn('Crunchbase data source failed:', error);
        return [];
      })
    );

    // Website scraping (Requirements: 1.3)
    if (website) {
      dataSourcePromises.push(
        fetchWebsitePeople(website).catch((error) => {
          console.warn('Website scraping failed:', error);
          return [];
        })
      );
    } else {
      dataSourcePromises.push(Promise.resolve([]));
    }

    // Hunter.io for additional email data
    if (process.env.HUNTER_API_KEY && website) {
      dataSourcePromises.push(
        fetchFromHunter(companyName, website).catch((error) => {
          console.warn('Hunter.io data source failed:', error);
          return [];
        })
      );
    } else {
      dataSourcePromises.push(Promise.resolve([]));
    }

    // Execute all data sources in parallel
    console.log('Executing parallel data source requests...');
    const results = await Promise.allSettled(dataSourcePromises);

    // Collect all people from successful data sources
    const allPeople: KeyPerson[] = [];
    const dataSourcesUsed = {
      linkedin: false,
      crunchbase: false,
      website: false,
      emailVerification: false,
    };

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allPeople.push(...result.value);

        // Track which data sources provided data
        switch (index) {
          case 0:
            dataSourcesUsed.linkedin = true;
            console.log(`LinkedIn provided ${result.value.length} people`);
            break;
          case 1:
            dataSourcesUsed.crunchbase = true;
            console.log(`Crunchbase provided ${result.value.length} people`);
            break;
          case 2:
            dataSourcesUsed.website = true;
            console.log(`Website scraping provided ${result.value.length} people`);
            break;
          case 3:
            dataSourcesUsed.emailVerification = true;
            console.log(`Hunter.io provided ${result.value.length} people`);
            break;
        }
      }
    });

    console.log(`Collected ${allPeople.length} people from all sources before deduplication`);

    // Advanced deduplication logic (Requirements: 4.5)
    const uniquePeople = deduplicatePeople(allPeople);
    console.log(`After deduplication: ${uniquePeople.length} unique people`);

    // Enhance with email prediction for people without emails
    const enhancedPeople = await enhanceWithEmailPrediction(uniquePeople, companyName, website);

    // Sort by department priority and position importance
    const sortedPeople = sortPeopleByPriority(enhancedPeople);

    // Limit to top 5 people as specified in requirements
    const topPeople = sortedPeople.slice(0, 5);

    // Use demo data fallback if no real data was found (Requirements: 1.5, 4.1)
    if (topPeople.length === 0) {
      console.log(`No real data found for ${companyName}, using demo data fallback`);
      return {
        people: getDemoKeyPeople(companyName, website),
        dataSourcesUsed: {
          linkedin: false,
          crunchbase: false,
          website: false,
          emailVerification: false,
        },
      };
    }

    console.log(`Returning top ${topPeople.length} key people for ${companyName}`);
    console.log('Data sources used:', dataSourcesUsed);

    return {
      people: topPeople,
      dataSourcesUsed,
    };
  } catch (error) {
    console.error('Failed to fetch key people:', error);
    // Use demo data as fallback when all APIs fail (Requirements: 1.5, 4.1)
    console.log(`Using demo data fallback due to error for ${companyName}`);
    return {
      people: getDemoKeyPeople(companyName, website),
      dataSourcesUsed: {
        linkedin: false,
        crunchbase: false,
        website: false,
        emailVerification: false,
      },
    };
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

/**
 * Predicts email addresses using common corporate email patterns
 * Implements comprehensive email pattern generation with domain extraction and name cleaning
 */
function predictEmail(name: string, companyName: string, website?: string): string {
  const cleanedName = cleanNameForEmail(name);
  const domain = extractDomainFromWebsite(website) || generateDomainFromCompanyName(companyName);

  if (!cleanedName.firstName || !cleanedName.lastName) {
    // Fallback for single names or invalid names
    const safeName = name
      .toLowerCase()
      .replace(/[^a-z\s]/g, '')
      .replace(/\s+/g, '.');
    return `${safeName}@${domain}`;
  }

  // Generate email pattern variations as specified in requirements
  const patterns = generateEmailPatterns(cleanedName.firstName, cleanedName.lastName, domain);

  // Return the most common pattern (firstname.lastname)
  return patterns[0];
}

/**
 * Generates common corporate email patterns
 * Requirements: 2.1, 2.4, 2.5 - firstname.lastname, firstnamelastname, f.lastname formats
 */
function generateEmailPatterns(firstName: string, lastName: string, domain: string): string[] {
  return [
    `${firstName}.${lastName}@${domain}`, // firstname.lastname@domain.com
    `${firstName}${lastName}@${domain}`, // firstnamelastname@domain.com
    `${firstName.charAt(0)}.${lastName}@${domain}`, // f.lastname@domain.com
    `${firstName}@${domain}`, // firstname@domain.com
    `${lastName}@${domain}`, // lastname@domain.com
    `${firstName.charAt(0)}${lastName}@${domain}`, // flastname@domain.com
  ];
}

/**
 * Extracts domain from company website URLs
 * Handles various URL formats and normalizes domain names
 */
function extractDomainFromWebsite(website?: string): string | null {
  if (!website) return null;

  try {
    // Remove protocol and www prefix, get base domain
    const domain = website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('?')[0]
      .split('#')[0]
      .toLowerCase()
      .trim();

    // Validate domain format
    if (domain && domain.includes('.') && domain.length > 3) {
      return domain;
    }

    return null;
  } catch (error) {
    console.warn('Error extracting domain from website:', error);
    return null;
  }
}

/**
 * Generates domain from company name as fallback
 * Creates a reasonable domain when website is not available
 */
function generateDomainFromCompanyName(companyName: string): string {
  // Clean company name and create domain
  const cleanName = companyName
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '') // Remove spaces
    .replace(/(inc|llc|corp|corporation|company|co|ltd|limited)$/i, '') // Remove common suffixes
    .trim();

  return `${cleanName}.com`;
}

/**
 * Cleans and validates names for email generation
 * Handles various name formats and removes invalid characters
 */
function cleanNameForEmail(name: string): { firstName: string; lastName: string } {
  if (!name || typeof name !== 'string') {
    return { firstName: '', lastName: '' };
  }

  // Clean the name - remove titles, special characters, extra spaces
  const cleanedName = name
    .replace(/^(mr|mrs|ms|dr|prof|professor|sir|madam)\.?\s+/i, '') // Remove titles
    .replace(/[^a-zA-Z\s'-]/g, '') // Keep only letters, spaces, hyphens, apostrophes
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim();

  const nameParts = cleanedName.split(' ').filter((part) => part.length > 0);

  if (nameParts.length === 0) {
    return { firstName: '', lastName: '' };
  }

  if (nameParts.length === 1) {
    // Single name - use as firstName, generate lastName
    return { firstName: nameParts[0].toLowerCase(), lastName: 'user' };
  }

  // Multiple parts - first and last
  const firstName = nameParts[0].toLowerCase();
  const lastName = nameParts[nameParts.length - 1].toLowerCase();

  // Validate name parts
  if (firstName.length < 1 || lastName.length < 1) {
    return { firstName: '', lastName: '' };
  }

  return { firstName, lastName };
}

/**
 * Extracts company name from website URL for email prediction
 */
function extractCompanyNameFromWebsite(website?: string): string {
  if (!website) return 'company';

  try {
    const domain = website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0]
      .split('.')[0];

    return domain || 'company';
  } catch (error) {
    return 'company';
  }
}

function parseLinkedInApiResponse(
  data: { data?: unknown[]; elements?: unknown[]; results?: unknown[] },
  companyName: string
): KeyPerson[] {
  const people: KeyPerson[] = [];

  try {
    // Handle different possible response structures from LinkedIn API
    const profiles = data.data || data.elements || data.results || [];

    if (!Array.isArray(profiles)) {
      console.warn('LinkedIn API response does not contain expected array structure');
      return people;
    }

    profiles.forEach((profileData: unknown) => {
      const profile = profileData as {
        name?: string;
        fullName?: string;
        firstName?: string;
        lastName?: string;
        title?: string;
        headline?: string;
        position?: string;
        currentPosition?: string;
        jobTitle?: string;
        profileUrl?: string;
        url?: string;
        publicProfileUrl?: string;
        profileId?: string;
        company?: string;
        currentCompany?: string;
      };
      try {
        // Extract name from various possible fields
        const name =
          profile.name || profile.fullName || `${profile.firstName || ''} ${profile.lastName || ''}`.trim() || profile.title;

        // Extract position/title
        const position =
          profile.headline || profile.position || profile.currentPosition || profile.jobTitle || 'Unknown Position';

        // Extract LinkedIn profile URL
        const linkedinUrl =
          profile.profileUrl ||
          profile.url ||
          profile.publicProfileUrl ||
          (profile.profileId ? `https://linkedin.com/in/${profile.profileId}` : undefined);

        // Only include if we have valid name and position
        if (name && position && name.length > 2 && position.length > 2) {
          // Check if this person is likely associated with the company
          const isRelevant =
            position.toLowerCase().includes(companyName.toLowerCase()) ||
            (profile.company && profile.company.toLowerCase().includes(companyName.toLowerCase())) ||
            (profile.currentCompany && profile.currentCompany.toLowerCase().includes(companyName.toLowerCase()));

          if (isRelevant || people.length < 3) {
            // Include first few results even if not clearly company-related
            const department = determineDepartment(position);

            // Predict email if we have company info
            const email = predictEmail(name, companyName);

            people.push({
              name: name.trim(),
              position: position.trim(),
              email,
              linkedin: linkedinUrl,
              department,
            });
          }
        }
      } catch (profileError) {
        console.warn('Error parsing individual LinkedIn profile:', profileError);
      }
    });

    console.log(`Parsed ${people.length} people from LinkedIn API for ${companyName}`);
  } catch (error) {
    console.warn('Error parsing LinkedIn API response:', error);
  }

  return people.slice(0, 10); // Limit to top 10 results
}

function parseTeamPageContent(html: string, website: string): KeyPerson[] {
  const people: KeyPerson[] = [];

  try {
    // Common patterns for team member information
    const patterns = [
      // Pattern 1: Name and title in separate elements
      /<(?:div|section|article)[^>]*class="[^"]*(?:team|member|person|staff|employee)[^"]*"[^>]*>[\s\S]*?<(?:h[1-6]|div|span)[^>]*>([^<]+)<\/(?:h[1-6]|div|span)>[\s\S]*?<(?:p|div|span)[^>]*>([^<]+)<\/(?:p|div|span)>[\s\S]*?(?:<a[^>]*href="mailto:([^"]+)"[^>]*>|$)/gi,

      // Pattern 2: JSON-LD structured data
      /"@type":\s*"Person"[\s\S]*?"name":\s*"([^"]+)"[\s\S]*?"jobTitle":\s*"([^"]+)"[\s\S]*?(?:"email":\s*"([^"]+)"|$)/gi,

      // Pattern 3: Simple name-title pairs
      /<(?:div|p)[^>]*>[\s\S]*?<(?:strong|b|h[1-6])[^>]*>([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)<\/(?:strong|b|h[1-6])>[\s\S]*?<[^>]*>([^<]*(?:CEO|CTO|CFO|COO|Director|Manager|VP|President|Head|Lead)[^<]*)<\/[^>]*>/gi,
    ];

    patterns.forEach((pattern) => {
      let match;
      while ((match = pattern.exec(html)) !== null && people.length < 15) {
        const name = match[1]?.trim();
        const title = match[2]?.trim();
        const email = match[3]?.trim();

        if (name && title && isValidPersonName(name) && isValidJobTitle(title)) {
          const department = determineDepartment(title);

          const person: KeyPerson = {
            name,
            position: title,
            email: email && isValidEmail(email) ? email : predictEmail(name, extractCompanyNameFromWebsite(website), website),
            department,
          };

          // Avoid duplicates
          if (!people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
            people.push(person);
          }
        }
      }
    });

    // Enhanced parsing using parsePersonText helper for various text formats
    // Look for text blocks that might contain name-position combinations
    const textBlockPatterns = [
      // Text within team/member containers
      /<(?:div|section|article)[^>]*class="[^"]*(?:team|member|person|staff|employee|bio|profile)[^"]*"[^>]*>([\s\S]*?)<\/(?:div|section|article)>/gi,
      // Text within list items
      /<li[^>]*>([\s\S]*?)<\/li>/gi,
      // Text within paragraphs that might contain executive info
      /<p[^>]*>([^<]*(?:CEO|CTO|CFO|COO|Director|Manager|VP|President|Head|Lead|Chief|Executive|Founder)[^<]*)<\/p>/gi,
    ];

    textBlockPatterns.forEach((blockPattern) => {
      let blockMatch;
      while ((blockMatch = blockPattern.exec(html)) !== null && people.length < 15) {
        const blockContent = blockMatch[1];

        // Remove HTML tags from the content
        const cleanContent = blockContent
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();

        // Try to parse this text block for name-position pairs
        const parsedPerson = parsePersonText(cleanContent);

        if (parsedPerson) {
          const { name, position } = parsedPerson;

          // Check if we already have this person
          if (!people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
            const department = determineDepartment(position);

            const person: KeyPerson = {
              name,
              position,
              email: predictEmail(name, extractCompanyNameFromWebsite(website), website),
              department,
            };

            people.push(person);
          }
        }
      }
    });

    // Try to find email addresses separately and match them to people
    const emailRegex = /href="mailto:([^"]+@[^"]+)"/gi;
    const foundEmails: string[] = [];
    let emailMatch;

    while ((emailMatch = emailRegex.exec(html)) !== null) {
      const email = emailMatch[1].trim();
      if (isValidEmail(email)) {
        foundEmails.push(email);
      }
    }

    // Try to match emails to people based on name similarity
    people.forEach((person) => {
      if (!person.email || person.email.includes('predicted')) {
        const matchingEmail = findMatchingEmail(person.name, foundEmails);
        if (matchingEmail) {
          person.email = matchingEmail;
        }
      }
    });

    // Additional parsing for common executive title formats in plain text
    if (people.length < 5) {
      const executivePatterns = [
        // "John Doe, CEO" or "Jane Smith - CTO" patterns in plain text
        /([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)[,\-–—]\s*(CEO|CTO|CFO|COO|VP|President|Director|Manager|Head|Lead|Chief[^,\n]*)/gi,
        // "CEO: John Doe" or "CTO - Jane Smith" patterns
        /(CEO|CTO|CFO|COO|VP|President|Director|Manager|Head|Lead|Chief[^:]*)[:\-–—]\s*([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi,
      ];

      executivePatterns.forEach((execPattern) => {
        let execMatch;
        while ((execMatch = execPattern.exec(html)) !== null && people.length < 15) {
          let name, position;

          // Check which capture group has the name vs position
          if (isValidPersonName(execMatch[1]) && isValidJobTitle(execMatch[2])) {
            name = execMatch[1].trim();
            position = execMatch[2].trim();
          } else if (isValidPersonName(execMatch[2]) && isValidJobTitle(execMatch[1])) {
            name = execMatch[2].trim();
            position = execMatch[1].trim();
          }

          if (name && position && !people.some((p) => p.name.toLowerCase() === name.toLowerCase())) {
            const department = determineDepartment(position);

            const person: KeyPerson = {
              name,
              position,
              email: predictEmail(name, extractCompanyNameFromWebsite(website), website),
              department,
            };

            people.push(person);
          }
        }
      });
    }
  } catch (error) {
    console.warn('Error parsing team page:', error);
  }

  return people;
}

function determineDepartment(title: string): string {
  // Use the new extractDepartment function for consistency
  return extractDepartment(title);
}

/**
 * Simple department classification function with basic position-to-department mapping
 * Task 8: Add basic department classification
 * Requirements: 3.2 - Map common titles to Executive, Technology, Sales, Marketing departments
 */
export function extractDepartment(position: string): string {
  if (!position || typeof position !== 'string') {
    return 'Operations';
  }

  const positionLower = position.toLowerCase().trim();

  // Executive department - C-level, founders, presidents
  if (
    positionLower.includes('ceo') ||
    positionLower.includes('chief executive') ||
    positionLower.includes('president') ||
    positionLower.includes('founder') ||
    positionLower.includes('co-founder') ||
    positionLower.includes('chief')
  ) {
    return 'Executive';
  }

  // Technology department - engineers, developers, technical roles
  if (
    positionLower.includes('engineer') ||
    positionLower.includes('developer') ||
    positionLower.includes('tech') ||
    positionLower.includes('cto') ||
    positionLower.includes('architect') ||
    positionLower.includes('programmer') ||
    positionLower.includes('software') ||
    positionLower.includes('product') ||
    positionLower.includes('design') ||
    positionLower.includes('ux') ||
    positionLower.includes('ui')
  ) {
    return 'Technology';
  }

  // Sales department - sales, business development
  if (
    positionLower.includes('sales') ||
    positionLower.includes('business development') ||
    positionLower.includes('account') ||
    positionLower.includes('revenue') ||
    positionLower.includes('partnership')
  ) {
    return 'Sales';
  }

  // Marketing department - marketing, growth, communications
  if (
    positionLower.includes('marketing') ||
    positionLower.includes('growth') ||
    positionLower.includes('brand') ||
    positionLower.includes('communications') ||
    positionLower.includes('content') ||
    positionLower.includes('digital')
  ) {
    return 'Marketing';
  }

  // Default to Operations for all other roles
  return 'Operations';
}

function isValidPersonName(name: string): boolean {
  // Basic validation for person names
  const nameRegex = /^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+$/;
  return nameRegex.test(name) && name.length >= 4 && name.length <= 50;
}

function isValidJobTitle(title: string): boolean {
  // Basic validation for job titles
  const invalidTitles = ['lorem ipsum', 'placeholder', 'example', 'test', 'sample'];
  const titleLower = title.toLowerCase();

  return title.length >= 3 && title.length <= 100 && !invalidTitles.some((invalid) => titleLower.includes(invalid));
}

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && !email.includes('example.com') && !email.includes('placeholder');
}

function findMatchingEmail(name: string, emails: string[]): string | undefined {
  const nameParts = name.toLowerCase().split(' ');
  const firstName = nameParts[0];
  const lastName = nameParts[nameParts.length - 1];

  // Look for emails that might match this person
  return emails.find((email) => {
    const emailLocal = email.split('@')[0].toLowerCase();
    return (
      emailLocal.includes(firstName) ||
      emailLocal.includes(lastName) ||
      emailLocal.includes(`${firstName}.${lastName}`) ||
      emailLocal.includes(`${firstName}${lastName}`)
    );
  });
}

/**
 * Demo data fallback function with realistic executives
 * Task 9: Create demo data fallback
 * Requirements: 1.5, 4.1 - Use when all APIs fail to maintain consistent UI
 */
export function getDemoKeyPeople(companyName: string, website?: string): KeyPerson[] {
  // Generate realistic demo executives with proper email patterns
  const domain = extractDomainFromWebsite(website) || generateDomainFromCompanyName(companyName);

  const demoExecutives: KeyPerson[] = [
    {
      name: 'Sarah Johnson',
      position: 'Chief Executive Officer',
      email: `sarah.johnson@${domain}`,
      department: 'Executive',
      linkedin: 'https://linkedin.com/in/sarah-johnson-ceo',
    },
    {
      name: 'Michael Chen',
      position: 'Chief Technology Officer',
      email: `michael.chen@${domain}`,
      department: 'Technology',
      linkedin: 'https://linkedin.com/in/michael-chen-cto',
    },
    {
      name: 'Emily Rodriguez',
      position: 'VP of Business Development',
      email: `emily.rodriguez@${domain}`,
      department: 'Sales',
      linkedin: 'https://linkedin.com/in/emily-rodriguez-vp',
    },
    {
      name: 'David Kim',
      position: 'Head of Marketing',
      email: `david.kim@${domain}`,
      department: 'Marketing',
      linkedin: 'https://linkedin.com/in/david-kim-marketing',
    },
    {
      name: 'Jennifer Walsh',
      position: 'Chief Financial Officer',
      email: `jennifer.walsh@${domain}`,
      department: 'Executive',
    },
  ];

  // Return 3-5 executives as specified in requirements
  const numberOfExecutives = Math.floor(Math.random() * 3) + 3; // Random between 3-5
  return demoExecutives.slice(0, numberOfExecutives);
}

/**
 * Helper function to parse various name-position text formats
 * Handles different formats like "John Doe - CEO", "Jane Smith, CTO", "Bob Johnson | VP Engineering", etc.
 */
function parsePersonText(text: string): { name: string; position: string } | null {
  try {
    // Clean up the text - remove extra whitespace and normalize
    const cleanText = text.trim().replace(/\s+/g, ' ');

    if (!cleanText || cleanText.length < 5) {
      return null;
    }

    // Common separators between name and position
    const separators = [
      ' - ', // John Doe - CEO
      ' – ', // John Doe – CEO (em dash)
      ' — ', // John Doe — CEO (em dash)
      ', ', // John Doe, CEO
      ' | ', // John Doe | CEO
      ' / ', // John Doe / CEO
      '\n', // John Doe\nCEO (newline)
      '\t', // John Doe\tCEO (tab)
    ];

    let name = '';
    let position = '';

    // Try each separator
    for (const separator of separators) {
      if (cleanText.includes(separator)) {
        const parts = cleanText.split(separator);
        if (parts.length >= 2) {
          const potentialName = parts[0].trim();
          const potentialPosition = parts[1].trim();

          // Validate that the first part looks like a name and second like a position
          if (isValidPersonName(potentialName) && isValidJobTitle(potentialPosition)) {
            name = potentialName;
            position = potentialPosition;
            break;
          }
        }
      }
    }

    // If no separator worked, try to detect patterns within the text
    if (!name || !position) {
      // Pattern: Name followed by title in parentheses - "John Doe (CEO)"
      const parenthesesMatch = cleanText.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\(([^)]+)\)$/);
      if (parenthesesMatch) {
        const potentialName = parenthesesMatch[1].trim();
        const potentialPosition = parenthesesMatch[2].trim();
        if (isValidPersonName(potentialName) && isValidJobTitle(potentialPosition)) {
          name = potentialName;
          position = potentialPosition;
        }
      }

      // Pattern: Position followed by name - "CEO John Doe"
      if (!name || !position) {
        const titleFirstMatch = cleanText.match(
          /^(CEO|CTO|CFO|COO|VP|President|Director|Manager|Head|Lead|Chief)\s+([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/i
        );
        if (titleFirstMatch) {
          const potentialPosition = titleFirstMatch[1].trim();
          const potentialName = titleFirstMatch[2].trim();
          if (isValidPersonName(potentialName) && isValidJobTitle(potentialPosition)) {
            name = potentialName;
            position = potentialPosition;
          }
        }
      }

      // Pattern: Name on one line, position on next (common in HTML with <br> tags)
      if (!name || !position) {
        const lines = cleanText.split(/\s*<br\s*\/?>\s*/i);
        if (lines.length >= 2) {
          const potentialName = lines[0].trim();
          const potentialPosition = lines[1].trim();
          if (isValidPersonName(potentialName) && isValidJobTitle(potentialPosition)) {
            name = potentialName;
            position = potentialPosition;
          }
        }
      }

      // Pattern: Look for executive titles within the text
      if (!name || !position) {
        const executiveTitles = [
          'Chief Executive Officer',
          'Chief Technology Officer',
          'Chief Financial Officer',
          'Chief Operating Officer',
          'Vice President',
          'Senior Vice President',
          'CEO',
          'CTO',
          'CFO',
          'COO',
          'VP',
          'SVP',
          'President',
          'Director',
          'Manager',
          'Head of',
          'Lead',
          'Principal',
          'Senior Director',
          'Executive Director',
        ];

        for (const title of executiveTitles) {
          const titleRegex = new RegExp(`\\b${title.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
          if (titleRegex.test(cleanText)) {
            // Try to extract name before or after the title
            const beforeTitle = cleanText.split(titleRegex)[0].trim();
            const afterTitle = cleanText.split(titleRegex)[1]?.trim() || '';

            // Check if name comes before title
            const nameMatch = beforeTitle.match(/([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)$/);
            if (nameMatch && isValidPersonName(nameMatch[1])) {
              name = nameMatch[1];
              position = title;
              break;
            }

            // Check if name comes after title
            const nameAfterMatch = afterTitle.match(/^([A-Z][a-z]+ [A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/);
            if (nameAfterMatch && isValidPersonName(nameAfterMatch[1])) {
              name = nameAfterMatch[1];
              position = title;
              break;
            }
          }
        }
      }
    }

    // Final validation
    if (name && position && isValidPersonName(name) && isValidJobTitle(position)) {
      return {
        name: name.trim(),
        position: position.trim(),
      };
    }

    return null;
  } catch (error) {
    console.warn('Error parsing person text:', error);
    return null;
  }
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

async function fetchLinkedInPeople(companyName: string): Promise<KeyPerson[]> {
  try {
    const rapidApiKey = process.env.RAPIDAPI_KEY;
    if (!rapidApiKey) {
      console.warn('RAPIDAPI_KEY not configured, skipping LinkedIn people fetch');
      return [];
    }

    // Use RapidAPI LinkedIn API to search for people
    const searchUrl = 'https://linkedin-api8.p.rapidapi.com/search/people';
    const searchParams = new URLSearchParams({
      keywords: companyName,
      location: 'United States',
      start: '0',
      count: '10',
    });

    const response = await fetchWithTimeout(
      `${searchUrl}?${searchParams}`,
      {
        method: 'GET',
        headers: {
          'X-RapidAPI-Key': rapidApiKey,
          'X-RapidAPI-Host': 'linkedin-api8.p.rapidapi.com',
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      },
      10000 // 10 second timeout
    );

    if (!response.ok) {
      throw new Error(`LinkedIn API returned ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return parseLinkedInApiResponse(data, companyName);
  } catch (error) {
    console.warn('LinkedIn API people search failed:', error);
    return [];
  }
}

async function fetchWebsitePeople(website: string): Promise<KeyPerson[]> {
  try {
    if (!website) {
      console.warn('No website provided for people scraping');
      return [];
    }

    const baseUrl = website.startsWith('http') ? website : `https://${website}`;

    // Comprehensive list of common team page URLs
    const peoplePages = [
      '/team',
      '/about',
      '/about-us',
      '/about-us/',
      '/leadership',
      '/leadership/',
      '/management',
      '/management/',
      '/executives',
      '/executives/',
      '/staff',
      '/staff/',
      '/people',
      '/people/',
      '/our-team',
      '/our-team/',
      '/meet-the-team',
      '/meet-our-team',
      '/company/team',
      '/company/leadership',
      '/company/about',
      '/who-we-are',
      '/founders',
      '/board',
      '/advisory-board',
      '/key-personnel',
    ];

    const keyPeople: KeyPerson[] = [];
    let successfulPages = 0;
    let totalAttempts = 0;

    console.log(`Scraping website ${baseUrl} for team information...`);

    // Try different team/about page URLs
    for (const page of peoplePages) {
      if (keyPeople.length >= 10) break; // Stop if we have enough people

      try {
        totalAttempts++;
        const url = `${baseUrl}${page}`;

        console.log(`Attempting to scrape: ${url}`);

        const response = await fetchWithTimeout(
          url,
          {
            headers: {
              'User-Agent': 'Mozilla/5.0 (compatible; OutsourcingAnalyzer/1.0)',
              Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
              'Accept-Language': 'en-US,en;q=0.5',
              'Accept-Encoding': 'gzip, deflate',
              Connection: 'keep-alive',
            },
          },
          8000 // 8 second timeout per page
        );

        if (response.ok) {
          successfulPages++;
          const html = await response.text();

          // Check if the page actually contains team/people content
          const hasTeamContent =
            /(?:team|staff|employee|executive|leadership|management|founder|director|manager|ceo|cto|cfo|coo)/i.test(html);

          if (hasTeamContent) {
            console.log(`Found team content on ${url}`);
            const foundPeople = parseTeamPageContent(html, website);

            if (foundPeople.length > 0) {
              console.log(`Extracted ${foundPeople.length} people from ${url}`);
              keyPeople.push(...foundPeople);
            }
          } else {
            console.log(`No team content found on ${url}`);
          }
        } else {
          console.log(`Page ${url} returned status ${response.status}`);
        }
      } catch (error) {
        // Log specific error types for debugging
        if (error instanceof Error) {
          if (error.message.includes('timeout')) {
            console.warn(`Timeout accessing ${baseUrl}${page}`);
          } else if (error.message.includes('ENOTFOUND') || error.message.includes('ECONNREFUSED')) {
            console.warn(`Network error accessing ${baseUrl}${page}: ${error.message}`);
          } else {
            console.warn(`Error accessing ${baseUrl}${page}: ${error.message}`);
          }
        }
        // Continue to next page if this one fails
        continue;
      }
    }

    // Remove duplicates based on name similarity
    const uniquePeople: KeyPerson[] = [];
    keyPeople.forEach((person) => {
      const isDuplicate = uniquePeople.some((existing) => {
        const nameSimilarity = person.name.toLowerCase() === existing.name.toLowerCase();
        const positionSimilarity = person.position.toLowerCase() === existing.position.toLowerCase();
        return nameSimilarity || (nameSimilarity && positionSimilarity);
      });

      if (!isDuplicate) {
        uniquePeople.push(person);
      }
    });

    console.log(
      `Website scraping completed: ${successfulPages}/${totalAttempts} pages successful, found ${uniquePeople.length} unique people`
    );

    return uniquePeople.slice(0, 10); // Limit to top 10
  } catch (error) {
    console.error('Website people scraping failed with error:', error);

    // Provide specific error context
    if (error instanceof Error) {
      if (error.message.includes('Invalid URL')) {
        console.error(`Invalid website URL provided: ${website}`);
      } else if (error.message.includes('timeout')) {
        console.error(`Website scraping timed out for: ${website}`);
      } else if (error.message.includes('ENOTFOUND')) {
        console.error(`Website not found: ${website}`);
      }
    }

    return [];
  }
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
export async function fetchEnhancedCompanyData(
  companyName: string,
  basicData: CompanyData
): Promise<
  CompanyData & {
    dataSourcesUsed?: {
      linkedin: boolean;
      crunchbase: boolean;
      website: boolean;
      emailVerification: boolean;
    };
  }
> {
  console.log(`Fetching enhanced data for ${companyName}...`);

  // Check if we have API keys configured, otherwise use demo data
  const hasApiKeys = process.env.NEWS_API_KEY || process.env.LINKEDIN_API_KEY;

  if (!hasApiKeys) {
    console.log('No API keys configured, using demo data...');
    const { fetchDemoEnhancedData } = await import('./demo-data');
    return fetchDemoEnhancedData(companyName, basicData);
  }

  const enhancedData: CompanyData & {
    dataSourcesUsed?: {
      linkedin: boolean;
      crunchbase: boolean;
      website: boolean;
      emailVerification: boolean;
    };
  } = { ...basicData };

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
    const keyPeopleResult = results[2].value as {
      people: KeyPerson[];
      dataSourcesUsed: {
        linkedin: boolean;
        crunchbase: boolean;
        website: boolean;
        emailVerification: boolean;
      };
    };
    enhancedData.keyPeople = keyPeopleResult.people;
    enhancedData.dataSourcesUsed = keyPeopleResult.dataSourcesUsed;
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

/**
 * Fetch people data from Hunter.io API
 */
/**
 * Fetches people data from Crunchbase API v4
 */
async function fetchCrunchbasePeople(companyName: string): Promise<KeyPerson[]> {
  try {
    const apiKey = process.env.CRUNCHBASE_API_KEY;
    if (!apiKey) {
      console.warn('CRUNCHBASE_API_KEY not configured, skipping Crunchbase people fetch');
      return [];
    }

    console.log(`Fetching Crunchbase people data for ${companyName}...`);

    // First, search for the organization to get its UUID
    const orgSearchUrl = 'https://api.crunchbase.com/api/v4/searches/organizations';
    const orgSearchBody = {
      field_ids: ['identifier', 'name', 'short_description'],
      query: companyName,
      limit: 5,
    };

    const orgResponse = await fetchWithTimeout(
      orgSearchUrl,
      {
        method: 'POST',
        headers: {
          'X-cb-user-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(orgSearchBody),
      },
      15000 // 15 second timeout for Crunchbase
    );

    if (!orgResponse.ok) {
      if (orgResponse.status === 429) {
        console.warn('Crunchbase API rate limit exceeded');
        return [];
      }
      throw new Error(`Crunchbase organization search failed: ${orgResponse.status} ${orgResponse.statusText}`);
    }

    const orgData = await orgResponse.json();

    if (!orgData.entities || orgData.entities.length === 0) {
      console.log(`No organization found in Crunchbase for ${companyName}`);
      return [];
    }

    // Get the first matching organization
    const organization = orgData.entities[0];
    const orgUuid = organization.uuid;

    console.log(`Found Crunchbase organization: ${organization.properties.name} (${orgUuid})`);

    // Now search for people associated with this organization
    const peopleSearchUrl = 'https://api.crunchbase.com/api/v4/searches/people';
    const peopleSearchBody = {
      field_ids: ['identifier', 'first_name', 'last_name', 'job_title', 'linkedin', 'primary_job_title', 'primary_organization'],
      query: companyName,
      limit: 10,
      order: [
        {
          field_id: 'rank',
          sort: 'asc',
        },
      ],
    };

    const peopleResponse = await fetchWithTimeout(
      peopleSearchUrl,
      {
        method: 'POST',
        headers: {
          'X-cb-user-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(peopleSearchBody),
      },
      15000
    );

    if (!peopleResponse.ok) {
      if (peopleResponse.status === 429) {
        console.warn('Crunchbase API rate limit exceeded for people search');
        return [];
      }
      throw new Error(`Crunchbase people search failed: ${peopleResponse.status} ${peopleResponse.statusText}`);
    }

    const peopleData = await peopleResponse.json();

    if (!peopleData.entities || peopleData.entities.length === 0) {
      console.log(`No people found in Crunchbase for ${companyName}`);
      return [];
    }

    const keyPeople: KeyPerson[] = [];

    // Parse the people data
    peopleData.entities.forEach(
      (person: {
        properties?: {
          first_name?: string;
          last_name?: string;
          primary_job_title?: string;
          job_title?: string;
          linkedin?: string;
        };
      }) => {
        try {
          const properties = person.properties;

          if (!properties) return;

          const firstName = properties.first_name || '';
          const lastName = properties.last_name || '';
          const name = `${firstName} ${lastName}`.trim();

          if (!name || name.length < 2) return;

          // Get job title - prefer primary_job_title over job_title
          const jobTitle = properties.primary_job_title || properties.job_title || 'Executive';

          // Get LinkedIn URL if available
          const linkedinUrl = properties.linkedin
            ? properties.linkedin.startsWith('http')
              ? properties.linkedin
              : `https://linkedin.com/in/${properties.linkedin}`
            : undefined;

          // Determine department based on job title
          const department = determineDepartment(jobTitle);

          // Predict email address
          const email = predictEmail(name, companyName);

          const keyPerson: KeyPerson = {
            name,
            position: jobTitle,
            email,
            linkedin: linkedinUrl,
            department,
          };

          keyPeople.push(keyPerson);
        } catch (personError) {
          console.warn('Error parsing Crunchbase person data:', personError);
        }
      }
    );

    console.log(`Found ${keyPeople.length} people from Crunchbase for ${companyName}`);
    return keyPeople;
  } catch (error) {
    console.warn('Crunchbase people fetch failed:', error);

    // Handle specific error cases
    if (error instanceof Error) {
      if (error.message.includes('429')) {
        console.warn('Crunchbase API quota exceeded - consider upgrading plan or implementing exponential backoff');
      } else if (error.message.includes('401') || error.message.includes('403')) {
        console.warn('Crunchbase API authentication failed - check CRUNCHBASE_API_KEY');
      } else if (error.message.includes('timeout')) {
        console.warn('Crunchbase API request timed out - service may be slow');
      }
    }

    return [];
  }
}

async function fetchFromHunter(_companyName: string, website: string): Promise<KeyPerson[]> {
  try {
    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      return [];
    }

    const domain = website
      .replace(/^https?:\/\//, '')
      .replace(/^www\./, '')
      .split('/')[0];

    const url = `https://api.hunter.io/v2/domain-search?domain=${domain}&api_key=${apiKey}&limit=10`;

    const response = await fetchWithTimeout(url, {}, 10000);

    if (!response.ok) {
      throw new Error(`Hunter.io API error: ${response.status}`);
    }

    const data = await response.json();
    const people: KeyPerson[] = [];

    if (data.data && data.data.emails) {
      data.data.emails.forEach((emailData: { first_name?: string; last_name?: string; value?: string; position?: string }) => {
        if (emailData.first_name && emailData.last_name && emailData.value) {
          const name = `${emailData.first_name} ${emailData.last_name}`;
          const title = emailData.position || 'Unknown';

          people.push({
            name,
            position: title,
            email: emailData.value,
            department: determineDepartment(title),
          });
        }
      });
    }

    return people;
  } catch (error) {
    console.warn('Hunter.io fetch failed:', error);
    return [];
  }
}

/**
 * Verify email address using Hunter.io API with comprehensive error handling
 * Requirements: 2.2, 2.3, 4.4 - Email deliverability checking with confidence scoring
 */
export async function verifyEmailWithHunter(email: string): Promise<{
  email: string;
  isValid: boolean;
  confidence: number;
  result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  source: 'hunter' | 'fallback';
}> {
  try {
    // Basic format validation first
    if (!isValidEmail(email)) {
      return {
        email,
        isValid: false,
        confidence: 0,
        result: 'undeliverable',
        source: 'fallback',
      };
    }

    const apiKey = process.env.HUNTER_API_KEY;
    if (!apiKey) {
      console.warn('HUNTER_API_KEY not configured, using fallback validation');
      return {
        email,
        isValid: true,
        confidence: 0.5,
        result: 'unknown',
        source: 'fallback',
      };
    }

    try {
      const url = `https://api.hunter.io/v2/email-verifier?email=${encodeURIComponent(email)}&api_key=${apiKey}`;

      const response = await fetchWithTimeout(
        url,
        {
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'User-Agent': 'OutsourcingAnalyzer/1.0',
          },
        },
        10000 // 10 second timeout
      );

      if (!response.ok) {
        // Handle specific HTTP status codes
        if (response.status === 429) {
          console.warn('Hunter.io API rate limit exceeded, using fallback');
          return {
            email,
            isValid: true,
            confidence: 0.4,
            result: 'unknown',
            source: 'fallback',
          };
        }

        if (response.status === 401 || response.status === 403) {
          console.warn('Hunter.io API authentication failed, check API key');
          return {
            email,
            isValid: true,
            confidence: 0.3,
            result: 'unknown',
            source: 'fallback',
          };
        }

        if (response.status === 400) {
          console.warn('Hunter.io API bad request, invalid email format');
          return {
            email,
            isValid: false,
            confidence: 0,
            result: 'undeliverable',
            source: 'fallback',
          };
        }

        throw new Error(`Hunter.io API returned ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.data) {
        console.warn('Hunter.io API returned unexpected response format');
        return {
          email,
          isValid: true,
          confidence: 0.3,
          result: 'unknown',
          source: 'fallback',
        };
      }

      const verificationData = data.data;
      const result = verificationData.result as 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
      const score = verificationData.score || 0;
      const confidence = Math.max(0, Math.min(1, score / 100)); // Normalize to 0-1 range

      // Map Hunter.io results to our validation logic
      const isValid = result === 'deliverable' || (result === 'risky' && confidence > 0.6);

      console.log(`Hunter.io verification for ${email}: ${result} (confidence: ${confidence})`);

      return {
        email,
        isValid,
        confidence,
        result,
        source: 'hunter',
      };
    } catch (apiError) {
      console.warn('Hunter.io API request failed:', apiError);

      // Handle network errors gracefully
      if (apiError instanceof Error) {
        if (apiError.message.includes('timeout')) {
          console.warn('Hunter.io API timeout, using fallback validation');
        } else if (apiError.message.includes('ENOTFOUND') || apiError.message.includes('ECONNREFUSED')) {
          console.warn('Hunter.io API network error, using fallback validation');
        }
      }

      // Fallback to basic domain validation
      return await fallbackEmailValidation(email);
    }
  } catch (error) {
    console.warn('Email verification with Hunter.io failed:', error);
    return await fallbackEmailValidation(email);
  }
}

/**
 * Fallback email validation when Hunter.io is unavailable
 * Provides basic domain and format validation
 */
async function fallbackEmailValidation(email: string): Promise<{
  email: string;
  isValid: boolean;
  confidence: number;
  result: 'deliverable' | 'undeliverable' | 'risky' | 'unknown';
  source: 'hunter' | 'fallback';
}> {
  try {
    // Basic format validation
    if (!isValidEmail(email)) {
      return {
        email,
        isValid: false,
        confidence: 0,
        result: 'undeliverable',
        source: 'fallback',
      };
    }

    const domain = email.split('@')[1];
    if (!domain) {
      return {
        email,
        isValid: false,
        confidence: 0,
        result: 'undeliverable',
        source: 'fallback',
      };
    }

    // Check for common business domains (higher confidence)
    const businessDomains = [
      'gmail.com',
      'outlook.com',
      'yahoo.com',
      'hotmail.com',
      'company.com',
      'corp.com',
      'inc.com',
      'llc.com',
    ];

    const isBusinessDomain = !businessDomains.some((bd) => domain.toLowerCase().includes(bd.split('.')[0]));

    // Basic domain validation - check if domain has proper format
    const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9]?\.[a-zA-Z]{2,}$/;
    const hasValidDomainFormat = domainRegex.test(domain);

    if (!hasValidDomainFormat) {
      return {
        email,
        isValid: false,
        confidence: 0.1,
        result: 'undeliverable',
        source: 'fallback',
      };
    }

    // Assign confidence based on domain characteristics
    let confidence = 0.5; // Base confidence for valid format

    if (isBusinessDomain) {
      confidence += 0.2; // Higher confidence for business domains
    }

    if (domain.includes('.com') || domain.includes('.org') || domain.includes('.net')) {
      confidence += 0.1; // Slight boost for common TLDs
    }

    // Cap confidence at reasonable level for fallback validation
    confidence = Math.min(confidence, 0.7);

    return {
      email,
      isValid: true,
      confidence,
      result: confidence > 0.6 ? 'deliverable' : 'unknown',
      source: 'fallback',
    };
  } catch (error) {
    console.warn('Fallback email validation failed:', error);
    return {
      email,
      isValid: false,
      confidence: 0,
      result: 'undeliverable',
      source: 'fallback',
    };
  }
}

/**
 * Enhanced email prediction with verification integration
 * Returns verified emails when available, fallback to predicted patterns
 * Requirements: 2.2, 2.3, 4.4
 */
export async function predictAndVerifyEmail(
  name: string,
  companyName: string,
  website?: string
): Promise<{
  email: string;
  isVerified: boolean;
  confidence: number;
  source: 'hunter' | 'fallback';
}> {
  try {
    const cleanedName = cleanNameForEmail(name);
    const domain = extractDomainFromWebsite(website) || generateDomainFromCompanyName(companyName);

    if (!cleanedName.firstName || !cleanedName.lastName) {
      // Fallback for single names or invalid names
      const safeName = name
        .toLowerCase()
        .replace(/[^a-z\s]/g, '')
        .replace(/\s+/g, '.');
      const fallbackEmail = `${safeName}@${domain}`;

      return {
        email: fallbackEmail,
        isVerified: false,
        confidence: 0.3,
        source: 'fallback',
      };
    }

    // Generate email pattern variations as specified in requirements
    const patterns = generateEmailPatterns(cleanedName.firstName, cleanedName.lastName, domain);

    // Try to verify each pattern, starting with most common
    for (const pattern of patterns) {
      const verification = await verifyEmailWithHunter(pattern);

      if (verification.source === 'hunter' && verification.isValid && verification.confidence > 0.6) {
        // Found a verified email with good confidence
        return {
          email: pattern,
          isVerified: true,
          confidence: verification.confidence,
          source: 'hunter',
        };
      }
    }

    // If no pattern was verified with high confidence, return the most likely pattern
    const bestPattern = patterns[0]; // firstname.lastname@domain.com
    const finalVerification = await verifyEmailWithHunter(bestPattern);

    return {
      email: bestPattern,
      isVerified: finalVerification.source === 'hunter' && finalVerification.isValid,
      confidence: finalVerification.confidence,
      source: finalVerification.source,
    };
  } catch (error) {
    console.warn('Email prediction and verification failed:', error);

    // Ultimate fallback
    const fallbackEmail = predictEmail(name, companyName, website);
    return {
      email: fallbackEmail,
      isVerified: false,
      confidence: 0.3,
      source: 'fallback',
    };
  }
}

/**
 * Advanced deduplication logic to remove duplicate people across sources
 * Task 7: Implements sophisticated name matching and position comparison
 */
function deduplicatePeople(people: KeyPerson[]): KeyPerson[] {
  const uniquePeople: KeyPerson[] = [];

  people.forEach((person) => {
    const isDuplicate = uniquePeople.some((existing) => {
      // Exact name match (case insensitive)
      const exactNameMatch = person.name.toLowerCase().trim() === existing.name.toLowerCase().trim();

      // Similar name match (handles variations like "John Smith" vs "J. Smith")
      const nameSimilarity = calculateNameSimilarity(person.name, existing.name);

      // Position similarity (same person might have slightly different titles from different sources)
      const positionSimilarity = calculatePositionSimilarity(person.position, existing.position);

      // Consider it a duplicate if:
      // 1. Exact name match, OR
      // 2. High name similarity (>0.8) AND some position similarity (>0.3)
      return exactNameMatch || (nameSimilarity > 0.8 && positionSimilarity > 0.3);
    });

    if (!isDuplicate) {
      uniquePeople.push(person);
    } else {
      // If it's a duplicate, merge the information (keep the one with more complete data)
      const existingIndex = uniquePeople.findIndex((existing) => {
        const exactNameMatch = person.name.toLowerCase().trim() === existing.name.toLowerCase().trim();
        const nameSimilarity = calculateNameSimilarity(person.name, existing.name);
        const positionSimilarity = calculatePositionSimilarity(person.position, existing.position);
        return exactNameMatch || (nameSimilarity > 0.8 && positionSimilarity > 0.3);
      });

      if (existingIndex !== -1) {
        const existing = uniquePeople[existingIndex];
        // Merge data, preferring more complete information
        uniquePeople[existingIndex] = mergePeopleData(existing, person);
      }
    }
  });

  return uniquePeople;
}

/**
 * Calculate name similarity between two names
 * Returns a score between 0 and 1, where 1 is identical
 */
function calculateNameSimilarity(name1: string, name2: string): number {
  const clean1 = name1
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '');
  const clean2 = name2
    .toLowerCase()
    .trim()
    .replace(/[^a-z\s]/g, '');

  if (clean1 === clean2) return 1.0;

  const words1 = clean1.split(/\s+/).filter((w) => w.length > 0);
  const words2 = clean2.split(/\s+/).filter((w) => w.length > 0);

  if (words1.length === 0 || words2.length === 0) return 0;

  // Check for initials match (e.g., "J. Smith" vs "John Smith")
  const hasInitialMatch = words1.some((w1) =>
    words2.some((w2) => (w1.length === 1 && w2.startsWith(w1)) || (w2.length === 1 && w1.startsWith(w2)))
  );

  // Count matching words
  const matchingWords = words1.filter((w1) => words2.some((w2) => w1 === w2 || w1.startsWith(w2) || w2.startsWith(w1))).length;

  const maxWords = Math.max(words1.length, words2.length);
  const wordMatchScore = matchingWords / maxWords;

  // Boost score if there's an initial match
  return hasInitialMatch ? Math.min(1.0, wordMatchScore + 0.3) : wordMatchScore;
}

/**
 * Calculate position similarity between two job titles
 * Returns a score between 0 and 1, where 1 is very similar
 */
function calculatePositionSimilarity(pos1: string, pos2: string): number {
  const clean1 = pos1.toLowerCase().trim();
  const clean2 = pos2.toLowerCase().trim();

  if (clean1 === clean2) return 1.0;

  // Common executive title variations
  const executiveTitles = ['ceo', 'chief executive', 'president', 'founder'];
  const techTitles = ['cto', 'chief technology', 'vp engineering', 'head of engineering'];
  const financeTitles = ['cfo', 'chief financial', 'vp finance', 'head of finance'];
  const operationsTitles = ['coo', 'chief operating', 'vp operations', 'head of operations'];

  const titleGroups = [executiveTitles, techTitles, financeTitles, operationsTitles];

  // Check if both positions belong to the same category
  for (const group of titleGroups) {
    const pos1InGroup = group.some((title) => clean1.includes(title));
    const pos2InGroup = group.some((title) => clean2.includes(title));

    if (pos1InGroup && pos2InGroup) {
      return 0.8; // High similarity for same category
    }
  }

  // Check for common words in positions
  const words1 = clean1.split(/\s+/);
  const words2 = clean2.split(/\s+/);
  const commonWords = words1.filter((w) => words2.includes(w) && w.length > 2);

  if (commonWords.length > 0) {
    return Math.min(0.6, commonWords.length * 0.2);
  }

  return 0;
}

/**
 * Merge data from two person records, keeping the most complete information
 */
function mergePeopleData(existing: KeyPerson, newPerson: KeyPerson): KeyPerson {
  return {
    // Use the longer/more complete name
    name: newPerson.name.length > existing.name.length ? newPerson.name : existing.name,

    // Use the more detailed position
    position: newPerson.position.length > existing.position.length ? newPerson.position : existing.position,

    // Prefer verified emails over predicted ones
    email: newPerson.email && !newPerson.email.includes('predicted') ? newPerson.email : existing.email,

    // Keep LinkedIn URL if available
    linkedin: newPerson.linkedin || existing.linkedin,

    // Use the more specific department
    department: newPerson.department !== 'Operations' ? newPerson.department : existing.department,
  };
}

/**
 * Enhance people data with email prediction for those without emails
 * Task 7: Email prediction integration
 */
async function enhanceWithEmailPrediction(people: KeyPerson[], companyName: string, website?: string): Promise<KeyPerson[]> {
  const enhancedPeople: KeyPerson[] = [];

  for (const person of people) {
    const enhancedPerson = { ...person };

    // Only predict email if person doesn't have one or has a placeholder
    if (!person.email || person.email.includes('predicted') || person.email.includes('example')) {
      try {
        const emailResult = await predictAndVerifyEmail(person.name, companyName, website);
        enhancedPerson.email = emailResult.email;

        if (emailResult.isVerified) {
          console.log(`Verified email for ${person.name}: ${emailResult.email} (confidence: ${emailResult.confidence})`);
        }
      } catch (error) {
        console.warn(`Failed to predict email for ${person.name}:`, error);
        // Keep existing email or use basic prediction
        enhancedPerson.email = person.email || predictEmail(person.name, companyName, website);
      }
    }

    enhancedPeople.push(enhancedPerson);
  }

  return enhancedPeople;
}

/**
 * Sort people by priority: Executive positions first, then by department importance
 * Task 7: Prioritization for top 5 selection
 */
function sortPeopleByPriority(people: KeyPerson[]): KeyPerson[] {
  const departmentOrder = ['Executive', 'Technology', 'Finance', 'Operations', 'Marketing', 'Sales'];

  return people.sort((a, b) => {
    // First, sort by department priority
    const aDeptIndex = departmentOrder.indexOf(a.department);
    const bDeptIndex = departmentOrder.indexOf(b.department);
    const aDeptPriority = aDeptIndex === -1 ? 999 : aDeptIndex;
    const bDeptPriority = bDeptIndex === -1 ? 999 : bDeptIndex;

    if (aDeptPriority !== bDeptPriority) {
      return aDeptPriority - bDeptPriority;
    }

    // Within same department, prioritize by position seniority
    const seniorityScore = (position: string): number => {
      const pos = position.toLowerCase();
      if (pos.includes('ceo') || pos.includes('chief executive') || pos.includes('president')) return 10;
      if (pos.includes('founder') || pos.includes('co-founder')) return 9;
      if (pos.includes('cto') || pos.includes('cfo') || pos.includes('coo')) return 8;
      if (pos.includes('chief')) return 7;
      if (pos.includes('vp') || pos.includes('vice president')) return 6;
      if (pos.includes('director')) return 5;
      if (pos.includes('head of') || pos.includes('lead')) return 4;
      if (pos.includes('manager')) return 3;
      if (pos.includes('senior')) return 2;
      return 1;
    };

    return seniorityScore(b.position) - seniorityScore(a.position);
  });
}

/**
 * Verify email address using various methods (legacy function, kept for compatibility)
 */
export async function verifyEmailAddress(email: string): Promise<{ isValid: boolean; confidence: number }> {
  const result = await verifyEmailWithHunter(email);
  return {
    isValid: result.isValid,
    confidence: result.confidence,
  };
}
