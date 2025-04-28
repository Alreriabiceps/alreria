const handleDeleteSchedule = async (weekId) => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/weeks/${weekId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || 'Failed to delete schedule');
        }

        // Refresh the schedules list after successful deletion
        fetchSchedules();
    } catch (err) {
        console.error('Error deleting schedule:', err);
        if (err.message.includes('token') || err.message.includes('authentication')) {
            window.location.href = '/admin/login';
        } else {
            setError(err.message);
        }
    }
}; 