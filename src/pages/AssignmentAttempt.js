import React, { useState, useEffect, useContext, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import Editor from '@monaco-editor/react';
import { AuthContext } from '../context/AuthContext';

const AssignmentAttempt = () => {
    const { slug } = useParams();
    const { user } = useContext(AuthContext);
    const [assignment, setAssignment] = useState(null);
    const [query, setQuery] = useState('-- Type your SQL query here\n');
    const [results, setResults] = useState(null);
    const [loading, setLoading] = useState(true);
    const [executing, setExecuting] = useState(false);
    const [hint, setHint] = useState('');
    const [gettingHint, setGettingHint] = useState(false);
    const [error, setError] = useState(null);
    const [history, setHistory] = useState([]);

    useEffect(() => {
        const fetchAssignment = async () => {
            try {
                const res = await axios.get(`https://ciphersqlstudiobackend.onrender.com/api/assignments/${slug}`);
                setAssignment(res.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load assignment.');
                setLoading(false);
            }
        };
        fetchAssignment();
    }, [slug]);

    const fetchHistory = useCallback(async () => {
        if (!user || !assignment?._id) return;
        try {
            const config = { headers: { Authorization: `Bearer ${user.token}` } };
            const res = await axios.get(`https://ciphersqlstudiobackend.onrender.com/api/attempts?assignmentId=${assignment._id}`, config);
            setHistory(res.data);
        } catch (err) {
            console.error('Failed to fetch history');
        }
    }, [user, assignment?._id]);

    useEffect(() => {
        if (user && assignment?._id) {
            fetchHistory();
        }
    }, [user, assignment?._id, fetchHistory]);

    const handleExecute = async () => {
        setExecuting(true);
        setError(null);
        try {
            const config = user ? { headers: { Authorization: `Bearer ${user.token}` } } : {};
            const res = await axios.post('https://ciphersqlstudiobackend.onrender.com/api/query', {
                query,
                assignmentId: assignment._id
            }, config);
            setResults(res.data);
            if (user) fetchHistory();
        } catch (err) {
            setError(err.response?.data?.message || 'Query execution failed.');
            if (user) fetchHistory();
        } finally {
            setExecuting(false);
        }
    };

    const handleGetHint = async () => {
        setGettingHint(true);
        try {
            const res = await axios.post('https://ciphersqlstudiobackend.onrender.com/api/hint', {
                question: assignment.question,
                userQuery: query,
                schemaContext: assignment.sampleDataSchema
            });
            setHint(res.data.hint);
        } catch (err) {
            setHint('Failed to get hint. Please try again.');
        } finally {
            setGettingHint(false);
        }
    };

    if (loading) return <div className="container main-content">Loading assignment...</div>;
    if (!assignment) return <div className="container main-content">Assignment not found.</div>;

    return (
        <div className="container-fluid attempt-page">
            <div className="attempt-layout">
                {/* Left Panel: Question and Schema */}
                <div className="panel question-panel">
                    <div className="panel__header">
                        <Link to="/" className="back-link">← Back to Assignments</Link>
                        <h2>{assignment.title}</h2>
                    </div>
                    <div className="panel__content">
                        <div className="question-text">
                            <p>{assignment.question}</p>
                        </div>
                        <div className="schema-viewer">
                            <h4>Database Schema</h4>
                            <pre><code>{assignment.sampleDataSchema}</code></pre>
                        </div>
                    </div>
                </div>

                {/* Right Panel: Editor and Results */}
                <div className="panel editor-panel">
                    <div className="panel__header">
                        <h3>SQL Editor</h3>
                        <div className="actions">
                            <button
                                className="btn btn--warning btn--sm"
                                onClick={handleGetHint}
                                disabled={gettingHint}
                            >
                                {gettingHint ? 'Thinking...' : 'Get Hint'}
                            </button>
                            <button
                                className="btn btn--primary btn--sm"
                                onClick={handleExecute}
                                disabled={executing}
                            >
                                {executing ? 'Running...' : 'Execute Query'}
                            </button>
                        </div>
                    </div>

                    <div className="editor-container">
                        <Editor
                            height="35vh"
                            defaultLanguage="sql"
                            theme="vs-dark"
                            value={query}
                            onChange={(value) => setQuery(value)}
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                scrollBeyondLastLine: false,
                            }}
                        />
                    </div>

                    {user && history.length > 0 && (
                        <div className="history-panel">
                            <h4>Previous Attempts</h4>
                            {history.map((attempt) => (
                                <div
                                    key={attempt._id}
                                    className={`attempt-item status-${attempt.status}`}
                                    onClick={() => setQuery(attempt.query)}
                                >
                                    <span className="attempt-query">{attempt.query}</span>
                                    <span className="attempt-date">
                                        {new Date(attempt.createdAt).toLocaleTimeString()}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {hint && (
                        <div className="hint-box fade-in">
                            <strong>💡 Hint:</strong> {hint}
                            <button className="close-hint" onClick={() => setHint('')}>×</button>
                        </div>
                    )}

                    <div className="results-container">
                        <div className="panel__header">
                            <h3>Query Results</h3>
                            {results && <span className="row-count">{results.rowCount} rows found in {results.duration}</span>}
                        </div>
                        <div className="results-content">
                            {error && <div className="error-message">{error}</div>}
                            {results && results.success && (
                                <div className="table-wrapper">
                                    <table className="results-table">
                                        <thead>
                                            <tr>
                                                {results.fields.map(field => <th key={field}>{field}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.data.map((row, i) => (
                                                <tr key={i}>
                                                    {results.fields.map(field => <td key={field}>{row[field]}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            {!results && !error && <div className="placeholder">Execute a query to see results.</div>}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AssignmentAttempt;
