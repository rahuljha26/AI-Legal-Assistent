import sqlite3
import pandas as pd

conn = sqlite3.connect('IndiaLaw.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table';")
tables = cursor.fetchall()
print("Tables:", tables)

for table in tables:
    table_name = table[0]
    print(f"\n--- Schema for {table_name} ---")
    cursor.execute(f"PRAGMA table_info({table_name});")
    print(cursor.fetchall())
    
    print(f"\n--- First 3 rows of {table_name} ---")
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3;")
    print(cursor.fetchall())
