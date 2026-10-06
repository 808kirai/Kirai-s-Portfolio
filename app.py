import sqlite3
import requests
from flask import Flask, jsonify, request
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Cross-Origin Resource Sharing enabled for web frontend access
DATABASE = 'database.db'


def get_db_connection():
    conn = sqlite3.connect(DATABASE)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Initialize SQLite database schemas for parking spots and reservation records."""
    conn = get_db_connection()
    conn.execute('''
        CREATE TABLE IF NOT EXISTS parking_spots (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            spot_number TEXT NOT NULL UNIQUE,
            is_occupied BOOLEAN NOT NULL DEFAULT 0,
            vehicle_plate TEXT,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Seed default parking spots if empty
    cursor = conn.cursor()
    cursor.execute('SELECT COUNT(*) FROM parking_spots')
    if cursor.fetchone()[0] == 0:
        default_spots = [('A1', 0, None), ('A2', 0, None), ('B1', 1, 'KDA 123A'), ('B2', 0, None)]
        cursor.executemany(
            'INSERT INTO parking_spots (spot_number, is_occupied, vehicle_plate) VALUES (?, ?, ?)',
            default_spots
        )
        conn.commit()
    conn.close()


@app.route('/api/spots', methods=['GET'])
def get_spots():
    """Retrieve current parking space statuses."""
    conn = get_db_connection()
    spots = conn.execute('SELECT * FROM parking_spots').fetchall()
    conn.close()
    return jsonify([dict(spot) for spot in spots])


@app.route('/api/reserve', methods=['POST'])
def reserve_spot():
    """Reserve or occupy a parking spot."""
    data = request.get_json() or {}
    spot_number = data.get('spot_number')
    plate = data.get('vehicle_plate')

    if not spot_number or not plate:
        return jsonify({'error': 'Missing spot_number or vehicle_plate'}), 400

    conn = get_db_connection()
    spot = conn.execute('SELECT * FROM parking_spots WHERE spot_number = ?', (spot_number,)).fetchone()

    if not spot:
        conn.close()
        return jsonify({'error': f'Spot {spot_number} not found'}), 404

    if spot['is_occupied']:
        conn.close()
        return jsonify({'error': f'Spot {spot_number} is currently occupied'}), 400

    conn.execute(
        'UPDATE parking_spots SET is_occupied = 1, vehicle_plate = ?, updated_at = CURRENT_TIMESTAMP WHERE spot_number = ?',
        (plate, spot_number)
    )
    conn.commit()
    conn.close()

    return jsonify({'status': 'success', 'message': f'Spot {spot_number} reserved for {plate}'}), 200


@app.route('/api/release', methods=['POST'])
def release_spot():
    """Release an occupied parking spot."""
    data = request.get_json() or {}
    spot_number = data.get('spot_number')

    if not spot_number:
        return jsonify({'error': 'Missing spot_number'}), 400

    conn = get_db_connection()
    conn.execute(
        'UPDATE parking_spots SET is_occupied = 0, vehicle_plate = NULL, updated_at = CURRENT_TIMESTAMP WHERE spot_number = ?',
        (spot_number,)
    )
    conn.commit()
    conn.close()

    return jsonify({'status': 'success', 'message': f'Spot {spot_number} is now free'}), 200


@app.route('/api/github-contributions/<username>', methods=['GET'])
def github_contributions_proxy(username):
    """Proxy endpoint to fetch contribution calendar JSON for any GitHub username."""
    try:
        url = f"https://github-contributions-api.deno.dev/{username}.json"
        res = requests.get(url, timeout=5)
        if res.status_code == 200:
            return jsonify(res.json())
        return jsonify({'error': 'Failed to retrieve GitHub activity'}), res.status_code
    except Exception as e:
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    init_db()
    app.run(host='0.0.0.0', port=5000, debug=True)