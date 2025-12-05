@echo off
echo Building Frontend...
cd frontend
call npm install
call npm run build
cd ..

echo Installing Backend Dependencies...
cd backend
call npm install
cd ..

echo Production Build Complete.
echo To run in production:
echo 1. Ensure .env files have valid GOOGLE_CLIENT_ID
echo 2. Set NODE_ENV=production in backend/.env
echo 3. Start backend: cd backend && npm start
echo 4. Serve frontend build (e.g., using 'serve -s build' in frontend)
pause
