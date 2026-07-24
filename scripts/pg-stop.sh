#!/bin/bash
# Stop the embedded PostgreSQL server
PG_BIN="/home/z/my-project/node_modules/@embedded-postgres/linux-x64/native/bin"
PG_DATA="/home/z/my-project/.pg-data"
export LD_LIBRARY_PATH="/home/z/my-project/node_modules/@embedded-postgres/linux-x64/native/lib:$LD_LIBRARY_PATH"

echo "Stopping PostgreSQL server..."
"$PG_BIN/pg_ctl" -D "$PG_DATA" stop 2>&1
echo "✅ PostgreSQL stopped."
