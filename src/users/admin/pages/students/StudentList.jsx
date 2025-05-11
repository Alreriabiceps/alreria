import React, { useState, useEffect } from "react";
import { MdSearch, MdFilterList, MdEdit, MdDelete, MdAdd } from "react-icons/md";
import { useGuideMode } from '../../../../contexts/GuideModeContext';

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
            <button className="btn btn-primary btn-sm gap-2">
              <MdAdd className="w-5 h-5" />
              Add Student
            </button>
          </div>

          {guideMode && (
            <details open className="mb-6 bg-info/10 border border-info rounded p-3">
              <summary className="cursor-pointer font-medium text-base text-info mb-1">How to use the Student List page?</summary>
              <ol className="mt-2 text-sm text-base-content list-decimal list-inside space-y-1">
                <li>View all students in the list below.</li>
                <li>Use the search or filters to find specific students.</li>
                <li>Edit or delete students using the icons next to each student.</li>
                <li>All changes are saved automatically or after confirmation.</li>
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
                      <th>Name</th>
                      <th>Student ID</th>
                      <th className="hidden lg:table-cell">Age</th>
                      <th>Strand</th>
                      <th className="hidden md:table-cell">Section</th>
                      <th>Year Level</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentStudents.map((student) => (
                      <tr key={student._id} className="hover">
                        <td>
                          <div className="font-medium">
                            {student.firstName} {student.lastName}
                          </div>
                        </td>
                        <td>{student.studentId}</td>
                        <td className="hidden lg:table-cell">{student.age}</td>
                        <td>
                          <span className="badge badge-ghost">
                            {student.strand}
                          </span>
                        </td>
                        <td className="hidden md:table-cell">
                          {student.section}
                        </td>
                        <td>{student.yearLevel}</td>
                        <td className="text-right">
                          <div className="flex justify-end gap-2">
                            <button className="btn btn-ghost btn-sm">
                              <MdEdit className="w-5 h-5" />
                            </button>
                            <button className="btn btn-ghost btn-sm text-error">
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
    </div>
  );
};

export default StudentList;
