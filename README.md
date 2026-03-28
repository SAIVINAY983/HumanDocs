# HumanDocs 📝✨

A powerful, open-source Google Docs alternative with real-time collaboration, intelligent AI assistance, and robust security features. Built for teams that need seamless document editing without the enterprise overhead.

## Features 🚀
* **Real-time Collaboration**: Type alongside your team with live cursor tracking powered by WebSockets.
* **AI-Powered Writing Assistant**: Integrated Google Gemini AI to instantly Summarize, Improve Writing, or Fix Grammar on selected text.
* **Granular Access Control**: Share documents via link with specific Viewer or Editor roles, or lock documents completely inside a password-protected Vault.
* **Version History**: Save snapshots of your document and securely roll back to previous versions at any time.
* **PDF & Text Export**: Instantly download your masterpiece to your local machine.

## Tech Stack 🛠️
* **Frontend**: React.js, Vite, Tailwind CSS, Framer Motion, React Quill
* **Backend**: Node.js, Express.js, Socket.io
* **Database**: MongoDB & Mongoose
* **Authentication**: JWT & @react-oauth/google
* **AI**: Google Generative AI SDK (Gemini)

## Setup & Installation 💻

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/humandocs.git
   cd humandocs
   ```

2. **Backend Configuration**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory:
   ```env
   PORT=5001
   MONGODB_URI=your_mongodb_atlas_connection_string
   JWT_SECRET=supersecretkey
   FRONTEND_URL=http://localhost:5174
   GEMINI_API_KEY=your_gemini_api_key
   EMAIL_USER=your_email@gmail.com
   EMAIL_PASS=your_app_password
   ```
   Start the backend:
   ```bash
   node index.js
   ```

3. **Frontend Configuration**
   ```bash
   cd ../frontend
   npm install
   ```
   Create a `.env` file in the `frontend` directory:
   ```env
   VITE_GOOGLE_CLIENT_ID=your_google_cloud_client_id.apps.googleusercontent.com
   ```
   Start the frontend:
   ```bash
   npm run dev
   ```

4. **Launch**
   Open `http://localhost:5174` in your browser!

---
*Built with ❤️ for modern document collaboration.*
