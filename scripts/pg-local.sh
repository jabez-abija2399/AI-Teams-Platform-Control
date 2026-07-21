#!/bin/bash
# Local PostgreSQL manager for development
# Usage: ./pg-local.sh start|stop|status|connect

PGDATA="/tmp/pgdata"
SOCKET="/tmp/pgdata/socket"
PORT=5433
DB="ai_teams_platform"
USER="jabez"

start() {
  if [ -f "$PGDATA/postmaster.pid" ]; then
    echo "PostgreSQL already running"
    return 0
  fi
  echo "Starting local PostgreSQL on port $PORT..."
  /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" -l "$PGDATA/logfile" start -o "-p $PORT -k $SOCKET"
  echo "Started. Connect: psql -h $SOCKET -p $PORT -U $USER -d $DB"
}

stop() {
  if [ ! -f "$PGDATA/postmaster.pid" ]; then
    echo "PostgreSQL not running"
    return 0
  fi
  echo "Stopping local PostgreSQL..."
  /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" stop -m fast
  echo "Stopped"
}

status() {
  if [ -f "$PGDATA/postmaster.pid" ]; then
    echo "PostgreSQL is running on port $PORT"
    /usr/lib/postgresql/16/bin/pg_ctl -D "$PGDATA" status
  else
    echo "PostgreSQL is not running"
  fi
}

connect() {
  psql -h "$SOCKET" -p "$PORT" -U "$USER" -d "$DB"
}

case "$1" in
  start)   start ;;
  stop)    stop ;;
  status)  status ;;
  connect) connect ;;
  *)       echo "Usage: $0 {start|stop|status|connect}" ;;
esac
