import React, { useState, useEffect, useRef } from 'react';
import { 
  MdAdd, MdEdit, MdDelete, MdSearch, MdFilterList, MdLink, MdFileDownload,
  MdUpload, MdRefresh, MdAnalytics, MdCheckCircle, MdError, MdWarning,
  MdSelectAll, MdClear, MdContentCopy, MdQrCode, MdVisibility,
  MdSort, MdGridView, MdViewList, MdBookmark, MdShare, MdCloud,
  MdTrendingUp, MdInsertDriveFile, MdFolder, MdSchedule
} from "react-icons/md";

const FILE_TYPES = ['pdf', 'docx', 'pptx', 'xlsx', 'txt', 'mp4', 'mp3', 'zip'];
const SUBJECTS = [
  'Effective Communication',
  'Life Skills',
  'General Mathematics',
  'General Science',
  'Pag-aaral ng Kasaysayan',
];

const SORT_OPTIONS = [
  { value: 'title', label: 'Title A-Z' },
  { value: '-title', label: 'Title Z-A' },
  { value: '-createdAt', label: 'Newest First' },
  { value: 'createdAt', label: 'Oldest First' },
  { value: 'subject', label: 'Subject A-Z' },
  { value: 'fileType', label: 'File Type' }
];

const ReviewerLinks = () => {
  // Core state
  const [reviewerLinks, setReviewerLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    link: '',
    fileType: 'pdf',
    title: '',
    description: '',
    subject: SUBJECTS[0],
    tags: [],
    category: '',
    priority: 'medium'
  });
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // UI state
  const [activeTab, setActiveTab] = useState('dashboard');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
  
  // Advanced filtering and search
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState('');
  const [filterFileType, setFilterFileType] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState('-createdAt');
  const [showFilters, setShowFilters] = useState(false);
  
  // Bulk operations
  const [selectedItems, setSelectedItems] = useState([]);
  const [showBulkActions, setShowBulkActions] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(12);
  
  // Advanced features
  const [linkValidation, setLinkValidation] = useState({});
  const [isValidating, setIsValidating] = useState(false);
  const [showStats, setShowStats] = useState(true);
  const [categories, setCategories] = useState([]);
  
  // File upload
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  useEffect(() => {
    fetchLinks();
    fetchCategories();
  }, []);

  const fetchLinks = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links`);
      if (!res.ok) throw new Error('Failed to fetch reviewer links');
      const data = await res.json();
      setReviewerLinks(data);
    } catch (err) {
      setError('Could not load reviewer links.');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    // Mock categories - replace with actual API call
    const mockCategories = ['Exam Prep', 'Study Guides', 'Reference Materials', 'Practice Tests', 'Tutorials'];
    setCategories(mockCategories);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsSubmitting(true);
    
    try {
      const payload = { 
        ...formData,
        tags: Array.isArray(formData.tags) ? formData.tags : formData.tags.split(',').map(t => t.trim()).filter(Boolean)
      };
      
      if (editId) {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update reviewer link');
        const updated = await res.json();
        setReviewerLinks(prev => prev.map(l => l._id === editId ? updated : l));
        setSuccess('Reviewer link updated successfully!');
        setEditId(null);
      } else {
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to add reviewer link');
        const newLink = await res.json();
        setReviewerLinks(prev => [newLink, ...prev]);
        setSuccess('Reviewer link added successfully!');
      }
      
      resetForm();
      setActiveTab('dashboard');
    } catch (err) {
      setError(editId ? 'Could not update reviewer link.' : 'Could not add reviewer link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      link: '',
      fileType: 'pdf',
      title: '',
      description: '',
      subject: SUBJECTS[0],
      tags: [],
      category: '',
      priority: 'medium'
    });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reviewer link?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setReviewerLinks(prev => prev.filter(l => l._id !== id));
      setSuccess('Reviewer link deleted successfully!');
    } catch (err) {
      setError('Could not delete reviewer link.');
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setFormData({
      link: item.link,
      fileType: item.fileType,
      title: item.title,
      description: item.description,
      subject: item.subject || SUBJECTS[0],
      tags: item.tags || [],
      category: item.category || '',
      priority: item.priority || 'medium'
    });
    setActiveTab('form');
  };

  const handleBulkSelect = (type) => {
    if (type === 'all') {
      setSelectedItems(filteredLinks.map(item => item._id));
    } else if (type === 'none') {
      setSelectedItems([]);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Delete ${selectedItems.length} selected items?`)) return;
    
    try {
      await Promise.all(
        selectedItems.map(id => 
          fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${id}`, {
            method: 'DELETE',
          })
        )
      );
      setReviewerLinks(prev => prev.filter(l => !selectedItems.includes(l._id)));
      setSelectedItems([]);
      setSuccess(`${selectedItems.length} items deleted successfully!`);
    } catch (err) {
      setError('Could not delete selected items.');
    }
  };

  const validateLinks = async () => {
    setIsValidating(true);
    setLinkValidation({});
    
    for (const link of reviewerLinks) {
      try {
        const response = await fetch(link.link, { method: 'HEAD', mode: 'no-cors' });
        setLinkValidation(prev => ({
          ...prev,
          [link._id]: { status: 'valid', message: 'Link is accessible' }
        }));
      } catch (err) {
        setLinkValidation(prev => ({
          ...prev,
          [link._id]: { status: 'invalid', message: 'Link may be broken' }
        }));
      }
    }
    setIsValidating(false);
  };

  // Filter and sort logic
  const filteredLinks = reviewerLinks.filter(link => {
    const matchesSearch = search === '' || 
      link.title.toLowerCase().includes(search.toLowerCase()) ||
      link.description.toLowerCase().includes(search.toLowerCase()) ||
      link.subject.toLowerCase().includes(search.toLowerCase()) ||
      (link.tags && link.tags.some(tag => tag.toLowerCase().includes(search.toLowerCase())));
    
    const matchesSubject = filterSubject === '' || link.subject === filterSubject;
    const matchesFileType = filterFileType === '' || link.fileType === filterFileType;
    const matchesCategory = filterCategory === '' || link.category === filterCategory;
    
    return matchesSearch && matchesSubject && matchesFileType && matchesCategory;
  }).sort((a, b) => {
    const [field, direction] = sortBy.startsWith('-') ? [sortBy.slice(1), 'desc'] : [sortBy, 'asc'];
    const aVal = a[field] || '';
    const bVal = b[field] || '';
    
    if (direction === 'desc') {
      return bVal.toString().localeCompare(aVal.toString());
    }
    return aVal.toString().localeCompare(bVal.toString());
  });

  // Pagination
  const totalPages = Math.ceil(filteredLinks.length / itemsPerPage);
  const paginatedLinks = filteredLinks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Statistics
  const stats = {
    total: reviewerLinks.length,
    bySubject: SUBJECTS.map(subject => ({
      name: subject,
      count: reviewerLinks.filter(l => l.subject === subject).length
    })),
    byFileType: FILE_TYPES.map(type => ({
      name: type.toUpperCase(),
      count: reviewerLinks.filter(l => l.fileType === type).length
    })).filter(item => item.count > 0),
    recentlyAdded: reviewerLinks.filter(l => {
      const addedDate = new Date(l.createdAt || Date.now());
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return addedDate > weekAgo;
    }).length
  };

  const getFileTypeIcon = (type) => {
    const icons = {
      pdf: '📄', docx: '📝', pptx: '📊', xlsx: '📊', 
      txt: '📄', mp4: '🎥', mp3: '🎵', zip: '📦'
    };
    return icons[type] || '📎';
  };

  const getPriorityColor = (priority) => {
    const colors = {
      high: 'badge-error',
      medium: 'badge-warning',
      low: 'badge-success'
    };
    return colors[priority] || 'badge-ghost';
  };

  return (
    <div className="container mx-auto px-2 sm:px-4 py-4 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-primary">Reviewer Resources</h1>
          <p className="text-base-content/70">Manage educational resources and study materials</p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <button
            className="btn btn-primary btn-sm"
            onClick={() => {
              resetForm();
              setEditId(null);
              setActiveTab('form');
            }}
          >
            <MdAdd className="w-4 h-4" />
            Add Resource
          </button>
          <button
            className="btn btn-outline btn-sm"
            onClick={validateLinks}
            disabled={isValidating}
          >
            <MdRefresh className={`w-4 h-4 ${isValidating ? 'animate-spin' : ''}`} />
            Validate Links
          </button>
          <button
            className="btn btn-ghost btn-sm"
            onClick={() => setShowFilters(!showFilters)}
          >
            <MdFilterList className="w-4 h-4" />
            Filters
          </button>
        </div>
      </div>

      {/* Alerts */}
      {error && (
        <div className="alert alert-error mb-4">
          <MdError />
          <span>{error}</span>
          <button onClick={() => setError('')} className="btn btn-ghost btn-xs">
            <MdClear />
          </button>
        </div>
      )}

      {success && (
        <div className="alert alert-success mb-4">
          <MdCheckCircle />
          <span>{success}</span>
          <button onClick={() => setSuccess('')} className="btn btn-ghost btn-xs">
            <MdClear />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="tabs tabs-boxed mb-6 bg-base-200">
        <button
          className={`tab tab-lg ${activeTab === 'dashboard' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <MdAnalytics className="w-4 h-4 mr-2" />
          Dashboard
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'list' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          <MdViewList className="w-4 h-4 mr-2" />
          Resources ({filteredLinks.length})
        </button>
        <button
          className={`tab tab-lg ${activeTab === 'form' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('form')}
        >
          {editId ? <MdEdit className="w-4 h-4 mr-2" /> : <MdAdd className="w-4 h-4 mr-2" />}
          {editId ? 'Edit Resource' : 'Add Resource'}
        </button>
      </div>

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-primary">
                <MdFolder className="w-8 h-8" />
              </div>
              <div className="stat-title">Total Resources</div>
              <div className="stat-value text-primary">{stats.total}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-secondary">
                <MdSchedule className="w-8 h-8" />
              </div>
              <div className="stat-title">This Week</div>
              <div className="stat-value text-secondary">{stats.recentlyAdded}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-accent">
                <MdTrendingUp className="w-8 h-8" />
              </div>
              <div className="stat-title">File Types</div>
              <div className="stat-value text-accent">{stats.byFileType.length}</div>
            </div>
            <div className="stat bg-base-200 rounded-lg p-4">
              <div className="stat-figure text-info">
                <MdBookmark className="w-8 h-8" />
              </div>
              <div className="stat-title">Subjects</div>
              <div className="stat-value text-info">{stats.bySubject.filter(s => s.count > 0).length}</div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Subject Distribution */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">Resources by Subject</h3>
                <div className="space-y-2">
                  {stats.bySubject.filter(s => s.count > 0).map((item, index) => (
                    <div key={item.name} className="flex items-center gap-3">
                      <span className="w-32 text-sm truncate">{item.name}</span>
                      <div className="flex-1 bg-base-300 rounded-full h-2">
                        <div 
                          className="h-2 rounded-full bg-primary transition-all duration-300"
                          style={{ width: `${(item.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-sm text-right">{item.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* File Type Distribution */}
            <div className="card bg-base-100 shadow">
              <div className="card-body">
                <h3 className="card-title">File Types</h3>
                <div className="grid grid-cols-2 gap-3">
                  {stats.byFileType.map(item => (
                    <div key={item.name} className="flex items-center gap-2 p-2 bg-base-200 rounded">
                      <span className="text-lg">{getFileTypeIcon(item.name.toLowerCase())}</span>
                      <div className="flex-1">
                        <div className="text-sm font-medium">{item.name}</div>
                        <div className="text-xs text-base-content/70">{item.count} files</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Recent Resources */}
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h3 className="card-title">Recent Resources</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {reviewerLinks.slice(0, 6).map(item => (
                  <div key={item._id} className="card bg-base-200 shadow-sm">
                    <div className="card-body p-4">
                      <div className="flex items-start gap-2">
                        <span className="text-2xl">{getFileTypeIcon(item.fileType)}</span>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-sm line-clamp-2">{item.title}</h4>
                          <p className="text-xs text-base-content/70 line-clamp-1">{item.subject}</p>
                          <div className="flex gap-1 mt-2">
                            <span className="badge badge-xs badge-outline">{item.fileType.toUpperCase()}</span>
                            {item.priority && (
                              <span className={`badge badge-xs ${getPriorityColor(item.priority)}`}>
                                {item.priority}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List Tab */}
      {activeTab === 'list' && (
        <div className="space-y-4">
          {/* Search and Filter Bar */}
          <div className="card bg-base-100 shadow">
            <div className="card-body p-4">
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="flex-1">
                  <div className="form-control">
                    <div className="input-group">
            <input
              type="text"
                        className="input input-bordered flex-1"
                        placeholder="Search resources..."
              value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                      <button className="btn btn-square">
                        <MdSearch className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2 flex-wrap">
                  <select
                    className="select select-bordered select-sm"
                    value={filterSubject}
                    onChange={(e) => setFilterSubject(e.target.value)}
                  >
                    <option value="">All Subjects</option>
                    {SUBJECTS.map(subject => (
                      <option key={subject} value={subject}>{subject}</option>
                    ))}
                  </select>
                  
                  <select
                    className="select select-bordered select-sm"
                    value={filterFileType}
                    onChange={(e) => setFilterFileType(e.target.value)}
                  >
                    <option value="">All Types</option>
                    {FILE_TYPES.map(type => (
                      <option key={type} value={type}>{type.toUpperCase()}</option>
                    ))}
                  </select>
                  
                  <select
                    className="select select-bordered select-sm"
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    {SORT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  
                  <div className="btn-group">
                    <button
                      className={`btn btn-sm ${viewMode === 'grid' ? 'btn-active' : ''}`}
                      onClick={() => setViewMode('grid')}
                    >
                      <MdGridView className="w-4 h-4" />
                    </button>
                    <button
                      className={`btn btn-sm ${viewMode === 'table' ? 'btn-active' : ''}`}
                      onClick={() => setViewMode('table')}
                    >
                      <MdViewList className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Bulk Actions */}
              {selectedItems.length > 0 && (
                <div className="mt-4 p-3 bg-base-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{selectedItems.length} items selected</span>
                    <div className="flex gap-2">
                      <button
                        className="btn btn-sm btn-error"
                        onClick={handleBulkDelete}
                      >
                        <MdDelete className="w-4 h-4" />
                        Delete Selected
                      </button>
                      <button
                        className="btn btn-sm btn-ghost"
                        onClick={() => setSelectedItems([])}
                      >
                        Clear Selection
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Content Area */}
          {loading ? (
            <div className="text-center py-12">
              <span className="loading loading-spinner loading-lg"></span>
              <p className="mt-4">Loading resources...</p>
            </div>
          ) : paginatedLinks.length === 0 ? (
            <div className="text-center py-12">
              <MdFolder className="w-16 h-16 mx-auto text-base-content/30 mb-4" />
              <p className="text-base-content/60">No resources found</p>
              <button
                className="btn btn-primary mt-4"
                onClick={() => setActiveTab('form')}
              >
                Add First Resource
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {paginatedLinks.map(item => (
                <div key={item._id} className="card bg-base-100 shadow hover:shadow-lg transition-shadow">
                  <div className="card-body p-4">
                    <div className="flex items-start justify-between">
                      <input
                        type="checkbox"
                        className="checkbox checkbox-sm"
                        checked={selectedItems.includes(item._id)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedItems(prev => [...prev, item._id]);
                          } else {
                            setSelectedItems(prev => prev.filter(id => id !== item._id));
                          }
                        }}
                      />
                      <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-xs">⋮</label>
                        <ul tabIndex={0} className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                          <li><a onClick={() => handleEdit(item)}><MdEdit />Edit</a></li>
                          <li><a href={item.link} target="_blank" rel="noopener noreferrer"><MdVisibility />View</a></li>
                          <li><a onClick={() => handleDelete(item._id)}><MdDelete />Delete</a></li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-3xl">{getFileTypeIcon(item.fileType)}</span>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-sm line-clamp-2 mb-1">{item.title}</h3>
                        <p className="text-xs text-base-content/70">{item.subject}</p>
                      </div>
                    </div>
                    
                    <p className="text-xs text-base-content/60 line-clamp-2 mb-3">{item.description}</p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      <span className="badge badge-xs badge-outline">{item.fileType.toUpperCase()}</span>
                      {item.priority && (
                        <span className={`badge badge-xs ${getPriorityColor(item.priority)}`}>
                          {item.priority}
                        </span>
                      )}
                      {linkValidation[item._id] && (
                        <span className={`badge badge-xs ${
                          linkValidation[item._id].status === 'valid' ? 'badge-success' : 'badge-error'
                        }`}>
                          {linkValidation[item._id].status === 'valid' ? '✓' : '✗'}
                        </span>
                      )}
                    </div>
                    
                    <div className="flex gap-1">
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-sm flex-1"
                      >
                        <MdLink className="w-4 h-4" />
                        Open
                      </a>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => handleEdit(item)}
                      >
                        <MdEdit className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="card bg-base-100 shadow">
            <div className="overflow-x-auto">
                <table className="table w-full">
                <thead>
                  <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox"
                          checked={selectedItems.length === paginatedLinks.length && paginatedLinks.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedItems(paginatedLinks.map(item => item._id));
                            } else {
                              setSelectedItems([]);
                            }
                          }}
                        />
                      </th>
                      <th>Resource</th>
                    <th>Subject</th>
                      <th>Type</th>
                      <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                    {paginatedLinks.map(item => (
                      <tr key={item._id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox"
                            checked={selectedItems.includes(item._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedItems(prev => [...prev, item._id]);
                              } else {
                                setSelectedItems(prev => prev.filter(id => id !== item._id));
                              }
                            }}
                          />
                        </td>
                        <td>
                          <div className="flex items-center gap-3">
                            <span className="text-xl">{getFileTypeIcon(item.fileType)}</span>
                            <div>
                              <div className="font-medium line-clamp-1">{item.title}</div>
                              <div className="text-sm text-base-content/70 line-clamp-1">{item.description}</div>
                            </div>
                          </div>
                        </td>
                        <td>{item.subject}</td>
                        <td>
                          <span className="badge badge-outline">{item.fileType.toUpperCase()}</span>
                        </td>
                        <td>
                          {linkValidation[item._id] ? (
                            <span className={`badge ${
                              linkValidation[item._id].status === 'valid' ? 'badge-success' : 'badge-error'
                            }`}>
                              {linkValidation[item._id].status === 'valid' ? 'Valid' : 'Broken'}
                            </span>
                          ) : (
                            <span className="badge badge-ghost">Unknown</span>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-2">
                            <a
                              href={item.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn btn-ghost btn-xs"
                              title="Open Link"
                            >
                              <MdLink className="w-4 h-4" />
                            </a>
                            <button
                              className="btn btn-ghost btn-xs"
                              onClick={() => handleEdit(item)}
                              title="Edit"
                            >
                              <MdEdit className="w-4 h-4" />
                        </button>
                            <button
                              className="btn btn-ghost btn-xs text-error"
                              onClick={() => handleDelete(item._id)}
                              title="Delete"
                            >
                              <MdDelete className="w-4 h-4" />
                        </button>
                          </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center mt-6">
              <div className="join">
                <button
                  className="join-item btn"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <span className="join-item btn btn-active">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  className="join-item btn"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Tab */}
      {activeTab === 'form' && (
        <div className="max-w-2xl mx-auto">
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title text-xl mb-4">
                {editId ? 'Edit Resource' : 'Add New Resource'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Title *</span>
                    </label>
                    <input
                      type="text"
                      className="input input-bordered"
                      placeholder="Enter resource title"
                      value={formData.title}
                      onChange={(e) => setFormData(prev => ({...prev, title: e.target.value}))}
                      required
                    />
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Subject *</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.subject}
                      onChange={(e) => setFormData(prev => ({...prev, subject: e.target.value}))}
                      required
                    >
                      {SUBJECTS.map(subject => (
                        <option key={subject} value={subject}>{subject}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Link (URL) *</span>
                  </label>
                  <input
                    type="url"
                    className="input input-bordered"
                    placeholder="https://example.com/resource"
                    value={formData.link}
                    onChange={(e) => setFormData(prev => ({...prev, link: e.target.value}))}
                    required
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">File Type</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.fileType}
                      onChange={(e) => setFormData(prev => ({...prev, fileType: e.target.value}))}
                    >
                      {FILE_TYPES.map(type => (
                        <option key={type} value={type}>{type.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Category</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.category}
                      onChange={(e) => setFormData(prev => ({...prev, category: e.target.value}))}
                    >
                      <option value="">Select category</option>
                      {categories.map(category => (
                        <option key={category} value={category}>{category}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium">Priority</span>
                    </label>
                    <select
                      className="select select-bordered"
                      value={formData.priority}
                      onChange={(e) => setFormData(prev => ({...prev, priority: e.target.value}))}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Description *</span>
                  </label>
                  <textarea
                    className="textarea textarea-bordered min-h-[100px]"
                    placeholder="Describe the resource and its contents"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({...prev, description: e.target.value}))}
                    required
                  />
                </div>
                
                <div className="form-control">
                  <label className="label">
                    <span className="label-text font-medium">Tags</span>
                    <span className="label-text-alt">Comma separated</span>
                  </label>
                  <input
                    type="text"
                    className="input input-bordered"
                    placeholder="e.g. exam, study guide, mathematics"
                    value={Array.isArray(formData.tags) ? formData.tags.join(', ') : formData.tags}
                    onChange={(e) => setFormData(prev => ({
                      ...prev, 
                      tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    }))}
                  />
                </div>
                
                <div className="form-control mt-6">
                  <div className="flex gap-4">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <span className="loading loading-spinner loading-sm"></span>
                      ) : (
                        <>
                          {editId ? <MdEdit className="w-4 h-4" /> : <MdAdd className="w-4 h-4" />}
                          {editId ? 'Update Resource' : 'Add Resource'}
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost"
                      onClick={() => {
                        resetForm();
                        setEditId(null);
                        setActiveTab('list');
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReviewerLinks;