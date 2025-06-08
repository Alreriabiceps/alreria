import React, { useState, useEffect } from "react";
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdAdd, MdVisibility, MdClose, MdCheck } from "react-icons/md";
import { useNavigate } from "react-router-dom";
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
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterGrade, setFilterGrade] = useState("");
  const [filterTrack, setFilterTrack] = useState("");
  const [filterSection, setFilterSection] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [visibleColumns, setVisibleColumns] = useState(COLUMN_DEFAULTS);
  const [showColumnDropdown, setShowColumnDropdown] = useState(false);
  const { guideMode } = useGuideMode();

  const backendurl = import.meta.env.VITE_BACKEND_URL;

  useEffect(() => {
    fetchStudents();
  }, []);

  useEffect(() => {
    filterStudents();
  }, [students, searchTerm, filterGrade, filterTrack, filterSection]);

  // Close column dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showColumnDropdown && !event.target.closest('.relative')) {
        setShowColumnDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showColumnDropdown]);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError("");
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const response = await fetch(`${backendurl}/api/admin/students`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch students');
      }

      const data = await response.json();
      console.log('Student data received:', data[0]); // Debug: see student structure
      setStudents(data);
    } catch (err) {
      console.error('Error fetching students:', err);
      setError(err.message || 'Failed to load students');
    } finally {
      setLoading(false);
    }
  };

  const filterStudents = () => {
    let filtered = students;

    if (searchTerm) {
      filtered = filtered.filter(student =>
        student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.studentId.toString().includes(searchTerm) ||
        (student.email && student.email.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (filterGrade) {
      filtered = filtered.filter(student => 
        student.yearLevel === filterGrade || 
        student.grade === filterGrade ||
        (student.yearLevel && student.yearLevel.includes(filterGrade))
      );
    }

    if (filterTrack) {
      filtered = filtered.filter(student => student.track === filterTrack);
    }

    if (filterSection) {
      filtered = filtered.filter(student => student.section === filterSection);
    }

    setFilteredStudents(filtered);
  };

  const handleEditStudent = (student) => {
    setEditingStudent(student._id);
    setEditForm({
      firstName: student.firstName,
      lastName: student.lastName,
      email: student.email,
      grade: student.grade,
      section: student.section,
      track: student.track,
      yearLevel: student.yearLevel
    });
  };

  const handleSaveEdit = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendurl}/api/admin/students/${editingStudent}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editForm)
      });

      if (!response.ok) {
        throw new Error('Failed to update student');
      }

      await fetchStudents();
      setEditingStudent(null);
      setEditForm({});
    } catch (err) {
      console.error('Error updating student:', err);
      setError(err.message || 'Failed to update student');
    }
  };

  const handleDeleteStudent = async (studentId) => {
    if (!window.confirm('Are you sure you want to delete this student?')) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendurl}/api/admin/students/${studentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to delete student');
      }

      await fetchStudents();
    } catch (err) {
      console.error('Error deleting student:', err);
      setError(err.message || 'Failed to delete student');
    }
  };

  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev => 
      prev.includes(studentId) 
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  const handleSelectAllStudents = () => {
    if (selectedStudents.length === filteredStudents.length) {
      setSelectedStudents([]);
    } else {
      setSelectedStudents(filteredStudents.map(student => student._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedStudents.length === 0) {
      alert('No students selected');
      return;
    }

    if (!window.confirm(`Are you sure you want to delete ${selectedStudents.length} students?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${backendurl}/api/admin/students/bulk-delete`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ studentIds: selectedStudents })
      });

      if (!response.ok) {
        throw new Error('Failed to delete students');
      }

      await fetchStudents();
      setSelectedStudents([]);
    } catch (err) {
      console.error('Error deleting students:', err);
      setError(err.message || 'Failed to delete students');
    }
  };

  const clearFilters = () => {
    setSearchTerm("");
    setFilterGrade("");
    setFilterTrack("");
    setFilterSection("");
  };

  const getUniqueValues = (key) => {
    const values = students.map(student => student[key]).filter(value => value !== null && value !== undefined && value !== '');
    const uniqueValues = [...new Set(values)];
    console.log(`Unique values for ${key}:`, uniqueValues); // Debug
    return uniqueValues;
  };

  const toggleColumn = (columnKey) => {
    setVisibleColumns(prev => 
      prev.includes(columnKey) 
        ? prev.filter(col => col !== columnKey)
        : [...prev, columnKey]
    );
  };

  const isColumnVisible = (columnKey) => {
    return visibleColumns.includes(columnKey);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center py-8">
            <div className="loading loading-spinner loading-lg"></div>
          </div>
        </div>
      </div>
    );
  }

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
    <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-base-200 rounded-lg shadow-lg p-3 sm:p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-primary">Student List</h1>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <div className="relative">
                <button
                  className="btn btn-secondary btn-sm gap-2 w-full sm:w-auto"
                  onClick={() => setShowColumnDropdown(!showColumnDropdown)}
                  aria-label="Show/Hide Columns"
                  title="Show/Hide Columns"
                >
                  <MdVisibility className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="hidden sm:inline">Columns</span>
                  <span className="sm:hidden">Cols</span>
                </button>
                
                {showColumnDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-64 bg-base-100 rounded-lg shadow-lg border z-50">
                    <div className="p-3">
                      <h3 className="font-medium text-sm mb-3">Toggle Columns</h3>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {COLUMN_OPTIONS.map(column => (
                          <label key={column.key} className="flex items-center gap-2 cursor-pointer hover:bg-base-200 p-1 rounded">
                            <input
                              type="checkbox"
                              className="checkbox checkbox-xs"
                              checked={isColumnVisible(column.key)}
                              onChange={() => toggleColumn(column.key)}
                            />
                            <span className="text-sm">{column.label}</span>
                          </label>
                        ))}
                      </div>
                      <div className="pt-3 mt-3 border-t">
                        <button 
                          className="btn btn-xs btn-outline w-full"
                          onClick={() => setShowColumnDropdown(false)}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <button 
                className="btn btn-primary btn-sm gap-2 w-full sm:w-auto"
                onClick={() => navigate('/admin/addstudent')}
              >
                <MdAdd className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
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

          {/* Search and Filters */}
          <div className="card bg-base-100 p-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4 mb-4">
              <div className="form-control flex-1">
                <div className="input-group">
                  <span className="bg-base-200">
                    <MdSearch className="w-4 h-4 sm:w-5 sm:h-5" />
                  </span>
                  <input
                    type="text"
                    placeholder="Search students..."
                    className="input input-bordered flex-1 bg-base-100"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              
              <button
                className="btn btn-outline btn-sm gap-2"
                onClick={() => setShowFilters(!showFilters)}
              >
                <MdFilterList className="w-4 h-4" />
                Filters
              </button>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-base-200 rounded-lg">
                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Grade</span>
                  </label>
                  <select
                    className="select select-bordered select-sm bg-base-100"
                    value={filterGrade}
                    onChange={(e) => setFilterGrade(e.target.value)}
                  >
                    <option value="">All Grades</option>
                    {getUniqueValues('yearLevel').map(grade => (
                      <option key={grade} value={grade}>{grade}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Track</span>
                  </label>
                  <select
                    className="select select-bordered select-sm bg-base-100"
                    value={filterTrack}
                    onChange={(e) => setFilterTrack(e.target.value)}
                  >
                    <option value="">All Tracks</option>
                    {getUniqueValues('track').map(track => (
                      <option key={track} value={track}>{track}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Section</span>
                  </label>
                  <select
                    className="select select-bordered select-sm bg-base-100"
                    value={filterSection}
                    onChange={(e) => setFilterSection(e.target.value)}
                  >
                    <option value="">All Sections</option>
                    {getUniqueValues('section').map(section => (
                      <option key={section} value={section}>{section}</option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Actions</span>
                  </label>
                  <button
                    className="btn btn-outline btn-sm"
                    onClick={clearFilters}
                  >
                    Clear All
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Bulk Actions */}
          {selectedStudents.length > 0 && (
            <div className="card bg-base-100 p-4 mb-6">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="font-medium">{selectedStudents.length} students selected</span>
                </div>
                
                <div className="flex gap-2">
                  <button
                    className="btn btn-error btn-sm gap-2"
                    onClick={handleBulkDelete}
                  >
                    <MdDelete className="w-4 h-4" />
                    Delete Selected
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Students Table */}
          <div className="card bg-base-100 p-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <h2 className="text-lg font-semibold">
                Students List ({filteredStudents.length} of {students.length})
              </h2>
            </div>

            {filteredStudents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-base-content/70">No students found matching your criteria.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>
                        <input
                          type="checkbox"
                          className="checkbox checkbox-sm"
                          checked={selectedStudents.length === filteredStudents.length}
                          onChange={handleSelectAllStudents}
                        />
                      </th>
                      <th>Student ID</th>
                      {isColumnVisible('firstName') && <th>First Name</th>}
                      {isColumnVisible('lastName') && <th>Last Name</th>}
                      {isColumnVisible('email') && <th className="hidden lg:table-cell">Email</th>}
                      {isColumnVisible('track') && <th className="hidden sm:table-cell">Track</th>}
                      {isColumnVisible('section') && <th className="hidden lg:table-cell">Section</th>}
                      {isColumnVisible('yearLevel') && <th className="hidden sm:table-cell">Year Level</th>}
                      {isColumnVisible('isActive') && <th className="hidden lg:table-cell">Status</th>}
                      {isColumnVisible('totalPoints') && <th className="hidden lg:table-cell">Points</th>}
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map((student) => (
                      <tr key={student._id}>
                        <td>
                          <input
                            type="checkbox"
                            className="checkbox checkbox-sm"
                            checked={selectedStudents.includes(student._id)}
                            onChange={() => handleSelectStudent(student._id)}
                          />
                        </td>
                        <td className="font-mono">{student.studentId}</td>
                        
                        {isColumnVisible('firstName') && (
                          <td>
                            {editingStudent === student._id ? (
                              <input
                                type="text"
                                className="input input-xs input-bordered"
                                value={editForm.firstName}
                                onChange={(e) => setEditForm({...editForm, firstName: e.target.value})}
                                placeholder="First Name"
                              />
                            ) : (
                              student.firstName
                            )}
                          </td>
                        )}
                        
                        {isColumnVisible('lastName') && (
                          <td>
                            {editingStudent === student._id ? (
                              <input
                                type="text"
                                className="input input-xs input-bordered"
                                value={editForm.lastName}
                                onChange={(e) => setEditForm({...editForm, lastName: e.target.value})}
                                placeholder="Last Name"
                              />
                            ) : (
                              student.lastName
                            )}
                          </td>
                        )}
                        
                        {isColumnVisible('email') && (
                          <td className="hidden lg:table-cell">
                            <span className="text-xs">{student.email}</span>
                          </td>
                        )}
                        
                        {isColumnVisible('track') && (
                          <td className="hidden sm:table-cell">
                            {editingStudent === student._id ? (
                              <select
                                className="select select-xs select-bordered"
                                value={editForm.track}
                                onChange={(e) => setEditForm({...editForm, track: e.target.value})}
                              >
                                <option value="Academic Track">Academic Track</option>
                                <option value="Technical-Professional Track">Technical-Professional Track</option>
                              </select>
                            ) : (
                              <span className="text-xs">{student.track}</span>
                            )}
                          </td>
                        )}
                        
                        {isColumnVisible('section') && (
                          <td className="hidden lg:table-cell">
                            {editingStudent === student._id ? (
                              <input
                                type="text"
                                className="input input-xs input-bordered"
                                value={editForm.section}
                                onChange={(e) => setEditForm({...editForm, section: e.target.value})}
                              />
                            ) : (
                              student.section
                            )}
                          </td>
                        )}
                        
                        {isColumnVisible('yearLevel') && (
                          <td className="hidden sm:table-cell">
                            {editingStudent === student._id ? (
                              <select
                                className="select select-xs select-bordered"
                                value={editForm.yearLevel || editForm.grade}
                                onChange={(e) => setEditForm({...editForm, yearLevel: e.target.value, grade: e.target.value})}
                              >
                                <option value="Grade 11">Grade 11</option>
                                <option value="Grade 12">Grade 12</option>
                              </select>
                            ) : (
                              student.yearLevel
                            )}
                          </td>
                        )}
                        
                        {isColumnVisible('isActive') && (
                          <td className="hidden lg:table-cell">
                            <span className={`badge badge-xs ${student.isActive ? 'badge-success' : 'badge-error'}`}>
                              {student.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                        )}
                        
                        {isColumnVisible('totalPoints') && (
                          <td className="hidden lg:table-cell">
                            <span className="font-mono text-xs">{student.totalPoints || 0}</span>
                          </td>
                        )}
                        
                        <td>
                          <div className="flex gap-1">
                            {editingStudent === student._id ? (
                              <>
                                <button
                                  className="btn btn-success btn-xs"
                                  onClick={handleSaveEdit}
                                >
                                  <MdCheck className="w-3 h-3" />
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => setEditingStudent(null)}
                                >
                                  <MdClose className="w-3 h-3" />
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="btn btn-ghost btn-xs"
                                  onClick={() => handleEditStudent(student)}
                                >
                                  <MdEdit className="w-3 h-3" />
                                </button>
                                <button
                                  className="btn btn-ghost btn-xs text-error"
                                  onClick={() => handleDeleteStudent(student._id)}
                                >
                                  <MdDelete className="w-3 h-3" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentList;
