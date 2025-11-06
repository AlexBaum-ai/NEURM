import request from 'supertest';
import app from '@/app';

/**
 * SPRINT-11-008: Integration Tests for Glossary API
 *
 * Test Coverage:
 * - GET /api/v1/glossary - Get all terms (A-Z)
 * - GET /api/v1/glossary/:slug - Get term details
 * - GET /api/v1/glossary/search?q=... - Search terms
 * - Category filtering
 * - Related terms linking
 * - Alphabetical ordering
 */

describe('Glossary API', () => {
  describe('GET /api/v1/glossary', () => {
    it('should return all glossary terms', async () => {
      const response = await request(app)
        .get('/api/v1/glossary')
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return terms in alphabetical order', async () => {
      const response = await request(app)
        .get('/api/v1/glossary')
        .expect(200);

      const terms = response.body.data;

      for (let i = 0; i < terms.length - 1; i++) {
        const term1 = terms[i].term.toLowerCase();
        const term2 = terms[i + 1].term.toLowerCase();
        expect(term1.localeCompare(term2)).toBeLessThanOrEqual(0);
      }
    });

    it('should filter by category', async () => {
      const response = await request(app)
        .get('/api/v1/glossary?category=Models')
        .expect(200);

      response.body.data.forEach((term: any) => {
        expect(term.category).toBe('Models');
      });
    });

    it('should paginate results', async () => {
      const response = await request(app)
        .get('/api/v1/glossary?page=1&limit=20')
        .expect(200);

      expect(response.body).toHaveProperty('pagination');
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: expect.any(Number),
      });
    });

    it('should include term metadata', async () => {
      const response = await request(app)
        .get('/api/v1/glossary')
        .expect(200);

      if (response.body.data.length > 0) {
        const firstTerm = response.body.data[0];
        expect(firstTerm).toMatchObject({
          id: expect.any(Number),
          slug: expect.any(String),
          term: expect.any(String),
          briefDefinition: expect.any(String),
          category: expect.any(String),
        });
      }
    });
  });

  describe('GET /api/v1/glossary/:slug', () => {
    it('should return term details', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toMatchObject({
        slug: 'attention-mechanism',
        term: expect.any(String),
        definition: expect.any(String),
        category: expect.any(String),
      });
    });

    it('should include full definition', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      expect(response.body.data).toHaveProperty('definition');
      expect(response.body.data.definition.length).toBeGreaterThan(50);
    });

    it('should include examples', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      expect(response.body.data).toHaveProperty('examples');
      expect(Array.isArray(response.body.data.examples)).toBe(true);
    });

    it('should include related terms', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      expect(response.body.data).toHaveProperty('relatedTerms');
      expect(Array.isArray(response.body.data.relatedTerms)).toBe(true);
    });

    it('should return 404 for non-existent term', async () => {
      await request(app)
        .get('/api/v1/glossary/non-existent-term')
        .expect(404);
    });

    it('should increment view count', async () => {
      const firstResponse = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      const initialViewCount = firstResponse.body.data.viewCount;

      const secondResponse = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      const newViewCount = secondResponse.body.data.viewCount;
      expect(newViewCount).toBeGreaterThan(initialViewCount);
    });

    it('should include category badge', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      expect(response.body.data.category).toMatch(/Models|Techniques|Metrics|Tools|Concepts/);
    });
  });

  describe('GET /api/v1/glossary/search', () => {
    it('should search terms by query', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/search?q=attention')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should return relevant results', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/search?q=attention')
        .expect(200);

      response.body.data.forEach((term: any) => {
        const termLower = term.term.toLowerCase();
        const defLower = term.definition?.toLowerCase() || '';
        const queryMatches =
          termLower.includes('attention') || defLower.includes('attention');
        expect(queryMatches).toBe(true);
      });
    });

    it('should require search query', async () => {
      await request(app).get('/api/v1/glossary/search').expect(400);
    });

    it('should handle empty results', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/search?q=xyzabcnonexistent')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should search in term name and definition', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/search?q=transformer')
        .expect(200);

      // Should find terms with "transformer" in name or definition
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should be case-insensitive', async () => {
      const lowerCaseResponse = await request(app)
        .get('/api/v1/glossary/search?q=attention')
        .expect(200);

      const upperCaseResponse = await request(app)
        .get('/api/v1/glossary/search?q=ATTENTION')
        .expect(200);

      expect(lowerCaseResponse.body.data.length).toBe(
        upperCaseResponse.body.data.length
      );
    });

    it('should limit search results', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/search?q=model&limit=5')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(5);
    });
  });

  describe('Alphabet Navigation', () => {
    it('should group terms by first letter', async () => {
      const response = await request(app)
        .get('/api/v1/glossary')
        .expect(200);

      const terms = response.body.data;

      // Group by first letter
      const grouped: { [key: string]: any[] } = {};
      terms.forEach((term: any) => {
        const firstLetter = term.term[0].toUpperCase();
        if (!grouped[firstLetter]) {
          grouped[firstLetter] = [];
        }
        grouped[firstLetter].push(term);
      });

      // Each group should be alphabetically sorted
      Object.values(grouped).forEach(group => {
        for (let i = 0; i < group.length - 1; i++) {
          expect(group[i].term.toLowerCase()).toBeLessThanOrEqual(
            group[i + 1].term.toLowerCase()
          );
        }
      });
    });

    it('should filter by starting letter', async () => {
      const response = await request(app)
        .get('/api/v1/glossary?letter=A')
        .expect(200);

      response.body.data.forEach((term: any) => {
        expect(term.term[0].toUpperCase()).toBe('A');
      });
    });
  });

  describe('Popular Terms', () => {
    it('should return popular terms', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/popular')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should sort by view count', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/popular')
        .expect(200);

      const terms = response.body.data;

      for (let i = 0; i < terms.length - 1; i++) {
        expect(terms[i].viewCount).toBeGreaterThanOrEqual(terms[i + 1].viewCount);
      }
    });

    it('should limit popular terms', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/popular?limit=10')
        .expect(200);

      expect(response.body.data.length).toBeLessThanOrEqual(10);
    });
  });

  describe('Related Terms', () => {
    it('should return related term details', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      const relatedTerms = response.body.data.relatedTerms;

      if (relatedTerms.length > 0) {
        relatedTerms.forEach((related: any) => {
          expect(related).toMatchObject({
            id: expect.any(Number),
            slug: expect.any(String),
            term: expect.any(String),
          });
        });
      }
    });

    it('should link to valid related terms', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/attention-mechanism')
        .expect(200);

      const relatedTerms = response.body.data.relatedTerms;

      // Verify each related term exists
      for (const related of relatedTerms) {
        const relatedResponse = await request(app)
          .get(`/api/v1/glossary/${related.slug}`)
          .expect(200);

        expect(relatedResponse.body.data.id).toBe(related.id);
      }
    });
  });

  describe('Categories', () => {
    it('should return available categories', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/categories')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(Array.isArray(response.body.data)).toBe(true);
    });

    it('should include term counts per category', async () => {
      const response = await request(app)
        .get('/api/v1/glossary/categories')
        .expect(200);

      response.body.data.forEach((category: any) => {
        expect(category).toMatchObject({
          name: expect.any(String),
          count: expect.any(Number),
        });
      });
    });
  });
});
