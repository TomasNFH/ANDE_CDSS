#!/bin/bash

# Start the backend server
cd flask-server
source venv/bin/activate
python3 server.py &

# Start the frontend application
cd ../client
npm install
npm run dev &