import React, { useState, useEffect } from "react";
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdAdd, MdVisibility, MdClose } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

const COLUMN_OPTIONS = [
  { key: 'firstName', label: 'First Name' },
  { key: 'middleName', label: 'Middle Name' },
  { key: 'lastName', label: 'Last Name' },
  { key: 'email', label: 'Email' },
  { key: 'studentId', label: 'Student ID' },
  { key: 'track', label: 'Track' },
  { key: 'section', label: 'Section' },
  { key: 'yearLevel', label: 'Year Level' },
  { key: 'isActive', label: 'Status' },
  { key: 'lastLogin', label: 'Last Login' },
  { key: 'totalPoints', label: 'Total Points' },
];

const COLUMN_DEFAULTS = [
  'firstName', 'lastName', 'email', 'studentId', 'track', 'section', 'yearLevel', 'isActive', 'totalPoints'
];

const StudentList = () => {
  const [students, setStudents] = useState([]);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStrand, setFilterStrand] = useState("");
  const [filterYearLevel, setFilterYearLevel] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [studentsPerPage] = useState(10);
  const [isLoading, setIsLoading] = useState(true);
  const { guideMode } = useGuideMode();
  const [visibleColumns, setVisibleColumns] = useState(() => {
    const saved = localStorage.getItem('studentListVisibleColumns');
    return saved ? JSON.parse(saved) : COLUMN_DEFAULTS;
  });
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editStudent, setEditStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState("");

  // Helper for select/deselect all
  const allSelected = visibleColumns.length === COLUMN_OPTIONS.length;
  const noneSelected = visibleColumns.length === 0;
  const handleSelectAll = () => setVisibleColumns(COLUMN_OPTIONS.map(col => col.key));
  const handleDeselectAll = () => setVisibleColumns([]);

  useEffect(() => {
    const fetchStudents = async () => {
      setError(null);
      setIsLoading(true);
      try {
        const backendurl = import.meta.env.VITE_BACKEND_URL;
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found. Please login again.');
        }
        const response = await fetch(`${backendurl}/api/students`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(
            errorData.message ||
            `Network response was not ok (status: ${response.status})`
          );
        }
        const data = await response.json();
        setStudents(data.sort((a, b) => a.lastName.localeCompare(b.lastName)));
      } catch (err) {
        console.error("Failed to fetch students:", err);
        setError(err.message);
        // If token is invalid, redirect to login
        if (err.message.includes('token') || err.message.includes('authentication')) {
          window.location.href = '/admin/login';
        }
      } finally {
        setIsLoading(false);
      }
    };
    fetchStudents();
  }, []);

  useEffect(() => {
    localStorage.setItem('studentListVisibleColumns', JSON.stringify(visibleColumns));
  }, [visibleColumns]);

  const filteredStudents = students.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const searchMatch =
      (student.firstName?.toLowerCase().includes(searchLower) ?? false) ||
      (student.lastName?.toLowerCase().includes(searchLower) ?? false) ||
      student.studentId?.toString().includes(searchTerm);

    const strandMatch = !filterStrand || student.strand === filterStrand;
    const yearLevelMatch =
      !filterYearLevel || student.yearLevel === filterYearLevel;

    return searchMatch && strandMatch && yearLevelMatch;
  });

  const indexOfLastStudent = currentPage * studentsPerPage;
  const indexOfFirstStudent = indexOfLastStudent - studentsPerPage;
  const currentStudents = filteredStudents.slice(
    indexOfFirstStudent,
    indexOfLastStudent
  );

  const totalPages = Math.ceil(filteredStudents.length / studentsPerPage);

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // Delete handler
  const handleDelete = async (studentId) => {
    if (!window.confirm("Are you sure you want to delete this student?")) return;
    try {
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendurl}/api/students/${studentId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Failed to delete student');
      setStudents(students => students.filter(s => s.studentId !== studentId));
    } catch (err) {
      alert(err.message);
    }
  };

  // Edit handlers
  const openEditModal = (student) => {
    setEditStudent(student);
    setEditForm({ ...student });
    setEditError("");
    setEditModalOpen(true);
  };
  const closeEditModal = () => {
    setEditModalOpen(false);
    setEditStudent(null);
    setEditForm({});
    setEditError("");
  };
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(f => ({ ...f, [name]: value }));
  };
  const handleEditSave = async () => {
    setEditLoading(true);
    setEditError("");
    try {
      const backendurl = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendurl}/api/students/${editStudent.studentId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editForm),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.message || 'Failed to update student');
      }
      // Update the list
      setStudents(students => students.map(s => s.studentId === editStudent.studentId ? { ...s, ...editForm } : s));
      closeEditModal();
    } catch (err) {
      setEditError(err.message);
    } finally {
      setEditLoading(false);
    }
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="alert alert-error">
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-primary">Student List</h1>
            <div className="flex gap-2">
              <div className="relative group">
                <button
                  className="btn btn-secondary btn-sm gap-2"
                  aria-label="Show/Hide Columns"
                  title="Show/Hide Columns"
                  onClick={() => setShowColumnDropdown(v => !v)}
                >
                  <MdVisibility className="w-5 h-5" />
                  Columns
                </button>
                {showColumnDropdown && (
                  <div className="absolute right-0 mt-2 bg-base-100 border border-base-300 rounded shadow-lg z-50 p-4 min-w-[220px] w-max animate-fade-in">
                    <div className="font-semibold mb-2 text-base-content">Column Visibility</div>
                    <div className="flex gap-2 mb-2">
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={handleSelectAll}
                        disabled={allSelected}
                      >
                        Select All
                      </button>
                      <button
                        className="btn btn-xs btn-outline"
                        onClick={handleDeselectAll}
                        disabled={noneSelected}
                      >
                        Deselect All
                      </button>
                    </div>
                    <div className="max-h-56 overflow-y-auto pr-1">
                      {COLUMN_OPTIONS.map(col => (
                        <label key={col.key} className="flex items-center gap-2 cursor-pointer mb-1 px-1 py-1 rounded hover:bg-base-200">
                          <input
                            type="checkbox"
                            checked={visibleColumns.includes(col.key)}
                            onChange={e => {
                              setVisibleColumns(v =>
                                e.target.checked
                                  ? [...v, col.key]
                                  : v.filter(k => k !== col.key)
                              );
                            }}
                          />
                          <span className="text-base-content">{col.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              <button className="btn btn-primary btn-sm gap-2">
                <MdAdd className="w-5 h-5" />
                Add Student
              </button>
            </div>
          </div>

          {guideMode && (
            <details className="mb-6 bg-info/10 border border-info rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-info mb-1">How to use the Student List page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>Use the <b>search</b> box to find students by name or ID.</li>
                <li>Filter by <b>track</b> (strand) or <b>year level</b> using the dropdowns.</li>
                <li>Click <b>Columns</b> to show or hide table columns in real time.</li>
                <li>Edit or delete students using the icons in the Actions column.</li>
              </ol>
            </details>
          )}

          {/* Search and Filter Section */}
          <div className="card bg-base-100 p-6 rounded-lg mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Search</span>
                </label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    className="input input-bordered w-full pl-10 bg-base-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                  <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Strand</span>
                </label>
                <div className="relative">
                  <select
                    className="select select-bordered w-full pl-10 bg-base-100"
                    value={filterStrand}
                    onChange={(e) => setFilterStrand(e.target.value)}
                  >
                    <option value="">All Strands</option>
                    <option value="ABM">ABM</option>
                    <option value="STEM">STEM</option>
                    <option value="HUMSS">HUMSS</option>
                    <option value="GAS">GAS</option>
                    <option value="TVL-ICT">TVL-ICT</option>
                    <option value="TVL-HE">TVL-HE</option>
                  </select>
                  <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                </div>
              </div>

              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium">Year Level</span>
                </label>
                <div className="relative">
                  <select
                    className="select select-bordered w-full pl-10 bg-base-100"
                    value={filterYearLevel}
                    onChange={(e) => setFilterYearLevel(e.target.value)}
                  >
                    <option value="">All Year Levels</option>
                    <option value="Grade 11">Grade 11</option>
                    <option value="Grade 12">Grade 12</option>
                  </select>
                  <MdFilterList className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-base-content/50" />
                </div>
              </div>
            </div>
          </div>

          {/* Table Section */}
          <div className="card bg-base-100 p-6 rounded-lg">
            {isLoading ? (
              <div className="flex justify-center items-center py-8">
                <span className="loading loading-spinner loading-lg text-primary"></span>
              </div>
            ) : currentStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base-content/70">No students found</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table w-full">
                  <thead>
                    <tr>
                      {COLUMN_OPTIONS.filter(col => visibleColumns.includes(col.key)).map(col => (
                        <th key={col.key}>{col.label}</th>
                      ))}
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((student) => (
                      <tr key={student._id} className="hover">
                        {COLUMN_OPTIONS.filter(col => visibleColumns.includes(col.key)).map(col => {
                          switch (col.key) {
                            case 'firstName':
                              return <td key="firstName">{student.firstName}</td>;
                            case 'middleName':
                              return <td key="middleName">{student.middleName}</td>;
                            case 'lastName':
                              return <td key="lastName">{student.lastName}</td>;
                            case 'email':
                              return <td key="email">{student.email}</td>;
                            case 'studentId':
                              return <td key="studentId">{student.studentId}</td>;
                            case 'track':
                              return <td key="track">{student.track}</td>;
                            case 'section':
                              return <td key="section">{student.section}</td>;
                            case 'yearLevel':
                              return <td key="yearLevel">{student.yearLevel}</td>;
                            case 'isActive':
                              return <td key="isActive">{student.isActive ? 'Active' : 'Inactive'}</td>;
                            case 'lastLogin':
                              return <td key="lastLogin">{student.lastLogin ? new Date(student.lastLogin).toLocaleString() : '-'}</td>;
                            case 'totalPoints':
                              return <td key="totalPoints">{student.totalPoints ?? 0}</td>;
                            default:
                              return null;
                          }
                        })}
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost btn-sm" onClick={() => openEditModal(student)}>
                              <MdEdit className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost btn-sm text-error" onClick={() => handleDelete(student.studentId)}>
                              <MdDelete className="w-5 h-5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-6">
                <button
                  className="btn btn-sm"
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  Previous
                </button>
                <div className="join">
                  {[...Array(totalPages)].map((_, index) => (
                    <button
                      key={index}
                      className={`join-item btn btn-sm ${currentPage === index + 1 ? "btn-active" : ""
                        }`}
                      onClick={() => handlePageChange(index + 1)}
                    >
                      {index + 1}
                    </button>
                  ))}
                </div>
                <button
                  className="btn btn-sm"
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-base-100 rounded-lg shadow-lg p-6 w-full max-w-md relative animate-fade-in">
            <button className="absolute top-2 right-2 btn btn-ghost btn-sm" onClick={closeEditModal}>
              <MdClose className="w-5 h-5" />
            </button>
            <h2 className="text-xl font-bold mb-4">Edit Student</h2>
            {editError && <div className="alert alert-error mb-2"><span>{editError}</span></div>}
            <form onSubmit={e => { e.preventDefault(); handleEditSave(); }}>
              <div className="grid grid-cols-1 gap-3">
                <input type="text" name="firstName" value={editForm.firstName || ''} onChange={handleEditChange} className="input input-bordered" placeholder="First Name" required />
                <input type="text" name="middleName" value={editForm.middleName || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Middle Name" />
                <input type="text" name="lastName" value={editForm.lastName || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Last Name" required />
                <input type="email" name="email" value={editForm.email || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Email" required />
                <input type="text" name="studentId" value={editForm.studentId || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Student ID" required disabled />
                <input type="text" name="track" value={editForm.track || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Track" required />
                <input type="text" name="section" value={editForm.section || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Section" required />
                <input type="text" name="yearLevel" value={editForm.yearLevel || ''} onChange={handleEditChange} className="input input-bordered" placeholder="Year Level" required />
              </div>
              <div className="flex justify-end gap-2 mt-4">
                <button type="button" className="btn btn-ghost" onClick={closeEditModal}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudentList;
