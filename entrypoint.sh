#!/bin/sh

# Start JSON Server
npx json-server -p 3500 -w src/db.json &

# Start Express Server
node server.js
