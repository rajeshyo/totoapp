# 🚀 TotoBondhu - Single Command Startup

## ✅ Changes Made

Your backend has been updated to serve the frontend:

1. ✅ Added `const path = require('path');` to server.js
2. ✅ Added express.static() middleware to serve `/public` folder
3. ✅ Copied frontend files (index.html, script.js, styles.css) to `backend/public/`

## 🎯 How to Run (Single Command)

Now you can run **BOTH** frontend and backend with ONE command:

### From the `backend` folder:
```bash
cd backend
npm start
```

This will:
- ✅ Start Express server on port 5000
- ✅ Connect to MongoDB Atlas
- ✅ Serve frontend files (index.html, script.js, styles.css)
- ✅ Make API available at http://localhost:5000/api

## 🌐 Open in Browser

Once backend is running, just open your browser and go to:
```
http://localhost:5000
```

You'll see your TotoBondhu app loaded!

## 📁 Folder Structure

```
backend/
├── server.js (Updated with express.static)
├── package.json
├── .env
├── public/
│   ├── index.html
│   ├── script.js
│   └── styles.css
├── config/
├── models/
├── routes/
└── middleware/
```

## ✨ What Just Happened

Before:
- Frontend: Needed to open index.html separately
- Backend: npm start in backend folder
- Two separate processes

After:
- Frontend: Served by Express from `/public`
- Backend: npm start in backend folder
- Single process that serves both!

## 🔄 Workflow

1. Open terminal
2. Navigate to backend folder: `cd backend`
3. Start server: `npm start`
4. Open browser: `http://localhost:5000`
5. Done! 🎉

## 📝 API Endpoints

Your API endpoints remain the same:
- `http://localhost:5000/api/auth/login`
- `http://localhost:5000/api/auth/signup`
- `http://localhost:5000/api/rides/request`
- etc.

And frontend files are served at:
- `http://localhost:5000/` → index.html
- `http://localhost:5000/script.js` → JavaScript
- `http://localhost:5000/styles.css` → Styles

---

**Ready to go!** Just run `npm start` from the backend folder. 🚀
