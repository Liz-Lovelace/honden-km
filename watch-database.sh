#!/bin/bash

DATABASE_PATH="/home/m/infotest/dim.db"

while true; do
    # Clear the screen
    clear

    # For every table in the database, output its content
    for table in $(sqlite3 $DATABASE_PATH ".tables"); do
        echo "===== $table ====="
        sqlite3 $DATABASE_PATH "SELECT * FROM $table;"
        echo
    done

    # Wait for 0.3 seconds
    sleep 0.3
done

