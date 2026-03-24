<div align="center">

# 🏥 AIDoc - Intelligent Medical Management System

<img src="https://img.shields.io/badge/React-18.3-61DAFB?style=for-the-badge&logo=react&logoColor=white" alt="React"/>
<img src="https://img.shields.io/badge/TypeScript-5.5-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript"/>
<img src="https://img.shields.io/badge/Firebase-11.2-FFCA28?style=for-the-badge&logo=firebase&logoColor=black" alt="Firebase"/>
<img src="https://img.shields.io/badge/Express-4.x-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express"/>
<img src="https://img.shields.io/badge/Tailwind-3.4-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind"/>

### 🚀 AI-Powered Hospital Management & Medical Consultation Platform

*Revolutionizing healthcare with intelligent automation, professional reporting, and seamless patient management*

[🌐 Live Demo](https://abushalem.site) • [📖 Documentation](#documentation) • [🎯 Features](#features) • [🛠️ Installation](#installation)

---

</div>

## 📋 Table of Contents

- [Overview](#overview)
- [Key Features](#features)
- [Technology Stack](#technology-stack)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Contributing](#contributing)
- [License](#license)
- [Developer](#developer)

---

## 🎯 Overview

**AIDoc** is a comprehensive, full-stack medical management system that combines cutting-edge AI technology with intuitive hospital administration tools. Built with modern web technologies, it provides healthcare professionals with powerful features for patient management, AI-assisted consultations, and professional medical reporting.


### 🌟 Why AIDoc?

- **🤖 AI-Powered Consultations**: Leverage DeepSeek AI for intelligent medical assessments
- **📄 Professional Reports**: Generate hospital-branded PDF reports with custom letterheads
- **👥 Complete Patient Management**: Track medical histories, appointments, and prescriptions
- **🏥 Multi-Hospital Support**: Manage multiple hospitals with role-based access control
- **📱 Responsive Design**: Beautiful, modern UI that works on all devices
- **🔒 Secure & Compliant**: Firebase authentication with role-based permissions
- **⚡ Real-time Updates**: Live data synchronization across all users
- **📊 Analytics Dashboard**: Comprehensive insights into hospital operations

---

## ✨ Features

### 🤖 AI Medical Consultation
- **Intelligent Chat Interface**: Real-time AI-powered medical consultations
- **Context-Aware Responses**: AI understands patient history and symptoms
- **Multi-turn Conversations**: Natural dialogue flow with memory
- **Instant Recommendations**: Get treatment suggestions and diagnostic insights
- **Chat History**: Complete conversation logs with timestamps

### 📄 Professional Report Generation
- **Hospital Letterhead**: Customizable branding with logo and contact info
- **Structured Formatting**: Clean, professional layout with sections
- **Patient Information**: Comprehensive patient details in every report
- **Multi-page Support**: Automatic pagination for lengthy consultations
- **Download Options**: PDF, Text, Email, and Copy to Clipboard
- **Signature Section**: Space for authorized medical professional signatures


### 👥 Patient Management
- **Complete Patient Records**: Demographics, medical history, allergies, medications
- **Search & Filter**: Quick patient lookup by name, ID, or contact
- **Medical History Tracking**: Comprehensive health records over time
- **Insurance Information**: Store and manage patient insurance details
- **Emergency Contacts**: Quick access to patient emergency information
- **Status Tracking**: Active, inactive, and archived patient management

### 📅 Appointment System
- **Smart Scheduling**: Book appointments with date and time selection
- **Doctor Assignment**: Assign specific doctors or departments
- **Status Management**: Track scheduled, in-progress, completed, and cancelled appointments
- **Today's View**: Quick overview of today's appointments
- **Past Appointments**: Historical appointment records
- **Appointment Reminders**: Automated notification system

### 🏥 Hospital Administration
- **Multi-Hospital Support**: Manage multiple hospital locations
- **Department Management**: Organize by departments and specialties
- **Doctor Profiles**: Complete doctor information with specializations
- **Role-Based Access**: Admin, Doctor, Nurse, and Staff roles
- **Settings & Preferences**: Customizable hospital configurations
- **Analytics Dashboard**: Real-time statistics and insights

### 📱 Modern User Interface
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile
- **Dark Mode**: Eye-friendly dark theme option
- **Smooth Animations**: Framer Motion powered transitions
- **Intuitive Navigation**: Easy-to-use interface for all user levels
- **Accessibility**: WCAG compliant design principles
- **Loading States**: Clear feedback for all operations


---

## 🛠️ Technology Stack

### Frontend
```
⚛️  React 18.3          - Modern UI library
📘  TypeScript 5.5       - Type-safe development
⚡  Vite 5.4            - Lightning-fast build tool
🎨  Tailwind CSS 3.4    - Utility-first styling
🎭  Framer Motion 12.5  - Smooth animations
🎯  React Router 6.22   - Client-side routing
📋  React Hook Form     - Form management
✅  Zod                 - Schema validation
🎨  Radix UI            - Accessible components
🎨  shadcn/ui           - Beautiful UI components
🎨  Lucide React        - Modern icon library
```

### Backend
```
🚀  Express.js          - Node.js web framework
🔥  Firebase 11.2       - Backend as a Service
   ├─ Authentication    - User management
   ├─ Firestore         - NoSQL database
   ├─ Realtime DB       - Real-time data sync
   └─ Storage           - File storage
🗄️  MySQL (Optional)    - Relational database
🔐  JWT                 - Token-based auth
```

### AI & APIs
```
🤖  DeepSeek AI         - Medical consultation AI
📄  jsPDF               - PDF generation
🔍  Tesseract.js        - OCR text extraction
📊  Recharts            - Data visualization
```

### Development Tools
```
📦  npm/yarn            - Package management
🔧  ESLint              - Code linting
🎨  Prettier            - Code formatting
🔨  TypeScript          - Static typing
🧪  Vite                - Development server
```

---


## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     AIDoc Architecture                       │
└─────────────────────────────────────────────────────────────┘

┌──────────────────┐         ┌──────────────────┐
│   React Frontend │◄───────►│  Express Backend │
│   (TypeScript)   │         │    (Node.js)     │
└────────┬─────────┘         └────────┬─────────┘
         │                            │
         │                            │
         ▼                            ▼
┌─────────────────────────────────────────────┐
│            Firebase Services                 │
├──────────────┬──────────────┬───────────────┤
│ Authentication│  Firestore   │ Realtime DB   │
│   (Auth)     │   (NoSQL)    │   (Sync)      │
└──────────────┴──────────────┴───────────────┘
         │                            │
         │                            │
         ▼                            ▼
┌─────────────────┐         ┌─────────────────┐
│   DeepSeek AI   │         │  MySQL Database │
│   (Optional)    │         │   (Optional)    │
└─────────────────┘         └─────────────────┘
```

### Component Structure
```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── Chat.tsx        # AI chat interface
│   ├── PatientForm.tsx # Patient registration
│   └── ...
├── pages/              # Route pages
│   ├── Dashboard.tsx   # Main dashboard
│   ├── Patients.tsx    # Patient management
│   ├── Reception.tsx   # Appointment booking
│   └── ...
├── context/            # React Context providers
│   ├── AuthContext.tsx
│   ├── HospitalContext.tsx
│   └── ...
├── services/           # API services
│   ├── api.ts          # API calls
│   ├── chatService.ts  # Chat management
│   └── ...
├── utils/              # Utility functions
│   ├── reportGenerator.ts
│   └── ...
└── config/             # Configuration
    └── firebase.ts
```

---


## 🚀 Installation

### Prerequisites
- Node.js 18+ and npm/yarn
- Firebase account
- (Optional) MySQL database
- (Optional) DeepSeek API key

### Step 1: Clone the Repository
```bash
git clone https://github.com/yourusername/aidoc.git
cd aidoc
```

### Step 2: Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd express-api
npm install
cd ..
```

### Step 3: Configure Environment Variables

Create `.env` file in the root directory:
```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_auth_domain
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_FIREBASE_DATABASE_URL=your_database_url

# DeepSeek AI (Optional)
VITE_DEEPSEEK_API_KEY=your_deepseek_api_key
VITE_DEEPSEEK_API_URL=https://api.deepseek.com/v1/chat/completions
```

Create `express-api/.env`:
```env
PORT=3000
NODE_ENV=development

# MySQL Configuration (Optional)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=AIDoc
```

### Step 4: Initialize Firebase
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication (Email/Password & Google)
4. Create Firestore Database
5. Create Realtime Database
6. Copy configuration to `.env`


### Step 5: Initialize Database (Optional - MySQL)
```bash
cd express-api
node -e "require('./database-setup.js')"
```

### Step 6: Run the Application

**Development Mode:**
```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (Optional)
cd express-api
npm start
```

**Production Build:**
```bash
npm run build
npm run preview
```

The application will be available at:
- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

---

## ⚙️ Configuration

### Firebase Security Rules

**Firestore Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /hospitals/{hospitalId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                     request.auth.uid == resource.data.userId;
    }
    
    match /patients/{patientId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    match /appointments/{appointmentId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
  }
}
```

**Realtime Database Rules:**
```json
{
  "rules": {
    "chats": {
      "$chatId": {
        ".read": "auth != null",
        ".write": "auth != null"
      }
    }
  }
}
```

---


## 📖 Usage

### 1. User Registration & Login
```typescript
// Sign up new user
await signUp(email, password);

// Sign in existing user
await signIn(email, password);

// Sign out
await signOut();
```

### 2. Hospital Registration
1. Navigate to Hospital Profile
2. Fill in hospital details
3. Upload hospital logo (optional)
4. Save configuration

### 3. Patient Management
```typescript
// Add new patient
const patient = {
  firstName: "John",
  lastName: "Doe",
  gender: "Male",
  dateOfBirth: "1990-01-01",
  contactNumber: "+1234567890",
  email: "john@example.com"
};
await addPatient(patient);

// Search patients
const results = await searchPatients("John");

// Update patient
await updatePatient(patientId, updatedData);
```

### 4. AI Consultation
```typescript
// Start consultation
const response = await generateChatResponse({
  message: "Patient has fever and headache",
  patientInfo: patientData,
  chatHistory: previousMessages
});

// Generate report
await generateMedicalReport({
  hospital: hospitalInfo,
  patient: patientInfo,
  content: consultationTranscript,
  reportType: "Consultation Report"
});
```

### 5. Appointment Booking
```typescript
// Book appointment
const appointment = {
  patientId: "PT-123456",
  date: "2024-02-15",
  time: "10:00",
  doctorName: "Dr. Smith",
  purpose: "General Checkup"
};
await bookAppointment(appointment);
```

---


## 🔌 API Documentation

### Authentication Endpoints

#### POST `/api/auth/register`
Register a new user
```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "role": "doctor"
}
```

#### POST `/api/auth/login`
Login user
```json
{
  "email": "user@example.com",
  "password": "securePassword123"
}
```

### Patient Endpoints

#### GET `/api/patients`
Get all patients for a hospital
```
Query Parameters:
- hospitalId: string (required)
- limit: number (optional)
- offset: number (optional)
```

#### POST `/api/patients`
Create new patient
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "gender": "Male",
  "dateOfBirth": "1990-01-01",
  "contactNumber": "+1234567890",
  "hospitalId": "HOSP-001"
}
```

#### GET `/api/patients/:id`
Get patient by ID

#### PUT `/api/patients/:id`
Update patient information

#### DELETE `/api/patients/:id`
Delete patient record

### Appointment Endpoints

#### GET `/api/appointments`
Get appointments
```
Query Parameters:
- hospitalId: string (required)
- date: string (optional, format: YYYY-MM-DD)
- status: string (optional)
```

#### POST `/api/appointments`
Create new appointment

#### PUT `/api/appointments/:id`
Update appointment status

---


## 🗄️ Database Schema

### Firestore Collections

#### `hospitals`
```typescript
{
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  logo?: string;
  userId: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

#### `patients`
```typescript
{
  id: string;
  patientId: string;
  hospitalId: string;
  firstName: string;
  lastName: string;
  gender: string;
  dateOfBirth: string;
  contactNumber: string;
  email: string;
  address: string;
  medicalHistory?: string;
  allergies?: string;
  medications?: string;
  bloodGroup?: string;
  emergencyContact?: string;
  insuranceInfo?: object;
  status: 'active' | 'inactive';
  createdAt: Timestamp;
}
```

#### `appointments`
```typescript
{
  id: string;
  hospitalId: string;
  patientId: string;
  patientName: string;
  date: string;
  time: string;
  doctorName: string;
  purpose: string;
  status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
  createdAt: Timestamp;
}
```

#### `chats`
```typescript
{
  id: string;
  hospitalId: string;
  patientId: string;
  patientName: string;
  messages: Message[];
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

### MySQL Tables (Optional)

See `express-api/database.sql` for complete schema including:
- users
- hospitals
- departments
- doctors
- patients
- appointments
- medical_reports
- prescriptions

---


## 📸 Screenshots

### Dashboard
![Dashboard](https://via.placeholder.com/800x450/0D6EFD/FFFFFF?text=AIDoc+Dashboard)

### AI Consultation
![AI Chat](https://via.placeholder.com/800x450/0DCAF0/FFFFFF?text=AI+Medical+Consultation)

### Patient Management
![Patients](https://via.placeholder.com/800x450/198754/FFFFFF?text=Patient+Management)

### Professional Reports
![Reports](https://via.placeholder.com/800x450/6C757D/FFFFFF?text=Medical+Reports)

---

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--primary-blue: #0D6EFD;
--info-cyan: #0DCAF0;
--success-green: #198754;
--warning-amber: #FFC107;
--danger-red: #DC3545;

/* Neutral Colors */
--gray-50: #F8F9FA;
--gray-100: #E9ECEF;
--gray-500: #6C757D;
--gray-900: #212529;

/* Gradients */
--gradient-primary: linear-gradient(135deg, #0D6EFD 0%, #6610F2 100%);
--gradient-success: linear-gradient(135deg, #198754 0%, #20C997 100%);
```

### Typography
```css
/* Font Family */
font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Font Sizes */
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
```

---


## 🧪 Testing

### Run Tests
```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage report
npm run test:coverage
```

### Test Structure
```
tests/
├── unit/
│   ├── components/
│   ├── services/
│   └── utils/
├── integration/
│   ├── api/
│   └── database/
└── e2e/
    ├── auth.spec.ts
    ├── patients.spec.ts
    └── appointments.spec.ts
```

---

## 🚀 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### Deploy to Netlify
```bash
# Install Netlify CLI
npm i -g netlify-cli

# Build and deploy
npm run build
netlify deploy --prod --dir=dist
```

### Deploy to Firebase Hosting
```bash
# Install Firebase CLI
npm i -g firebase-tools

# Login and initialize
firebase login
firebase init hosting

# Deploy
npm run build
firebase deploy
```

### Environment Variables
Make sure to set all environment variables in your deployment platform:
- Firebase configuration
- DeepSeek API key
- Database credentials (if using MySQL)

---


## 🤝 Contributing

We welcome contributions! Please follow these steps:

### 1. Fork the Repository
```bash
git clone https://github.com/yourusername/aidoc.git
cd aidoc
```

### 2. Create a Feature Branch
```bash
git checkout -b feature/amazing-feature
```

### 3. Make Your Changes
- Write clean, documented code
- Follow the existing code style
- Add tests for new features
- Update documentation

### 4. Commit Your Changes
```bash
git add .
git commit -m "Add: Amazing new feature"
```

### 5. Push and Create Pull Request
```bash
git push origin feature/amazing-feature
```

### Commit Message Convention
```
Add: New feature
Fix: Bug fix
Update: Update existing feature
Remove: Remove feature
Docs: Documentation changes
Style: Code style changes
Refactor: Code refactoring
Test: Add or update tests
```

### Code Style Guidelines
- Use TypeScript for type safety
- Follow ESLint rules
- Use functional components with hooks
- Write meaningful variable names
- Add comments for complex logic
- Keep components small and focused

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

```
MIT License

Copyright (c) 2024 Md Abu Shalem Alam

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

---


## 👨‍💻 Developer

<div align="center">

### **Md Abu Shalem Alam**

[![Portfolio](https://img.shields.io/badge/Portfolio-abushalem.site-0D6EFD?style=for-the-badge&logo=google-chrome&logoColor=white)](https://abushalem.site)
[![GitHub](https://img.shields.io/badge/GitHub-Follow-181717?style=for-the-badge&logo=github&logoColor=white)](https://github.com/yourusername)
[![LinkedIn](https://img.shields.io/badge/LinkedIn-Connect-0A66C2?style=for-the-badge&logo=linkedin&logoColor=white)](https://linkedin.com/in/yourprofile)
[![Email](https://img.shields.io/badge/Email-Contact-EA4335?style=for-the-badge&logo=gmail&logoColor=white)](mailto:your.email@example.com)

**Full-Stack Developer | AI Enthusiast | Healthcare Technology Innovator**

*Building intelligent solutions for modern healthcare*

</div>

---

## 🙏 Acknowledgments

- **React Team** - For the amazing React library
- **Firebase** - For the powerful backend infrastructure
- **Vercel** - For seamless deployment
- **shadcn/ui** - For beautiful UI components
- **Tailwind CSS** - For the utility-first CSS framework
- **DeepSeek** - For AI consultation capabilities
- **Open Source Community** - For countless helpful libraries

---

## 📞 Support

Need help? We're here for you!

- 📧 Email: support@aidoc.com
- 💬 Discord: [Join our community](https://discord.gg/aidoc)
- 📖 Documentation: [docs.aidoc.com](https://docs.aidoc.com)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/aidoc/issues)

---

## 🗺️ Roadmap

### Version 2.0 (Coming Soon)
- [ ] Mobile app (React Native)
- [ ] Video consultations
- [ ] Prescription management
- [ ] Lab test integration
- [ ] Billing and invoicing
- [ ] Multi-language support
- [ ] Advanced analytics
- [ ] Telemedicine features

### Version 3.0 (Future)
- [ ] AI-powered diagnosis
- [ ] Medical imaging analysis
- [ ] Wearable device integration
- [ ] Blockchain for medical records
- [ ] Voice-to-text consultations
- [ ] Automated appointment reminders

---


## 📊 Project Stats

<div align="center">

![GitHub stars](https://img.shields.io/github/stars/yourusername/aidoc?style=social)
![GitHub forks](https://img.shields.io/github/forks/yourusername/aidoc?style=social)
![GitHub watchers](https://img.shields.io/github/watchers/yourusername/aidoc?style=social)

![GitHub issues](https://img.shields.io/github/issues/yourusername/aidoc)
![GitHub pull requests](https://img.shields.io/github/issues-pr/yourusername/aidoc)
![GitHub last commit](https://img.shields.io/github/last-commit/yourusername/aidoc)
![GitHub repo size](https://img.shields.io/github/repo-size/yourusername/aidoc)

</div>

---

## 🌟 Star History

<div align="center">

[![Star History Chart](https://api.star-history.com/svg?repos=yourusername/aidoc&type=Date)](https://star-history.com/#yourusername/aidoc&Date)

</div>

---

## 💖 Show Your Support

If you find this project helpful, please consider:

- ⭐ Starring the repository
- 🐛 Reporting bugs
- 💡 Suggesting new features
- 🔀 Contributing code
- 📢 Sharing with others

---

<div align="center">

### Made with ❤️ by [Md Abu Shalem Alam](https://abushalem.site)

**AIDoc** - *Transforming Healthcare with Intelligence*

[⬆ Back to Top](#-aidoc---intelligent-medical-management-system)

---

© 2024 AIDoc. All Rights Reserved.

</div>
