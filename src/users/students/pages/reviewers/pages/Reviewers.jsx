import React, { useState, useEffect, useRef } from 'react'; // Added hooks
import styles from './Reviewers.module.css';
import { FaSearch, FaBook, FaFileAlt, FaSyncAlt, FaStar, FaRegStar, FaFilePdf, FaFileWord, FaFilePowerpoint, FaTag, FaEraser, FaFilter, FaListUl, FaHeart, FaUndo, FaChevronDown, FaChevronUp } from 'react-icons/fa'; // Added more icons
import FloatingStars from '../../../components/FloatingStars/FloatingStars';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { useSwipeable } from 'react-swipeable';
// import 'pdfjs-dist/legacy/build/pdf.worker.entry'; // REMOVE THIS LINE
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

// --- Define File Types and Subjects ---
const FILE_TYPES = ['pdf', 'docx', 'pptx']; // Or derive dynamically if needed
// const SUBJECTS = [ // This will be dynamically populated now
//     "Effective Communication",
//     "Life Skills",
//     "General Mathematics",
//     "General Science",
//     "Pag-aaral ng Kasaysayan"
// ];
// -------------------------------------

// Helper to get icon class (Keep as is, but ensure classes exist in new CSS)
const getIconClass = (type) => {
    const extension = type?.toLowerCase();
    if (extension === 'pdf') return styles.iconPdf;
    if (extension === 'docx' || extension === 'doc') return styles.iconDocx;
    if (extension === 'pptx' || extension === 'ppt') return styles.iconPptx;
    return styles.iconDefault;
};

// Helper to get original icon class for PDF preview background if needed
const getOriginalIconClassForBg = (type) => {
    const extension = type?.toLowerCase();
    if (extension === 'pdf') return styles.iconPdf; // Assumes these provide background-color
    if (extension === 'docx' || extension === 'doc') return styles.iconDocx;
    if (extension === 'pptx' || extension === 'ppt') return styles.iconPptx;
    return styles.iconDefault;
};

// PDF Thumbnail Preview Component
const PdfThumbnail = ({ url }) => {
  const canvasRef = useRef(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let isMounted = true;
    const renderThumbnail = async () => {
      try {
        const loadingTask = pdfjsLib.getDocument(url);
        const pdf = await loadingTask.promise;
        const page = await pdf.getPage(1);
        const viewport = page.getViewport({ scale: 0.2 });
        const canvas = canvasRef.current;
        if (!canvas || !isMounted) return;
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        if (isMounted) setError(true);
        console.error("Error rendering PDF thumbnail:", err);
      }
    };
    if (url && canvasRef.current) renderThumbnail();
    return () => { isMounted = false; };
  }, [url]);

  if (error) return <FaFilePdf className={styles.fileIconFallback} />;
  return <canvas ref={canvasRef} className={styles.pdfThumbnailPreview} title="PDF preview" />;
};

// Updated to return elements with classes for styling via CSS modules
const getFileTypeIcon = (type, url) => {
  const extension = type?.toLowerCase();
  if (extension === 'pdf') {
    // Using a wrapper for PdfThumbnail to control its size if needed, or rely on canvas intrinsic size
    return url ? <PdfThumbnail url={url} /> : <FaFilePdf className={`${styles.fileTypeDisplayIcon} ${styles.iconPdfColor}`} />;
  }
  if (extension === 'docx' || extension === 'doc') return <FaFileWord className={`${styles.fileTypeDisplayIcon} ${styles.iconDocxColor}`} />;
  if (extension === 'pptx' || extension === 'ppt') return <FaFilePowerpoint className={`${styles.fileTypeDisplayIcon} ${styles.iconPptxColor}`} />;
  return <FaFileAlt className={`${styles.fileTypeDisplayIcon} ${styles.iconDefaultColor}`} />;
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
  // Add more if needed, e.g., by subject, by download count
];

const ITEMS_PER_PAGE = 8; // Increased slightly for compact cards

const isMobile = () => typeof window !== 'undefined' && window.innerWidth <= 768;

// ... (ReviewerCard component will be refactored later)

