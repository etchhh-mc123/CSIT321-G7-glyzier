/**
 * HomePage Component
 * * Landing page of the Glyzier application.
 * Features:
 * - Dynamic Hero Carousel
 * - Hot Arts Section
 * - Infinite Scroll Feed
 * - Partners & Social Footer
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navigation from '../components/Navigation';
import Aurora from '../components/Aurora';
import FavoriteButton from '../components/FavoriteButton';
import { getAllProducts } from '../services/productService'; 
import { extractColorsFromImage, enhanceColorsForAurora } from '../utils/colorExtractor';
import styles from '../styles/pages/HomePage.module.css';

// --- PARTNER LOGOS ---
import partnerMaha from '../assets/partner-maha.png';
import partnerFaber from '../assets/partner-faber.png';
import partnerGallery from '../assets/partner-gallery.png';
import partnerArtLabel from '../assets/partner-artlabel.png';

// --- SOCIAL ICONS ---
// (Make sure these exist in src/assets! Run the command below if missing)
import twitterIcon from '../assets/twitter.png';
import facebookIcon from '../assets/facebook.png';
import instagramIcon from '../assets/instagram.png';

/**
 * Custom hook for auto-rotating carousel
 */
const useCarousel = (totalSlides, interval = 5000) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (totalSlides <= 1) return;
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

