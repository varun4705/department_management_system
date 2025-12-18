import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';

const API_BASE_URL = 'http://127.0.0.1:5000/events'; 

const EventDetails = () => {
    const { id } = useParams();
    const [event, setEvent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newName, setNewName] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // Wrap fetchData in useCallback to prevent infinite loop/linter warning
    const fetchData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(API_BASE_URL);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const data = await response.json();
            
            // Note: The event ID is correctly accessed via ._id.$oid from the MongoDB/Flask response
            const foundEvent = data.find(e => e._id?.$oid === id); 
            setEvent(foundEvent);
        } catch (e) {
            console.error("Fetch Error:", e);
            setError("Failed to connect to backend API.");
        } finally {
            setLoading(false);
        }
    }, [id]); // fetchData depends on 'id'

    // Fixes the React Hook useEffect has a missing dependency warning
    useEffect(() => {
        fetchData();
    }, [fetchData]); // Now depends only on fetchData

    // --- CRUD FUNCTIONS ---

    // 1. CREATE: Register Participant
    const handleRegister = async (e) => {
        e.preventDefault();
        try {
            const response = await fetch(`${API_BASE_URL}/register/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: newName, email: newEmail }),
            });
            if (!response.ok) throw new Error("Registration failed.");
            
            alert('Registration Successful (CREATE)!');
            setNewName('');
            setNewEmail('');
            fetchData(); // Refresh the data to show the new participant
        } catch (e) {
            alert('Error registering participant.');
        }
    };

    // 2. DELETE: Remove Participant
    const handleRemove = async (participantId) => {
        if (!window.confirm("Are you sure you want to remove this participant?")) return;
        
        try {
            // Use optional chaining for safer ID access, sending the raw string ID to Flask
            const participantOid = participantId?.$oid || participantId; 
            const response = await fetch(`${API_BASE_URL}/unregister/${id}/${participantOid}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error("Deletion failed.");

            alert('Participant Removed (DELETE)!');
            fetchData(); // Refresh the data
        } catch (e) {
            alert('Error removing participant.');
        }
    };

    // 3. UPDATE: Change Status
    const handleStatusChange = async (participantId, currentStatus) => {
        const newStatus = currentStatus === 'Registered' ? 'Attended' : 'Registered';

        try {
            // Use optional chaining for safer ID access, sending the raw string ID to Flask
            const participantOid = participantId?.$oid || participantId; 
            const response = await fetch(`${API_BASE_URL}/status/${id}/${participantOid}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
            if (!response.ok) throw new Error("Status update failed.");
            
            alert(`Status updated to ${newStatus} (UPDATE)!`);
            fetchData(); // Refresh the data
        } catch (e) {
            alert('Error updating status.');
        }
    };


    // --- RENDERING ---

    if (loading) return <div className="container mt-5"><div className="alert alert-info">Loading Event Details...</div></div>;
    if (error) return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
    if (!event) return <div className="container mt-5"><div className="alert alert-warning">Event not found.</div></div>;

    // Safely format the date, handling both $date and direct date formats
    const formattedDate = new Date(event.date?.$date || event.date).toLocaleDateString();

    return (
        // REMOVED: style={{ fontFamily: 'Times New Roman' }}
        <div className="container mt-5"> 
            <div className="card shadow-lg border-primary">
                <div className="card-header bg-primary text-white text-center">
                    <h3 className="mb-0" style={{ fontWeight: 'bold' }}>{event.title}</h3>
                </div>
                <div className="card-body">
                    
                    <div className="row">
                        {/* LEFT COLUMN: Event Info and Registration */}
                        <div className="col-md-5 border-end">
                            <h4 style={{ fontWeight: 'bold', color: '#007bff' }}>Event Information</h4>
                            <p><strong>Description:</strong> {event.description}</p>
                            <p><strong>Date:</strong> {formattedDate}</p>
                            <p><strong>Time:</strong> {event.time}</p>
                            <p><strong>Venue:</strong> {event.venue.name} (Capacity: {event.venue.capacity})</p>
                            <p className="text-muted small">MongoDB ID: {id}</p>
                            
                            <hr />

                            <h4 style={{ fontWeight: 'bold', color: '#28a745' }}>**Live Registration Demo (CREATE)**</h4>
                            <form onSubmit={handleRegister} className="mt-3">
                                <div className="mb-2">
                                    <input type="text" className="form-control" placeholder="Full Name" value={newName} onChange={(e) => setNewName(e.target.value)} required />
                                </div>
                                <div className="mb-3">
                                    <input type="email" className="form-control" placeholder="Email Address" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} required />
                                </div>
                                <button type="submit" className="btn btn-success w-100">
                                    Register Participant (POST API Call)
                                </button>
                            </form>
                        </div>
                        
                        {/* RIGHT COLUMN: Participants List and CRUD Actions */}
                        <div className="col-md-7">
                            <h4 style={{ fontWeight: 'bold', color: '#dc3545' }}>**Embedded Participants List (READ/UPDATE/DELETE)** ({event.participants?.length || 0})</h4>
                            
                            {event.participants && event.participants.length > 0 ? (
                                <ul className="list-group mt-3">
                                    {event.participants.map((p) => (
                                        <li key={p.participantId?.$oid} className="list-group-item d-flex justify-content-between align-items-center flex-wrap">
                                            <div>
                                                {p.name} <span className="small text-muted">({p.email})</span>
                                            </div>
                                            <div className="btn-group btn-group-sm">
                                                <button 
                                                    onClick={() => handleStatusChange(p.participantId, p.status)}
                                                    // Used template literal for cleaner button class determination
                                                    className={`btn btn-${p.status === 'Registered' ? 'warning' : 'info'} me-2`} 
                                                    style={{ fontSize: '0.85rem' }}
                                                >
                                                    {p.status === 'Registered' ? 'Mark Attended (UPDATE)' : 'Mark Registered (UPDATE)'}
                                                </button>
                                                <button 
                                                    onClick={() => handleRemove(p.participantId)}
                                                    className="btn btn-danger"
                                                    style={{ fontSize: '0.85rem' }}
                                                >
                                                    Remove (DELETE)
                                                </button>
                                            </div>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="alert alert-warning mt-3">No participants registered yet. Be the first!</div>
                            )}

                        </div>
                    </div>
                    
                    <hr className="my-4" />
                    
                    <Link to="/events" className="btn btn-secondary">
                        ← Back to Event List
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default EventDetails;