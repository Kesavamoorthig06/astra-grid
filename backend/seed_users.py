"""Seed admin users to MongoDB"""
from pymongo import MongoClient
from werkzeug.security import generate_password_hash

# MongoDB connection
client = MongoClient('mongodb://localhost:27017/')
db = client['astra_grid_db']
users_collection = db['users']

# Check existing users
existing_count = users_collection.count_documents({})
print(f"Existing users: {existing_count}")

if existing_count > 0:
    print("\nCurrent users:")
    for user in users_collection.find({}, {'email': 1, 'name': 1, '_id': 0}):
        print(f"  - {user.get('email')} ({user.get('name', 'N/A')})")
    
    # Ask if we should delete and reseed
    print("\nDeleting all users and reseeding...")
    users_collection.delete_many({})

# Seed admin users
admin_users = [
    {'email': 'abroesly@powergrid.com', 'password': generate_password_hash('admin123'), 'name': 'A B Roesly'},
    {'email': 'kesavamoorthi@powergrid.com', 'password': generate_password_hash('admin123'), 'name': 'Kesavamoorthi'},
]

result = users_collection.insert_many(admin_users)
print(f"\n[OK] Seeded {len(result.inserted_ids)} admin users:")
for user in admin_users:
    print(f"  - {user['email']} / admin123")

print("\nYou can now login with these credentials!")
