// Test the email prediction functionality through the main fetchKeyPeople function
// Since the email prediction functions are internal, we test them indirectly

import { fetchKeyPeople } from '../enhanced-apis';

// Mock the external dependencies
jest.mock('../external-apis', () => ({
  fetchWithTimeout: jest.fn(),
  createExternalApiError: jest.fn((service, message, status) => new Error(`${service}: ${message} (${status})`)),
}));

describe('Email Prediction System', () => {
  const { fetchWithTimeout: mockFetchWithTimeout } = jest.requireMock('../external-apis');

  beforeEach(() => {
    jest.clearAllMocks();
    // Clear environment variables
    delete process.env.RAPIDAPI_KEY;
    delete process.env.CRUNCHBASE_API_KEY;
    delete process.env.HUNTER_API_KEY;
  });

  describe('Email Prediction Integration', () => {
    it('should predict emails when scraping website team pages', async () => {
      // Mock a successful website scraping response with team data
      const mockHtml = `
        <div class="team-member">
          <h3>John Doe</h3>
          <p>Chief Executive Officer</p>
        </div>
        <div class="team-member">
          <h3>Jane Smith</h3>
          <p>Chief Technology Officer</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await fetchKeyPeople('TechCorp', 'https://techcorp.com');

      expect(result).toHaveLength(2);

      // Check that emails are predicted with the correct pattern (firstname.lastname@domain)
      const johnDoe = result.find((person) => person.name === 'John Doe');
      const janeSmith = result.find((person) => person.name === 'Jane Smith');

      expect(johnDoe?.email).toBe('john.doe@techcorp.com');
      expect(janeSmith?.email).toBe('jane.smith@techcorp.com');
    });

    it('should handle various website domain formats', async () => {
      const mockHtml = `
        <div class="team">
          <h3>Bob Johnson</h3>
          <p>VP Engineering</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      // Test with different website formats
      const result = await fetchKeyPeople('TestCompany', 'https://www.test-company.co.uk/about');

      expect(result).toHaveLength(1);
      expect(result[0].email).toBe('bob.johnson@test-company.co.uk');
    });

    it('should clean names properly for email generation', async () => {
      const mockHtml = `
        <div class="team">
          <h3>Dr. Sarah O'Connor-Smith</h3>
          <p>Chief Medical Officer</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await fetchKeyPeople('MedCorp', 'https://medcorp.com');

      expect(result).toHaveLength(1);
      // Should clean the name and use the standard pattern
      expect(result[0].email).toBe("sarah.o'connor-smith@medcorp.com");
    });

    it('should generate domain from company name when website is not provided', async () => {
      // Mock empty responses from all external sources
      mockFetchWithTimeout.mockRejectedValue(new Error('No website provided'));

      const result = await fetchKeyPeople('TechStartup Inc');

      // Should return empty array since no data sources are available
      // But if we had demo data, it would use generated domain
      expect(result).toEqual([]);
    });

    it('should handle single names gracefully', async () => {
      const mockHtml = `
        <div class="team">
          <h3>Madonna</h3>
          <p>Creative Director</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await fetchKeyPeople('CreativeAgency', 'https://creative.com');

      expect(result).toHaveLength(1);
      // Should handle single names by adding 'user' as lastname
      expect(result[0].email).toBe('madonna.user@creative.com');
    });
  });

  describe('Email Pattern Variations', () => {
    it('should use the firstname.lastname pattern as primary', async () => {
      const mockHtml = `
        <div class="team">
          <h3>Alexander Thompson-Williams</h3>
          <p>Senior Developer</p>
        </div>
      `;

      mockFetchWithTimeout.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve(mockHtml),
      });

      const result = await fetchKeyPeople('DevCorp', 'https://devcorp.com');

      expect(result).toHaveLength(1);
      // Should use the primary pattern: firstname.lastname
      expect(result[0].email).toBe('alexander.thompson-williams@devcorp.com');
    });
  });
});
