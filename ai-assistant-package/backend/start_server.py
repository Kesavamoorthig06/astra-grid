"""
Power Grid AI Server Starter
Run with: python start_server.py
"""
import sys
import os

# Set environment
os.environ['ENABLE_WEB_SEARCH'] = 'true'

sys.path.insert(0, os.path.dirname(__file__))

print("=" * 60)
print("POWER GRID AI SERVER")
print("=" * 60)

print("Loading application...")
from app import app, db_handler

print("Initializing database...")
db_handler.initialize_database()

print("")
print("Starting server on http://localhost:5000")
print("Frontend should connect to this backend")
print("Press Ctrl+C to stop")
print("=" * 60)

if __name__ == '__main__':
    try:
        print("Starting Waitress server...")
        from waitress import serve
        serve(app, host='0.0.0.0', port=5000, threads=4)
    except ImportError:
        print("Waitress not installed, using Flask dev server...")
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
    except KeyboardInterrupt:
        print("\nShutting down...")
    except Exception as e:
        print(f"Error: {e}")
        import traceback
        traceback.print_exc()
        print("Trying Flask dev server...")
        app.run(host='0.0.0.0', port=5000, debug=False, threaded=True, use_reloader=False)
