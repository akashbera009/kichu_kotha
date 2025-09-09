# কিছু কথা (Kichu Kotha) - Real-time Chat Application

A modern, full-stack chat application built with the MERN stack, featuring real-time messaging, voice messages, image sharing, and a beautiful Bengali-inspired design.

## ✨ Features

- **Real-time Messaging**: Instant text messaging with Socket.io
- **Voice Messages**: Record and send voice notes
- **Image Sharing**: Upload and share images with Cloudinary
- **Online Status**: See who's online and when they were last seen
- **Typing Indicators**: Know when someone is typing
- **Modern UI**: Clean, responsive design with smooth animations
- **User Authentication**: Secure login/registration with JWT
- **Contact Management**: Add and manage contacts
- **Message Status**: See sent/delivered/read status
- **Bengali Theme**: Beautiful Bengali typography and cultural elements

## 🚀 Tech Stack

### Backend
- **Node.js** & **Express.js** - Server framework
- **MongoDB** & **Mongoose** - Database
- **Socket.io** - Real-time communication
- **JWT** - Authentication
- **bcryptjs** - Password hashing
- **Cloudinary** - File storage
- **Multer** - File upload handling

### Frontend
- **React.js** - Frontend framework
- **React Router** - Navigation
- **Socket.io Client** - Real-time communication
- **Axios** - HTTP client
- **Context API** - State management
- **CSS Modules** - Styling

## 📦 Installation

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account
- Cloudinary account

### Backend Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd kotha-app/backend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=90d
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
FRONTEND_URL=http://localhost:3000
PORT=5000
```

5. Start the server:
```bash
npm run dev
```

### Frontend Setup

1. Navigate to frontend directory:
```bash
cd ../frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env` file:
```bash
cp .env.example .env
```

4. Configure environment variables:
```env
VITE_BACKEND_URL2=http://localhost:5000
REACT_APP_NAME=Kotha
```

5. Start the development server:
```bash
npm start
```

The application will be available at `http://localhost:3000`

## 🎯 Usage

1. **Register**: Create a new account with username and password
2. **Login**: Sign in with your credentials
3. **Add Contacts**: Search for users by username and add them as contacts
4. **Start Chatting**: Select a contact and start messaging
5. **Send Media**: Click the image icon to upload photos or microphone for voice messages
6. **Voice Messages**: Hold the microphone button to record voice messages

## 📱 Features Overview

### Authentication
- Secure user registration and login
- JWT-based authentication
- Password hashing with bcrypt
- Auto-login with stored tokens

### Real-time Communication
- Instant message delivery
- Online/offline status
- Typing indicators
- Message read receipts
- Voice message recording

### File Handling
- Image upload with preview
- Voice message recording and playback
- Cloudinary integration for file storage
- File type validation

### UI/UX
- Modern, responsive design
- Dark/light theme support
- Smooth animations
- Bengali cultural elements
- Mobile-friendly interface

## 🌐 Deployment

### Backend (Render)
1. Create a new web service on Render
2. Connect your GitHub repository
3. Set build command: `npm install`
4. Set start command: `node server.js`
5. Add environment variables in Render dashboard

### Frontend (Vercel)
1. Connect your GitHub repository to Vercel
2. Set build command: `npm run build`
3. Set output directory: `build`
4. Add environment variables in Vercel dashboard

## 🔒 Security Features

- Password hashing with bcrypt
- JWT authentication
- CORS protection
- Input validation
- File upload restrictions
- Rate limiting (can be added)

## 🎨 Customization

### Themes
The app uses CSS custom properties for easy theming:

```css
:root {
  --primary-color: #667eea;
  --secondary-color: #764ba2;
  --background-color: #f8f9fa;
  --text-color: #333;
}
```

### Bengali Typography
Custom Bengali fonts and cultural elements can be added in the CSS files.

## 🧪 Testing

Run tests for both frontend and backend:

```bash
# Backend tests
cd backend
npm test

# Frontend tests
cd frontend
npm test
```

## 📝 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### User Endpoints
- `GET /api/users/me` - Get current user
- `GET /api/users/search` - Search users
- `GET /api/users/contacts` - Get user contacts
- `POST /api/users/contacts` - Add contact

### Message Endpoints
- `GET /api/messages/:userId` - Get messages with user
- `PATCH /api/messages/:messageId/read` - Mark message as read

### Upload Endpoints
- `POST /api/messages/upload` - Upload file for message
- `POST /api/users/profile-pic` - Upload profile picture

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Bengali typography and cultural inspiration
- Socket.io for real-time communication
- Cloudinary for file storage
- MongoDB for database
- React community for amazing tools

## 🐛 Known Issues

- Voice messages work best on modern browsers
- File upload size limited to 10MB
- Mobile voice recording may require HTTPS

## 📞 Support

For support, email your-email@example.com or create an issue in the repository.

---

Made with ❤️ for the Bengali community