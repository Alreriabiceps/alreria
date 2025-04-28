import React, { useState, useEffect } from 'react'; // Added hooks
import styles from './Reviewers.module.css';

// --- Sample Data (Ensure 'subject' is added) ---
const allReviewersData = [
  { id: 1, title: 'Introduction to Algorithms', type: 'pdf', description: 'Chapter 1-3 concepts, complexity analysis.', url: '#', subject: 'General Mathematics' },
  { id: 2, title: 'Thermodynamics Basics Slides', type: 'pptx', description: 'Key slides from Lecture 5 on laws of thermo.', url: '#', subject: 'General Science' },
  { id: 3, title: 'Communication Styles Worksheet', type: 'docx', description: 'Practice exercises for identifying communication types.', url: '#', subject: 'Effective Communication' },
  { id: 4, title: 'Philippine History Timeline', type: 'pdf', description: 'Major events from pre-colonial to modern era.', url: '#', subject: 'Pag-aaral ng Kasaysayan' },
  { id: 5, title: 'Calculus I Cheat Sheet', type: 'pdf', description: 'Formulas for derivatives and integrals.', url: '#', subject: 'General Mathematics' },
  { id: 6, title: 'Ohm\'s Law Explained', type: 'pptx', description: 'Visual explanation and sample problems.', url: '#', subject: 'General Science' },
  { id: 7, title: 'Budgeting Template', type: 'docx', description: 'Simple template for personal budgeting.', url: '#', subject: 'Life Skills' },
  { id: 8, title: 'Scientific Method Overview', type: 'pdf', description: 'Steps and examples of the scientific method.', url: '#', subject: 'General Science' },
  { id: 9, title: 'Active Listening Guide', type: 'pdf', description: 'Tips and techniques for better listening.', url: '#', subject: 'Effective Communication'},
];
// --------------------------

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


const Reviewers = () => {
  // --- State ---
  const [allReviewers, ] = useState(allReviewersData); // Hold original data
  const [filteredReviewers, setFilteredReviewers] = useState(allReviewersData); // Data to display
  const [selectedSubject, setSelectedSubject] = useState(''); // '' means 'All'
  const [selectedFileType, setSelectedFileType] = useState(''); // '' means 'All'
  const [searchTerm, setSearchTerm] = useState('');

  // --- Filtering Logic ---
  useEffect(() => {
    let result = allReviewers;

    // Filter by Subject
    if (selectedSubject) {
      result = result.filter(item => item.subject === selectedSubject);
    }

    // Filter by File Type
    if (selectedFileType) {
      result = result.filter(item => item.type.toLowerCase() === selectedFileType);
    }

    // Filter by Search Term (Title or Description)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.title.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    setFilteredReviewers(result);
  }, [selectedSubject, selectedFileType, searchTerm, allReviewers]); // Re-run filter when these change


  // TODO: Add useEffect to fetch reviewer data from API and setAllReviewers

  return (
    <div className={styles.reviewersContainer}>
      <div className={styles.reviewersPanel}>
        <h1 className={styles.reviewersTitle}>// Review Materials //</h1>

        {/* --- Filters Section --- */}
        <div className={styles.filterSection}>
          {/* Removed redundant header */}
          <div className={styles.filterControls}>
            {/* Subject Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="subject-filter" className={styles.filterLabel}>Subject</label>
              <div className={styles.filterInputContainer}>
                {/* Optional Icon */}
                {/* <span className={styles.filterInputIcon}>📚</span> */}
                <select
                  id="subject-filter"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                  className={styles.filterSelect}
                  style={{ paddingLeft: '12px'}} // Adjust padding if no icon
                >
                  <option value="">All Subjects</option>
                  {SUBJECTS.map(subject => (
                    <option key={subject} value={subject}>{subject}</option>
                  ))}
                </select>
              </div>
            </div>

             {/* File Type Filter */}
            <div className={styles.filterGroup}>
              <label htmlFor="filetype-filter" className={styles.filterLabel}>File Type</label>
              <div className={styles.filterInputContainer}>
                 {/* Optional Icon */}
                {/* <span className={styles.filterInputIcon}>📄</span> */}
                <select
                  id="filetype-filter"
                  value={selectedFileType}
                  onChange={(e) => setSelectedFileType(e.target.value)}
                  className={styles.filterSelect}
                   style={{ paddingLeft: '12px'}} // Adjust padding if no icon
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
                 <span className={styles.filterInputIcon}>🔍</span>
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
          </div>
        </div>
        {/* --- End Filters Section --- */}


        <ul className={styles.reviewersList}>
          {/* Map over FILTERED data */}
          {filteredReviewers.length > 0 ? (
            filteredReviewers.map((reviewer) => (
              <li key={reviewer.id} className={styles.reviewerItem}>
                <div className={`${styles.fileIcon} ${getIconClass(reviewer.type)}`}>
                  {reviewer.type?.toUpperCase()}
                </div>
                <div className={styles.fileInfo}>
                  <h3 className={styles.fileTitle}>{reviewer.title}</h3>
                  <p className={styles.fileDescription}>{reviewer.description}</p>
                </div>
                <a
                  href={reviewer.url}
                  download
                  target="_blank"
                  rel="noopener noreferrer"
                  className={styles.downloadButton}
                  aria-label={`Download ${reviewer.title}`}
                >
                  Access
                </a>
              </li>
            ))
          ) : (
             // Use appropriate message (could be different if search term exists)
            <p style={{textAlign: 'center', fontFamily: 'var(--font-body)', fontSize: '1.2rem', color: 'var(--color-text-muted)', marginTop: '30px'}}>
                No review materials found matching your filters.
            </p>
          )}
        </ul>
      </div>
    </div>
  );
};

export default Reviewers;