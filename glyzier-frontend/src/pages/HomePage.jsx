/**
 * HomePage Component
 * * Landing page of the Glyzier application, redesigned to match the UI wireframes.
 * Features:
 * - A dynamic hero carousel section.
 * - "Artist of the Month" showcase.
 * - "Hot Arts" section to display products.
 * - "Category" browsing section.
 * - Sponsor and social media footers.
 * * @author Glyzier Team
 * @version 5.0 (UI Redesign - Mockup Implementation)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Aurora from '../components/Aurora';
import FavoriteButton from '../components/FavoriteButton';
import { getAllProducts } from '../services/productService'; // We will use this for the "Hot Arts" section
import { extractColorsFromImage, enhanceColorsForAurora } from '../utils/colorExtractor';
import styles from '../styles/pages/HomePage.module.css';

/**
 * Custom hook for auto-rotating carousel with fade effect
 * @param {number} totalSlides - Total number of slides
 * @param {number} interval - Rotation interval in milliseconds
 * @returns {Object} Current index, next/prev handlers, setter, and fade state
 */
const useCarousel = (totalSlides, interval = 5000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (totalSlides <= 1) return; // Don't auto-rotate if only 1 slide
    
    const timer = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % totalSlides);
        setIsTransitioning(false);
      }, 300);
    }, interval);

    return () => clearInterval(timer);
  }, [totalSlides, interval]);

  const goToNext = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % totalSlides);
      setIsTransitioning(false);
    }, 300);
  };

  const goToPrev = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
      setIsTransitioning(false);
    }, 300);
  };

  const goToSlide = (index) => {
    if (isTransitioning || index === currentIndex) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setIsTransitioning(false);
    }, 300);
  };

  return { currentIndex, goToNext, goToPrev, goToSlide, isTransitioning };
};

// Removed artists, categories data for clean minimal homepage

/**
 * HomePage functional component
 * @returns {JSX.Element} The redesigned home page component
 */
