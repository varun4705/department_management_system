from flask import Flask, request, jsonify
from pymongo import MongoClient
from bson.objectid import ObjectId
from bson.json_util import dumps
from flask_cors import CORS

app = Flask(__name__)
CORS(app) # Enable CORS for all routes (allows React frontend to connect)

# --- Configuration ---
# 🔑 CRITICAL: REPLACE THIS LINE with your actual MongoDB Atlas connection string
# Use your confirmed password here!
MONGO_URI = "mongodb+srv://1ms23is141_db_user:airbusa380@cluster0.zwtr0zl.mongodb.net/?appName=Cluster0"
DB_NAME = "DepartmentEventsDB"

# --- Database Connection ---
try:
    client = MongoClient(MONGO_URI)
    db = client[DB_NAME]
    events_collection = db.events
    print(f"✅ Successfully connected to MongoDB Atlas and database: {DB_NAME}")
except Exception as e:
    print(f"❌ Error connecting to MongoDB. Please check MONGO_URI and Network Access: {e}")
    # In a real app, you might raise an exception or exit here

# --- Application Routes ---

@app.route('/')
def home():
    return "Department Events Management System API is running! Use /events to see data."

# Route 1 (READ): Get all events
@app.route('/events')
def get_events():
    # READ Operation: Find all documents
    events = events_collection.find()
    
    # dumps() handles the MongoDB-specific BSON data types (like ObjectId and Date)
    list_output = list(events)
    return dumps(list_output)

# Route 2 (CREATE): Add a new event (Not currently used by React, but essential for the API)
@app.route('/events/add', methods=['POST'])
def add_event():
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
    
    event_data = request.get_json()
    
    # Initialize embedded array and convert reference ID to ObjectId
    event_data['participants'] = []
    
    try:
        event_data['hostDepartmentId'] = ObjectId(event_data['hostDepartmentId'])
    except Exception:
        return jsonify({"msg": "Invalid hostDepartmentId format"}), 400
        
    try:
        result = events_collection.insert_one(event_data)
        return jsonify({"msg": "Event created successfully", "id": str(result.inserted_id)}), 201
    except Exception as e:
        return jsonify({"msg": f"Database insertion failed: {e}"}), 500


# Route 3 (CREATE/UPDATE): Register a participant to an event (uses $push)
@app.route('/events/register/<event_id>', methods=['POST'])
def register_participant(event_id):
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
        
    participant_data = request.get_json()
    
    if 'name' not in participant_data or 'email' not in participant_data:
        return jsonify({"msg": "Missing participant details (name, email)"}), 400
        
    # Prepare the new embedded document
    new_participant = {
        "participantId": ObjectId(), # Generate a unique ID for the participant
        "name": participant_data['name'],
        "email": participant_data['email'],
        "status": "Registered"
    }
    
    try:
        # $push operation to add the participant to the embedded array
        result = events_collection.update_one(
            {"_id": ObjectId(event_id)},
            {"$push": {"participants": new_participant}}
        )
        
        if result.matched_count == 0:
            return jsonify({"msg": "Event not found"}), 404
            
        return jsonify({
            "msg": "Participant successfully registered (Document Updated)", 
            "modified_count": result.modified_count
        }), 200
        
    except Exception as e:
        # Added a clean error message for the frontend
        return jsonify({"msg": f"Registration update failed: {e}"}), 500


# Route 4 (UPDATE): Update a participant's status (Mark Attended/Registered)
@app.route('/events/status/<event_id>/<participant_id>', methods=['PUT'])
def update_participant_status(event_id, participant_id):
    if not request.is_json:
        return jsonify({"msg": "Missing JSON in request"}), 400
        
    status_data = request.get_json()
    new_status = status_data.get('status')
    
    if not new_status:
        return jsonify({"msg": "Missing new status in request"}), 400
        
    try:
        # Filter finds the parent event and the specific embedded participant by ID
        # $set uses the positional operator ($) to update the status of the matched participant
        result = events_collection.update_one(
            {"_id": ObjectId(event_id), "participants.participantId": ObjectId(participant_id)},
            {"$set": {"participants.$.status": new_status}}
        )
        
        if result.matched_count == 0:
            return jsonify({"msg": "Event or Participant not found"}), 404
            
        return jsonify({"msg": "Participant status updated", "modified_count": result.modified_count}), 200
        
    except Exception as e:
        # Added a clean error message for the frontend
        return jsonify({"msg": f"Status update failed: {e}"}), 500

# Route 5 (DELETE): Remove a participant from the event (uses $pull)
@app.route('/events/unregister/<event_id>/<participant_id>', methods=['DELETE'])
def unregister_participant(event_id, participant_id):
    clean_event_id = event_id.strip()
    clean_participant_id = participant_id.strip()
    
    # --- ADD THIS DEBUG LINE HERE ---
    print(f"DEBUG: Attempting to convert Participant ID: |{clean_participant_id}|")
    # --------------------------------
    
    try:
        # CRITICAL FIX: Convert the participant ID string to a PyMongo ObjectId *first*
        participant_oid = ObjectId(clean_participant_id)

        # Use the pre-converted ObjectId in the $pull filter.
        # This structure is the most reliable way to match an embedded ObjectId.
        result = events_collection.update_one(
            {"_id": ObjectId(clean_event_id)},
            {"$pull": {"participants": {"participantId": participant_oid}}}
        )
        
        # Check if the database actually made a change
        if result.modified_count == 0:
            # We hit this because the participant_oid was not found in the array.
            return jsonify({
                "msg": "Deletion failed. Participant ID not found within the event or ID mismatch."
            }), 404
            
        return jsonify({"msg": "Participant successfully removed", "modified_count": result.modified_count}), 200
        
    except Exception as e:
        # Catches errors if the ID string conversion fails
        return jsonify({"msg": f"Deletion failed due to server error: {e}"}), 500
if __name__ == '__main__':
    # Run the Flask development server
    app.run(debug=True)