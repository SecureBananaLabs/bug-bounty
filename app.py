from flask import Flask, jsonify
import os
import pymysql

app = Flask(__name__)

DB_HOST = os.environ.get('DB_HOST', 'localhost')
DB_PORT = int(os.environ.get('DB_PORT', 3306))
DB_USER = os.environ.get('DB_USER', 'root')
DB_PASSWORD = os.environ.get('DB_PASSWORD', '')
DB_NAME = os.environ.get('DB_NAME', 'app')


@app.route('/health')
def health():
    return jsonify({"status": "healthy"}), 200


@app.route('/ready')
def readiness():
    try:
        connection = pymysql.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            database=DB_NAME,
            connect_timeout=5
        )
        connection.close()
        return jsonify({"status": "ready", "database": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "not_ready", "database": "disconnected", "error": str(e)}), 503


@app.route('/')
def index():
    return jsonify({"message": "Welcome to the API"})


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))
