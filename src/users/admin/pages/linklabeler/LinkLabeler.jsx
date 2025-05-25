import React, { useState, useEffect } from 'react';
import { FaSearch, FaBook, FaFileAlt, FaEdit, FaTrash, FaEye, FaSort, FaSortUp, FaSortDown } from 'react-icons/fa';

const fileTypes = [
  { label: 'PDF', value: 'pdf' },
  { label: 'DOCX', value: 'docx' },
  { label: 'PPT', value: 'ppt' },
  { label: 'Other', value: 'other' },
];

const LinkLabeler = () => {
  // Form states
  const [link, setLink] = useState('');
  const [name, setName] = useState('');
  const [type, setType] = useState('pdf');
  const [description, setDescription] = useState('');
  const [formSubject, setFormSubject] = useState('');

  // List states
  const [submitted, setSubmitted] = useState(null);
  const [linkHistory, setLinkHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('add');
  const [subjects, setSubjects] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [editingReviewer, setEditingReviewer] = useState(null);
  const [previewReviewer, setPreviewReviewer] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [reviewerToDelete, setReviewerToDelete] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Filter states
  const [filteredLinks, setFilteredLinks] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('');
  const [filterSubject, setFilterSubject] = useState('');

  const backendurl = import.meta.env.VITE_BACKEND_URL || "http://localhost:5000";

  // Fetch Subjects
  useEffect(() => {
    const fetchSubjects = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/subjects`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }
        const data = await res.json();
        setSubjects(data);
      } catch (err) {
        console.error("Failed to fetch subjects:", err);
        setError(`Failed to fetch subjects: ${err.message}`);
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSubjects();
  }, [backendurl]);

  // Fetch Links
  useEffect(() => {
    const fetchLinks = async () => {
      setLoading(true);
      setError('');
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/admin/reviewers`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setLinkHistory(data);
        setFilteredLinks(data);
      } catch (err) {
        console.error("Failed to fetch links:", err);
        setError(`Failed to fetch links: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchLinks();
  }, [backendurl]);

  // Handle delete reviewer
  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const res = await fetch(`${backendurl}/api/admin/reviewers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to delete reviewer');
      }

      setLinkHistory(prev => prev.filter(item => item._id !== id));
      setSuccess('Review material deleted successfully!');
      setShowDeleteConfirm(false);
      setReviewerToDelete(null);
    } catch (err) {
      console.error('Error deleting reviewer:', err);
      setError(err.message);
    }
  };

  // Handle edit reviewer
  const handleEdit = async (e) => {
    e.preventDefault();
    if (!formSubject) {
      setError('Please select a subject');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const updatedReviewer = {
        name,
        link,
        type,
        subject: formSubject,
        description
      };

      const res = await fetch(`${backendurl}/api/admin/reviewers/${editingReviewer._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatedReviewer)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to update reviewer');
      }

      const result = await res.json();
      setLinkHistory(prev => prev.map(item => 
        item._id === editingReviewer._id ? result : item
      ));
      setSuccess('Review material updated successfully!');
      setEditingReviewer(null);
      resetForm();
    } catch (err) {
      console.error('Error updating reviewer:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Reset form
  const resetForm = () => {
    setLink('');
    setName('');
    setType('pdf');
    setDescription('');
    setFormSubject('');
    setEditingReviewer(null);
  };

  // Handle sort
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Sort data
  const getSortedData = (data) => {
    if (!sortConfig.key) return data;

    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  // Filter and sort Links
  useEffect(() => {
    let result = linkHistory;

    // Filter by Subject
    if (filterSubject) {
      result = result.filter(item => item.subject === filterSubject);
    }

    // Filter by File Type
    if (selectedFileType) {
      result = result.filter(item => item.type.toLowerCase() === selectedFileType);
    }

    // Filter by Search Term (Title or Description)
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      result = result.filter(item =>
        item.name.toLowerCase().includes(lowerSearchTerm) ||
        item.description.toLowerCase().includes(lowerSearchTerm)
      );
    }

    // Apply sorting
    result = getSortedData(result);
    setFilteredLinks(result);
  }, [filterSubject, selectedFileType, searchTerm, linkHistory, sortConfig]);

  // Clear Messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError('');
        setSuccess('');
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formSubject) {
      setError('Please select a subject');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const newLink = {
        name,
        link,
        type,
        subject: formSubject,
        description
      };

      const res = await fetch(`${backendurl}/api/admin/reviewers`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newLink)
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to add link');
      }

      const result = await res.json();
      setLinkHistory(prev => [result, ...prev]);
      setSuccess('Link added successfully!');
      
      // Reset form
      setLink('');
      setName('');
      setType('pdf');
      setDescription('');
      setFormSubject('');
      setActiveTab('list');
    } catch (err) {
      console.error('Error adding link:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value;
    console.log('Name change:', value); // Debug log
    setName(value);
  };

  const handleLinkChange = (e) => {
    const value = e.target.value;
    console.log('Link change:', value); // Debug log
    setLink(value);
  };

  const handleDescriptionChange = (e) => {
    const value = e.target.value;
    console.log('Description change:', value); // Debug log
    setDescription(value);
  };

  const handleSubjectChange = (e) => {
    const value = e.target.value;
    console.log('Subject change:', value); // Debug log
    setFormSubject(value);
  };

  const handleTypeChange = (e) => {
    const value = e.target.value;
    console.log('Type change:', value); // Debug log
    setType(value);
  };

  const AddLinkForm = () => (
    <div className="bg-base-200 rounded-lg shadow-lg p-4 max-w-2xl mx-auto">
      <h1 className="text-xl font-bold mb-4 text-primary">
        {editingReviewer ? 'Edit Review Material' : 'Add New Review Material'}
      </h1>
      {error && (
        <div className="alert alert-error mb-4">
          <span>{error}</span>
        </div>
      )}
      {success && (
        <div className="alert alert-success mb-4">
          <span>{success}</span>
        </div>
      )}
      <form onSubmit={editingReviewer ? handleEdit : handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-medium text-sm">Title</label>
            <input
              type="text"
              className="input input-bordered w-full input-sm"
              placeholder="Enter material title"
              value={name}
              onChange={handleNameChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm">Subject</label>
            <select
              className="select select-bordered w-full select-sm"
              value={formSubject}
              onChange={handleSubjectChange}
              required
            >
              <option value="">Select a subject</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject.subject}>
                  {subject.subject}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div>
          <label className="block mb-1 font-medium text-sm">Description</label>
          <textarea
            className="textarea textarea-bordered w-full textarea-sm"
            placeholder="Enter material description"
            value={description}
            onChange={handleDescriptionChange}
            required
            rows={3}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block mb-1 font-medium text-sm">Link</label>
            <input
              type="url"
              className="input input-bordered w-full input-sm"
              placeholder="https://example.com/file.pdf"
              value={link}
              onChange={handleLinkChange}
              required
            />
          </div>
          <div>
            <label className="block mb-1 font-medium text-sm">File Type</label>
            <select
              className="select select-bordered w-full select-sm"
              value={type}
              onChange={handleTypeChange}
            >
              {fileTypes.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex gap-2 justify-end">
          {editingReviewer && (
            <button 
              type="button" 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                resetForm();
                setActiveTab('list');
              }}
            >
              Cancel
            </button>
          )}
          <button 
            type="submit" 
            className="btn btn-primary btn-sm"
            disabled={loading}
          >
            {loading ? 'Saving...' : editingReviewer ? 'Update Material' : 'Add Material'}
          </button>
        </div>
      </form>
    </div>
  );

  const LinkList = () => (
    <div className="bg-base-200 rounded-lg shadow-lg p-4 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-primary">Review Materials</h2>
        <button 
          onClick={() => {
            resetForm();
            setActiveTab('add');
          }}
          className="btn btn-primary btn-sm"
        >
          Add New Material
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {/* Subject Filter */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">Subject</span>
          </label>
          <div className="relative">
            <FaBook className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
            <select
              className="select select-bordered w-full pl-10 select-sm"
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
            >
              <option value="">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject._id} value={subject.subject}>
                  {subject.subject}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* File Type Filter */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">File Type</span>
          </label>
          <div className="relative">
            <FaFileAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
            <select
              className="select select-bordered w-full pl-10 select-sm"
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
            >
              <option value="">All Types</option>
              {fileTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Search Filter */}
        <div className="form-control">
          <label className="label py-1">
            <span className="label-text text-sm">Search</span>
          </label>
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-base-content/50" />
            <input
              type="text"
              className="input input-bordered w-full pl-10 input-sm"
              placeholder="Search title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center py-8">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filteredLinks.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-base-content/70 mb-4">No review materials found.</p>
          <button 
            onClick={() => setActiveTab('add')}
            className="btn btn-primary btn-sm"
          >
            Add Your First Material
          </button>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="table table-zebra w-full">
            <thead>
              <tr>
                <th className="w-12"></th>
                <th>Title</th>
                <th>Subject</th>
                <th>Type</th>
                <th>Description</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredLinks.map((item) => (
                <tr key={item._id}>
                  <td>
                    <div className={`badge badge-sm ${item.type === 'pdf' ? 'badge-primary' : item.type === 'docx' ? 'badge-secondary' : 'badge-accent'}`}>
                      {item.type.toUpperCase()}
                    </div>
                  </td>
                  <td className="font-medium">{item.name}</td>
                  <td>{item.subject}</td>
                  <td>{item.type.toUpperCase()}</td>
                  <td className="max-w-xs truncate">{item.description}</td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button
                        onClick={() => setPreviewReviewer(item)}
                        className="btn btn-ghost btn-xs"
                        title="Preview"
                      >
                        <FaEye />
                      </button>
                      <button
                        onClick={() => {
                          setEditingReviewer(item);
                          setName(item.name);
                          setLink(item.link);
                          setType(item.type);
                          setDescription(item.description);
                          setFormSubject(item.subject);
                          setActiveTab('add');
                        }}
                        className="btn btn-ghost btn-xs"
                        title="Edit"
                      >
                        <FaEdit />
                      </button>
                      <button
                        onClick={() => {
                          setReviewerToDelete(item);
                          setShowDeleteConfirm(true);
                        }}
                        className="btn btn-ghost btn-xs text-error"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                      <a
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-primary btn-xs"
                        title="Access"
                      >
                        Access
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  // Preview Modal
  const PreviewModal = () => {
    if (!previewReviewer) return null;

    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-md">
          <h3 className="font-bold text-lg mb-3">{previewReviewer.name}</h3>
          <div className="space-y-3">
            <div>
              <label className="font-medium text-sm">Subject:</label>
              <p className="text-sm">{previewReviewer.subject}</p>
            </div>
            <div>
              <label className="font-medium text-sm">Type:</label>
              <p className="text-sm">{previewReviewer.type.toUpperCase()}</p>
            </div>
            <div>
              <label className="font-medium text-sm">Description:</label>
              <p className="text-sm">{previewReviewer.description}</p>
            </div>
            <div>
              <label className="font-medium text-sm">Link:</label>
              <a 
                href={previewReviewer.link} 
                target="_blank" 
                rel="noopener noreferrer"
                className="link link-primary text-sm block truncate"
              >
                {previewReviewer.link}
              </a>
            </div>
          </div>
          <div className="modal-action">
            <button 
              className="btn btn-sm"
              onClick={() => setPreviewReviewer(null)}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  };

  // Delete Confirmation Modal
  const DeleteConfirmModal = () => {
    if (!showDeleteConfirm || !reviewerToDelete) return null;

    return (
      <div className="modal modal-open">
        <div className="modal-box max-w-sm">
          <h3 className="font-bold text-lg mb-3">Confirm Delete</h3>
          <p className="text-sm">Are you sure you want to delete "{reviewerToDelete.name}"?</p>
          <div className="modal-action">
            <button 
              className="btn btn-ghost btn-sm"
              onClick={() => {
                setShowDeleteConfirm(false);
                setReviewerToDelete(null);
              }}
            >
              Cancel
            </button>
            <button 
              className="btn btn-error btn-sm"
              onClick={() => handleDelete(reviewerToDelete._id)}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto mt-6 p-4">
      <div className="tabs tabs-boxed mb-4">
        <button 
          className={`tab tab-sm ${activeTab === 'add' ? 'tab-active' : ''}`}
          onClick={() => {
            resetForm();
            setActiveTab('add');
          }}
        >
          {editingReviewer ? 'Edit Material' : 'Add Material'}
        </button>
        <button 
          className={`tab tab-sm ${activeTab === 'list' ? 'tab-active' : ''}`}
          onClick={() => setActiveTab('list')}
        >
          Materials List
        </button>
      </div>

      {activeTab === 'add' ? <AddLinkForm /> : <LinkList />}
      <PreviewModal />
      <DeleteConfirmModal />
    </div>
  );
};

export default LinkLabeler; 