import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import * as Select from '@radix-ui/react-select';
import * as Switch from '@radix-ui/react-switch';
import * as Toast from '@radix-ui/react-toast';
import * as Tooltip from '@radix-ui/react-tooltip';
import CategoryBreakdown from './CategoryBreakdown';
import {
  Star,
  Filter,
  Search,
  Eye,
  EyeOff,
  CheckCircle,
  XCircle,
  Calendar,
  MapPin,
  MessageSquare,
  BarChart3,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import './ManagerDashboard.css';
import '../styles/radix.css';
import flexLogo from '../assets/images/logo.webp'; // Add your logo import

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

const ManagerDashboard = () => {
  const [reviews, setReviews] = useState([]);
  const [filteredReviews, setFilteredReviews] = useState([]);
  const [propertySummary, setPropertySummary] = useState([]);
  const [filterOptions, setFilterOptions] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState('reviews'); // 'reviews' or 'analytics'
  
  // Toast state
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Filter states
  const [filters, setFilters] = useState({
    listingId: 'all',
    channel: 'all',
    rating: 'all',
    approved: 'all',
    type: 'all',
    searchTerm: ''
  });

  // Sort states
  const [sortConfig, setSortConfig] = useState({
    key: 'reviewDate',
    direction: 'desc'
  });

  useEffect(() => {
    document.title = 'Reviews Dashboard';
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [reviewsRes, summaryRes, optionsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/reviews/hostaway`),
        axios.get(`${API_BASE_URL}/api/properties/summary`),
        axios.get(`${API_BASE_URL}/api/filter-options`)
      ]);

      const reviews = reviewsRes.data.data.normalizedReviews || [];
      console.log('Loaded reviews:', reviews.length);
      setReviews(reviews);
      setPropertySummary(summaryRes.data || []);
      setFilterOptions(optionsRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
      // Handle error gracefully
      setReviews([]);
      setPropertySummary([]);
      setFilterOptions({});
    } finally {
      setLoading(false);
    }
  };

  const applyFiltersAndSort = useCallback(() => {
    let filtered = [...reviews];
    console.log('Applying filters to reviews:', reviews.length);

    // Apply filters
    if (filters.listingId && filters.listingId !== 'all') {
      filtered = filtered.filter(review => review.listingId === parseInt(filters.listingId));
    }
    if (filters.channel && filters.channel !== 'all') {
      filtered = filtered.filter(review => review.channel === filters.channel);
    }
    if (filters.rating && filters.rating !== 'all') {
      filtered = filtered.filter(review => review.rating === parseInt(filters.rating));
    }
    if (filters.approved && filters.approved !== 'all') {
      const isApproved = filters.approved === 'true';
      filtered = filtered.filter(review => review.isApproved === isApproved);
    }
    if (filters.type && filters.type !== 'all') {
      filtered = filtered.filter(review => review.type === filters.type);
    }
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(review =>
        review.comment.toLowerCase().includes(searchLower) ||
        review.guestName.toLowerCase().includes(searchLower) ||
        review.listingName.toLowerCase().includes(searchLower)
      );
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'reviewDate') {
        aValue = new Date(aValue);
        bValue = new Date(bValue);
      }

      if (sortConfig.direction === 'desc') {
        return bValue > aValue ? 1 : -1;
      } else {
        return aValue > bValue ? 1 : -1;
      }
    });

    console.log('Filtered reviews count:', filtered.length);
    setFilteredReviews(filtered);
  }, [reviews, filters, sortConfig]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [applyFiltersAndSort]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }));
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      listingId: 'all',
      channel: 'all',
      rating: 'all',
      approved: 'all',
      type: 'all',
      searchTerm: ''
    });
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastOpen(true);
  };

  const toggleReviewApproval = async (reviewId, currentApproval) => {
    try {
      const newApproval = !currentApproval;
      await axios.put(`${API_BASE_URL}/api/reviews/${reviewId}/approval`, {
        isApproved: newApproval
      });

      // Update local state
      setReviews(prev => prev.map(review =>
        review.id === reviewId
          ? { ...review, isApproved: newApproval }
          : review
      ));

      // Show success toast
      showToast(
        newApproval 
          ? 'Review approved and will appear on property page' 
          : 'Review removed from public display',
        'success'
      );

      // Refresh property summary
      const summaryRes = await axios.get(`${API_BASE_URL}/api/properties/summary`);
      setPropertySummary(summaryRes.data || []);
    } catch (error) {
      console.error('Error updating review approval:', error);
      showToast('Failed to update review approval. Please try again.', 'error');
    }
  };

  const getStarRating = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={16}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  const getRatingColor = (rating) => {
    if (rating >= 4) return 'green';
    if (rating >= 3) return 'orange';
    return 'red';
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  // TODO: breakdown the JSX into smaller components for readability
  return (
    <Toast.Provider swipeDirection="right">
      <Tooltip.Provider>
        <div className="manager-dashboard">
          {/* Header */}
          <header className="dashboard-header">
            <div className="header-content">

            <img src={flexLogo} alt="Flex Living" className="dashboard-logo" />
            <div className="dashboard-title">Reviews Dashboard</div>

              <div className="view-toggle">
                <button
                  className={selectedView === 'reviews' ? 'active' : ''}
                  onClick={() => setSelectedView('reviews')}
                >
                  <Filter size={16} />
                  Reviews
                </button>
                <button
                  className={selectedView === 'analytics' ? 'active' : ''}
                  onClick={() => setSelectedView('analytics')}
                >
                  <BarChart3 size={16} />
                  Analytics
                </button>
              </div>
            </div>
          </header>

      {selectedView === 'analytics' && (
        <div className="analytics-section">
          <h2>Property Performance Overview</h2>
          <div className="property-cards">
            {propertySummary.map(property => (
              <div key={property.listingId} className="property-card">
                <div className="property-header">
                  <h3>{property.listingName}</h3>
                  <div className="property-stats">
                    <span className="average-rating">
                      {getStarRating(Math.round(property.averageRating))}
                      <span>{property.averageRating}</span>
                    </span>
                  </div>
                </div>
                <div className="property-metrics">
                  <div className="metric">
                    <span className="metric-label">Total Reviews</span>
                    <span className="metric-value">{property.totalReviews}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Approved</span>
                    <span className="metric-value">{property.approvedReviews}</span>
                  </div>
                  <div className="metric">
                    <span className="metric-label">Approval Rate</span>
                    <span className="metric-value">
                      {property.totalReviews > 0 
                        ? Math.round((property.approvedReviews / property.totalReviews) * 100)
                        : 0}%
                    </span>
                  </div>
                </div>
                <div className="rating-distribution">
                  <h4>Rating Distribution</h4>
                  {Object.entries(property.ratingDistribution)
                    .reverse()
                    .map(([rating, count]) => (
                    <div key={rating} className="rating-bar">
                      <span>{rating}★</span>
                      <div className="bar">
                        <div 
                          className="bar-fill" 
                          style={{ 
                            width: `${property.totalReviews > 0 ? (count / property.totalReviews) * 100 : 0}%`,
                            backgroundColor: getRatingColor(parseInt(rating))
                          }}
                        ></div>
                      </div>
                      <span>{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {selectedView === 'reviews' && (
        <>
          {/* Filters */}
          <div className="filters-section">
            <div className="filters-header">
              <h2>
                <Filter size={20} />
                Filters & Search
              </h2>
              <button onClick={clearFilters} className="clear-filters-btn">
                Clear All
              </button>
            </div>
            
            <div className="filters-grid">
              <div className="filter-group">
                <label>Search Reviews</label>
                <div className="search-input">
                  <Search size={16} />
                  <input
                    type="text"
                    placeholder="Search by guest name, comment, or property..."
                    value={filters.searchTerm}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
                  />
                </div>
              </div>

              <div className="filter-group">
                <label>Property</label>
                <Select.Root value={filters.listingId} onValueChange={(value) => handleFilterChange('listingId', value)}>
                  <Select.Trigger className="select-trigger">
                    <Select.Value placeholder="All Properties" />
                    <Select.Icon className="select-icon">
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="select-content" position="popper">
                      <Select.Viewport className="select-viewport">
                        <Select.Item value="all" className="select-item">
                          <Select.ItemIndicator className="select-item-indicator">
                            <Check size={14} />
                          </Select.ItemIndicator>
                          <Select.ItemText>All Properties</Select.ItemText>
                        </Select.Item>
                        {filterOptions.properties?.map(property => (
                          <Select.Item key={property.id} value={property.id} className="select-item">
                            <Select.ItemIndicator className="select-item-indicator">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Select.ItemText>{property.name}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="filter-group">
                <label>Channel</label>
                <Select.Root value={filters.channel} onValueChange={(value) => handleFilterChange('channel', value)}>
                  <Select.Trigger className="select-trigger">
                    <Select.Value placeholder="All Channels" />
                    <Select.Icon className="select-icon">
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="select-content" position="popper">
                      <Select.Viewport className="select-viewport">
                        <Select.Item value="all" className="select-item">
                          <Select.ItemIndicator className="select-item-indicator">
                            <Check size={14} />
                          </Select.ItemIndicator>
                          <Select.ItemText>All Channels</Select.ItemText>
                        </Select.Item>
                        {filterOptions.channels?.map(channel => (
                          <Select.Item key={channel} value={channel} className="select-item">
                            <Select.ItemIndicator className="select-item-indicator">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Select.ItemText>{channel}</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="filter-group">
                <label>Rating</label>
                <Select.Root value={filters.rating} onValueChange={(value) => handleFilterChange('rating', value)}>
                  <Select.Trigger className="select-trigger">
                    <Select.Value placeholder="All Ratings" />
                    <Select.Icon className="select-icon">
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="select-content" position="popper">
                      <Select.Viewport className="select-viewport">
                        <Select.Item value="all" className="select-item">
                          <Select.ItemIndicator className="select-item-indicator">
                            <Check size={14} />
                          </Select.ItemIndicator>
                          <Select.ItemText>All Ratings</Select.ItemText>
                        </Select.Item>
                        {filterOptions.ratings?.map(rating => (
                          <Select.Item key={rating} value={rating.toString()} className="select-item">
                            <Select.ItemIndicator className="select-item-indicator">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Select.ItemText>{rating} Stars</Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="filter-group">
                <label>Review Type</label>
                <Select.Root value={filters.type} onValueChange={(value) => handleFilterChange('type', value)}>
                  <Select.Trigger className="select-trigger">
                    <Select.Value placeholder="All Types" />
                    <Select.Icon className="select-icon">
                      <ChevronDown size={16} />
                    </Select.Icon>
                  </Select.Trigger>
                  <Select.Portal>
                    <Select.Content className="select-content" position="popper">
                      <Select.Viewport className="select-viewport">
                        <Select.Item value="all" className="select-item">
                          <Select.ItemIndicator className="select-item-indicator">
                            <Check size={14} />
                          </Select.ItemIndicator>
                          <Select.ItemText>All Types</Select.ItemText>
                        </Select.Item>
                        {filterOptions.types?.map(type => (
                          <Select.Item key={type} value={type} className="select-item">
                            <Select.ItemIndicator className="select-item-indicator">
                              <Check size={14} />
                            </Select.ItemIndicator>
                            <Select.ItemText>
                              {type === 'guest-to-host' ? 'Guest to Host' : 'Host to Guest'}
                            </Select.ItemText>
                          </Select.Item>
                        ))}
                      </Select.Viewport>
                    </Select.Content>
                  </Select.Portal>
                </Select.Root>
              </div>

              <div className="filter-group">
                <label>Quick Filters</label>
                <div className="switch-group">
                  <div className="switch-item">
                    <Switch.Root
                      className="switch-root"
                      checked={filters.approved === 'true'}
                      onCheckedChange={(checked) => 
                        handleFilterChange('approved', checked ? 'true' : 'all')
                      }
                    >
                      <Switch.Thumb className="switch-thumb" />
                    </Switch.Root>
                    <label>Show Only Approved</label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Results Summary */}
          <div className="results-summary">
            <p>
              Showing {filteredReviews.length} of {reviews.length} reviews
            </p>
          </div>

          {/* Reviews Table */}
          <div className="reviews-section">
            <div className="reviews-table">
              <div className="table-header">
                <div className="header-cell sortable" onClick={() => handleSort('reviewDate')}>
                  <Calendar size={16} />
                  Date
                  {sortConfig.key === 'reviewDate' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}>
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
                <div className="header-cell sortable" onClick={() => handleSort('listingName')}>
                  <MapPin size={16} />
                  Property
                  {sortConfig.key === 'listingName' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}>
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
                <div className="header-cell sortable" onClick={() => handleSort('guestName')}>
                  Guest
                  {sortConfig.key === 'guestName' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}>
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
                <div className="header-cell sortable" onClick={() => handleSort('rating')}>
                  Rating
                  {sortConfig.key === 'rating' && (
                    <span className={`sort-indicator ${sortConfig.direction}`}>
                      {sortConfig.direction === 'desc' ? '↓' : '↑'}
                    </span>
                  )}
                </div>
                <div className="header-cell">Channel</div>
                <div className="header-cell">Type</div>
                <div className="header-cell">Comment</div>
                <div className="header-cell">Status</div>
                <div className="header-cell">Actions</div>
              </div>

              <div className="table-body">
                {filteredReviews.map(review => (
                  <div key={review.id} className={`table-row ${!review.isApproved ? 'pending' : ''}`}>
                    <div className="table-cell" data-label="Date">
                      {format(new Date(review.reviewDate), 'MMM dd, yyyy')}
                    </div>
                    <div className="table-cell" data-label="Property">
                        <a href={`/property/${review.listingId}`}>{review.listingName}</a>
                    </div>
                    <div className="table-cell" data-label="Guest">
                      {review.guestName}
                    </div>
                    <div className="table-cell" data-label="Rating">
                      <div className="rating-display">
                        {getStarRating(review.rating)}
                        <span>({review.rating})</span>
                        <CategoryBreakdown 
                          reviewCategories={review.reviewCategories}
                          buttonVariant="manager"
                          buttonText=""
                          showIcon={true}
                        />
                      </div>
                    </div>
                    <div className="table-cell" data-label="Channel">
                      <span className="channel-badge">{review.channel}</span>
                    </div>
                    <div className="table-cell" data-label="Type">
                      <span className={`type-badge ${review.type === 'guest-to-host' ? 'guest-to-host' : 'host-to-guest'}`}>
                        {review.type === 'guest-to-host' ? 'Guest → Host' : 'Host → Guest'}
                      </span>
                    </div>
                    <div className="table-cell comment-cell" data-label="Comment">
                      <p>{review.comment}</p>
                    </div>
                    <div className="table-cell" data-label="Status">
                      <div className={`status-badge ${review.isApproved ? 'approved' : 'pending'}`}>
                        {review.isApproved ? (
                          <>
                            <CheckCircle size={14} />
                            Approved
                          </>
                        ) : (
                          <>
                            <XCircle size={14} />
                            Pending
                          </>
                        )}
                      </div>
                    </div>
                    <div className="table-cell actions-cell" data-label="Actions">
                      <Tooltip.Root>
                        <Tooltip.Trigger asChild>
                          <button
                            onClick={() => toggleReviewApproval(review.id, review.isApproved)}
                            className={`action-btn ${review.isApproved ? 'remove' : 'approve'}`}
                          >
                            {review.isApproved ? (
                              <>
                                <EyeOff size={16} />
                                Remove
                              </>
                            ) : (
                              <>
                                <Eye size={16} />
                                Approve
                              </>
                            )}
                          </button>
                        </Tooltip.Trigger>
                        <Tooltip.Portal>
                          <Tooltip.Content className="tooltip-content" sideOffset={4}>
                            {review.isApproved 
                              ? 'Remove from public display' 
                              : 'Approve for public display'
                            }
                            <Tooltip.Arrow className="tooltip-arrow" />
                          </Tooltip.Content>
                        </Tooltip.Portal>
                      </Tooltip.Root>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {filteredReviews.length === 0 && (
              <div className="no-results">
                <MessageSquare size={48} />
                <h3>No reviews found</h3>
                <p>Try adjusting your filters or search terms.</p>
              </div>
            )}
          </div>
        </>
      )}


          {/* Toast Notifications */}
          <Toast.Root 
            className={`toast-root toast-${toastType}`} 
            open={toastOpen} 
            onOpenChange={setToastOpen}
          >
            <Toast.Title className="toast-title">
              {toastMessage}
            </Toast.Title>
            <Toast.Close className="toast-close">
              <X size={16} />
            </Toast.Close>
          </Toast.Root>

          <Toast.Viewport className="toast-viewport" />
        </div>
      </Tooltip.Provider>
    </Toast.Provider>
  );
};

export default ManagerDashboard;
