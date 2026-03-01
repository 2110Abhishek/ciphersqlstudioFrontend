import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const AssignmentList = () => {
    const [assignments, setAssignments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchAssignments = async () => {
            try {
                const res = await axios.get('https://ciphersqlstudiobackend.onrender.com/api/assignments');
                setAssignments(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load assignments. Please ensure the server is running.');
                setLoading(false);
            }
        };
        fetchAssignments();
    }, []);

    if (loading) return <div className="container main-content">Loading assignments...</div>;
    if (error) return <div className="container main-content text-danger">{error}</div>;

    return (
        <div className="container main-content fade-in">
            <header className="page-header">
                <h1>Available Assignments</h1>
                <p>Select an assignment to practice your SQL skills.</p>
            </header>

            <div className="assignment-grid">
                {assignments.map((assignment) => (
                    <div key={assignment._id} className="card assignment-card">
                        <div className={`badge badge--${assignment.difficulty.toLowerCase()}`}>
                            {assignment.difficulty}
                        </div>
                        <h3>{assignment.title}</h3>
                        <p>{assignment.description}</p>
                        <Link to={`/attempt/${assignment.slug}`} className="btn">
                            Attempt Assignment
                        </Link>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default AssignmentList;