// Main Reviewers Component
const Reviewers = () => {
  // --- State ---
  const [allReviewers, setAllReviewers] = useState([]);
  const [filteredReviewers, setFilteredReviewers] = useState([]);
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [uniqueSubjects, setUniqueSubjects] = useState([]); // For dynamic filter options
  const [uniqueFileTypes, setUniqueFileTypes] = useState([]); // For dynamic filter options
  // const [selectedTags, setSelectedTags] = useState([]); // Tags seem unused, can remove or implement fully
  const [selectedFileType, setSelectedFileType] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true); // Start with loading true
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [downloading, setDownloading] = useState({});
  const [expandedId, setExpandedId] = useState(null);
  const [swipeAction, setSwipeAction] = useState({});

  const token = localStorage.getItem('token');

  const fetchReviewers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links`);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({ message: 'Failed to fetch reviewer links' }));
        throw new Error(errorData.message || 'Failed to fetch reviewer links');
      }
      const data = await res.json();
      const mapped = data.map(item => ({
        id: item._id,
        title: item.title,
        type: item.fileType?.toLowerCase(), // Ensure lowercase for consistency
        description: item.description,
        url: item.link,
        subject: item.subject, // This might be a single string or an array from backend
        subjects: Array.isArray(item.subjects) ? item.subjects : (item.subject ? [item.subject] : []), // Normalize subjects
        tags: item.tags || [], // Ensure tags is an array
        createdAt: item.createdAt,
        downloadCount: item.downloadCount || 0,
      }));
      setAllReviewers(mapped);

      // Dynamically populate filter options
      const subjects = Array.from(new Set(mapped.flatMap(r => r.subjects))).sort();
      const fileTypes = Array.from(new Set(mapped.map(r => r.type).filter(Boolean))).sort();
      setUniqueSubjects(subjects);
      setUniqueFileTypes(fileTypes);

    } catch (err) {
      setError(err.message || 'Could not load reviewer links.');
      setAllReviewers([]); // Clear data on error
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/students/favorite-reviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      setFavorites(data.map(fav => fav.reviewerLink?._id).filter(Boolean)); // Ensure fav.reviewerLink exists
    } catch (err) {
      // console.error("Error fetching favorites:", err); // Optional: log error
      setFavorites([]);
    }
  };

  useEffect(() => {
    fetchReviewers();
    fetchFavorites();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]); // Re-fetch if token changes, though unlikely in this context

  useEffect(() => {
    let result = showFavoritesOnly
      ? allReviewers.filter(r => favorites.includes(r.id))
      : allReviewers;

    if (searchTerm) {
      result = result.filter(r =>
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.subjects.some(s => s.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }
    if (selectedFileType) {
      result = result.filter(r => r.type === selectedFileType);
    }
    if (selectedSubjects.length > 0) {
      result = result.filter(r => r.subjects.some(s => selectedSubjects.includes(s)));
    }

    // Sorting logic (ensure stability or add secondary sort if needed)
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest': return new Date(b.createdAt) - new Date(a.createdAt);
        case 'oldest': return new Date(a.createdAt) - new Date(b.createdAt);
        case 'title-asc': return a.title.localeCompare(b.title);
        case 'title-desc': return b.title.localeCompare(a.title);
        default: return 0;
      }
    });

    setFilteredReviewers(result);
    setPage(1); // Reset to first page on filter/sort change
  }, [allReviewers, searchTerm, selectedFileType, selectedSubjects, sortBy, favorites, showFavoritesOnly]);

  const totalPages = Math.max(1, Math.ceil(filteredReviewers.length / ITEMS_PER_PAGE));
  const currentReviewers = filteredReviewers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handleSelectSubject = (subject) => {
    setSelectedSubjects(prev =>
      prev.includes(subject) ? prev.filter(s => s !== subject) : [...prev, subject]
    );
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setSelectedFileType('');
    setSelectedSubjects([]);
    setSortBy('newest');
    setShowFavoritesOnly(false); // Also reset favorites filter
  };

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
  const handleRefresh = () => { fetchReviewers(); fetchFavorites(); };

  const handleToggleFavorite = async (id) => {
    if (!token) { setError("You must be logged in to manage favorites."); return; }
    const originalFavorites = [...favorites];
    const isCurrentlyFavorite = favorites.includes(id);
    const optimisticFavorites = isCurrentlyFavorite ? favorites.filter(favId => favId !== id) : [...favorites, id];
    setFavorites(optimisticFavorites);

    try {
      const method = isCurrentlyFavorite ? 'DELETE' : 'POST';
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/students/favorite-reviewers/${id}`, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        setFavorites(originalFavorites); // Revert on error
        throw new Error(isCurrentlyFavorite ? 'Failed to unfavorite' : 'Failed to favorite');
      }
      // Optionally re-fetch favorites to ensure consistency, or trust optimistic update
      // fetchFavorites(); 
    } catch (err) {
      setError(err.message);
      setFavorites(originalFavorites); // Revert on error
    }
  };

  const handleAccess = async (id, url) => {
    if (!url) { setError("No URL available for this item."); return; }
    setDownloading(prev => ({ ...prev, [id]: true }));
    try {
      // Increment download count on backend
      await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${id}/increment-download`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }, // Assuming admin or specific student endpoint
      });
      // Update local state for download count immediately for responsiveness (optional)
      setAllReviewers(prev => prev.map(r => r.id === id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
      window.open(url, '_blank');
    } catch (err) {
      // console.error("Error accessing/incrementing download:", err);
      // Still open the URL even if count increment fails
      window.open(url, '_blank');
    } finally {
      setDownloading(prev => ({ ...prev, [id]: false }));
    }
  };

  return (
    <div className={styles.reviewersContainer}>
      <FloatingStars />
      <div className={styles.pageHeaderWrapper}> {/* Added wrapper */} 
        <h1 className={styles.pageTitle}>Reviewer Materials</h1> {/* Changed class */} 
      </div>

      <div className={styles.contentPanelWrapper}> {/* Changed class */} 
        {/* Filter Section */}
        <div className={styles.filterSection}>
          <div className={styles.filterControls}>
            {/* Search Input */}
            <div className={styles.filterGroup}>
              <label htmlFor="searchTerm" className={styles.filterLabel}>Search by Title/Keyword</label>
              <div className={styles.filterInputContainer}>
                <FaSearch className={styles.filterInputIcon} />
                <input
                  type="text"
                  id="searchTerm"
                  className={styles.filterInput} // Uses filterControlBase via composes
                  placeholder="E.g., Communication, Math, History..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Sort By Dropdown */}
            <div className={styles.filterGroup}>
              <label htmlFor="sortBy" className={styles.filterLabel}>Sort By</label>
              <div className={styles.filterInputContainer}>
                 <FaListUl className={styles.filterInputIcon} /> {/* Example Icon */} 
                <select
                  id="sortBy"
                  className={styles.filterSelectWithIcon} // Uses filterControlBase via composes
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                >
                  {SORT_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
            </div>
          </div>
            
          {/* File Type Chips (if uniqueFileTypes has items) */}
          {uniqueFileTypes.length > 0 && (
            <div className={styles.filterGroup} style={{ marginTop: '15px' }}>
              <label className={styles.filterLabel}>Filter by File Type</label>
              <div className={styles.filterChipsScroll}>
                {uniqueFileTypes.map(fileType => (
                  <label key={fileType} className={`${styles.chipCheckbox} ${selectedFileType === fileType ? styles.selected : ''}`}>
                    <input
                      type="radio"
                      name="fileTypeFilter"
                      value={fileType}
                      checked={selectedFileType === fileType}
                      onChange={() => setSelectedFileType(prev => prev === fileType ? '' : fileType)} // Toggle behavior: click again to clear
                    />
                    {/* Optional: Add icon to chip based on fileType */}
                    {/* getFileTypeIcon(fileType) */} 
                    {fileType.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Subject Chips (if uniqueSubjects has items) */}
          {uniqueSubjects.length > 0 && (
            <div className={styles.filterGroup} style={{ marginTop: '15px' }}>
              <label className={styles.filterLabel}>Filter by Subject</label>
              <div className={styles.filterChipsScroll}>
                {uniqueSubjects.map(subject => (
                  <label key={subject} className={`${styles.chipCheckbox} ${selectedSubjects.includes(subject) ? styles.selected : ''}`}>
                    <input
                      type="checkbox"
                      value={subject}
                      checked={selectedSubjects.includes(subject)}
                      onChange={() => handleSelectSubject(subject)}
                    />
                    {/* <FaTag className={styles.chipIcon} />  Example Icon */}
                    {subject}
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className={styles.filterActions}>
            <button onClick={handleClearFilters} className={styles.clearFilterBtn}>
              <FaEraser style={{ marginRight: '6px' }} /> Clear Filters
            </button>
            <button onClick={handleRefresh} className={styles.refreshButton} title="Refresh List">
              <FaSyncAlt />
            </button>
            {token && ( /* Show favorites toggle only if logged in */
              <button onClick={() => setShowFavoritesOnly(!showFavoritesOnly)} className={styles.toggleFavoriteButton}>
                <FaHeart style={{ marginRight: '6px' }} /> {showFavoritesOnly ? 'Show All' : 'My Favorites'}
              </button>
            )}
          </div>
        </div>

        {/* Loading and Error States */}
        {loading && <p className={styles.loadingMessage}>Loading reviewer materials...</p>}
        {error && <p className={styles.errorMessage}>{error}</p>}

        {/* Reviewers List (Content to be refactored next) */}
        {!loading && !error && currentReviewers.length === 0 && (
          <p className={styles.infoMessage}>No reviewer materials found matching your criteria. Try adjusting the filters.</p>
        )}
        {!loading && !error && currentReviewers.length > 0 && (
          <ul className={styles.reviewersList}>
            {currentReviewers.map((reviewer, index) => (
              <ReviewerCard
                key={reviewer.id} 
                reviewer={reviewer}
                isExpanded={expandedId === reviewer.id}
                onExpand={setExpandedId}
                onFavorite={handleToggleFavorite}
                onAccess={handleAccess}
                isFavorite={favorites.includes(reviewer.id)}
                isDownloading={downloading[reviewer.id]}
                token={token} // Pass token for enabling/disabling favorite button
                swipeAction={swipeAction}
                setSwipeAction={setSwipeAction}
                itemIndex={index} // For animation delay
              />
            ))}
          </ul>
        )}

        {/* Pagination (To be refactored next) */}
        {!loading && !error && totalPages > 1 && (
          <div className={styles.paginationControls}>
            <button onClick={handlePrev} disabled={page === 1} className={styles.paginationButton}>Previous</button>
            <span className={styles.paginationInfo}>Page {page} of {totalPages}</span>
            <button onClick={handleNext} disabled={page === totalPages} className={styles.paginationButton}>Next</button>
          </div>
        )}
      </div>
    </div>
  );
};

// THIS IS THE ReviewerCard component, to be refactored with new styles
function ReviewerCard({
  reviewer,
  isExpanded,
  onExpand,
  onFavorite,
  onAccess,
  isFavorite,
  isDownloading,
  token,
  swipeAction,
  setSwipeAction,
  itemIndex // For animation delay
}) {
  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      if (isMobile()) onAccess(reviewer.id, reviewer.url);
      setSwipeAction(a => ({ ...a, [reviewer.id]: 'left' }));
      setTimeout(() => setSwipeAction(a => ({ ...a, [reviewer.id]: null })), 400); 
    },
    onSwipedRight: () => {
      if (isMobile()) onFavorite(reviewer.id);
      setSwipeAction(a => ({ ...a, [reviewer.id]: 'right' }));
      setTimeout(() => setSwipeAction(a => ({ ...a, [reviewer.id]: null })), 400);
    },
    delta: 40,
    trackTouch: true,
    trackMouse: false, 
  });

  // Determine card background based on swipe action (visual feedback)
  const cardStyle = {
    transition: 'background 0.2s ease-out', // Smoother transition
    animationDelay: `${itemIndex * 0.05}s` // Stagger animation
  };
  if (swipeAction && swipeAction[reviewer.id] === 'left') {
    cardStyle.background = 'rgba(var(--dbz-blue-rgb, 52, 152, 219), 0.15)'; // Use theme variable
  } else if (swipeAction && swipeAction[reviewer.id] === 'right') {
    cardStyle.background = 'rgba(var(--blueprint-accent-rgb, 241, 196, 15), 0.2)'; // Use theme variable
  }

  return (
    // .reviewerItem will be restyled for compactness
    <li 
      className={styles.reviewerItem} 
      style={cardStyle} 
      {...(isMobile() ? swipeHandlers : {})}
    >
      <div 
        className={styles.fileHeader} 
        onClick={() => onExpand(isExpanded ? null : reviewer.id)}
        aria-expanded={isExpanded}
        aria-controls={`reviewer-details-${reviewer.id}`}
        role="button"
        tabIndex={0}
        onKeyPress={(e) => (e.key === 'Enter' || e.key === ' ') && onExpand(isExpanded ? null : reviewer.id)}
      >
        <div className={`${styles.fileIconContainer} ${getOriginalIconClassForBg(reviewer.type)}`}> {/* Changed to fileIconContainer if it has specific sizing now */}
          {getFileTypeIcon(reviewer.type, reviewer.url)}
          {/* <span className={styles.fileTypeLabel}>{reviewer.type?.toUpperCase()}</span> Removed if icon is enough, or restyle */}
        </div>
        <div className={styles.fileInfo}>
          <h3 className={styles.fileTitle} title={reviewer.title}>{reviewer.title}</h3>
          <p className={styles.fileMeta}> {/* New class for subject/date */} 
            <span>{reviewer.subjects?.join(', ') || 'General'}</span>
            {reviewer.createdAt && (
                <span>{new Date(reviewer.createdAt).toLocaleDateString()}</span>
            )}
          </p>
        </div>
        
        <div className={styles.cardActions}> {/* Wrapper for action buttons */} 
          <button
            className={`${styles.iconButton} ${styles.favoriteButtonAction} ${isFavorite ? styles.isFavorite : ''}`} // New classes for styling as icon button
            onClick={e => { e.stopPropagation(); onFavorite(reviewer.id); }}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
            disabled={!token || isDownloading} // Disable if no token or another action is in progress
            aria-pressed={isFavorite}
          >
            {isFavorite ? <FaStar /> : <FaRegStar />}
          </button>
          <button
            className={styles.accessButton} // New class, will use themedButton base
            onClick={e => { e.stopPropagation(); onAccess(reviewer.id, reviewer.url); }}
            disabled={isDownloading || !reviewer.url} 
            title={!reviewer.url ? "URL not available" : (isDownloading ? "Accessing..." : "Access File")}
          >
            {isDownloading ? 'Opening...' : 'Access'}
          </button>
          <button 
            className={styles.iconButton} 
            title={isExpanded ? "Collapse details" : "Expand details"} 
            style={{marginTop: token ? '0' : 'auto'}} // Align expand button if no favorite button
            aria-label={isExpanded ? "Collapse details" : "Expand details"}
            onClick={() => onExpand(isExpanded ? null : reviewer.id)} // No stopPropagation needed here
            >
            {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div 
          id={`reviewer-details-${reviewer.id}`} 
          className={styles.collapsibleDetails}
        >
          <p className={styles.fileDescription}>{reviewer.description || "No description available."}</p>
          <div className={styles.detailsFooter}>
            <span className={styles.downloadCount} title="Number of accesses/downloads">
              <FaBook style={{marginRight: '4px'}}/> {reviewer.downloadCount || 0} accesses
            </span>
            {/* Add more details if needed, e.g. tags */}
            {reviewer.tags && reviewer.tags.length > 0 && (
                <div className={styles.tagList}>
                    {reviewer.tags.map(tag => <span key={tag} className={styles.tagItem}>{tag}</span>)}
                </div>
            )}
          </div>
        </div>
      )}
    </li>
  );
}

export default Reviewers;