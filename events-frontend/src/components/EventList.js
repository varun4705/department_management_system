import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';

// The URL for your Flask Backend's READ endpoint
const API_URL = 'http://127.0.0.1:5000/events'; 

const EventList = () => {
    const [events, setEvents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Fetch data from the running Flask server
        fetch(API_URL)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                setEvents(data);
                setLoading(false);
            })
            .catch(error => {
                console.error("Error fetching events:", error);
                setError("Failed to connect to backend API. Ensure python app.py is running.");
                setLoading(false);
            });
    }, []);

    // --- Conditional Rendering ---
    if (loading) return <div className="container mt-5"><div className="alert alert-info">Loading Events...</div></div>;
    if (error) return <div className="container mt-5"><div className="alert alert-danger">{error}</div></div>;
    if (events.length === 0) return <div className="container mt-5"><div className="alert alert-warning">No Events found in MongoDB.</div></div>;

    return (
        <div className="container mt-4">
            <h1 className="mb-4 text-primary">Available Events</h1>
            <div className="list-group">
                {events.map(event => (
                    // event._id is a complex BSON object, so we access $oid for the string ID
                    <div key={event._id.$oid} className="list-group-item list-group-item-action d-flex justify-content-between align-items-center">
                        <div>
                            <h5>{event.title}</h5>
                            <small className="text-muted">
                                Venue: {event.venue.name} | 
                                Date: {new Date(event.date.$date).toLocaleDateString()}
                            </small>
                        </div>
                        <div>
                            <span className="badge bg-success me-3">
                                Participants: {event.participants.length}
                            </span>
                            {/* Link to details page, passing the MongoDB ID */}
                            <Link to={`/details/${event._id.$oid}`} className="btn btn-sm btn-outline-primary">
                                View Details
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
             <p className="mt-3 text-muted">Data retrieved live from MongoDB via Flask API.</p>
        </div>
    );
};

export default EventList;