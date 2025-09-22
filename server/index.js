const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const { format } = require("date-fns");

// Load environment variables
require('dotenv').config();

const HostawayService = require("./hostawayService");

const {
  getNormalizedReviews,
  getReviewsByProperty,
  getApprovedReviews,
  getPublicReviews,
  updateReviewApproval,
  getPropertySummary
} = require("./dataService");

const app = express();
const port = process.env.PORT || 3001;

// Initialize Hostaway service
const hostawayService = new HostawayService();

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check
app.get("/", (req, res) => {
  res.json({ 
    message: "Flex Living Reviews Dashboard API", 
    status: "running",
    timestamp: new Date().toISOString(),
    hostaway: {
      mockMode: hostawayService.useMockData,
      message: hostawayService.useMockData ? "Using mock data" : "Connected to Hostaway API"
    }
  });
});


// Get property summary/analytics
app.get("/api/properties/summary", (req, res) => {
  try {
    const summary = getPropertySummary();
    res.json(summary);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch property summary", details: error.message });
  }
});

// Get public reviews for a specific property (for the public display page)
app.get("/api/properties/:propertyId/public-reviews", (req, res) => {
  try {
    const { propertyId } = req.params;
    const publicReviews = getPublicReviews(propertyId);
    
    res.json({
      propertyId,
      reviews: publicReviews,
      total: publicReviews.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch public reviews", details: error.message });
  }
});

// Update review approval status
app.put("/api/reviews/:reviewId/approval", (req, res) => {
  try {
    const { reviewId } = req.params;
    const { isApproved, isPubliclyVisible } = req.body;
    
    const updatedReview = updateReviewApproval(
      parseInt(reviewId), 
      isApproved, 
      isPubliclyVisible
    );
    
    if (updatedReview) {
      res.json({
        message: "Review approval status updated successfully",
        review: updatedReview
      });
    } else {
      res.status(404).json({ error: "Review not found" });
    }
  } catch (error) {
    res.status(500).json({ error: "Failed to update review approval", details: error.message });
  }
});

// Get available filter options (for dashboard UI)
app.get("/api/filter-options", (req, res) => {
  try {
    const normalizedReviews = getNormalizedReviews();
    const properties = [...new Set(normalizedReviews.map(r => ({ id: r.propertyId, name: r.propertyName })))];
    const channels = [...new Set(normalizedReviews.map(r => r.channel))];
    const categories = [...new Set(normalizedReviews.map(r => r.category))];
    const ratings = [1, 2, 3, 4, 5];
    
    res.json({
      properties,
      channels,
      categories,
      ratings
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch filter options", details: error.message });
  }
});

// Get Hostaway reviews (fetch and normalize)
app.get("/api/reviews/hostaway", async (req, res) => {
  try {
    const options = {
      listingName: req.query.listingName,
      type: req.query.type, // 'guest-to-host' or 'host-to-guest'
      status: req.query.status, // 'published', 'pending', 'rejected'
      channel: req.query.channel, // 'Airbnb', 'Booking.com', 'Direct'
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      sortBy: req.query.sortBy || 'submittedAt',
      sortOrder: req.query.sortOrder || 'desc',
      limit: req.query.limit ? parseInt(req.query.limit) : 50,
      offset: req.query.offset ? parseInt(req.query.offset) : 0
    };

    console.log('Fetching Hostaway reviews with options:', options);
    
    // Fetch raw reviews from Hostaway API (or mock data)
    const rawResponse = await hostawayService.fetchReviews(options);
    
    // Normalize the reviews to internal format
    const { normalizeHostawayReview } = require('./dataService');
    const normalizedReviews = rawResponse.result.map(review => normalizeHostawayReview(review));
    
    // Group by listing for better organization
    const reviewsByListing = {};
    normalizedReviews.forEach(review => {
      const listingKey = review.originalData.listingName;
      if (!reviewsByListing[listingKey]) {
        reviewsByListing[listingKey] = [];
      }
      reviewsByListing[listingKey].push(review);
    });
    
    res.json({
      status: 'success',
      message: `Fetched and normalized ${normalizedReviews.length} reviews from Hostaway`,
      data: {
        total: rawResponse.total,
        count: normalizedReviews.length,
        offset: rawResponse.offset,
        limit: rawResponse.limit,
        normalizedReviews: normalizedReviews,
        reviewsByListing: reviewsByListing,
        rawResponse: process.env.NODE_ENV === 'development' ? rawResponse : undefined // Include raw data only in dev
      }
    });
  } catch (error) {
    console.error("Error fetching Hostaway reviews:", error);
    res.status(500).json({ 
      error: "Failed to fetch Hostaway reviews", 
      details: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Something went wrong!" });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: "Route not found" });
});

app.listen(port, () => {
  console.log(`🚀 Flex Living Reviews Dashboard API running on port ${port}`);
  console.log(`📊 Hostaway Service: ${hostawayService.useMockData ? 'Mock Data Mode' : 'Live API Mode'}`);
  if (hostawayService.useMockData) {
    console.log(`   Mock reviews loaded: ${require('./dataService').hostawayMockResponse.result.length} Hostaway reviews`);
  }
  console.log(`   Normalized reviews: ${getNormalizedReviews().length} reviews across ${getPropertySummary().length} properties`);
  console.log(`🔗 Health check: http://localhost:${port}/`);
  console.log(`🔗 Hostaway API: http://localhost:${port}/api/reviews/hostaway`);
});