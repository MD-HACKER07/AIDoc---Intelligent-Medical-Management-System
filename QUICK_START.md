# ⚡ Quick Start Guide - AIDoc

## 🚀 Get Started in 5 Minutes

### 1. Clone & Install (2 minutes)
```bash
# Clone the repository
git clone https://github.com/YOUR_USERNAME/aidoc-medical-system.git
cd aidoc-medical-system

# Install dependencies
npm install

# Install backend dependencies
cd express-api && npm install && cd ..
```

### 2. Configure Firebase (2 minutes)
```bash
# Create .env file
cp .env.example .env

# Add your Firebase credentials to .env
# Get them from: https://console.firebase.google.com
```

### 3. Run the Application (1 minute)
```bash
# Start frontend (Terminal 1)
npm run dev

# Start backend (Terminal 2 - Optional)
cd express-api && npm start
```

**🎉 Done! Open http://localhost:5173**

---

## 📋 Essential Commands

### Development
```bash
npm run dev              # Start development server
npm run build            # Build for production
npm run preview          # Preview production build
npm run lint             # Run ESLint
npm run fix-lint         # Fix linting errors
```

### Backend
```bash
cd express-api
npm start                # Start Express server
npm run dev              # Start with nodemon (auto-reload)
```

### Git Commands
```bash
git status               # Check status
git add .                # Stage all changes
git commit -m "message"  # Commit changes
git push                 # Push to GitHub
git pull                 # Pull latest changes
```

---

## 🔑 First Time Setup Checklist

- [ ] Install Node.js 18+
- [ ] Clone repository
- [ ] Install dependencies (`npm install`)
- [ ] Create Firebase project
- [ ] Copy Firebase config to `.env`
- [ ] Enable Firebase Authentication
- [ ] Create Firestore database
- [ ] Run `npm run dev`
- [ ] Create first hospital account
- [ ] Test AI consultation

---

## 🎯 Key Features to Try

1. **Register Hospital** → Hospital Profile page
2. **Add Patient** → Reception → Register Patient
3. **Book Appointment** → Reception → Book Appointment
4. **AI Consultation** → Consultations → Start Chat
5. **Generate Report** → Chat → Download Full Report
6. **View Dashboard** → Dashboard → See statistics

---

## 🐛 Common Issues & Solutions

### Issue: Firebase not connecting
**Solution:** Check `.env` file has correct Firebase credentials

### Issue: Port 5173 already in use
**Solution:** 
```bash
# Kill the process
npx kill-port 5173
# Or use different port
npm run dev -- --port 3000
```

### Issue: Module not found
**Solution:**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: Build errors
**Solution:**
```bash
# Clear build cache
rm -rf dist
npm run build
```

---

## 📚 Documentation Links

- [Full README](README.md)
- [GitHub Setup](GITHUB_SETUP.md)
- [Feature Guide](FEATURE_GUIDE.md)
- [Implementation Summary](IMPLEMENTATION_SUMMARY.md)
- [API Documentation](README.md#api-documentation)

---

## 💡 Pro Tips

1. **Use Dark Mode** - Toggle in settings for better UX
2. **Keyboard Shortcuts** - Ctrl+K for quick search
3. **Auto-save** - All forms auto-save to localStorage
4. **Offline Mode** - Works offline with cached data
5. **Mobile Friendly** - Fully responsive design

---

## 🆘 Need Help?

- 📧 Email: support@aidoc.com
- 🐛 Issues: [GitHub Issues](https://github.com/YOUR_USERNAME/aidoc-medical-system/issues)
- 📖 Docs: [Full Documentation](README.md)
- 🌐 Website: [abushalem.site](https://abushalem.site)

---

**Happy Coding! 🚀**

*Developed by Md Abu Shalem Alam*
