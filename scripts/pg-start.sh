#!/bin/bash
# Start the embedded PostgreSQL server for QBIT Hub development
# Usage: ./scripts/pg-start.sh

PG_BIN="/home/z/my-project/node_modules/@embedded-postgres/linux-x64/native/bin"
PG_DATA="/home/z/my-project/.pg-data"
export LD_LIBRARY_PATH="/home/z/my-project/node_modules/@embedded-postgres/linux-x64/native/lib:$LD_LIBRARY_PATH"

# Check if already running
if node -e "const net=require('net');const c=new net.Socket();c.setTimeout(500);c.connect(54321,'localhost',()=>{console.log('RUNNING');c.destroy()});c.on('error',()=>{console.log('STOPPED');c.destroy()});c.on('timeout',()=>{console.log('STOPPED');c.destroy()})" 2>/dev/null | grep -q RUNNING; then
  echo "✅ PostgreSQL is already running on port 54321"
  exit 0
fi

# Initialize if needed
if [ ! -d "$PG_DATA" ]; then
  echo "Initializing PostgreSQL cluster..."
  "$PG_BIN/initdb" -D "$PG_DATA" --auth=password --username=postgres --pwprompt 2>&1
fi

# Start the server
echo "Starting PostgreSQL server on port 54321..."
"$PG_BIN/pg_ctl" -D "$PG_DATA" -l "/tmp/pg-logfile" start 2>&1

sleep 2
echo ""
echo "DATABASE_URL=postgres://postgres:qbithub2024@localhost:54321/qbithub"
echo ""
echo "To stop: $PG_BIN/pg_ctl -D $PG_DATA stop"
