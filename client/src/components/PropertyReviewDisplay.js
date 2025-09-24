import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import CategoryBreakdown from './CategoryBreakdown';
import {
  Star,
  ArrowLeft,
  MapPin,
  Wifi,
  Car,
  Coffee,
  Dumbbell,
  Shield,
  Clock,
  Bed,
  Bath,
  Home,
  Phone,
  Mail,
  ChevronLeft,
  ChevronRight,
  Heart,
  X,
  Share2,
  Download,
  MoreVertical
} from 'lucide-react';
import './PropertyReviewDisplay.css';
import '../styles/radix.css';
import flexLogo from '../assets/images/logo.webp';
import propertyData from '../data/propertyData'; // Mock property data

const API_BASE_URL = (process.env.REACT_APP_API_URL || 'http://localhost:3001').replace(/\/+$/, '');

const PropertyReviewDisplay = () => {
  const { propertyId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [dialogImageOpen, setDialogImageOpen] = useState(false);

  // Keyboard navigation for gallery
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (dialogImageOpen) {
        if (event.key === 'ArrowLeft') {
          prevImage();
        } else if (event.key === 'ArrowRight') {
          nextImage();
        } else if (event.key === 'Escape') {
          setDialogImageOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [dialogImageOpen]);

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === propertyData.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? propertyData.images.length - 1 : prev - 1
    );
  };

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
        const response = await axios.get(`${API_BASE_URL}/api/properties/${propertyId}/public-reviews`);
      setReviews(response.data.reviews || []);
    } catch (err) {
      console.error('Error fetching reviews:', err);
      setError('Failed to load reviews. Please try again later.');
      setReviews([]);
    } finally {
      setLoading(false);
    }
  }, [propertyId]);

  useEffect(() => {
    document.title = propertyData.name;
    fetchReviews();
  }, [propertyId, fetchReviews]);

  const getStarRating = (rating) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        size={20}
        className={i < rating ? 'star-filled' : 'star-empty'}
      />
    ));
  };

  const calculateAverageRating = () => {
    if (reviews.length === 0) return 0;
    const total = reviews.reduce((sum, review) => sum + review.rating, 0);
    return (total / reviews.length).toFixed(1);
  };

  const getRatingDistribution = () => {
    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach(review => {
      distribution[review.rating]++;
    });
    return distribution;
  };

  const getAmenityIcon = (iconType) => {
    const iconMap = {
      'wifi': <Wifi size={20} />,
      'car': <Car size={20} />,
      'dumbbell': <Dumbbell size={20} />,
      'coffee': <Coffee size={20} />,
      'shield': <Shield size={20} />,
      'clock': <Clock size={20} />,
      'home': <Home size={20} />
    };
    return iconMap[iconType] || <Shield size={20} />;
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading property details...</p>
      </div>
    );
  }

  // TODO: breakdown into smaller components
  return (
    <Tooltip.Provider>
      <div className="property-page">
        {/* Navigation */}
        <nav className="flex-nav">
        <div className="nav-content">
          <Link to="/dashboard" className="back-link">
            <ArrowLeft size={20} />
            <span>Back to Dashboard</span>
          </Link>
          <div className="nav-logo">
            <img src={flexLogo} alt="Flex Living" className="logo-image" />
          </div>
          <div className="nav-actions">
            <Tooltip.Root>
              <Tooltip.Trigger asChild>
                <button className="heart-btn" onClick={() => setIsLiked(!isLiked)}>
                  <Heart size={20} fill={isLiked ? 'currentColor' : 'none'} />
                </button>
              </Tooltip.Trigger>
              <Tooltip.Portal>
                <Tooltip.Content className="tooltip-content" side="bottom">
                  {isLiked ? 'Remove from favorites' : 'Add to favorites'}
                  <Tooltip.Arrow className="tooltip-arrow" />
                </Tooltip.Content>
              </Tooltip.Portal>
            </Tooltip.Root>
            
            <DropdownMenu.Root>
              <DropdownMenu.Trigger asChild>
                <button className="more-actions-btn">
                  <MoreVertical size={20} />
                </button>
              </DropdownMenu.Trigger>
              
              <DropdownMenu.Portal>
                <DropdownMenu.Content className="dropdown-content" sideOffset={8} align="end">
                  <DropdownMenu.Item className="dropdown-item">
                    <Share2 size={16} />
                    <span>Share Property</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Item className="dropdown-item">
                    <Download size={16} />
                    <span>Download Brochure</span>
                  </DropdownMenu.Item>
                  <DropdownMenu.Arrow className="dropdown-arrow" />
                </DropdownMenu.Content>
              </DropdownMenu.Portal>
            </DropdownMenu.Root>
          </div>
        </div>
      </nav>

      {/* Property Gallery */}
      <section className="property-gallery">
        <div className="gallery-container">
            <Dialog.Root open={dialogImageOpen} onOpenChange={setDialogImageOpen}>
              <Dialog.Trigger asChild>
                <div className="main-image" role="button" tabIndex={0}>
                  <img src={propertyData.images[currentImageIndex]} alt={propertyData.name} />
                  {propertyData.images.length > 1 && (
                    <>
                      <button className="gallery-nav prev" onClick={(e) => { e.stopPropagation(); prevImage(); }}>
                        <ChevronLeft size={24} />
                      </button>
                      <button className="gallery-nav next" onClick={(e) => { e.stopPropagation(); nextImage(); }}>
                        <ChevronRight size={24} />
                      </button>
                    </>
                  )}
                  <div className="image-counter">
                    <span>{currentImageIndex + 1} / {propertyData.images.length}</span>
                  </div>
                  <div className="gallery-overlay">
                    <span>Click to view full gallery</span>
                  </div>
                </div>
              </Dialog.Trigger>
              
              <Dialog.Portal>
                <Dialog.Overlay className="dialog-overlay" />
                <Dialog.Content className="dialog-content dialog-fullscreen gallery-dialog">
                  <div className="gallery-dialog-header">
                    <Dialog.Title className="dialog-title">
                      {propertyData.name} - Gallery
                    </Dialog.Title>
                    <Dialog.Close className="dialog-close">
                      <X size={24} />
                    </Dialog.Close>
                  </div>
                  
                  <div className="gallery-dialog-content">
                    <div className="dialog-main-image">
                      <img src={propertyData.images[currentImageIndex]} alt={propertyData.name} />
                      {propertyData.images.length > 1 && (
                        <>
                          <button className="dialog-gallery-nav prev" onClick={prevImage}>
                            <ChevronLeft size={32} />
                          </button>
                          <button className="dialog-gallery-nav next" onClick={nextImage}>
                            <ChevronRight size={32} />
                          </button>
                        </>
                      )}
                    </div>
                    
                    <div className="dialog-thumbnails">
                      {propertyData.images.map((image, index) => (
                        <button
                          key={index}
                          className={`dialog-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                          onClick={() => setCurrentImageIndex(index)}
                        >
                          <img src={image} alt={`View ${index + 1}`} />
                        </button>
                      ))}
                    </div>
                  </div>
                </Dialog.Content>
              </Dialog.Portal>
            </Dialog.Root>
          <div className="image-thumbnails">
            {propertyData.images.map((image, index) => (
              <button
                key={index}
                className={`thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                onClick={() => setCurrentImageIndex(index)}
              >
                <img src={image} alt={`View ${index + 1}`} />
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Property Header Info */}
      <section className="property-header-info">
        <div className="container">
          <div className="property-main-info">
            <div className="property-title-section">
              <h1>{propertyData.name}</h1>
              <div className="property-location">
                <MapPin size={18} />
                <span>{propertyData.address}</span>
              </div>
              <div className="property-neighborhood">
                <span className="neighborhood-badge">{propertyData.neighborhood}</span>
              </div>
            </div>
            <div className="property-pricing">
              <div className="price-section">
                <span className="price">{propertyData.price}</span>
                <span className="price-unit">{propertyData.priceUnit}</span>
              </div>
              <div className="availability">
                <span className="status available">{propertyData.availability}</span>
              </div>
            </div>
          </div>
          <div className="property-stats">
            <div className="stat">
              <Bed size={20} />
              <span>{propertyData.bedrooms} Bedroom{propertyData.bedrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <Bath size={20} />
              <span>{propertyData.bathrooms} Bathroom{propertyData.bathrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <Home size={20} />
              <span>{propertyData.sqft} sq ft</span>
            </div>
          </div>
        </div>
      </section>

        <div className="property-content">
        {/* Property Details */}
        <section className="property-details">
          <div className="container">
            <div className="details-grid">
              <div className="details-main">
                <div className="description-section">
                  <h2>About This Property</h2>
                  <p>{propertyData.description}</p>
                </div>
                
                <div className="amenities-section">
                  <h3>Apartment Features</h3>
                  <div className="amenities-grid">
                    {propertyData.amenities.map((amenity, index) => (
                      <div key={index} className="amenity-item">
                        {getAmenityIcon(amenity.icon)}
                        <span>{amenity.name}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="building-features-section">
                  <h3>Building Features</h3>
                  <div className="features-list">
                    {propertyData.buildingFeatures.map((feature, index) => (
                      <div key={index} className="feature-item">
                        <span>•</span>
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              
              <div className="details-sidebar">
                <div className="contact-card">
                  <h3>Interested in this property?</h3>
                  <div className="contact-info">
                    <div className="contact-item">
                      <Phone size={18} />
                      <span>(555) 123-4567</span>
                    </div>
                    <div className="contact-item">
                      <Mail size={18} />
                      <span>hello@flexliving.com</span>
                    </div>
                  </div>
                  <div className="contact-buttons">
                    <button className="btn-primary">Schedule Tour</button>
                    <button className="btn-secondary">Get Info</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="reviews-section" id="reviews">
          <div className="container">
            <div className="reviews-header">
              <h2>Resident Reviews</h2>
              <p className="reviews-subtitle">See what our residents are saying about their Flex Living experience</p>
              {reviews.length > 0 && (
                <div className="reviews-summary">
                  <div className="average-rating">
                    <div className="rating-display">
                      <span className="rating-number">{calculateAverageRating()}</span>
                      <div className="rating-stars">
                        {getStarRating(Math.round(parseFloat(calculateAverageRating())))}
                      </div>
                    </div>
                    <div className="rating-text">
                      <span className="rating-count">Based on {reviews.length} resident {reviews.length === 1 ? 'review' : 'reviews'}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {error && (
              <div className="error-message">
                <p>{error}</p>
              </div>
            )}

            {!error && reviews.length === 0 && !loading && (
              <div className="no-reviews">
                <div className="no-reviews-content">
                  <Star size={48} className="no-reviews-icon" />
                  <h3>No reviews yet</h3>
                  <p>Be among the first to experience this exceptional property and share your thoughts with future residents.</p>
                </div>
              </div>
            )}

            {!error && reviews.length > 0 && (
              <>
                {/* Reviews Grid */}
                <div className="reviews-grid">
                  <div className="rating-breakdown">
                    <h4>Rating Distribution</h4>
                    <div className="rating-bars">
                      {Object.entries(getRatingDistribution())
                        .reverse()
                        .map(([rating, count]) => (
                        <div key={rating} className="rating-bar">
                          <span className="rating-label">{rating}★</span>
                          <div className="bar-container">
                            <div 
                              className="bar-fill" 
                              style={{ 
                                width: `${reviews.length > 0 ? (count / reviews.length) * 100 : 0}%` 
                              }}
                            ></div>
                          </div>
                          <span className="rating-count">{count}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="reviews-list">
                    {reviews.slice(0, 6).map(review => (
                      <div key={review.id} className="review-card">
                        <div className="review-header">
                          <div className="reviewer-info">
                            <div className="reviewer-avatar">
                              <span>{review.guestName.charAt(0)}</span>
                            </div>
                            <div className="reviewer-details">
                              <h5>{review.guestName}</h5>
                              <div className="review-meta">
                                <div className="review-rating">
                                  {getStarRating(review.rating)}
                                </div>
                                <span className="review-date">
                                  {format(new Date(review.reviewDate), 'MMM yyyy')}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        <div className="review-content">
                          <p>"{review.comment}"</p>
                        </div>
                        <div className="review-footer">
                          <CategoryBreakdown 
                            reviewCategories={review.reviewCategories}
                            buttonVariant="property"
                            buttonText="Categories"
                            showIcon={true}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                {reviews.length > 6 && (
                  <div className="load-more-reviews">
                    <button className="btn-outline">View All {reviews.length} Reviews</button>
                  </div>
                )}
              </>
            )}
          </div>
        </section>


        {/* Footer CTA */}
        <section className="footer-cta">
          <div className="container">
            <div className="cta-content">
              <h2>Ready to Experience Flex Living?</h2>
              <p>Join thousands of residents who have made Flex Living their home. Schedule a tour today and discover your perfect space.</p>
              <div className="cta-buttons">
                <button className="btn-primary large">Schedule Your Tour</button>
                <button className="btn-outline large">Learn More</button>
              </div>
            </div>
          </div>
        </section>
        </div>
      </div>
    </Tooltip.Provider>
  );
};

export default PropertyReviewDisplay;