function HomePage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]); // This will be used for "Latest Hot Arts"
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auroraColors, setAuroraColors] = useState(['#c9bfe8', '#b8afe8', '#9b8dd4']);
  
  // Feed section state
  const [feedProducts, setFeedProducts] = useState([]);
  const [feedPage, setFeedPage] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const observerTarget = useRef(null);
  
  // Hero carousel (auto-rotates through first 5 products every 5 seconds)
  const heroSlides = Math.min(products.length, 5);
  const { currentIndex: heroIndex, goToNext: heroNext, goToPrev: heroPrev, goToSlide: goToHeroSlide, isTransitioning } = useCarousel(heroSlides, 5000);



  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        // Fetch all products and show the latest 8 as "Latest Hot Arts"
        const data = await getAllProducts();
        // Sort by product ID descending to get latest uploaded
        const sortedData = data.sort((a, b) => b.pid - a.pid);
        setProducts(sortedData.slice(0, 8)); 
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load art. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  /**
   * Load more products for feed section
   * Implements pagination by loading products in chunks
   */
  const loadMoreFeedProducts = useCallback(async () => {
    if (feedLoading || !feedHasMore) return;
    
    try {
      setFeedLoading(true);
      const data = await getAllProducts();
      
      // Sort by product ID descending (latest first)
      const sortedData = data.sort((a, b) => b.pid - a.pid);
      
      // Simulate pagination: 12 products per page
      const pageSize = 12;
      const startIndex = feedPage * pageSize;
      const endIndex = startIndex + pageSize;
      const pageData = sortedData.slice(startIndex, endIndex);
      
      if (pageData.length === 0) {
        setFeedHasMore(false);
      } else {
        setFeedProducts(prev => [...prev, ...pageData]);
        setFeedPage(prev => prev + 1);
        
        // Check if we've loaded all products
        if (endIndex >= sortedData.length) {
          setFeedHasMore(false);
        }
      }
    } catch (err) {
      console.error('Failed to load more products:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [feedPage, feedLoading, feedHasMore]);

  /**
   * Intersection Observer for infinite scroll
   * Loads more products when user scrolls to the bottom
   */
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && feedHasMore && !feedLoading) {
          loadMoreFeedProducts();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [loadMoreFeedProducts, feedHasMore, feedLoading]);

  /**
   * Initial load for feed section
   */
  useEffect(() => {
    loadMoreFeedProducts();
  }, []); // Empty dependency array - only run once on mount

  // Update Aurora colors when carousel index changes
  useEffect(() => {
    const updateAuroraColors = async () => {
      if (products.length > 0 && products[heroIndex]?.screenshotPreviewUrl) {
        const extractedColors = await extractColorsFromImage(products[heroIndex].screenshotPreviewUrl);
        const enhancedColors = enhanceColorsForAurora(extractedColors);
        setAuroraColors(enhancedColors);
      }
    };
    
    updateAuroraColors();
  }, [heroIndex, products]);

  return (
    <div className={styles.page}>
      <Navigation />

      {/* Hero Carousel Section - Auto-rotates through first 5 products */}
      <header className={styles.heroSection}>
        {/* Aurora Background Effect */}
        <Aurora 
          colorStops={auroraColors}
          amplitude={1.2}
          blend={0.6}
          speed={0.4}
        />
        
        <button 
          className={styles.carouselArrow} 
          onClick={heroPrev}
          aria-label="Previous product"
          disabled={isTransitioning}
        >
          &lt;
        </button>
        
        <div className={styles.heroContent}>
          {products.length > 0 ? (
            <>
              <div className={`${styles.heroText} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
                <h1 data-length={
                  (() => {
                    const title = products[heroIndex]?.productname || "Eye in Abstract";
                    const length = title.length;
                    if (length <= 20) return "short";
                    if (length <= 35) return "medium";
                    if (length <= 50) return "long";
                    return "very-long";
                  })()
                }>
                  {products[heroIndex]?.productname || "Eye in Abstract"}
                </h1>
                <p>
                  {products[heroIndex]?.productdesc || "A vibrant, colorful abstract painting of a human eye with splashes and drips of paint, creating an expressive and energetic look."}
                </p>
                <button 
                  className={styles.getItNowButton}
                  onClick={() => products[heroIndex] && navigate(`/products/${products[heroIndex].pid}`)}
                >
                  GET IT NOW
                </button>
              </div>
              <div className={styles.heroImageContainer}>
                <div className={`${styles.heroImage} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
                  {products[heroIndex]?.screenshotPreviewUrl ? (
                    <img 
                      src={products[heroIndex].screenshotPreviewUrl} 
                      alt={products[heroIndex].productname}
                      className={styles.heroImageDisplay}
                    />
                  ) : (
                    <div className={styles.heroImagePlaceholder}>[Image here]</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.heroText}>
              <h1>Explore The Art World</h1>
              <p>Where Artists and Buyers Unite for a Unique Experience</p>
            </div>
          )}
          
          {/* Carousel indicators */}
          {heroSlides > 1 && (
            <div className={styles.carouselIndicators}>
              {products.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === heroIndex ? styles.active : ''}`}
                  onClick={() => goToHeroSlide(index)}
                  aria-label={`Go to slide ${index + 1}`}
                  disabled={isTransitioning}
                />
              ))}
            </div>
          )}
        </div>

        <button 
          className={styles.carouselArrow} 
          onClick={heroNext}
          aria-label="Next product"
          disabled={isTransitioning}
        >
          &gt;
        </button>
      </header>

      <main>
        {/* Latest Hot Arts Section */}
        <section className={styles.hotArtsSection}>
          <h2>Latest Hot Arts</h2>
          <p className={styles.sectionSubtitle}>Latest uploaded arts</p>
          {loading && <p>Loading art...</p>}
          {error && <p className={styles.errorMessage}>{error}</p>}
          {!loading && !error && (
            <div className={styles.hotArtsGrid}>
              {products.length > 0 ? (
                products.map((product) => (
                  <Link key={product.pid} to={`/products/${product.pid}`} className={styles.hotArtCard}>
                    <div className={styles.hotArtImage}>
                      {product.screenshotPreviewUrl ? (
                        <img 
                          src={product.screenshotPreviewUrl} 
                          alt={product.productname}
                          className={styles.productImage}
                        />
                      ) : (
                        <span>[No Image]</span>
                      )}
                      {/* Favorite Button - Module 10 */}
                      <FavoriteButton 
                        productId={product.pid} 
                        className={styles.favoriteButtonOverlay}
                      />
                    </div>
                    <p>{product.productname}</p>
                  </Link>
                ))
              ) : (
                <p>No arts available yet. Add some products!</p>
              )}
            </div>
          )}
        </section>

        {/* Feed Section - Infinite Scroll */}
        <section className={styles.feedSection}>
          <h2>Feed</h2>
          <p className={styles.sectionSubtitle}>Discover all artworks</p>
          
          <div className={styles.feedGrid}>
            {feedProducts.map((product) => (
              <Link key={product.pid} to={`/products/${product.pid}`} className={styles.feedCard}>
                <div className={styles.feedImage}>
                  {product.screenshotPreviewUrl ? (
                    <img 
                      src={product.screenshotPreviewUrl} 
                      alt={product.productname}
                      className={styles.productImage}
                    />
                  ) : (
                    <div className={styles.imagePlaceholder}>
                      [No Image]
                    </div>
                  )}
                  {/* Favorite Button - Module 10 */}
                  <FavoriteButton 
                    productId={product.pid} 
                    className={styles.favoriteButtonOverlay}
                  />
                </div>
                <div className={styles.feedInfo}>
                  <p className={styles.feedProductName}>{product.productname}</p>
                  <p className={styles.feedProductPrice}>${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Loading indicator */}
          {feedLoading && (
            <div className={styles.feedLoading}>
              <p>Loading more artworks...</p>
            </div>
          )}
          
          {/* Intersection observer target */}
          <div ref={observerTarget} className={styles.observerTarget} />
          
          {/* End of feed message */}
          {!feedHasMore && feedProducts.length > 0 && (
            <div className={styles.feedEnd}>
              <p>You've seen all the artworks!</p>
            </div>
          )}
          
          {/* Empty state */}
          {!feedLoading && feedProducts.length === 0 && (
            <div className={styles.feedEmpty}>
              <p>No artworks available yet.</p>
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

export default HomePage;

//this is a sample
//this is a sample
//this is a sample
//this is a sample
//this is a sample