const fs = require('fs');
const path = require('path');

// Load JSON data files
const loadJSON = (filename) => {
  try {
    const filePath = path.join(__dirname, 'data', filename);
    const rawData = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error(`Error loading ${filename}:`, error.message);
    return null;
  }
};

// Load Hostaway data
const hostawayMockResponse = loadJSON('hostaway-reviews.json');

// Channel ID to Channel Name mapping
const channelMapping = {
  2018: 'airbnbOfficial',
  2002: 'homeaway',
  2005: 'bookingcom',
  2007: 'expedia',
  2009: 'homeawayical',
  2010: 'vrboical',
  2000: 'direct',
  2013: 'bookingengine',
  2015: 'customIcal',
  2016: 'tripadvisorical',
  2017: 'wordpress',
  2019: 'marriott',
  2020: 'partner',
  2021: 'gds',
  2022: 'google'
};


// Normalize Hostaway review to internal format
const normalizeHostawayReview = (hostawayReview) => {
  // Use API-provided listingMapId
  const listingMapId = hostawayReview.listingMapId;
  
  // Calculate average rating from categories, convert from 10-point to 5-point scale
  let averageRating = hostawayReview.rating;
  if (averageRating) {
    // Convert existing rating from 10-point to 5-point scale
    averageRating = Math.round((averageRating / 10) * 5); // Round to nearest integer
  } else if (hostawayReview.reviewCategory?.length > 0) {
    // Calculate from categories and convert to 5-point scale
    const totalRating = hostawayReview.reviewCategory.reduce((sum, cat) => sum + cat.rating, 0);
    const avgOut10 = totalRating / hostawayReview.reviewCategory.length;
    averageRating = Math.round((avgOut10 / 10) * 5); // Round to nearest integer
  }

  // Get channel name from channel ID
  const channelName = channelMapping[hostawayReview.channelId] || 'unknown';

  // Convert category ratings from 10-point to 5-point scale
  const convertedCategories = (hostawayReview.reviewCategory || []).map(cat => ({
    ...cat,
    rating: Math.round((cat.rating / 10) * 5) // Convert to 5-point scale, round to nearest integer
  }));


  return {
    id: hostawayReview.id,
    listingId: listingMapId,
    listingName: hostawayReview.listingName,
    guestName: hostawayReview.guestName,
    rating: averageRating,
    reviewDate: new Date(hostawayReview.submittedAt).toISOString(),
    channelId: hostawayReview.channelId,
    channel: channelName,
    comment: hostawayReview.publicReview,
    isApproved: hostawayReview.status === "published",
    type: hostawayReview.type,
    status: hostawayReview.status,
    reviewCategories: convertedCategories,
  };
};

// Get normalized reviews
const getNormalizedReviews = () => {
  if (!hostawayMockResponse?.result) {
    console.error('Hostaway mock response not loaded properly');
    return [];
  }
  return hostawayMockResponse.result.map(normalizeHostawayReview);
};

const getPublicReviews = (listingId = null) => {
  const normalized = getNormalizedReviews();
  let reviews = normalized.filter(review => review.isApproved);
  if (listingId) {
    reviews = reviews.filter(review => review.listingId === parseInt(listingId));
  }
  return reviews;
};

// Property summary data (simplified without grouping)
const getPropertySummary = () => {
  const normalized = getNormalizedReviews();
  const properties = {};
  
  normalized.forEach(review => {
    // Skip reviews without listingId
    if (!review.listingId) {
      return;
    }
    
    if (!properties[review.listingId]) {
      properties[review.listingId] = {
        listingId: review.listingId,
        listingName: review.listingName,
        totalReviews: 0,
        approvedReviews: 0,
        averageRating: 0,
        ratingDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        channelBreakdown: {},
        recentReviews: []
      };
    }
    
    const prop = properties[review.listingId];
    prop.totalReviews++;
    
    if (review.isApproved) {
      prop.approvedReviews++;
    }
    
    if (review.rating) {
      prop.ratingDistribution[review.rating]++;
    }
    
    if (!prop.channelBreakdown[review.channel]) {
      prop.channelBreakdown[review.channel] = 0;
    }
    prop.channelBreakdown[review.channel]++;
  });
  
  // Calculate averages
  Object.values(properties).forEach(prop => {
    const totalRating = Object.entries(prop.ratingDistribution)
      .reduce((sum, [rating, count]) => sum + (parseInt(rating) * count), 0);
    prop.averageRating = prop.totalReviews > 0 ? (totalRating / prop.totalReviews).toFixed(1) : 0;
    
    // Get recent reviews (last 5)
    prop.recentReviews = normalized
      .filter(review => review.listingId === prop.listingId)
      .sort((a, b) => new Date(b.reviewDate) - new Date(a.reviewDate))
      .slice(0, 5);
  });
  
  return Object.values(properties);
};

// Update review approval (for mock data)
const updateReviewApproval = (reviewId, isApproved) => {
  if (!hostawayMockResponse?.result) {
    return null;
  }
  
  const review = hostawayMockResponse.result.find(r => r.id === parseInt(reviewId));
  if (review) {
    review.status = isApproved ? 'published' : 'awaiting';
    return normalizeHostawayReview(review);
  }
  return null;
};

// Shared function to process and normalize Hostaway reviews data
const processHostawayReviews = (rawResponse) => {
  // Normalize the reviews to internal format
  const normalizedReviews = rawResponse.result.map(review => normalizeHostawayReview(review));
  
  // Group by listing for better organization
  const reviewsByListing = {};
  normalizedReviews.forEach(review => {
    const listingKey = review.listingName;
    if (!reviewsByListing[listingKey]) {
      reviewsByListing[listingKey] = [];
    }
    reviewsByListing[listingKey].push(review);
  });
  
  return {
    total: rawResponse.total,
    count: normalizedReviews.length,
    offset: rawResponse.offset,
    limit: rawResponse.limit,
    normalizedReviews: normalizedReviews,
    reviewsByListing: reviewsByListing
  };
};

module.exports = {
  hostawayMockResponse,
  channelMapping,
  normalizeHostawayReview,
  processHostawayReviews,
  getNormalizedReviews,
  getPublicReviews,
  getPropertySummary,
  updateReviewApproval
};