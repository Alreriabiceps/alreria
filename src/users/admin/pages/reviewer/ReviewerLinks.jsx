import React, { useState, useEffect } from 'react';

const FILE_TYPES = ['pdf', 'docx', 'pptx'];
const SUBJECTS = [
  'Effective Communication',
  'Life Skills',
  'General Mathematics',
  'General Science',
  'Pag-aaral ng Kasaysayan',
];

const ReviewerLinks = () => {
  const [link, setLink] = useState('');
  const [fileType, setFileType] = useState('pdf');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [tags, setTags] = useState([]);
  const [reviewerLinks, setReviewerLinks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [editId, setEditId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState('list'); // 'add' or 'list'

  // Fetch reviewer links from backend
  useEffect(() => {
    fetchLinks();
    // eslint-disable-next-line
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const payload = { link, fileType, title, description, subject, tags };
      if (editId) {
        // Edit mode
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${editId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to update reviewer link');
        const updated = await res.json();
        setReviewerLinks(prev => prev.map(l => l._id === editId ? updated : l));
        setEditId(null);
      } else {
        // Add mode
        const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error('Failed to add reviewer link');
        const newLink = await res.json();
        setReviewerLinks(prev => [newLink, ...prev]);
      }
      setLink('');
      setFileType('pdf');
      setTitle('');
      setDescription('');
      setSubject(SUBJECTS[0]);
      setTags([]);
      setError('');
      setActiveTab('list'); // Switch to list after add/edit
    } catch (err) {
      setError(editId ? 'Could not update reviewer link.' : 'Could not add reviewer link.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this reviewer link?')) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_BACKEND_URL || ''}/api/admin/reviewer-links/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to delete');
      setReviewerLinks(prev => prev.filter(l => l._id !== id));
    } catch (err) {
      alert('Could not delete reviewer link.');
    }
  };

  const handleEdit = (item) => {
    setEditId(item._id);
    setLink(item.link);
    setFileType(item.fileType);
    setTitle(item.title);
    setDescription(item.description);
    setSubject(item.subject || SUBJECTS[0]);
    setTags(item.tags || []);
    setActiveTab('add');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleCancelEdit = () => {
    setEditId(null);
    setLink('');
    setFileType('pdf');
    setTitle('');
    setDescription('');
    setSubject(SUBJECTS[0]);
    setTags([]);
    setActiveTab('list');
  };

  // Filtered list
  const filteredLinks = reviewerLinks.filter(l => {
    const s = search.toLowerCase();
    return (
      l.title.toLowerCase().includes(s) ||
      l.subject.toLowerCase().includes(s) ||
      l.fileType.toLowerCase().includes(s)
    );
  });

  return (
    <div className="container mx-auto px-4 py-8 flex flex-col items-center">
      {/* Top Navigation */}
      <div className="w-full max-w-3xl mb-6 flex justify-center">
        <div className="tabs tabs-boxed bg-base-200">
          <button
            className={`tab tab-lg${activeTab === 'list' ? ' tab-active' : ''}`}
            onClick={() => { setActiveTab('list'); handleCancelEdit(); }}
          >
            Reviewer Links List
          </button>
          <button
            className={`tab tab-lg${activeTab === 'add' ? ' tab-active' : ''}`}
            onClick={() => {
              setActiveTab('add');
              if (!editId) {
                setLink('');
                setFileType('pdf');
                setTitle('');
                setDescription('');
                setSubject(SUBJECTS[0]);
              }
            }}
          >
            {editId ? 'Edit Reviewer Link' : 'Add Reviewer Link'}
          </button>
        </div>
      </div>

      {/* Add/Edit Form */}
      {activeTab === 'add' && (
        <div className="card bg-base-200 shadow-lg w-full max-w-xl mb-8">
          <div className="card-body">
            <h2 className="card-title text-2xl font-bold text-primary mb-4">
              {editId ? 'Edit Reviewer Resource' : 'Add Reviewer Resource'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="form-control">
                <label htmlFor="link" className="label">
                  <span className="label-text font-medium">Link (URL)</span>
                </label>
                <input
                  id="link"
                  type="url"
                  value={link}
                  onChange={e => setLink(e.target.value)}
                  required
                  placeholder="https://..."
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div className="form-control">
                <label htmlFor="fileType" className="label">
                  <span className="label-text font-medium">File Type</span>
                </label>
                <select
                  id="fileType"
                  value={fileType}
                  onChange={e => setFileType(e.target.value)}
                  className="select select-bordered w-full bg-base-100"
                >
                  {FILE_TYPES.map(type => (
                    <option key={type} value={type}>{type.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Subject</span>
                </label>
                <select
                  value={subject}
                  onChange={e => setSubject(e.target.value)}
                  className="select select-bordered w-full bg-base-100"
                  required
                >
                  {SUBJECTS.map(subj => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))}
                </select>
              </div>
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Add Reviewer Link (comma separated)</span>
                </label>
                <input
                  type="text"
                  value={tags.join(', ')}
                  onChange={e => setTags(e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
                  placeholder="e.g. algebra, exam, 2024"
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div className="form-control">
                <label htmlFor="title" className="label">
                  <span className="label-text font-medium">Title</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  required
                  placeholder="Enter title"
                  className="input input-bordered w-full bg-base-100"
                />
              </div>
              <div className="form-control">
                <label htmlFor="description" className="label">
                  <span className="label-text font-medium">Description</span>
                </label>
                <textarea
                  id="description"
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  required
                  placeholder="Enter description"
                  className="textarea textarea-bordered w-full bg-base-100 min-h-[60px]"
                />
              </div>
              {error && <div className="alert alert-error py-2">{error}</div>}
              <div className="form-control mt-4 flex flex-row gap-2">
                <button type="submit" className="btn btn-primary w-full font-semibold" disabled={isSubmitting}>
                  {editId ? 'Update Reviewer' : 'Add Reviewer'}
                </button>
                {editId && (
                  <button type="button" className="btn btn-ghost w-full font-semibold" onClick={handleCancelEdit}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'list' && (
        <div className="w-full max-w-3xl">
          <div className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <input
              type="text"
              className="input input-bordered w-full sm:w-80 bg-base-100"
              placeholder="Search by title, subject, or file type..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <h3 className="text-xl font-bold mb-4 text-primary">Reviewer Links List</h3>
          {loading ? (
            <div className="text-center py-8">Loading...</div>
          ) : filteredLinks.length === 0 ? (
            <div className="text-center py-8 text-base-content/60">No reviewer links found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="table w-full bg-base-200">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>File Type</th>
                    <th>Subject</th>
                    <th>Link</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLinks.map(link => (
                    <tr key={link._id}>
                      <td className="font-semibold">{link.title}</td>
                      <td>{link.fileType.toUpperCase()}</td>
                      <td>{link.subject}</td>
                      <td>
                        <a href={link.link} target="_blank" rel="noopener noreferrer" className="link link-primary break-all">
                          View
                        </a>
                      </td>
                      <td className="max-w-xs truncate" title={link.description}>{link.description}</td>
                      <td className="flex gap-2">
                        <button className="btn btn-xs btn-warning" onClick={() => handleEdit(link)}>
                          Edit
                        </button>
                        <button className="btn btn-xs btn-error" onClick={() => handleDelete(link._id)}>
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReviewerLinks;