const axios = require('axios');
const { 
  hostawayMockResponse, 
  normalizeHostawayReview,
  getNormalizedReviews,
  getReviewsByProperty,
  getApprovedReviews,
  getPublicReviews
} = require('./dataService');

class HostawayService {
  constructor() {
    this.apiKey = process.env.HOSTAWAY_API_KEY;
    this.accountId = process.env.HOSTAWAY_ACCOUNT_ID;
    this.baseUrl = process.env.HOSTAWAY_API_URL || 'https://api.hostaway.com/v1';
    this.useMockData = process.env.USE_MOCK_DATA === 'true' || !this.apiKey;
    
    console.log(`Hostaway Service initialized - Mock Mode: ${this.useMockData}`);
  }

  async getAccessToken() {
    if (this.useMockData) return null;
    
    try {
      // In production, you might want to cache this token
      const response = await axios.post(`${this.baseUrl}/auth/token`, {
        grant_type: 'client_credentials',
        client_id: process.env.HOSTAWAY_CLIENT_ID,
        client_secret: process.env.HOSTAWAY_CLIENT_SECRET,
        scope: 'general'
      });
      
      return response.data.access_token;
    } catch (error) {
      console.error('Failed to get Hostaway access token:', error.message);
      throw new Error('Authentication failed');
    }
  }

  async fetchReviews(options = {}) {
    if (this.useMockData) {
      console.log('Using mock data for reviews');
      return this.processMockReviews(options);
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Account-Id': this.accountId,
        'Accept': 'application/json'
      };

      // Build query parameters
      const params = new URLSearchParams();
      if (options.listingId) params.append('listingId', options.listingId);
      if (options.status) params.append('status', options.status);
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit);
      if (options.offset) params.append('offset', options.offset);
      if (options.sortBy) params.append('sortBy', options.sortBy);
      if (options.sortOrder) params.append('sortOrder', options.sortOrder);

      const url = `${this.baseUrl}/reviews${params.toString() ? '?' + params.toString() : ''}`;
      
      console.log(`Fetching reviews from Hostaway API: ${url}`);
      const response = await axios.get(url, { headers });
      
      return this.processApiReviews(response.data, options);
    } catch (error) {
      console.error('Failed to fetch reviews from Hostaway API:', error.message);
      
      // Fallback to mock data if API fails
      console.log('Falling back to mock data');
      return this.processMockReviews(options);
    }
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
      let comparison = 0;
      
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

  async getReviewsForManager(filters = {}) {
    try {
      const options = {
        type: filters.type || undefined,
        status: filters.approved === 'true' ? 'published' : 
               filters.approved === 'false' ? 'awaiting' : undefined,
        channel: filters.channel !== 'all' ? filters.channel : undefined,
        listingName: filters.propertyId !== 'all' ? this.getListingNameFromPropertyId(filters.propertyId) : undefined,
        sortBy: filters.sortBy || 'submittedAt',
        sortOrder: filters.sortOrder || 'desc',
        limit: filters.limit || 50,
        offset: filters.offset || 0
      };

      const response = await this.fetchReviews(options);
      
      // Normalize the reviews to internal format
      const normalizedReviews = response.result.map(review => normalizeHostawayReview(review));
      
      return {
        ...response,
        result: normalizedReviews
      };
    } catch (error) {
      console.error('Error fetching reviews for manager:', error);
      throw error;
    }
  }

  async getPublicReviewsForProperty(propertyId) {
    try {
      const listingName = this.getListingNameFromPropertyId(propertyId);
      const options = {
        status: 'published',
        listingName: listingName,
        type: 'guest-to-host', // Only show guest reviews publicly
        sortBy: 'submittedAt',
        sortOrder: 'desc'
      };

      const response = await this.fetchReviews(options);
      
      // Normalize and filter for public display
      const normalizedReviews = response.result
        .map(review => normalizeHostawayReview(review))
        .filter(review => review.isPubliclyVisible);
      
      return normalizedReviews;
    } catch (error) {
      console.error('Error fetching public reviews:', error);
      throw error;
    }
  }

  getListingNameFromPropertyId(propertyId) {
    // Since we're not doing multi-unit grouping, just return the propertyId
    // as it should already be the listing name or derived from it
    return propertyId;
  }

  async updateReviewStatus(reviewId, status) {
    if (this.useMockData) {
      console.log(`Mock: Updating review ${reviewId} status to ${status}`);
      
      // Find and update in mock data
      const review = hostawayMockResponse.result.find(r => r.id === parseInt(reviewId));
      if (review) {
        review.status = status;
        return { success: true, review: normalizeHostawayReview(review) };
      }
      return { success: false, error: 'Review not found' };
    }

    try {
      const token = await this.getAccessToken();
      const headers = {
        'Authorization': `Bearer ${token}`,
        'X-Account-Id': this.accountId,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      };

      const response = await axios.put(
        `${this.baseUrl}/reviews/${reviewId}`,
        { status },
        { headers }
      );

      return { success: true, review: normalizeHostawayReview(response.data) };
    } catch (error) {
      console.error('Failed to update review status:', error.message);
      return { success: false, error: error.message };
    }
  }

  async getReviewStats() {
    try {
      const response = await this.fetchReviews({ limit: 1000 }); // Get all reviews for stats
      const normalizedReviews = response.result.map(review => normalizeHostawayReview(review));
      
      return this.calculateStats(normalizedReviews);
    } catch (error) {
      console.error('Error calculating review stats:', error);
      throw error;
    }
  }

  calculateStats(reviews) {
    const stats = {
      totalReviews: reviews.length,
      publishedReviews: reviews.filter(r => r.isApproved).length,
      pendingReviews: reviews.filter(r => !r.isApproved).length,
      averageRating: 0,
      ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      channelBreakdown: {},
      categoryBreakdown: {},
      recentReviews: reviews.slice(0, 5)
    };

    let totalRating = 0;
    let ratedReviews = 0;

    reviews.forEach(review => {
      // Rating distribution
      if (review.rating) {
        stats.ratingDistribution[review.rating]++;
        totalRating += review.rating;
        ratedReviews++;
      }

      // Channel breakdown
      const channel = review.channel || 'Unknown';
      stats.channelBreakdown[channel] = (stats.channelBreakdown[channel] || 0) + 1;

      // Category breakdown
      const category = review.category || 'Other';
      stats.categoryBreakdown[category] = (stats.categoryBreakdown[category] || 0) + 1;
    });

    stats.averageRating = ratedReviews > 0 ? (totalRating / ratedReviews).toFixed(1) : 0;

    return stats;
  }
}

module.exports = HostawayService;
