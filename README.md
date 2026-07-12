# OdooHack Setup Guide

A complete, full-stack application setup using Next.js, Express, and PostgreSQL (with Prisma).

## Prerequisites (Preferred Versions)

Make sure you have the following installed before starting:
- **Node.js**: v22.22.1
- **npm**: 10.9.4
- **PostgreSQL**: 18.4

## Quick Setup

I have provided automated scripts to install all dependencies for both the frontend and backend.

Simply run the script that matches your environment:
- **`install.sh`**
- **`install.bat`**

*Note: The script will automatically verify your prerequisites and install all required packages.*

## Environment & Ports

The application communicates across the following default ports:
- **Frontend (Next.js)**: `3000`
- **Backend (Express)**: `5000`
- **Database (PostgreSQL)**: `5432`

## Running the Application

After the setup script completes, you will need to start both the backend and frontend servers in separate terminal windows.

**1. Start the Backend:**
```bash
cd backend
npm run dev
```

**2. Start the Frontend:**
```bash
cd frontend
npm run dev
```

## Verifying the Connection

To check that the Database, Backend, and Frontend are all communicating correctly:
1. Ensure both servers are running.
2. Open your web browser and navigate to [http://localhost:3000](http://localhost:3000).
3. If you see a **Success** message on the screen showing data fetched from the database, then everything is correctly connected and ready to go!
