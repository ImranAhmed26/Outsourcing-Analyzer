import { fetchKeyPeople, extractDepartment, getDemoKeyPeople } from '../enhanced-apis';

// Mock the fetchWithTimeout function
jest.mock('../external-apis', () => ({
  fetchWithTimeout: jest.fn(),
  createExternalApiError: jest.fn((service, message, status) => new Error(`${service}: ${message} (${status})`)),
}));

describe('Enhanced APIs - LinkedIn Integration', () => {
  const { fetchWithTimeout: mockFetchWithTimeout } = jest.requireMock('../external-apis');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables
    delete process.env.RAPIDAPI_KEY;
    delete process.env.HUNTER_API_KEY;
  });

  describe('fetchLinkedInPeople via RapidAPI', () => {
    it('should return empty array when RAPIDAPI_KEY is not configured', async () => {
      const result = await fetchKeyPeople('Test Company');

      // Should still work but without LinkedIn data
      expect(Array.isArray(result)).toBe(true);
    });

    it('should successfully fetch and parse LinkedIn people data', async () => {
      // Set up environment
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      // Mock successful LinkedIn API response
      const mockLinkedInResponse = {
        data: [
          {
            name: 'John Smith',
            headline: 'CEO at Test Company',
            profileUrl: 'https://linkedin.com/in/johnsmith',
            company: 'Test Company',
          },
          {
            name: 'Jane Doe',
            headline: 'CTO at Test Company',
            profileUrl: 'https://linkedin.com/in/janedoe',
            company: 'Test Company',
          },
        ],
      };

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockLinkedInResponse),
      });

      const result = await fetchKeyPeople('Test Company');

      expect(mockFetchWithTimeout).toHaveBeenCalledWith(
        expect.stringContaining('linkedin-api8.p.rapidapi.com/search/people'),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-RapidAPI-Key': 'test-rapidapi-key',
            'X-RapidAPI-Host': 'linkedin-api8.p.rapidapi.com',
          }),
        }),
        10000
      );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('name');
      expect(result[0]).toHaveProperty('position');
      expect(result[0]).toHaveProperty('email');
      expect(result[0]).toHaveProperty('department');
    });

    it('should handle LinkedIn API errors gracefully', async () => {
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      // Mock API error
      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
      });

      const result = await fetchKeyPeople('Test Company');

      // Should not throw error, should return empty array or fallback data
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle network timeouts', async () => {
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      // Mock timeout error
      mockFetchWithTimeout.mockRejectedValueOnce(new Error('Request timeout'));

      const result = await fetchKeyPeople('Test Company');

      // Should handle timeout gracefully
      expect(Array.isArray(result)).toBe(true);
    });

    it('should parse different LinkedIn API response formats', async () => {
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      // Test different response structure
      const mockResponse = {
        elements: [
          {
            fullName: 'Alice Johnson',
            currentPosition: 'VP Engineering at Test Company',
            publicProfileUrl: 'https://linkedin.com/in/alicejohnson',
            currentCompany: 'Test Company',
          },
        ],
      };

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchKeyPeople('Test Company');

      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0].name).toBe('Alice Johnson');
        expect(result[0].position).toBe('VP Engineering at Test Company');
        expect(result[0].linkedin).toBe('https://linkedin.com/in/alicejohnson');
      }
    });

    it('should filter results by company relevance', async () => {
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      const mockResponse = {
        data: [
          {
            name: 'Relevant Person',
            headline: 'Manager at Test Company',
            company: 'Test Company',
          },
          {
            name: 'Irrelevant Person',
            headline: 'Developer at Other Company',
            company: 'Other Company',
          },
        ],
      };

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchKeyPeople('Test Company');

      // Should prioritize company-relevant results
      expect(result.length).toBeGreaterThan(0);
      if (result.length > 0) {
        expect(result[0].name).toBe('Relevant Person');
      }
    });

    it('should assign correct departments based on job titles', async () => {
      process.env.RAPIDAPI_KEY = 'test-rapidapi-key';

      const mockResponse = {
        data: [
          {
            name: 'CEO Person',
            headline: 'Chief Executive Officer at Test Company',
            company: 'Test Company',
          },
          {
            name: 'Tech Person',
            headline: 'Software Engineer at Test Company',
            company: 'Test Company',
          },
        ],
      };

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockResponse),
      });

      const result = await fetchKeyPeople('Test Company');

      expect(result.length).toBeGreaterThan(0);

      const ceo = result.find((p) => p.name === 'CEO Person');
      const engineer = result.find((p) => p.name === 'Tech Person');

      if (ceo) expect(ceo.department).toBe('Executive');
      if (engineer) expect(engineer.department).toBe('Technology');
    });
  });
});

