const axios = require('axios');
const {hostawayMockResponse} = require('./dataService');
const TokenService = require('./tokenService');

class HostawayService {
  constructor() {
    this.accountId = process.env.HOSTAWAY_ACCOUNT_ID; // client_id
    this.apiKey = process.env.HOSTAWAY_API_KEY; // client_secret
    this.baseUrl = process.env.HOSTAWAY_API_URL || 'https://api.hostaway.com/v1';
    this.useMockData = process.env.USE_MOCK_DATA === 'true' || !this.apiKey || !this.accountId;
    
    // Initialize token service for token storage
    !this.useMockData && (this.tokenService = new TokenService());
    
    console.log(`Hostaway Service initialized - Mock Mode: ${this.useMockData}`);
  }

  // Store access token (uses database)
  async storeAccessToken(token) {
    await this.tokenService.storeToken(this.accountId, token);
  }

  async getStoredAccessToken() {
    return await this.tokenService.getValidToken(this.accountId);
  }

  async clearStoredAccessToken() {
    await this.tokenService.clearTokens(this.accountId);
  }

  async getAccessToken(forceRefresh = false) {
    if (this.useMockData) return null;
    
    try {
      // Step 1: Check if there is non-expired token
      if (!forceRefresh) {
        const storedToken = await this.getStoredAccessToken();
        if (storedToken) {
          // Step 2: If yes, use stored token
          return storedToken;
        }
      }
      
      // Step 3: If not, get new token using POST /accessTokens
      console.log('Requesting new access token from Hostaway API...');
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.accountId);
      params.append('client_secret', this.apiKey);
      params.append('scope', 'general');

      const response = await axios.post(`${this.baseUrl}/accessTokens`, params, {
        headers: {
          'Cache-control': 'no-cache',
          'Content-type': 'application/x-www-form-urlencoded'
        }
      });
      
      const accessToken = response.data.access_token;
      
      // Step 4: Store token
      await this.storeAccessToken(accessToken);
      
      return accessToken;
    } catch (error) {
      console.error('Failed to get Hostaway access token:', error.message);
      throw new Error('Authentication failed');
    }
  }

  async makeAuthenticatedRequest(method, url, data = null, params = null) {
    if (this.useMockData) {
      throw new Error('This method should not be called in mock mode');
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      };

      const config = {
        method,
        url,
        headers,
        ...(data && { data }),
        ...(params && { params })
      };

      return await axios(config);
    } catch (error) {
      // Step 5: Handle 403 errors by refreshing token
      if (error.response && error.response.status === 403) {
        console.log('Access denied (403) - refreshing token...');
        await this.clearStoredAccessToken();
        
        try {
          // Retry with fresh token
          const token = await this.getAccessToken(true); // Force refresh
          const headers = {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          };

          const config = {
            method,
            url,
            headers,
            ...(data && { data }),
            ...(params && { params })
          };

          return await axios(config);
        } catch (retryError) {
          console.error('Failed to retry request after token refresh:', retryError.message);
          throw retryError;
        }
      }
      
      throw error;
    }
  }

  async fetchReviews(options = {}) {
    if (this.useMockData) {
      console.log('Using mock data for reviews');
      return this.processMockReviews(options);
    }

    try {
      // Build query parameters
      const queryParams = {};
      if (options.listingId) queryParams.listingId = options.listingId;
      if (options.status) queryParams.status = options.status;
      if (options.type) queryParams.type = options.type;
      if (options.limit) queryParams.limit = options.limit;
      if (options.offset) queryParams.offset = options.offset;
      if (options.sortBy) queryParams.sortBy = options.sortBy;
      if (options.sortOrder) queryParams.sortOrder = options.sortOrder;

      const url = `${this.baseUrl}/reviews`;
      
      console.log(`Fetching reviews from Hostaway API: ${url}`);
      const response = await this.makeAuthenticatedRequest('GET', url, null, queryParams);
      
      return this.processApiReviews(response.data, options);
    } catch (error) {
      console.error('Failed to fetch reviews from Hostaway API:', error.message);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data');
      return this.processMockReviews(options);
    }
  }

  async fetchReviewById(reviewId) {
    if (this.useMockData) {
      console.log(`Using mock data for review ID: ${reviewId}`);
      return this.processMockReviewById(reviewId);
    }

    try {
      const url = `${this.baseUrl}/reviews/${reviewId}`;
      
      console.log(`Fetching single review from Hostaway API: ${url}`);
      const response = await this.makeAuthenticatedRequest('GET', url);
      
      return {
        status: 'success',
        result: response.data
        };
    } catch (error) {
      console.error(`Failed to fetch review ${reviewId} from Hostaway API:`, error.message);
      
      // If it's a 404, return a structured response
      if (error.response && error.response.status === 404) {
        return {
          status: 'error',
          error: 'Review not found',
          code: 404,
          result: null
        };
      }
      
      // For other errors, try fallback to mock data
      console.log('Falling back to mock data');
      return this.processMockReviewById(reviewId);
    }
  }

  processMockReviewById(reviewId) {
    const review = hostawayMockResponse.result.find(r => r.id === parseInt(reviewId));
    
    if (!review) {
      return {
        status: 'error',
        error: 'Review not found',
        code: 404,
        result: null
      };
    }

    return {
      status: 'success',
      result: review
    };
  }

  processMockReviews(options = {}) {
    let reviews = [...hostawayMockResponse.result];

    // Apply filters
    if (options.listingName) {
      reviews = reviews.filter(review => 
        review.listingName.toLowerCase().includes(options.listingName.toLowerCase())
      );
    }

    if (options.type) {
      reviews = reviews.filter(review => review.type === options.type);
    }

    if (options.status) {
      reviews = reviews.filter(review => review.status === options.status);
    }

    if (options.channel) {
      reviews = reviews.filter(review => review.channelId === parseInt(options.channel));
    }

    if (options.startDate && options.endDate) {
      const start = new Date(options.startDate);
      const end = new Date(options.endDate);
      reviews = reviews.filter(review => {
        const reviewDate = new Date(review.submittedAt);
        return reviewDate >= start && reviewDate <= end;
      });
    }

    // Apply sorting
    const sortBy = options.sortBy || 'submittedAt';
    const sortOrder = options.sortOrder || 'desc';
    
    reviews.sort((a, b) => {
      let comparison;
      
      switch (sortBy) {
        case 'submittedAt':
          comparison = new Date(a.submittedAt) - new Date(b.submittedAt);
          break;
        case 'rating':
          comparison = (a.rating || 0) - (b.rating || 0);
          break;
        case 'guestName':
          comparison = a.guestName.localeCompare(b.guestName);
          break;
        default:
          comparison = new Date(a.submittedAt) - new Date(b.submittedAt);
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    // Apply pagination
    const limit = options.limit || 50;
    const offset = options.offset || 0;
    const paginatedReviews = reviews.slice(offset, offset + limit);

    return {
      status: 'success',
      result: paginatedReviews,
      count: paginatedReviews.length,
      total: reviews.length,
      offset: offset,
      limit: limit
    };
  }

  processApiReviews(apiResponse, options = {}) {
    // Process real API response and normalize if needed
    return {
      ...apiResponse,
      result: apiResponse.result.map(review => ({
        ...review,
        // Add any additional processing here
      }))
    };
  }
}

module.exports = HostawayService;
