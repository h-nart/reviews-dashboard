# Reviews Dashboard

A full-stack web application for managing property reviews with integration to the Hostaway API. This project demonstrates modern React development, Node.js API design, database integration, and third-party API authentication patterns.

🌐 **Live Demo:** [https://reviews-dashboard-ten.vercel.app](https://reviews-dashboard-ten.vercel.app)

---

## 📚 Technical Documentation

### Tech Stack

#### Frontend
- **React 19** - Modern React with hooks and functional components
- **React Router DOM 6** - Client-side routing with SPA navigation
- **Radix UI** - Accessible, unstyled component primitives
  - Select, Dialog, Switch, Toast, Tooltip, Dropdown Menu, Tabs
- **Lucide React** - Modern icon library with consistent styling
- **Axios** - HTTP client with interceptors and error handling
- **Date-fns** - Lightweight date manipulation library

#### Backend
- **Node.js with Express 5** - RESTful API server
- **Axios** - HTTP client for external API integration
- **dotenv** - Environment variable management
- **CORS** - Cross-origin resource sharing middleware

#### Database
- **PostgreSQL** (via Supabase) - Relational database for token storage

#### Infrastructure
- **Vercel** - Serverless deployment platform
- **Monorepo structure** - Client and server in single repository

### Key Design and Logic Decisions

#### 1. Environment Configuration with REACT_APP_API_URL

The application uses environment-based API URL configuration to handle different deployment scenarios:

```javascript
// Client-side API configuration
const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001')
  .replace(/\/+$/, ''); // Remove trailing slashes

// Usage in components
axios.get(`${API_BASE_URL}/api/reviews/hostaway`)
```

**Design Rationale:** Allows the url to be configured to root `/` - useful for Vercel deployments where the `server` and `client` are deployed on one server.

#### 2. CategoryBreakdown Component Architecture

Created a reusable React component to eliminate code duplication between Manager Dashboard and Property Review Display:

```javascript
// Shared component for category breakdown dialogs
<CategoryBreakdown 
  isOpen={categoryDialogOpen}
  onOpenChange={setCategoryDialogOpen}
  categories={selectedReviewCategories}
  averageRating={averageRating}
/>
```

**Design Benefits:**
- **DRY principle** - Single source of truth for category display logic
- **Consistent UX** - Identical behavior across different views
- **Maintainability** - Changes propagate automatically to all usage locations
- **Radix UI integration** - Leverages accessible dialog primitives
  
**Note:** There are other areas of the code that could've benefited from similar refactoring, but time constraints limited the scope.

#### 3. Database Integration and Token Management

Implemented PostgreSQL-based token storage using Supabase with a simplified schema:

```sql
CREATE TABLE hostaway_tokens (
  client_id VARCHAR(255) PRIMARY KEY,
  token TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL
);
```

**Architecture Design:**
- **SupabaseService** - Generic database connection layer
- **TokenService** - Business logic for token CRUD operations  
- **HostawayService** - API client with automatic token refresh

#### 4. Hostaway API Token Generation and Management

Implemented OAuth2 Client Credentials flow following [Hostaway's authentication documentation](https://api.hostaway.com/documentation#working-with-authorization-token):

**Key Implementation Details:**
- **24-month token lifecycle** - Matches Hostaway's documented token expiration
- **Automatic refresh on 403** - Handles expired tokens
- **Database persistence** - Tokens survive server restarts and deployments

---

## 🌐 API Endpoints

The server provides a comprehensive REST API for managing property reviews and integrating with Hostaway. All endpoints are defined in `server/index.js`.

### Health Check

#### `GET /`
Health check endpoint that provides API status and configuration information.

```bash
# Local development
curl http://localhost:3001/

# Live demo
curl https://reviews-dashboard-ten.vercel.app/
```

**Response:**
```json
{
  "message": "Flex Living Reviews Dashboard API",
  "status": "running",
  "timestamp": "2024-09-24T15:30:00.000Z",
  "hostaway": {
    "mockMode": true,
    "message": "Using mock data"
  }
}
```

### Property Management

#### `GET /api/properties/summary`
Get summary analytics for all properties including total reviews, average ratings, and rating distributions.

```bash
# Local development
curl http://localhost:3001/api/properties/summary

# Live demo
curl https://reviews-dashboard-ten.vercel.app/api/properties/summary
```

**Response:**
```json
[
  {
    "listingId": 123456,
    "listingName": "Flex Living Downtown - Studio 1A",
    "totalReviews": 15,
    "averageRating": 4.2,
    "approvedReviews": 12,
    "pendingReviews": 3,
    "ratingDistribution": {
      "1": 0, "2": 1, "3": 2, "4": 5, "5": 7
    }
  }
]
```

#### `GET /api/properties/:propertyId/public-reviews`
Get public guest-to-host reviews for a specific property (customer-facing endpoint).

```bash
curl http://localhost:3001/api/properties/123456/public-reviews
```

**Response:**
```json
{
  "propertyId": "123456",
  "reviews": [
    {
      "id": 7453,
      "guestName": "John Smith",
      "rating": 5,
      "comment": "Amazing stay! The apartment was clean and modern.",
      "reviewDate": "2024-09-20T00:00:00.000Z",
      "reviewCategories": [
        {"category": "cleanliness", "rating": 5},
        {"category": "communication", "rating": 5}
      ],
      "channel": "Airbnb",
      "type": "guest-to-host",
      "isApproved": true
    }
  ],
  "total": 1
}
```

### Review Management

#### `PUT /api/reviews/:reviewId/approval`
Update the approval status of a review (manager dashboard functionality).

```bash
curl -X PUT http://localhost:3001/api/reviews/7453/approval \
  -H "Content-Type: application/json" \
  -d '{"isApproved": true}'
```

**Response:**
```json
{
  "message": "Review approval status updated successfully",
  "review": {
    "id": 7453,
    "guestName": "John Smith",
    "isApproved": true,
    "rating": 5,
    "listingName": "Flex Living Downtown - Studio 1A"
  }
}
```

### Filter Options

#### `GET /api/filter-options`
Get available filter options for the manager dashboard UI.

```bash
curl http://localhost:3001/api/filter-options
```

**Response:**
```json
{
  "properties": [
    {"id": 123456, "name": "Flex Living Downtown - Studio 1A"},
    {"id": 234567, "name": "Flex Living Midtown - 1BR 2A"}
  ],
  "channels": ["Airbnb", "Booking.com", "Direct"],
  "types": ["guest-to-host", "host-to-guest"],
  "ratings": [1, 2, 3, 4, 5]
}
```

### Hostaway API Integration

#### `GET /api/reviews/hostaway`
Fetch and normalize reviews from Hostaway API with optional filtering and pagination.

**Query Parameters:**
- `type` - `guest-to-host` or `host-to-guest`
- `status` - `published`, `awaiting`
- `limit` - Number of reviews to return
- `offset` - Number of reviews to skip (default: 0)

```bash
# Get all reviews
curl http://localhost:3001/api/reviews/hostaway

# Get reviews with filters
curl "http://localhost:3001/api/reviews/hostaway?type=guest-to-host&limit=10"

```

**Response:**
```json
{
  "status": "success",
  "message": "Fetched and normalized 25 reviews from Hostaway",
  "data": {
    "normalizedReviews": [
      {
        "id": 7453,
        "listingId": 123456,
        "listingName": "Flex Living Downtown - Studio 1A",
        "guestName": "John Smith",
        "rating": 5,
        "reviewCategories": [
          {"category": "cleanliness", "rating": 5},
          {"category": "communication", "rating": 5}
        ],
        "comment": "Amazing stay! The apartment was clean and modern.",
        "reviewDate": "2024-09-20T00:00:00.000Z",
        "channel": "Airbnb",
        "type": "guest-to-host",
        "isApproved": true
      }
    ],
    "count": 25,
    "pagination": {
      "limit": 50,
      "offset": 0,
      "total": 25
    }
  }
}
```

#### `GET /api/reviews/hostaway/:id`
Fetch a single review by ID from Hostaway API and return normalized data.

```bash
curl http://localhost:3001/api/reviews/hostaway/7453
```

**Response:**
```json
{
  "status": "success",
  "message": "Fetched and normalized review 7453",
  "data": {
    "review": {
      "id": 7453,
      "listingId": 123456,
      "listingName": "Flex Living Downtown - Studio 1A",
      "guestName": "John Smith",
      "rating": 5,
      "reviewCategories": [
        {"category": "cleanliness", "rating": 5},
        {"category": "communication", "rating": 5}
      ],
      "comment": "Amazing stay! The apartment was clean and modern.",
      "reviewDate": "2024-09-20T00:00:00.000Z",
      "channel": "Airbnb",
      "type": "guest-to-host",
      "isApproved": true
    }
  }
}
```

### Data Normalization

The API automatically normalizes Hostaway data:

**Raw Hostaway Data → Normalized Format:**
- **Rating Scale:** 10-point → 5-point (0.5 rounds up)
- **Property ID:** `listingMapId` → `listingId`
- **Categories:** All category ratings converted to 5-point scale
- **Average Rating:** Calculated from categories when `rating` is null
- **Date Format:** Standardized to ISO 8601

---

## 🔧 Configuration

### Environment Variables

```bash
# Hostaway API Configuration
HOSTAWAY_ACCOUNT_ID=your_account_id_here      # Used as client_id
HOSTAWAY_API_KEY=your_api_key_here            # Used as client_secret
USE_MOCK_DATA=true                            # Set to 'false' for live API

# Database Configuration
SUPABASE_URL=your_supabase_project_url
SUPABASE_ANON_KEY=your_supabase_anon_key

REACT_APP_API_URL=/                           # Allows Vercel to use run both client and server on same domain
```
---
## 🗺️ Google Places API Findings

Integration with Google Places API is feasible but was intentionally not implemented due to the reasons outlined below:

### Cost Implications
The primary constraint is that accessing the `rating` field would trigger the **Place Details Enterprise SKU** ([pricing details](https://developers.google.com/maps/billing-and-pricing/sku-details#place-details-ent-sku)), introducing additional costs beyond the scope of the current task.

### Technical Requirements
To integrate Google Places API, the following would be needed:

1. **Place ID Mapping**: The API requires a `place_id`. Integration would need mapping between `place_id` and `listingId`; Ideally we want both IDs persisting in our database.

2. **Data Normalization**: Google Places review data would need normalization to be uniform with what the frontend expects, similar to the Hostaway data transformation already implemented.

### Implementation Decision
I considered implementing the integration with mock data. However, this would have largely duplicated what has already been done with Hostaway mock data and would not add meaningful value to the assessment. Instead, I prioritized focusing on other areas of improvement that deliver immediate and demonstrable value within the scope of this project.