function HomePage() {
  const navigate = useNavigate();
  
  // State for Hero & Hot Arts
  const [products, setProducts] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [auroraColors, setAuroraColors] = useState(['#c9bfe8', '#b8afe8', '#9b8dd4']);
  
  // State for Feed Section
  const [feedProducts, setFeedProducts] = useState([]);
  const [feedPage, setFeedPage] = useState(0);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedHasMore, setFeedHasMore] = useState(true);
  const observerTarget = useRef(null);
  
  // Carousel Logic
  const heroSlides = Math.min(products.length, 5);
  const { currentIndex: heroIndex, goToNext: heroNext, goToPrev: heroPrev, goToSlide: goToHeroSlide, isTransitioning } = useCarousel(heroSlides, 5000);

  // Initial Fetch (Hero + Hot Arts)
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const data = await getAllProducts();
        // Sort by ID desc to get newest
        const sortedData = data.sort((a, b) => b.pid - a.pid);
        setProducts(sortedData.slice(0, 8)); 
        setError(null);
      } catch (err) {
        console.error('Failed to fetch products:', err);
        setError('Failed to load art.');
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Feed Pagination Logic
  const loadMoreFeedProducts = useCallback(async () => {
    if (feedLoading || !feedHasMore) return;
    
    try {
      setFeedLoading(true);
      const data = await getAllProducts();
      const sortedData = data.sort((a, b) => b.pid - a.pid);
      
      const pageSize = 12;
      const startIndex = feedPage * pageSize;
      const endIndex = startIndex + pageSize;
      const pageData = sortedData.slice(startIndex, endIndex);
      
      if (pageData.length === 0) {
        setFeedHasMore(false);
      } else {
        setFeedProducts(prev => [...prev, ...pageData]);
        setFeedPage(prev => prev + 1);
        if (endIndex >= sortedData.length) setFeedHasMore(false);
      }
    } catch (err) {
      console.error('Failed load feed:', err);
    } finally {
      setFeedLoading(false);
    }
  }, [feedPage, feedLoading, feedHasMore]);

  // Infinite Scroll Observer
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
    if (currentTarget) observer.observe(currentTarget);
    return () => {
      if (currentTarget) observer.unobserve(currentTarget);
    };
  }, [loadMoreFeedProducts, feedHasMore, feedLoading]);

  // Initial Feed Load
  useEffect(() => {
    loadMoreFeedProducts();
  }, []); 

  // Aurora Effect
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

      {/* --- HERO SECTION --- */}
      <header className={styles.heroSection}>
        <Aurora colorStops={auroraColors} amplitude={1.2} blend={0.6} speed={0.4} />
        
        <button className={styles.carouselArrow} onClick={heroPrev} disabled={isTransitioning}>&lt;</button>
        
        <div className={styles.heroContent}>
          {products.length > 0 ? (
            <>
              <div className={`${styles.heroText} ${isTransitioning ? styles.fadeOut : styles.fadeIn}`}>
                <h1>{products[heroIndex]?.productname || "Eye in Abstract"}</h1>
                <p>{products[heroIndex]?.productdesc || "A vibrant, colorful abstract painting."}</p>
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
                    <img src={products[heroIndex].screenshotPreviewUrl} alt="Art" className={styles.heroImageDisplay} />
                  ) : (
                    <div className={styles.heroImagePlaceholder}>[Image here]</div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className={styles.heroText}>
              <h1>Explore The Art World</h1>
              <p>Where Artists and Buyers Unite.</p>
            </div>
          )}
          
          {heroSlides > 1 && (
            <div className={styles.carouselIndicators}>
              {products.slice(0, 5).map((_, index) => (
                <button
                  key={index}
                  className={`${styles.indicator} ${index === heroIndex ? styles.active : ''}`}
                  onClick={() => goToHeroSlide(index)}
                  disabled={isTransitioning}
                />
              ))}
            </div>
          )}
        </div>

        <button className={styles.carouselArrow} onClick={heroNext} disabled={isTransitioning}>&gt;</button>
      </header>

      <main>
        {/* --- HOT ARTS --- */}
        <section className={styles.hotArtsSection}>
          <h2>Latest Hot Arts</h2>
          <p className={styles.sectionSubtitle}>Latest uploaded arts</p>
          {!loading && !error && (
            <div className={styles.hotArtsGrid}>
              {products.map((product) => (
                <Link key={product.pid} to={`/products/${product.pid}`} className={styles.hotArtCard}>
                  <div className={styles.hotArtImage}>
                    {product.screenshotPreviewUrl ? (
                      <img src={product.screenshotPreviewUrl} alt={product.productname} className={styles.productImage} loading="lazy" />
                    ) : (
                      <div className={styles.imagePlaceholder}>No Image</div>
                    )}
                    <FavoriteButton productId={product.pid} className={styles.favoriteButtonOverlay} />
                  </div>
                  <p>{product.productname}</p>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* --- FEED SECTION --- */}
        <section className={styles.feedSection}>
          <h2>Feed</h2>
          <p className={styles.sectionSubtitle}>Discover all artworks</p>
          <div className={styles.feedGrid}>
            {feedProducts.map((product) => (
              <Link key={product.pid} to={`/products/${product.pid}`} className={styles.feedCard}>
                <div className={styles.feedImage}>
                  <img src={product.screenshotPreviewUrl} alt={product.productname} className={styles.productImage} />
                  <FavoriteButton productId={product.pid} className={styles.favoriteButtonOverlay} />
                </div>
                <div className={styles.feedInfo}>
                  <p className={styles.feedProductName}>{product.productname}</p>
                  <p className={styles.feedProductPrice}>${product.price}</p>
                </div>
              </Link>
            ))}
          </div>
          {feedLoading && <div className={styles.feedLoading}><p>Loading...</p></div>}
          <div ref={observerTarget} className={styles.observerTarget} />
        </section>

        {/* --- PARTNERS & FOOTER --- */}
        <section className={styles.partnersSection}>
          <div className={styles.partnersContainer}>
            <div className={styles.partnersList}>
              <div className={styles.partnerLogo}><img src={partnerMaha} alt="Maha" className={styles.partnerImage}/></div>
              <div className={styles.partnerLogo}><img src={partnerFaber} alt="Faber" className={styles.partnerImage}/></div>
              <div className={styles.partnerLogo}><img src={partnerGallery} alt="Gallery" className={styles.partnerImage}/></div>
              <div className={styles.partnerLogo}><img src={partnerArtLabel} alt="Art Label" className={styles.partnerImage}/></div>
            </div>
            
            {/* Social Icons */}
            <div className={styles.socialIcons}>
              <a href="#" className={styles.socialLink}><img src={twitterIcon} alt="Twitter" /></a>
              <a href="#" className={styles.socialLink}><img src={facebookIcon} alt="Facebook" /></a>
              <a href="#" className={styles.socialLink}><img src={instagramIcon} alt="Instagram" /></a>
            </div>
          </div>
        </section>

      </main>
    </div>
  );
}

export default HomePage;