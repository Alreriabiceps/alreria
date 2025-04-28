const fetchSchedule = async () => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/weeks/active`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        if (!res.ok) {
            throw new Error("Failed to fetch schedule");
        }
        const data = await res.json();
        setSchedule(data);
        setUniqueSubjects(extractUniqueSubjects(data));
    } catch (err) {
        console.error("Error fetching schedule:", err);
        if (err.message.includes('token') || err.message.includes('authentication')) {
            window.location.href = '/admin/login';
        }
    }
};

const handleCreateSchedule = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const res = await fetch(`${backendurl}/api/weeks`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                weekNumber: parseInt(weekNumber),
                startDate: startDate,
                endDate: endDate,
                subjects: selectedSubjects,
            }),
        });

        if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.message || "Failed to create schedule");
        }

        const data = await res.json();
        setSchedule(data);
        setSuccess("Schedule created successfully!");
        setWeekNumber("");
        setStartDate("");
        setEndDate("");
        setSelectedSubjects([]);
    } catch (err) {
        console.error("Error creating schedule:", err);
        setError(err.message);
        if (err.message.includes('token') || err.message.includes('authentication')) {
            window.location.href = '/admin/login';
        }
    } finally {
        setLoading(false);
    }
}; 