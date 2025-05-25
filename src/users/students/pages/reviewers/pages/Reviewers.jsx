import React, { useState, useEffect, useRef } from 'react'; // Added hooks
import styles from './Reviewers.module.css';
import { FaSearch, FaBook, FaFileAlt, FaSyncAlt, FaStar, FaRegStar, FaFilePdf, FaFileWord, FaFilePowerpoint, FaTag, FaEraser } from 'react-icons/fa';
import FloatingStars from '../../../components/FloatingStars/FloatingStars';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { useSwipeable } from 'react-swipeable';
// import 'pdfjs-dist/legacy/build/pdf.worker.entry'; // REMOVE THIS LINE
pdfjsLib.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjsLib.version}/legacy/build/pdf.worker.min.js`;

// --- Define File Types and Subjects ---
const FILE_TYPES = ['pdf', 'docx', 'pptx']; // Or derive dynamically if needed
const SUBJECTS = [ // Make sure this list aligns with your data
    "Effective Communication",
    "Life Skills",
    "General Mathematics",
    "General Science",
    "Pag-aaral ng Kasaysayan"
];
// -------------------------------------

// Helper to get icon class (Keep as is)
const getIconClass = (type) => { /* ... */
    const extension = type?.toLowerCase();
    if (extension === 'pdf') return styles.iconPdf;
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
        const viewport = page.getViewport({ scale: 0.25 });
        const canvas = canvasRef.current;
        if (!canvas) return;
        const context = canvas.getContext('2d');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        await page.render({ canvasContext: context, viewport }).promise;
      } catch (err) {
        if (isMounted) setError(true);
      }
    };
    renderThumbnail();
    return () => { isMounted = false; };
  }, [url]);
  if (error) return <FaFilePdf style={{ color: '#e53e3e', fontSize: 32 }} />;
  return <canvas ref={canvasRef} className={styles.pdfThumbnailPreview} title="PDF preview" />;
};

const getFileTypeIcon = (type, url) => {
  const extension = type?.toLowerCase();
  if (extension === 'pdf' && url) return <PdfThumbnail url={url} />;
  if (extension === 'pdf') return <FaFilePdf style={{ color: '#e53e3e' }} />;
  if (extension === 'docx' || extension === 'doc') return <FaFileWord style={{ color: '#3182ce' }} />;
  if (extension === 'pptx' || extension === 'ppt') return <FaFilePowerpoint style={{ color: '#d69e2e' }} />;
  return <FaFileAlt />;
};

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'title-asc', label: 'Title (A-Z)' },
  { value: 'title-desc', label: 'Title (Z-A)' },
];

const ITEMS_PER_PAGE = 6;

const isMobile = () => window.innerWidth <= 768;

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
  return (
    <li
      className={styles.reviewerItem}
      style={{
        background:
          swipeAction[reviewer.id] === 'left'
            ? 'rgba(52, 152, 219, 0.12)'
            : swipeAction[reviewer.id] === 'right'
            ? 'rgba(250, 204, 21, 0.18)'
            : undefined,
        transition: 'background 0.2s',
      }}
      {...(isMobile() ? swipeHandlers : {})}
    >
      <div
        className={styles.fileHeader}
        style={{ cursor: 'pointer', minHeight: 56 }}
        onClick={() => onExpand(isExpanded ? null : reviewer.id)}
        aria-expanded={isExpanded}
        aria-controls={`reviewer-details-${reviewer.id}`}
      >
        <div className={`${styles.fileIcon} ${getIconClass(reviewer.type)}`}>
          {getFileTypeIcon(reviewer.type, reviewer.url)}
          <span className={styles.fileTypeLabel}>{reviewer.type?.toUpperCase()}</span>
        </div>
        <div className={styles.fileInfo}>
          <h3 className={styles.fileTitle}>{reviewer.title}</h3>
        </div>
        {/* Favorite/Bookmark */}
        <button
          className={styles.favoriteButton || 'btn btn-ghost btn-xs'}
          style={{ marginLeft: 'auto', fontSize: 22, color: isFavorite ? '#facc15' : '#aaa' }}
          onClick={e => { e.stopPropagation(); onFavorite(reviewer.id); }}
          title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          disabled={!token}
        >
          {isFavorite ? <FaStar /> : <FaRegStar />}
        </button>
        <button
          className={styles.downloadButton}
          aria-label={`Download ${reviewer.title}`}
          onClick={e => { e.stopPropagation(); onAccess(reviewer.id, reviewer.url); }}
          disabled={isDownloading}
          style={{ minWidth: 80, marginLeft: 8 }}
        >
          {isDownloading ? 'Accessing...' : 'Access'}
        </button>
      </div>
      {/* Collapsible Details */}
      {isExpanded && (
        <div
          id={`reviewer-details-${reviewer.id}`}
          className={styles.collapsibleDetails}
          style={{ marginTop: 10, padding: '8px 0 0 0', borderTop: '1px solid #2228', fontSize: 15 }}
        >
          <p className={styles.fileDescription}>{reviewer.description}</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
            <span className={styles.downloadCount} title="Number of accesses/downloads" style={{ fontSize: 13, color: '#888' }}>
              {reviewer.downloadCount || 0} downloads
            </span>
          </div>
        </div>
      )}
    </li>
  );
}

const Reviewers = () => {
  // --- State ---
  const [allReviewers, setAllReviewers] = useState([]); // Hold fetched data
  const [filteredReviewers, setFilteredReviewers] = useState([]); // Data to display
  const [selectedSubjects, setSelectedSubjects] = useState([]); // Multi-select
  const [selectedTags, setSelectedTags] = useState([]); // Multi-select
  const [selectedFileType, setSelectedFileType] = useState(''); // '' means 'All'
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [page, setPage] = useState(1);
  const [favorites, setFavorites] = useState([]); // Array of reviewerLink IDs
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [downloading, setDownloading] = useState({}); // { [id]: boolean }
  const [expandedId, setExpandedId] = useState(null); // For collapsible cards
  const [swipeAction, setSwipeAction] = useState({}); // { [id]: 'left' | 'right' | null }

  // Get student token from localStorage
  const token = localStorage.getItem('token');

  // Fetch reviewer links
  const fetchReviewers = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links`);
      if (!res.ok) throw new Error('Failed to fetch reviewer links');
      const data = await res.json();
      const mapped = data.map(item => ({
        id: item._id,
        title: item.title,
        type: item.fileType,
        description: item.description,
        url: item.link,
        subject: item.subject,
        createdAt: item.createdAt,
        downloadCount: item.downloadCount || 0,
      }));
      setAllReviewers(mapped);
      setFilteredReviewers(mapped);
      setPage(1);
    } catch (err) {
      setError('Could not load reviewer links.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch favorites for current student
  const fetchFavorites = async () => {
    if (!token) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/students/favorite-reviewers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch favorites');
      const data = await res.json();
      setFavorites(data.map(fav => fav.reviewerLink._id));
    } catch (err) {
      // Ignore error, just show no favorites
      setFavorites([]);
    }
  };

  useEffect(() => {
    fetchReviewers();
    fetchFavorites();
    // eslint-disable-next-line
  }, []);

  // Parse all unique subjects from reviewer links
  const allSubjects = Array.from(new Set(allReviewers.flatMap(r => r.subjects || (r.subject ? [r.subject] : []))));

  // Filtering, sorting, and favorites
  useEffect(() => {
    let result = allReviewers;
    // Single-subject filter
    if (selectedSubjects.length > 0) {
      result = result.filter(item => {
        const itemSubject = item.subject || (item.subjects && item.subjects[0]);
        return itemSubject === selectedSubjects[0];
      });
    }
    if (selectedFileType) {
      result = result.filter(item => item.type.toLowerCase() === selectedFileType);
    }
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm)
      );
    }
    if (showFavoritesOnly) {
      result = result.filter(item => favorites.includes(item.id));
    }
    // Sorting
    if (sortBy === 'newest') {
      result = [...result].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === 'oldest') {
      result = [...result].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === 'title-asc') {
      result = [...result].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'title-desc') {
      result = [...result].sort((a, b) => b.title.localeCompare(a.title));
    }
    setFilteredReviewers(result);
    setPage(1);
  }, [selectedSubjects, selectedFileType, searchTerm, allReviewers, sortBy, showFavoritesOnly, favorites]);

  // Pagination
  const totalPages = Math.ceil(filteredReviewers.length / ITEMS_PER_PAGE);
  const paginatedReviewers = filteredReviewers.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const handlePrev = () => setPage(p => Math.max(1, p - 1));
  const handleNext = () => setPage(p => Math.min(totalPages, p + 1));
  const handleRefresh = () => { fetchReviewers(); fetchFavorites(); };

  // Favorite/Unfavorite
  const handleToggleFavorite = async (id) => {
    if (!token) {
      alert('You must be logged in as a student to favorite reviewers.');
      return;
    }
    if (favorites.includes(id)) {
      // Remove favorite
      await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/students/favorite-reviewers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      setFavorites(favs => favs.filter(favId => favId !== id));
    } else {
      // Add favorite
      await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/students/favorite-reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ reviewerLink: id }),
      });
      setFavorites(favs => [...favs, id]);
    }
  };

  // Download tracking
  const handleAccess = async (id, url) => {
    setDownloading(d => ({ ...d, [id]: true }));
    try {
      await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${id}/increment-download`, {
        method: 'POST',
      });
      // Optimistically update download count in UI
      setAllReviewers(prev => prev.map(r => r.id === id ? { ...r, downloadCount: (r.downloadCount || 0) + 1 } : r));
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      alert('Could not track download.');
    } finally {
      setDownloading(d => ({ ...d, [id]: false }));
    }
  };

  return (
    <div className={styles.reviewersContainer}>
      <FloatingStars />
      <div className={styles.reviewersPanel}>
        <h1 className={styles.reviewersTitle}>// Review Materials //</h1>

        {/* --- Filters Section --- */}
        <div className={styles.filterSection}>
          <div className={styles.filterControls}>
            {/* Subject Filter (single-select dropdown) */}
            <div className={styles.filterGroup}>
              <label htmlFor="subject-filter" className={styles.filterLabel}>Subject</label>
              <div className={styles.filterInputContainer}>
                <FaBook className={styles.filterInputIcon} />
                <select
                  id="subject-filter"
                  value={selectedSubjects[0]}
                  onChange={e => setSelectedSubjects([e.target.value])}
                  className={styles.filterSelectWithIcon}
                >
                  <option value="">All Subjects</option>
                  {allSubjects.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
            </div>
            {/* File Type Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filetype-filter" className={styles.filterLabel}>File Type</label>
              <div className={styles.filterInputContainer}>
                <FaFileAlt className={styles.filterInputIcon} />
                <select
                  id="filetype-filter"
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className={styles.filterSelectWithIcon} /* Use class for padding with icon */
                >
                  <option value="">All Types</option>
                  {FILE_TYPES.map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Search Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="search-filter" className={styles.filterLabel}>Search</label>
              <div className={styles.filterInputContainer}>
                 <FaSearch className={styles.filterInputIcon} />
                <input
                  type="text"
                  id="search-filter"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={styles.filterInput}
                  placeholder="Search title or description..."
                />
              </div>
            </div>

            {/* Sort Dropdown */}
            <div className={styles.filterGroup}>
              <label htmlFor="sort-filter" className={styles.filterLabel}>Sort By</label>
              <div className={styles.filterInputContainer}>
                <select
                  id="sort-filter"
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value)}
                  className={styles.filterSelectWithIcon}
                >
                  {SORT_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Favorites Only Toggle */}
            <div className={styles.filterGroup} style={{ alignItems: 'flex-end' }}>
              <label className={styles.filterLabel} style={{ marginBottom: 0, marginRight: 8 }}>
                <input
                  type="checkbox"
                  checked={showFavoritesOnly}
                  onChange={e => setShowFavoritesOnly(e.target.checked)}
                  style={{ marginRight: 6 }}
                  disabled={!token}
                />
                Favorites Only
              </label>
            </div>

            {/* Refresh Button */}
            <div className={styles.filterGroup} style={{ alignItems: 'flex-end' }}>
              <button
                type="button"
                className={styles.refreshButton || 'btn btn-sm btn-outline'}
                onClick={handleRefresh}
                title="Refresh reviewer links"
                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
              >
                <FaSyncAlt /> Refresh
              </button>
            </div>
          </div>
        </div>
        {/* --- End Filters Section --- */}

        {loading ? (
          <div style={{ textAlign: 'center', marginTop: 40 }}>Loading...</div>
        ) : error ? (
          <div style={{ textAlign: 'center', marginTop: 40, color: 'red' }}>{error}</div>
        ) : (
          <>
            <ul className={styles.reviewersList} style={{ gridTemplateColumns: '1fr' }}>
              {paginatedReviewers.length > 0 ? (
                paginatedReviewers.map((reviewer, index) => (
                  <ReviewerCard
                    key={reviewer.id}
                    reviewer={reviewer}
                    isExpanded={expandedId === reviewer.id}
                    onExpand={setExpandedId}
                    onFavorite={handleToggleFavorite}
                    onAccess={handleAccess}
                    isFavorite={favorites.includes(reviewer.id)}
                    isDownloading={downloading[reviewer.id]}
                    token={token}
                    swipeAction={swipeAction}
                    setSwipeAction={setSwipeAction}
                  />
                ))
              ) : (
                <p style={{textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1.2rem', color: 'var(--color-text-muted)', marginTop: '30px'}}>
                  No review materials found matching your filters.
                </p>
              )}
            </ul>
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                <button
                  className={styles.paginationButton || 'btn btn-sm btn-outline'}
                  onClick={handlePrev}
                  disabled={page === 1}
                >
                  Previous
                </button>
                <span style={{ alignSelf: 'center' }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  className={styles.paginationButton || 'btn btn-sm btn-outline'}
                  onClick={handleNext}
                  disabled={page === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Reviewers;