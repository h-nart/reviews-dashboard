import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Info, Star } from 'lucide-react';
import './CategoryBreakdown.css';

const CategoryBreakdown = ({ 
  reviewCategories = [], 
  buttonVariant = 'default',
  buttonText = 'Categories',
  showIcon = true,
  className = ''
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleShowCategories = () => {
    setDialogOpen(true);
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

  // Don't render anything if no categories
  if (!reviewCategories || reviewCategories.length === 0) {
    return null;
  }

  return (
    <>
      <button 
        className={`category-info-btn ${buttonVariant === 'manager' ? '' : 'property-category-btn'} ${className}`}
        onClick={handleShowCategories}
        title="View category breakdown"
      >
        {showIcon && <Info size={buttonVariant === 'manager' ? 14 : 16} />}
        {buttonText && <span>{buttonText}</span>}
      </button>

      <Dialog.Root open={dialogOpen} onOpenChange={setDialogOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="dialog-overlay" />
          <Dialog.Content className="dialog-content category-dialog">
            <Dialog.Title className="dialog-title">
              Review Category Breakdown
            </Dialog.Title>
            <Dialog.Description className="dialog-description">
              Detailed ratings for each category:
            </Dialog.Description>
            
            <div className="category-breakdown">
              {reviewCategories.map((category, index) => (
                <div key={index} className="category-item">
                  <div className="category-info">
                    <span className="category-name">
                      {category.category.charAt(0).toUpperCase() + 
                       category.category.slice(1).replace(/_/g, ' ')}
                    </span>
                    <div className="category-rating">
                      {getStarRating(category.rating)}
                      <span className="rating-number">({category.rating})</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <Dialog.Close asChild>
              <button className="dialog-close-btn">
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
};

export default CategoryBreakdown;
