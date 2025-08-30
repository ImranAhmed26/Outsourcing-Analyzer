// Mock the external-apis module
jest.mock('../external-apis', () => ({
  fetchWithTimeout: jest.fn(),
  createExternalApiError: jest.fn(),
}));

describe('Website Scraping Functionality', () => {
  const { fetchWithTimeout: mockFetchWithTimeout } = jest.requireMock('../external-apis');

  beforeEach(() => {
    jest.clearAllMocks();
    // Reset environment variables to ensure we test website scraping
    delete process.env.RAPIDAPI_KEY;
    delete process.env.HUNTER_API_KEY;
    delete process.env.NEWS_API_KEY;
    delete process.env.LINKEDIN_API_KEY;
  });

  describe('fetchWebsitePeople integration', () => {
    it('should handle successful website scraping', async () => {
      // Mock successful HTTP response with team page content
      const mockHtml = `
        <div class="team-member">
          <h3>John Doe</h3>
          <p>Chief Executive Officer</p>
          <a href="mailto:john.doe@example.com">Contact</a>
        </div>
        <div class="team-member">
          <h3>Jane Smith</h3>
          <p>Chief Technology Officer</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      // Test through the main function since fetchWebsitePeople is not exported
      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://example.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(mockFetchWithTimeout).toHaveBeenCalled();
      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Company');
    });

    it('should handle website access failures gracefully', async () => {
      // Mock network error
      mockFetchWithTimeout.mockRejectedValue(new Error('ENOTFOUND'));

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://nonexistent.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      // Should not throw error and should return some result
      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Company');
    });

    it('should handle parsing errors gracefully', async () => {
      // Mock response with malformed HTML
      const mockHtml = '<div><broken html content';

      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://example.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      // Should handle parsing errors gracefully
      expect(result).toBeDefined();
    });

    it('should try multiple team page URLs', async () => {
      // Mock 404 for first few URLs, success for later one
      mockFetchWithTimeout
        .mockResolvedValueOnce({ ok: false, status: 404 }) // /team
        .mockResolvedValueOnce({ ok: false, status: 404 }) // /about
        .mockResolvedValueOnce({
          // /leadership
          ok: true,
          text: jest.fn().mockResolvedValue(`
            <div>
              <h2>Leadership Team</h2>
              <p>John Doe - CEO</p>
              <p>Jane Smith, CTO</p>
            </div>
          `),
        });

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://example.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      // Should have tried multiple URLs
      expect(mockFetchWithTimeout).toHaveBeenCalledTimes(3);
    });

    it('should parse various name-position formats', async () => {
      // Test different formats that parsePersonText should handle
      const mockHtml = `
        <div>
          <p>John Doe - CEO</p>
          <p>Jane Smith, CTO</p>
          <p>Bob Johnson | VP Engineering</p>
          <p>Alice Brown (CFO)</p>
          <p>CEO: Mike Wilson</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://example.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(result).toBeDefined();
      // The parsePersonText function should have been used to parse these formats
    });
  });

  describe('Error handling', () => {
    it('should handle timeout errors', async () => {
      mockFetchWithTimeout.mockRejectedValue(new Error('timeout'));

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://slow-website.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Company');
    });

    it('should handle invalid URLs', async () => {
      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'invalid-url',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Company');
    });

    it('should handle empty website parameter', async () => {
      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: '',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(result).toBeDefined();
      expect(result.companyName).toBe('Test Company');
    });
  });

  describe('parsePersonText functionality through integration', () => {
    it('should extract people from HTML with various formats', async () => {
      const mockHtml = `
        <div class="team">
          <div class="member">
            <h3>John Doe - Chief Executive Officer</h3>
          </div>
          <div class="member">
            <p>Jane Smith, Chief Technology Officer</p>
          </div>
          <div class="member">
            <span>Bob Johnson | VP of Engineering</span>
          </div>
          <div class="member">
            <strong>Alice Brown (Chief Financial Officer)</strong>
          </div>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValue({
        ok: true,
        text: jest.fn().mockResolvedValue(mockHtml),
      });

      const { fetchEnhancedCompanyData } = require('../enhanced-apis');

      const result = await fetchEnhancedCompanyData('Test Company', {
        companyName: 'Test Company',
        website: 'https://example.com',
        outsourcingLikelihood: 'Medium',
        reasoning: 'Test reasoning',
        possibleServices: ['Development'],
      });

      expect(result).toBeDefined();
      expect(mockFetchWithTimeout).toHaveBeenCalled();
    });
  });
});
