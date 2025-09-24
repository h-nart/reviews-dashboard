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

Core REST API for property reviews and Hostaway integration (`server/index.js`):

#### `GET /` - Health check
```bash
curl http://localhost:3001/
curl https://reviews-dashboard-ten.vercel.app/
```

#### `GET /api/properties/summary` - Property analytics
```bash
curl http://localhost:3001/api/properties/summary
curl https://reviews-dashboard-ten.vercel.app/api/properties/summary
```

#### `GET /api/properties/:propertyId/public-reviews` - Public reviews
```bash
curl http://localhost:3001/api/properties/123456/public-reviews
```

#### `PUT /api/reviews/:reviewId/approval` - Update approval status
```bash
curl -X PUT http://localhost:3001/api/reviews/7453/approval \
  -H "Content-Type: application/json" \
  -d '{"isApproved": true}'
```

#### `GET /api/filter-options` - Dashboard filter options
```bash
curl http://localhost:3001/api/filter-options
```

#### `GET /api/reviews/hostaway` - Fetch Hostaway reviews
```bash
curl "http://localhost:3001/api/reviews/hostaway?type=guest-to-host&limit=10"
```

#### `GET /api/reviews/hostaway/:id` - Single review by ID
```bash
curl http://localhost:3001/api/reviews/hostaway/7453
```

### Key Features
- **Data Normalization**: 10-point → 5-point rating scale (0.5 rounds up)
- **OAuth2 Token Management**: Automatic refresh with 24-month lifecycle
- **Filtering**: By type, status, property, channel, approval status, date range
- **Pagination**: Limit/offset support for large datasets

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
