import sqlite3

connection = sqlite3.connect("crop_yield.db")

tables = connection.execute(
    """
    SELECT name
    FROM sqlite_master
    WHERE type = 'table'
    ORDER BY name
    """
).fetchall()

for (table_name,) in tables:
    print(f"\n--- {table_name} ---")

    columns = connection.execute(
        f'PRAGMA table_info("{table_name}")'
    ).fetchall()

    for column in columns:
        print(
            f"Column: {column[1]}, "
            f"Type: {column[2]}, "
            f"Primary key: {bool(column[5])}"
        )

connection.close()