import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';
import * as Dialog from '@radix-ui/react-dialog';
import * as Tabs from '@radix-ui/react-tabs';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';
import {
  Star,
  Calendar,
  User,
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
import flexLogo from '../assets/images/logo.webp'; // Add your logo import

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const PropertyReviewDisplay = () => {
  const { propertyId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mock property data (in real app, this would come from a property API)
  const propertyData = {
    'flex-downtown-001': {
      name: 'Flex Living Downtown',
      address: '123 Downtown Avenue, City Center',
      description: 'Experience the pinnacle of urban living in this stunning downtown apartment. Featuring floor-to-ceiling windows, premium finishes, and breathtaking city views, this space offers the perfect blend of luxury and convenience for the modern professional.',
      images: [
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
      ],
      amenities: [
        { name: 'High-Speed WiFi', icon: 'wifi' },
        { name: '24/7 Concierge', icon: 'clock' },
        { name: 'Fitness Center', icon: 'dumbbell' },
        { name: 'Rooftop Terrace', icon: 'home' },
        { name: 'Parking Available', icon: 'car' },
        { name: 'Cleaning Service', icon: 'shield' }
      ],
      price: '$2,500',
      priceUnit: '/month',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 750,
      availability: 'Available Now',
      leaseTerms: ['6 months', '12 months', '18 months'],
      neighborhood: 'Downtown Core',
      buildingFeatures: [
        'Luxury Lobby',
        'Package Concierge',
        'Rooftop Deck',
        'Fitness Center',
        'Business Center',
        'Pet Wash Station'
      ]
    },
    'flex-midtown-002': {
      name: 'Flex Living Midtown',
      address: '456 Midtown Boulevard, Business District',
      description: 'Discover sophisticated living in the heart of the business district. This contemporary apartment features smart home technology, premium appliances, and designer furnishings, creating the perfect environment for today\'s professionals.',
      images: [
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
      ],
      amenities: [
        { name: 'High-Speed WiFi', icon: 'wifi' },
        { name: 'Gym Access', icon: 'dumbbell' },
        { name: 'Coworking Space', icon: 'coffee' },
        { name: 'Smart Home Features', icon: 'home' },
        { name: 'Parking', icon: 'car' },
        { name: 'Cleaning Service', icon: 'shield' }
      ],
      price: '$2,800',
      priceUnit: '/month',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 850,
      availability: 'Available Now',
      leaseTerms: ['6 months', '12 months', '18 months'],
      neighborhood: 'Midtown Business District',
      buildingFeatures: [
        'Executive Lounge',
        'Conference Rooms',
        'Sky Deck',
        'Wellness Center',
        'Concierge Service',
        'Valet Parking'
      ]
    },
    'flex-uptown-003': {
      name: 'Flex Living Uptown',
      address: '789 Uptown Street, Cultural District',
      description: 'Immerse yourself in the vibrant cultural heart of the city. This stylish apartment combines artistic flair with modern comfort, surrounded by galleries, theaters, and the finest dining the city has to offer.',
      images: [
        'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80',
        'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?ixlib=rb-4.0.3&auto=format&fit=crop&w=1470&q=80'
      ],
      amenities: [
        { name: 'High-Speed WiFi', icon: 'wifi' },
        { name: 'Fitness Center', icon: 'dumbbell' },
        { name: 'Community Events', icon: 'coffee' },
        { name: 'Bike Storage', icon: 'car' },
        { name: 'Package Service', icon: 'shield' },
        { name: 'Security', icon: 'shield' }
      ],
      price: '$2,200',
      priceUnit: '/month',
      bedrooms: 1,
      bathrooms: 1,
      sqft: 700,
      availability: 'Available Now',
      leaseTerms: ['6 months', '12 months', '18 months'],
      neighborhood: 'Cultural Arts District',
      buildingFeatures: [
        'Art Gallery',
        'Community Garden',
        'Creative Spaces',
        'Yoga Studio',
        'Library Lounge',
        'Event Space'
      ]
    }
  };

  const property = propertyData[propertyId] || propertyData['flex-downtown-001'];
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [dialogImageOpen, setDialogImageOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchReviews();
  }, [propertyId]);

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
      prev === property.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? property.images.length - 1 : prev - 1
    );
  };

  const fetchReviews = async () => {
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
  };

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
                  <img src={property.images[currentImageIndex]} alt={property.name} />
                  {property.images.length > 1 && (
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
                    <span>{currentImageIndex + 1} / {property.images.length}</span>
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
                      {property.name} - Gallery
                    </Dialog.Title>
                    <Dialog.Close className="dialog-close">
                      <X size={24} />
                    </Dialog.Close>
                  </div>
                  
                  <div className="gallery-dialog-content">
                    <div className="dialog-main-image">
                      <img src={property.images[currentImageIndex]} alt={property.name} />
                      {property.images.length > 1 && (
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
                      {property.images.map((image, index) => (
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
            {property.images.map((image, index) => (
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
              <h1>{property.name}</h1>
              <div className="property-location">
                <MapPin size={18} />
                <span>{property.address}</span>
              </div>
              <div className="property-neighborhood">
                <span className="neighborhood-badge">{property.neighborhood}</span>
              </div>
            </div>
            <div className="property-pricing">
              <div className="price-section">
                <span className="price">{property.price}</span>
                <span className="price-unit">{property.priceUnit}</span>
              </div>
              <div className="availability">
                <span className="status available">{property.availability}</span>
              </div>
            </div>
          </div>
          <div className="property-stats">
            <div className="stat">
              <Bed size={20} />
              <span>{property.bedrooms} Bedroom{property.bedrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <Bath size={20} />
              <span>{property.bathrooms} Bathroom{property.bathrooms > 1 ? 's' : ''}</span>
            </div>
            <div className="stat">
              <Home size={20} />
              <span>{property.sqft} sq ft</span>
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
                  <p>{property.description}</p>
                </div>
                
                <div className="amenities-section">
                  <h3>Apartment Features</h3>
                  <div className="amenities-grid">
                    {property.amenities.map((amenity, index) => (
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
                    {property.buildingFeatures.map((feature, index) => (
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
                          <span className="review-category">{review.category}</span>
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