describe('Demo Data Fallback', () => {
  const { fetchWithTimeout: mockFetchWithTimeout } = jest.requireMock('../external-apis');

  beforeEach(() => {
    jest.clearAllMocks();
    // Ensure no API keys are set to force demo data usage
    delete process.env.RAPIDAPI_KEY;
    delete process.env.CRUNCHBASE_API_KEY;
    delete process.env.HUNTER_API_KEY;
  });

  it('should return demo data when all APIs fail', async () => {
    // Mock all API calls to fail
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Test Company', 'https://testcompany.com');

    // Should return demo data instead of empty array
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);

    // Verify demo data structure
    result.forEach((person) => {
      expect(person).toHaveProperty('name');
      expect(person).toHaveProperty('position');
      expect(person).toHaveProperty('email');
      expect(person).toHaveProperty('department');
      expect(typeof person.name).toBe('string');
      expect(typeof person.position).toBe('string');
      expect(typeof person.email).toBe('string');
      expect(typeof person.department).toBe('string');
      expect(person.name.length).toBeGreaterThan(0);
      expect(person.position.length).toBeGreaterThan(0);
      expect(person.email.length).toBeGreaterThan(0);
    });
  });

  it('should return demo data when no real data is found', async () => {
    // Mock APIs to return empty results
    mockFetchWithTimeout.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ data: [] }),
    });

    const result = await fetchKeyPeople('Test Company', 'https://testcompany.com');

    // Should return demo data
    expect(result.length).toBeGreaterThanOrEqual(3);
    expect(result.length).toBeLessThanOrEqual(5);
  });

  it('should use company domain in demo emails when website provided', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Test Company', 'https://testcompany.com');

    // All demo emails should use the company domain
    result.forEach((person) => {
      expect(person.email).toContain('@testcompany.com');
    });
  });

  it('should generate domain from company name when no website provided', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Acme Corp');

    // Should generate domain from company name
    result.forEach((person) => {
      expect(person.email).toContain('@acme');
    });
  });

  it('should include realistic executive positions in demo data', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Test Company');

    // Should include typical executive positions
    const positions = result.map((p) => p.position.toLowerCase());
    const hasExecutive = positions.some(
      (pos) => pos.includes('ceo') || pos.includes('chief executive') || pos.includes('cto') || pos.includes('chief technology')
    );

    expect(hasExecutive).toBe(true);
  });

  it('should assign correct departments to demo executives', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Test Company');

    // Verify department assignments are correct
    result.forEach((person) => {
      const expectedDepartment = extractDepartment(person.position);
      expect(person.department).toBe(expectedDepartment);
    });
  });

  it('should include LinkedIn profiles for some demo executives', async () => {
    mockFetchWithTimeout.mockRejectedValue(new Error('Network error'));

    const result = await fetchKeyPeople('Test Company');

    // Some demo executives should have LinkedIn profiles
    const hasLinkedIn = result.some((person) => person.linkedin && person.linkedin.includes('linkedin.com'));
    expect(hasLinkedIn).toBe(true);
  });
});

describe('extractDepartment', () => {
  it('should classify executive positions correctly', () => {
    expect(extractDepartment('CEO')).toBe('Executive');
    expect(extractDepartment('Chief Executive Officer')).toBe('Executive');
    expect(extractDepartment('President')).toBe('Executive');
    expect(extractDepartment('Founder')).toBe('Executive');
    expect(extractDepartment('Co-Founder')).toBe('Executive');
    expect(extractDepartment('Chief Technology Officer')).toBe('Executive');
    expect(extractDepartment('Chief Financial Officer')).toBe('Executive');
  });

  it('should classify technology positions correctly', () => {
    expect(extractDepartment('Software Engineer')).toBe('Technology');
    expect(extractDepartment('Developer')).toBe('Technology');
    expect(extractDepartment('CTO')).toBe('Technology');
    expect(extractDepartment('Tech Lead')).toBe('Technology');
    expect(extractDepartment('Software Architect')).toBe('Technology');
    expect(extractDepartment('Programmer')).toBe('Technology');
    expect(extractDepartment('Product Manager')).toBe('Technology');
    expect(extractDepartment('UX Designer')).toBe('Technology');
    expect(extractDepartment('UI Developer')).toBe('Technology');
  });

  it('should classify sales positions correctly', () => {
    expect(extractDepartment('Sales Manager')).toBe('Sales');
    expect(extractDepartment('Business Development')).toBe('Sales');
    expect(extractDepartment('Account Manager')).toBe('Sales');
    expect(extractDepartment('Revenue Operations')).toBe('Sales');
    expect(extractDepartment('Partnership Manager')).toBe('Sales');
  });

  it('should classify marketing positions correctly', () => {
    expect(extractDepartment('Marketing Manager')).toBe('Marketing');
    expect(extractDepartment('Growth Manager')).toBe('Marketing');
    expect(extractDepartment('Brand Manager')).toBe('Marketing');
    expect(extractDepartment('Communications Director')).toBe('Marketing');
    expect(extractDepartment('Content Manager')).toBe('Marketing');
    expect(extractDepartment('Digital Marketing')).toBe('Marketing');
  });

  it('should default to Operations for unrecognized positions', () => {
    expect(extractDepartment('Office Manager')).toBe('Operations');
    expect(extractDepartment('HR Manager')).toBe('Operations');
    expect(extractDepartment('Administrative Assistant')).toBe('Operations');
    expect(extractDepartment('Unknown Position')).toBe('Operations');
  });

  it('should handle edge cases gracefully', () => {
    expect(extractDepartment('')).toBe('Operations');
    expect(extractDepartment(null as any)).toBe('Operations');
    expect(extractDepartment(undefined as any)).toBe('Operations');
    expect(extractDepartment('   ')).toBe('Operations');
  });

  it('should be case insensitive', () => {
    expect(extractDepartment('ceo')).toBe('Executive');
    expect(extractDepartment('SOFTWARE ENGINEER')).toBe('Technology');
    expect(extractDepartment('Sales Manager')).toBe('Sales');
    expect(extractDepartment('MARKETING DIRECTOR')).toBe('Marketing');
  });

  it('should handle positions with extra whitespace', () => {
    expect(extractDepartment('  CEO  ')).toBe('Executive');
    expect(extractDepartment('\tSoftware Engineer\n')).toBe('Technology');
  });
});
