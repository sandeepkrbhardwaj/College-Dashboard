import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import {
  getFirestore, collection, doc, setDoc, onSnapshot,
  updateDoc, addDoc, getDoc, query
} from 'firebase/firestore';
import {
  getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut
} from 'firebase/auth';
import { 
  CalendarCheck, FolderOpen, Bell, User, CheckCircle, XCircle, 
  FileText, Download, Clock, ChevronRight, ChevronLeft, Activity, Users, 
  Shield, BookOpen, LogOut, Plus, Search, Info, Eye, Save, ArrowLeft, Edit, Lock, Mail, Key
} from 'lucide-react';

// ==========================================
// FIREBASE CONFIGURATION (VERIFIED FROM YOUR PROJECT)
// ==========================================
const firebaseConfig = {
  apiKey: "AIzaSyDAwLvjEMFSDa0Qnjb4LR05iuaaNVibWcc",
  authDomain: "dashboard-5e76c.firebaseapp.com",
  projectId: "dashboard-5e76c",
  storageBucket: "dashboard-5e76c.firebasestorage.app",
  messagingSenderId: "41183782819",
  appId: "1:41183782819:web:923157652c394a452e5c16",
  measurementId: "G-2J4YRMZ1YP"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const firestore = getFirestore(app);

const appId = typeof __app_id !== 'undefined' ? __app_id : 'dashboard-5e76c';

// ==========================================
// MAIN APP COMPONENT (ROLE ROUTER & LOGIN)
// ==========================================
export default function App() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [activeRole, setActiveRole] = useState(null);
  const [activeUser, setActiveUser] = useState(null);

  const [appData, setAppData] = useState({ students: [], teachers: [], admins: [] });

  const [isLoginView, setIsLoginView] = useState(true);
  const [isTeacherReg, setIsTeacherReg] = useState(false);
  const [authMessage, setAuthMessage] = useState({ type: '', text: '' });

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [adminKey, setAdminKey] = useState('');

  // Teacher registration fields
  const [teacherName, setTeacherName] = useState('');
  const [teacherEmail, setTeacherEmail] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('');
  const [teacherDept, setTeacherDept] = useState('');
  const [teacherBatch, setTeacherBatch] = useState('');
  const [teacherYear, setTeacherYear] = useState('');
  const [teacherCourse, setTeacherCourse] = useState('');
  const [teacherPhoto, setTeacherPhoto] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u && u.email) {
        const savedRole = localStorage.getItem('cp_role');
        if (savedRole) setActiveRole(savedRole);
        setAuthMessage({ type: 'success', text: `Authenticated as ${u.email}` });
      } else {
        setActiveRole(null);
        setActiveUser(null);
        localStorage.removeItem('cp_role');
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const base = ['artifacts', appId, 'public', 'data'];

    const unsubStudents = onSnapshot(collection(firestore, ...base, 'students'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setAppData(prev => ({ ...prev, students: data }));
    }, (err) => console.error('Students snapshot error:', err));

    const unsubTeachers = onSnapshot(collection(firestore, ...base, 'teachers'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setAppData(prev => ({ ...prev, teachers: data }));
    }, (err) => console.error('Teachers snapshot error:', err));

    const unsubAdmins = onSnapshot(collection(firestore, ...base, 'admins'), (snap) => {
      const data = snap.docs.map(d => ({ ...d.data(), id: d.id }));
      setAppData(prev => ({ ...prev, admins: data }));
    }, (err) => console.error('Admins snapshot error:', err));

    return () => { unsubStudents(); unsubTeachers(); unsubAdmins(); };
  }, [user]);

  const resolveActiveUser = (email, role) => {
    const lower = email.toLowerCase();
    if (role === 'admin') {
      const match = appData.admins.find(a => a.email.toLowerCase() === lower);
      setActiveUser(match || { id: user?.uid || '', name: 'Admin', email });
    } else if (role === 'teacher') {
      const match = appData.teachers.find(t => t.email.toLowerCase() === lower);
      setActiveUser(match || { id: user?.uid || '', name: 'Teacher', email });
    } else {
      const match = appData.students.find(s => s.email?.toLowerCase() === lower || s.personalDetails?.email?.toLowerCase() === lower);
      setActiveUser(match || { id: user?.uid || '', name: 'Student', email });
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Validating credentials...' });

    const email = loginEmail.toLowerCase().trim();
    if (!email || !loginPassword) {
      setAuthMessage({ type: 'error', text: 'Enter email and password.' });
      return;
    }

    try {
      const userCred = await signInWithEmailAndPassword(auth, email, loginPassword);

      let role = 'student';
      if (email.endsWith('@admin.com')) role = 'admin';
      else if (email.endsWith('@teacher.com')) role = 'teacher';

      setActiveRole(role);
      localStorage.setItem('cp_role', role);
      
      setActiveUser({ id: userCred.user.uid, name: email.split('@')[0], email });
      setAuthMessage({ type: 'success', text: 'Login successful.' });
    } catch (err) {
      setAuthMessage({ type: 'error', text: `Authentication failed: ${err.message}` });
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Creating administrator...' });

    if (adminKey.replace(/\s/g, '') !== '123456789') {
      setAuthMessage({ type: 'error', text: 'Invalid Master Admin Key.' });
      return;
    }

    const email = regEmail.toLowerCase().trim();
    if (!email.endsWith('@admin.com')) {
      setAuthMessage({ type: 'error', text: 'Admin email must end with @admin.com' });
      return;
    }

    if (appData.admins.some(a => a.email.toLowerCase() === email)) {
      setAuthMessage({ type: 'error', text: 'Admin already exists.' });
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, regPassword);
      const adminRecord = { 
        id: userCred.user.uid, 
        name: regName, 
        email, 
        createdAt: new Date().toISOString(),
        role: 'admin'
      };

      const collectionPath = collection(firestore, 'artifacts', appId, 'public', 'data', 'admins');
      await setDoc(doc(collectionPath, userCred.user.uid), adminRecord);

      setActiveRole('admin');
      setActiveUser(adminRecord);
      localStorage.setItem('cp_role', 'admin');

      setAuthMessage({ type: 'success', text: 'Administrator created and logged in.' });
      setIsLoginView(true);
      setLoginEmail(email);
      setLoginPassword(regPassword);
      setRegName(''); setRegEmail(''); setRegPassword(''); setAdminKey('');
    } catch (err) {
      setAuthMessage({ type: 'error', text: `Registration failed: ${err.message}` });
    }
  };

  const handleTeacherRegister = async (e) => {
    e.preventDefault();
    setAuthMessage({ type: 'info', text: 'Creating teacher account...' });

    const email = teacherEmail.toLowerCase().trim();
    if (!email.endsWith('@teacher.com')) {
      setAuthMessage({ type: 'error', text: 'Teacher email must end with @teacher.com' });
      return;
    }

    if (appData.teachers.some(t => t.email.toLowerCase() === email)) {
      setAuthMessage({ type: 'error', text: 'Teacher already exists.' });
      return;
    }

    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, teacherPassword);
      
      // Auto-determine sections based on batch/year/course
      const matchingSections = [...new Set(appData.students
        .filter(s => 
          s.collegeDetails?.batch === teacherBatch && 
          s.collegeDetails?.year === teacherYear &&
          s.collegeDetails?.course === teacherCourse
        )
        .map(s => s.section)
      )];

      const teacherRecord = { 
        id: userCred.user.uid, 
        name: teacherName, 
        email, 
        department: teacherDept,
        batch: teacherBatch,
        year: teacherYear,
        course: teacherCourse,
        sections: matchingSections,
        photo: teacherPhoto || 'https://i.pravatar.cc/150?u=' + userCred.user.uid,
        createdAt: new Date().toISOString(),
        role: 'teacher'
      };

      const collectionPath = collection(firestore, 'artifacts', appId, 'public', 'data', 'teachers');
      await setDoc(doc(collectionPath, userCred.user.uid), teacherRecord);

      // Keep local app state in sync immediately so teacher dashboard can resolve sections/students on first login
      setAppData(prev => ({ ...prev, teachers: [...prev.teachers, teacherRecord] }));

      setActiveRole('teacher');
      setActiveUser(teacherRecord);
      localStorage.setItem('cp_role', 'teacher');

      setAuthMessage({ type: 'success', text: `Teacher account created! Assigned to ${matchingSections.length} section(s).` });
      setIsTeacherReg(false);
      setTeacherName(''); setTeacherEmail(''); setTeacherPassword(''); setTeacherDept('');
      setTeacherBatch(''); setTeacherYear(''); setTeacherCourse(''); setTeacherPhoto('');
    } catch (err) {
      setAuthMessage({ type: 'error', text: `Registration failed: ${err.message}` });
    }
  };

  if (!activeRole) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4 sm:p-6">
        <div className="bg-white max-w-4xl w-full rounded-3xl shadow-2xl overflow-hidden flex flex-col md:flex-row">
          
          {/* Branding Side */}
          <div className="bg-blue-600 p-8 sm:p-12 text-white md:w-1/2 flex flex-col justify-center relative overflow-hidden hidden md:flex">
            <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500 rounded-full blur-3xl opacity-50 transform translate-x-1/2 -translate-y-1/2"></div>
            <div className="relative z-10">
              <h1 className="text-4xl font-bold mb-4">Campus Portal</h1>
              <p className="text-blue-100 mb-8 text-lg">Secure centralized management for Students, Faculty, and Administrators.</p>
              <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-blue-100 bg-blue-700/50 p-3.5 rounded-xl"><Shield size={18}/> Admin Creation & Strict Sync Routing</div>
                <div className="flex items-center gap-3 text-sm text-blue-100 bg-blue-700/50 p-3.5 rounded-xl"><CheckCircle size={18}/> Real-time Live Attendance Validation</div>
                <div className="flex items-center gap-3 text-sm text-blue-100 bg-blue-700/50 p-3.5 rounded-xl"><FileText size={18}/> Read-only Student Academic Vaults</div>
              </div>
            </div>
          </div>

          {/* Form Side */}
          <div className="p-6 sm:p-10 md:w-1/2 flex flex-col justify-center bg-white relative">
            
            <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-2">
                  {isLoginView ? 'Welcome Back' : isTeacherReg ? 'Teacher Register' : 'Admin Register'}
                </h2>
                <p className="text-slate-500 text-sm">
                  {isLoginView ? 'Please sign in to your assigned account.' : isTeacherReg ? 'Register a new Faculty Member.' : 'Register a new Super Administrator.'}
                </p>
              </div>
              <div className="flex bg-slate-100 p-1.5 rounded-xl shrink-0 w-full sm:w-auto gap-1">
                <button onClick={() => {setIsLoginView(true); setAuthMessage({type:'', text:''});}} className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${isLoginView ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Login</button>
                <button onClick={() => {setIsLoginView(false); setIsTeacherReg(false); setAuthMessage({type:'', text:''});}} className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${!isLoginView && !isTeacherReg ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Admin</button>
                <button onClick={() => {setIsLoginView(false); setIsTeacherReg(true); setAuthMessage({type:'', text:''});}} className={`px-3 py-2 text-xs sm:text-sm font-bold rounded-lg transition-all ${!isLoginView && isTeacherReg ? 'bg-white shadow-sm text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>Teacher</button>
              </div>
            </div>
            
            {authMessage.text && (
              <div className={`mb-6 p-4 rounded-xl text-sm border flex items-start gap-3 animate-fade-in-up ${authMessage.type === 'error' ? 'bg-red-50 text-red-700 border-red-100' : 'bg-green-50 text-green-700 border-green-100'}`}>
                {authMessage.type === 'error' ? <XCircle size={18} className="shrink-0 mt-0.5" /> : <CheckCircle size={18} className="shrink-0 mt-0.5" />}
                <span>{authMessage.text}</span>
              </div>
            )}

            {isLoginView ? (
              <form onSubmit={handleLogin} className="space-y-5 animate-fade-in-up">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} placeholder="e.g. alice@student.com" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} placeholder="Enter your password" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"/>
                  </div>
                </div>
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-xl shadow-md hover:shadow-lg transition-all mt-2 active:scale-[0.98]">
                  Secure Login
                </button>
              </form>
            ) : isTeacherReg ? (
              <form onSubmit={handleTeacherRegister} className="space-y-3 animate-fade-in-up max-h-96 overflow-y-auto">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input type="text" required value={teacherName} onChange={e => setTeacherName(e.target.value)} placeholder="e.g. Prof. John Doe" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Teacher Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={teacherEmail} onChange={e => setTeacherEmail(e.target.value)} placeholder="e.g. john@teacher.com" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="password" required value={teacherPassword} onChange={e => setTeacherPassword(e.target.value)} placeholder="Create password" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Department</label>
                  <input type="text" required value={teacherDept} onChange={e => setTeacherDept(e.target.value)} placeholder="e.g. Computer Science" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Batch</label>
                    <input type="text" required value={teacherBatch} onChange={e => setTeacherBatch(e.target.value)} placeholder="e.g. 2024-2028" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Year</label>
                    <input type="text" required value={teacherYear} onChange={e => setTeacherYear(e.target.value)} placeholder="e.g. 2nd Year" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Course</label>
                  <input type="text" required value={teacherCourse} onChange={e => setTeacherCourse(e.target.value)} placeholder="e.g. B.Tech" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Profile Photo URL</label>
                  <input type="url" value={teacherPhoto} onChange={e => setTeacherPhoto(e.target.value)} placeholder="https://example.com/photo.jpg" className="w-full bg-slate-50 border border-slate-200 px-4 py-3 rounded-xl text-sm font-medium focus:outline-none focus:border-emerald-500 transition-all" />
                </div>

                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-md transition-all mt-2 active:scale-[0.98] text-sm">
                  Register as Teacher
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegister} className="space-y-4 animate-fade-in-up">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Full Name</label>
                  <input type="text" required value={regName} onChange={e => setRegName(e.target.value)} placeholder="e.g. Master Admin" className="w-full bg-slate-50 border border-slate-200 px-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Admin Email</label>
                  <div className="relative">
                    <Mail size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="email" required value={regEmail} onChange={e => setRegEmail(e.target.value)} placeholder="e.g. new@admin.com" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Set Password</label>
                  <div className="relative">
                    <Key size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="text" required value={regPassword} onChange={e => setRegPassword(e.target.value)} placeholder="Create password" className="w-full bg-slate-50 border border-slate-200 pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-blue-500 transition-all" />
                  </div>
                </div>

                <div className="space-y-1.5 pt-2 border-t border-slate-100">
                  <label className="text-xs font-bold text-slate-500 uppercase flex justify-between tracking-wider">
                    <span className="text-purple-600">Master Authorization Key</span>
                    <span className="text-[10px] text-purple-600 font-bold bg-purple-50 px-2 py-0.5 rounded">Hint: 123456789</span>
                  </label>
                  <div className="relative">
                    <Shield size={18} className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-slate-400" />
                    <input type="password" required value={adminKey} onChange={e => setAdminKey(e.target.value)} placeholder="Required to authorize creation" className="w-full bg-purple-50 border border-purple-200 pl-11 pr-4 py-3.5 rounded-xl text-sm font-medium focus:outline-none focus:border-purple-500 transition-all" />
                  </div>
                </div>

                <button type="submit" className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-4 rounded-xl shadow-md transition-all mt-2 active:scale-[0.98]">
                  Authorize & Create Admin
                </button>
              </form>
            )}

            <div className="text-center pt-5 border-t border-slate-100 mt-6">
              <p className="text-xs text-slate-400">System enforces strict domain and password validation.</p>
              <div className="flex flex-wrap justify-center gap-2 mt-3">
                <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md font-medium">@admin.com</span>
                <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md font-medium">@teacher.com</span>
                <span className="text-[10px] sm:text-xs bg-slate-100 text-slate-600 px-3 py-1.5 rounded-md font-medium">@student.com</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.warn('signOut:', err);
    }
    setActiveRole(null);
    setActiveUser(null);
    setUser(null);
    setLoginEmail('');
    setLoginPassword('');
    setIsLoginView(true);
    setAuthMessage({ type:'', text:'' });
    localStorage.removeItem('cp_role');
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 flex flex-col">
      <header className="bg-white border-b border-slate-200 h-16 flex items-center justify-between px-4 sm:px-6 shrink-0 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm sm:text-base shadow-sm
            ${activeRole === 'admin' ? 'bg-purple-600' : activeRole === 'teacher' ? 'bg-emerald-600' : 'bg-blue-600'}`}>
            {activeRole === 'admin' ? 'A' : activeRole === 'teacher' ? 'T' : 'S'}
          </div>
          <h1 className="text-base sm:text-lg font-bold text-slate-800 capitalize hidden sm:block">{activeRole} Portal</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-sm font-bold text-slate-800 truncate max-w-[120px] sm:max-w-none">{activeUser.name}</p>
            <p className="text-xs text-slate-500 capitalize">{activeRole}</p>
          </div>
          <button onClick={logout} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors" title="Logout">
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {activeRole === 'student' && <StudentDashboard db={appData} user={activeUser} />}
        {activeRole === 'teacher' && <TeacherDashboard db={appData} setDb={setAppData} user={activeUser} />}
        {activeRole === 'admin' && <AdminDashboard db={appData} setDb={setAppData} />}
      </div>
    </div>
  );
}

// ==========================================
// 1. STUDENT DASHBOARD
// ==========================================
function StudentDashboard({ db, user }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const [selectedDate, setSelectedDate] = useState(24);

  const currentStudent = db.students.find(s => s.id === user.id);

  // Auto-match teachers by batch, year, course, and section
  const assignedTeachers = db.teachers.filter(t => 
    t.batch === currentStudent?.collegeDetails?.batch &&
    t.year === currentStudent?.collegeDetails?.year &&
    t.course === currentStudent?.collegeDetails?.course &&
    t.sections.includes(currentStudent?.section)
  );

  // Keep legacy alias for compatibility
  const assignedFaculties = assignedTeachers.map(t => ({ 
    subject: t.department, 
    name: t.name,
    email: t.email,
    photo: t.photo || 'https://i.pravatar.cc/150?u=' + t.id,
    id: t.id
  }));

  const getCalendarData = () => {
    const days = [];
    let totalClasses = 0;
    let attendedClasses = 0;

    for (let i = 1; i <= 31; i++) {
      const dateStr = `2026-03-${i.toString().padStart(2, '0')}`;
      const classesForDay = currentStudent.attendance.filter(a => a.date === dateStr);
      
      let status = 'future';
      if (i <= 24) { 
        if (classesForDay.length === 0) {
           status = 'empty'; 
        } else {
           const presentCount = classesForDay.filter(c => c.status === 'Present').length;
           if (presentCount === classesForDay.length) status = 'present';
           else if (presentCount === 0) status = 'absent';
           else status = 'partial';
           
           totalClasses += classesForDay.length;
           attendedClasses += presentCount;
        }
      }
      days.push({ day: i, dateStr, status, classes: classesForDay });
    }
    const percentage = totalClasses === 0 ? 0 : Math.round((attendedClasses / totalClasses) * 100);
    return { days, percentage, totalClasses, attendedClasses };
  };

  const calData = getCalendarData();
  const selectedDayDetails = calData.days.find(d => d.day === selectedDate);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      {/* Mobile-Friendly Horizontal Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto scrollbar-hide z-10 shadow-sm md:shadow-none">
        <nav className="p-2 md:p-4 flex flex-row md:flex-col gap-2 min-w-max md:min-w-0 w-full">
          {[
            { id: 'attendance', icon: CalendarCheck, label: 'Attendance' },
            { id: 'results', icon: FileText, label: 'Results' },
            { id: 'details', icon: User, label: 'Personal Details' },
            { id: 'college', icon: BookOpen, label: 'College Details' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-medium whitespace-nowrap ${
                activeTab === tab.id ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'
              }`}>
              <tab.icon size={18} className={activeTab === tab.id ? 'text-blue-600' : ''} />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
        <div className="max-w-5xl mx-auto space-y-6">
          
          {activeTab === 'details' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in-up">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Personal Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <ReadOnlyField label="Full Name" value={currentStudent.name} />
                <ReadOnlyField label="Date of Birth" value={currentStudent.personalDetails.dob} />
                <ReadOnlyField label="Email Address" value={currentStudent.personalDetails.email} />
                <ReadOnlyField label="Phone Number" value={currentStudent.personalDetails.phone} />
                <div className="md:col-span-2">
                  <ReadOnlyField label="Permanent Address" value={currentStudent.personalDetails.address} />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'teachers' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in-up">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 border-b pb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" /> My Assigned Teachers
              </h2>
              <p className="text-slate-600 mb-6">Teachers automatically assigned based on your batch, year, course, and section.</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedTeachers.length > 0 ? (
                  assignedTeachers.map((teacher) => (
                    <div key={teacher.id} className="bg-gradient-to-r from-emerald-50 to-blue-50 p-5 rounded-xl border border-emerald-100 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <img 
                          src={teacher.photo || 'https://i.pravatar.cc/150?u=' + teacher.id} 
                          alt={teacher.name}
                          className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-sm"
                        />
                        <div className="flex-1">
                          <h3 className="font-bold text-slate-800 text-lg">{teacher.name}</h3>
                          <p className="text-emerald-600 font-medium text-sm">{teacher.department}</p>
                          <p className="text-slate-500 text-xs mt-1">{teacher.email}</p>
                        </div>
                      </div>
                      <div className="mt-4 pt-4 border-t border-emerald-100">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-slate-600">Teaches:</span>
                          <span className="font-medium text-slate-800">{teacher.course} - {teacher.year}</span>
                        </div>
                        <div className="flex items-center justify-between text-sm mt-1">
                          <span className="text-slate-600">Sections:</span>
                          <span className="font-medium text-slate-800">{teacher.sections.join(', ')}</span>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-center py-12">
                    <Users size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500 font-medium">No teachers assigned yet</p>
                    <p className="text-slate-400 text-sm mt-1">Teachers will be automatically assigned when they register for your batch/course.</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'college' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8 animate-fade-in-up">
              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6 border-b pb-4">Academic & College Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                <ReadOnlyField label="Roll Number" value={currentStudent.rollNo} />
                <ReadOnlyField label="Section" value={`Section ${currentStudent.section}`} />
                <ReadOnlyField label="Course" value={currentStudent.collegeDetails.course} />
                <ReadOnlyField label="Batch" value={currentStudent.collegeDetails.batch} />
                <ReadOnlyField label="Current Semester" value={currentStudent.collegeDetails.semester} />
                <ReadOnlyField label="Faculty Advisor" value={currentStudent.collegeDetails.advisor} />
              </div>

              <h3 className="text-lg md:text-xl font-bold text-slate-800 mt-10 mb-6 border-b pb-4 flex items-center gap-2">
                <Users size={20} className="text-blue-600" /> Assigned Faculty
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {assignedFaculties.length > 0 ? (
                  assignedFaculties.map((fac, idx) => (
                    <div key={idx} className="bg-slate-50 p-4 rounded-xl border border-slate-100 flex items-center gap-4 hover:shadow-sm transition-shadow">
                      <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-lg shrink-0">
                        {fac.name.charAt(6) || fac.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{fac.subject}</p>
                        <p className="text-sm text-slate-500">{fac.name}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-slate-500 italic col-span-2">No faculty currently assigned to this section.</p>
                )}
              </div>
            </div>
          )}

          {activeTab === 'results' && (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden animate-fade-in-up">
               <div className="p-5 md:p-6 border-b border-slate-100 bg-slate-50">
                  <h2 className="text-lg md:text-xl font-bold text-slate-800">Academic Vault & Results</h2>
               </div>
               <div className="divide-y divide-slate-100">
                  {currentStudent.results.length === 0 ? (
                    <p className="p-6 text-slate-500 text-center">No results published yet.</p>
                  ) : currentStudent.results.map((doc) => (
                    <div key={doc.id} className="p-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors gap-4">
                      <div className="flex items-start sm:items-center gap-4">
                        <div className="p-3 rounded-xl bg-indigo-50 text-indigo-600 shrink-0"><FileText size={20} /></div>
                        <div>
                          <p className="font-bold text-slate-800">{doc.name}</p>
                          <p className="text-xs text-slate-500 mt-1 font-medium">{doc.type} • {doc.size} • {doc.date}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                        <button className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 text-sm font-bold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors">
                          <Eye size={16} /> <span className="sm:hidden lg:inline">View</span>
                        </button>
                        <button className="flex-1 sm:flex-none flex justify-center items-center gap-2 px-4 py-2 text-sm font-bold text-slate-600 hover:text-blue-600 bg-white border border-slate-200 shadow-sm hover:shadow-md rounded-xl transition-all">
                          <Download size={16} /> <span className="sm:hidden lg:inline">Download</span>
                        </button>
                      </div>
                    </div>
                  ))}
               </div>
            </div>
          )}

          {activeTab === 'attendance' && (
            <div className="space-y-6 animate-fade-in-up">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 md:p-8 rounded-3xl shadow-md text-white flex items-center justify-between lg:col-span-2 relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-blue-100 font-medium mb-1 uppercase tracking-wider text-sm">Overall Attendance</p>
                    <div className="flex items-baseline gap-3">
                      <h3 className="text-5xl md:text-6xl font-black tracking-tight">{calData.percentage}%</h3>
                      <p className="text-blue-200 font-bold hidden sm:block bg-white/10 px-3 py-1 rounded-full text-sm">Excellent Standing</p>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3 sm:gap-6 text-sm">
                      <div className="bg-white/10 px-4 py-2 rounded-xl flex-1 sm:flex-none text-center sm:text-left"><span className="block text-blue-200 text-xs uppercase mb-1">Total</span><span className="font-bold text-xl">{calData.totalClasses}</span></div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl flex-1 sm:flex-none text-center sm:text-left"><span className="block text-blue-200 text-xs uppercase mb-1">Attended</span><span className="font-bold text-xl">{calData.attendedClasses}</span></div>
                      <div className="bg-white/10 px-4 py-2 rounded-xl flex-1 sm:flex-none text-center sm:text-left"><span className="block text-blue-200 text-xs uppercase mb-1">Missed</span><span className="font-bold text-xl">{calData.totalClasses - calData.attendedClasses}</span></div>
                    </div>
                  </div>
                  <div className="hidden sm:flex w-32 h-32 rounded-full border-[12px] border-white/10 items-center justify-center absolute -right-6 -bottom-6">
                    <Activity size={56} className="text-white opacity-80" />
                  </div>
                </div>
                
                <div className="bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-100 flex flex-col justify-center">
                  <h3 className="font-bold text-slate-800 mb-5 border-b pb-3">Subject Breakdown</h3>
                  <div className="space-y-5">
                    {assignedFaculties.length > 0 ? (
                      assignedFaculties.slice(0, 3).map((fac, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between text-xs font-bold text-slate-600 mb-2">
                            <span className="truncate pr-2">{fac.subject}</span>
                            <span className="text-blue-600 shrink-0 bg-blue-50 px-2 py-0.5 rounded">{85 + (idx * 4)}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                            <div className="bg-blue-500 h-full rounded-full" style={{ width: `${85 + (idx * 4)}%` }}></div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-slate-500 italic">No subjects assigned yet.</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
                    <h3 className="text-xl font-bold text-slate-800">March 2026</h3>
                    <div className="flex gap-4 text-xs font-bold bg-slate-50 p-2 rounded-xl w-fit">
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-green-500"></div> Present</div>
                      <div className="flex items-center gap-1.5"><div className="w-3 h-3 rounded-full bg-red-500"></div> Absent</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-7 gap-1 sm:gap-2">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <div key={day} className="text-center text-xs font-bold text-slate-400 py-2 uppercase tracking-wide">{day}</div>
                    ))}
                    {calData.days.map((data, index) => {
                      let bgColor = 'bg-slate-50 text-slate-300'; 
                      if (data.status === 'empty') bgColor = 'bg-slate-100 text-slate-500 hover:bg-slate-200';
                      if (data.status === 'present') bgColor = 'bg-green-100 text-green-700 font-bold hover:bg-green-200';
                      if (data.status === 'absent') bgColor = 'bg-red-100 text-red-700 font-bold hover:bg-red-200';
                      if (data.status === 'partial') bgColor = 'bg-yellow-100 text-yellow-700 font-bold hover:bg-yellow-200';
                      
                      const isSelected = selectedDate === data.day;
                      
                      return (
                        <button key={index}
                          onClick={() => data.status !== 'future' && setSelectedDate(data.day)}
                          disabled={data.status === 'future'}
                          className={`aspect-square rounded-xl sm:rounded-2xl flex items-center justify-center transition-all font-bold text-sm sm:text-base
                            ${bgColor} ${isSelected ? 'ring-4 ring-blue-500 ring-offset-2 scale-95' : ''} 
                            ${data.status !== 'future' ? 'cursor-pointer hover:scale-105' : 'cursor-default opacity-50'}`}>
                          {data.day}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-6 md:p-8">
                  <h3 className="text-xl font-bold text-slate-800 mb-5 pb-3 border-b">Log: March {selectedDate}</h3>
                  
                  {selectedDayDetails?.classes?.length > 0 ? (
                    <div className="space-y-3">
                      {selectedDayDetails.classes.map((cls, idx) => (
                        <div key={idx} className="p-4 rounded-2xl border border-slate-100 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div>
                            <p className="font-bold text-slate-800 text-sm">{cls.subject}</p>
                            <p className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mt-1.5"><Clock size={12} /> {cls.time}</p>
                          </div>
                          <span className={`text-xs font-bold px-3 py-1.5 rounded-lg w-fit ${cls.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {cls.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-sm font-medium bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                      <CalendarCheck size={36} className="mb-3 text-slate-300" />
                      <p>No attendance recorded.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

const ReadOnlyField = ({ label, value }) => (
  <div className="bg-slate-50 p-4 md:p-5 rounded-2xl border border-slate-100">
    <p className="text-[10px] md:text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wider">{label}</p>
    <p className="font-bold text-slate-800 text-sm md:text-base">{value || 'N/A'}</p>
  </div>
);


// ==========================================
// 2. TEACHER DASHBOARD
// ==========================================
function TeacherDashboard({ db, setDb, user }) {
  const [selectedSection, setSelectedSection] = useState(null);
  const [attendanceDraft, setAttendanceDraft] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);
  const [detailedStudentId, setDetailedStudentId] = useState(null);
  const [attendanceDate, setAttendanceDate] = useState('2026-03-24');

  // Prefer realtime teacher record from DB; fallback to active user payload after signup
  const currentTeacher = db.teachers.find(t => t.id === user.id) || user;

  // Auto-fetch sections based on teacher's batch, year, course, section membership
  const matchedSections = currentTeacher ? [...new Set(
    db.students
      .filter(s => 
        s.collegeDetails?.batch === currentTeacher.batch &&
        s.collegeDetails?.year === currentTeacher.year &&
        s.collegeDetails?.course === currentTeacher.course
      )
      .map(s => s.section)
  )] : [];

  const availableSections = currentTeacher?.sections?.length > 0
    ? matchedSections.filter(sec => currentTeacher.sections.includes(sec))
    : matchedSections;

  const sectionStudents = db.students.filter(s => s.section === selectedSection);
  const detailedStudent = db.students.find(s => s.id === detailedStudentId);

  useEffect(() => {
    if (availableSections.length > 0 && !selectedSection) {
      setSelectedSection(availableSections[0]);
    }
  }, [availableSections, selectedSection]);

  useEffect(() => {
    const draft = {};
    sectionStudents.forEach(s => { 
      const existingRecord = s.attendance.find(a => a.date === attendanceDate);
      draft[s.id] = existingRecord ? existingRecord.status : 'Present'; 
    });
    setAttendanceDraft(draft);
    setDetailedStudentId(null);
  }, [selectedSection, attendanceDate, db.students]);

  const handleToggleAttendance = (studentId, status) => {
    setAttendanceDraft(prev => ({ ...prev, [studentId]: status }));
  };

  const handleSubmitAttendance = async () => {
    setIsSubmitting(true);
    setToastMessage(`Submitting to secure server for ${attendanceDate}...`);

    try {
      const newSubject = currentTeacher.department;

      const studentUpdates = sectionStudents.map((student) => {
        const existingIndex = student.attendance.findIndex(a => a.date === attendanceDate);
        const newRecord = { date: attendanceDate, subject: newSubject, status: attendanceDraft[student.id] || 'Present', time: '02:00 PM' };

        const newAttendance = existingIndex >= 0
          ? student.attendance.map((a, idx) => idx === existingIndex ? newRecord : a)
          : [...student.attendance, newRecord];

        return { id: student.id, attendance: newAttendance };
      });

      await Promise.all(studentUpdates.map(item => {
        const studentDoc = doc(firestore, 'artifacts', appId, 'public', 'data', 'students', item.id);
        return setDoc(studentDoc, { ...db.students.find(s => s.id === item.id), attendance: item.attendance }, { merge: true });
      }));

      setDb(prevDb => {
        const updatedStudents = prevDb.students.map(student => {
          if (student.section === selectedSection && studentUpdates.some(item => item.id === student.id)) {
            const update = studentUpdates.find(item => item.id === student.id);
            return { ...student, attendance: update.attendance };
          }
          return student;
        });
        return { ...prevDb, students: updatedStudents };
      });

      setToastMessage('Attendance synced successfully. Changes will reflect in all dashboards within seconds.');
      setTimeout(() => setToastMessage(null), 5000);
    } catch (error) {
      console.error('Attendance update failed:', error);
      setToastMessage('Failed to sync attendance: ' + error.message);
      setTimeout(() => setToastMessage(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full relative">
      {toastMessage && (
         <div className="fixed sm:absolute top-4 sm:top-6 left-1/2 transform -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up w-[90%] sm:w-auto text-center sm:text-left justify-center">
           {isSubmitting ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"/> : <CheckCircle size={18} className="text-green-400"/>}
           <span className="text-sm font-medium">{toastMessage}</span>
         </div>
      )}

      {/* Mobile-Friendly Horizontal Navigation */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
        <div className="p-3 md:p-4 border-b border-slate-100 bg-slate-50 hidden md:block">
          <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Assigned Sections</h2>
        </div>
        <nav className="p-2 md:p-4 flex flex-row md:flex-col gap-2 overflow-x-auto scrollbar-hide">
          {availableSections.map(sec => (
            <button key={sec} onClick={() => setSelectedSection(sec)}
              className={`flex items-center justify-center md:justify-between px-5 py-3 rounded-xl transition-all font-bold text-sm min-w-[120px] md:min-w-0 ${
                selectedSection === sec ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 border border-transparent'
              }`}>
              <div className="flex items-center gap-2 md:gap-3">
                <Users size={18} className={selectedSection === sec ? 'text-emerald-600' : 'text-slate-400'} />
                Section {sec}
              </div>
              <ChevronRight size={16} className="text-emerald-300 hidden md:block"/>
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
        {detailedStudentId && detailedStudent ? (
          // ==========================================
          // STUDENT DETAIL (Globally Synced Read-Only View)
          // ==========================================
          <div className="max-w-4xl mx-auto animate-fade-in-up">
            <button 
              onClick={() => setDetailedStudentId(null)}
              className="mb-6 flex items-center gap-2 text-slate-600 hover:text-slate-800 font-bold px-4 py-2 bg-white border border-slate-200 rounded-xl transition-all shadow-sm hover:shadow"
            >
              <ArrowLeft size={18} /> Back to Roster
            </button>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-100 to-slate-200 p-6 md:p-8 border-b border-slate-200 flex flex-col sm:flex-row items-center sm:items-start gap-6 relative">
                <img 
                  src={detailedStudent.photo} 
                  alt={detailedStudent.name} 
                  className="w-28 h-28 sm:w-32 sm:h-32 rounded-2xl object-cover border-4 border-white shadow-lg bg-white relative z-10" 
                />
                <div className="text-center sm:text-left pt-2">
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-1.5">{detailedStudent.name}</h2>
                  <p className="text-base sm:text-lg text-slate-600 font-medium mb-3">Roll No: {detailedStudent.rollNo} • Section {detailedStudent.section}</p>
                  <span className="bg-blue-100 text-blue-800 font-bold px-4 py-1.5 rounded-lg text-sm shadow-sm inline-block">
                    {detailedStudent.collegeDetails.course}
                  </span>
                </div>
              </div>

              <div className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <BookOpen size={20} className="text-blue-600"/> Academic Settings
                  </h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-3">
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium text-sm">Batch</span>
                      <span className="font-bold text-slate-800 text-sm">{detailedStudent.collegeDetails.batch}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-200 pb-2">
                      <span className="text-slate-500 font-medium text-sm">Semester</span>
                      <span className="font-bold text-slate-800 text-sm">{detailedStudent.collegeDetails.semester}</span>
                    </div>
                    <div className="flex justify-between pt-1 items-center">
                      <span className="text-slate-500 font-medium text-sm">Total Attendance</span>
                      <span className="font-bold text-blue-600 text-lg bg-blue-50 px-3 py-1 rounded-lg border border-blue-100 text-center">
                        {detailedStudent.attendance.length > 0 
                          ? `${Math.round((detailedStudent.attendance.filter(a => a.status === 'Present').length / detailedStudent.attendance.length) * 100)}%` 
                          : 'N/A'}
                        <span className="text-xs text-slate-500 block font-normal mt-0.5">
                           {detailedStudent.attendance.length > 0 && `(${detailedStudent.attendance.filter(a => a.status === 'Present').length}/${detailedStudent.attendance.length})`}
                        </span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800 border-b pb-2 flex items-center gap-2">
                    <User size={20} className="text-emerald-600"/> Contact Records
                  </h3>
                  <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Student Phone</span>
                      <p className="font-bold text-slate-800 text-sm">{detailedStudent.personalDetails.phone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Parent Phone</span>
                      <p className="font-bold text-slate-800 text-sm">{detailedStudent.personalDetails.parentPhone}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Email Address</span>
                      <p className="font-bold text-slate-800 text-sm break-all">{detailedStudent.personalDetails.email}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] uppercase tracking-wider font-bold block mb-0.5">Permanent Address</span>
                      <p className="font-bold text-slate-800 text-sm">{detailedStudent.personalDetails.address}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            {/* Header / Controls */}
            <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4 mb-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Section {selectedSection} Roster</h2>
                <p className="text-slate-500 text-sm mt-1 font-medium">{sectionStudents.length} Students Currently Enrolled</p>
              </div>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-xl border border-slate-200 shadow-sm flex-1 sm:flex-none">
                  <CalendarCheck size={18} className="text-purple-600 shrink-0" />
                  <input 
                    type="date" 
                    value={attendanceDate}
                    onChange={(e) => setAttendanceDate(e.target.value)}
                    className="bg-transparent text-sm font-bold text-slate-800 outline-none cursor-pointer w-full"
                  />
                </div>
                <button 
                  onClick={handleSubmitAttendance} 
                  disabled={isSubmitting}
                  className={`px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-md flex-1 sm:flex-none
                    ${isSubmitting ? 'bg-slate-200 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 text-white hover:bg-emerald-700 hover:shadow-lg active:scale-95'}`}>
                  <CheckCircle size={18} />
                  {isSubmitting ? 'Syncing...' : 'Submit Attendance'}
                </button>
              </div>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
              {/* Desktop Table Header (Hidden on Mobile) */}
              <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-500 text-xs uppercase tracking-wider">
                <div className="col-span-2">Roll No</div>
                <div className="col-span-4">Student Name</div>
                <div className="col-span-4 text-center">Mark Attendance</div>
                <div className="col-span-2 text-right">Details</div>
              </div>

              {/* Responsive List */}
              <div className="divide-y divide-slate-100">
                {sectionStudents.map(student => (
                  <div key={student.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:items-center transition-colors hover:bg-slate-50">
                    
                    {/* Desktop Roll No */}
                    <div className="hidden md:block col-span-2 font-bold text-slate-600 text-sm">{student.rollNo}</div>
                    
                    {/* Photo & Name (Mobile Top, Desktop Col 2) */}
                    <div className="col-span-4 flex items-center gap-4 py-1">
                      <img 
                        src={student.photo} 
                        alt={student.name} 
                        className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover bg-slate-200 border-2 border-slate-200 shadow-sm shrink-0" 
                      />
                      <div>
                        <span className="font-bold text-slate-800 text-lg sm:text-xl block leading-tight">{student.name}</span>
                        {/* Mobile Roll No */}
                        <span className="md:hidden text-sm font-bold text-slate-400 mt-1 block">{student.rollNo}</span>
                      </div>
                    </div>
                    
                    {/* Attendance Buttons */}
                    <div className="col-span-4 flex justify-start md:justify-center gap-3 w-full mt-2 md:mt-0">
                      <button onClick={() => handleToggleAttendance(student.id, 'Present')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all border shadow-sm ${
                          attendanceDraft[student.id] === 'Present' 
                            ? 'bg-green-100 text-green-700 border-green-200 ring-2 ring-green-500/20' 
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                        }`}>Present</button>
                      <button onClick={() => handleToggleAttendance(student.id, 'Absent')}
                        className={`flex-1 md:flex-none px-6 py-2.5 text-sm font-bold rounded-xl transition-all border shadow-sm ${
                          attendanceDraft[student.id] === 'Absent' 
                            ? 'bg-red-100 text-red-700 border-red-200 ring-2 ring-red-500/20' 
                            : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50 hover:text-slate-600'
                        }`}>Absent</button>
                    </div>

                    {/* Action Button */}
                    <div className="col-span-2 text-left md:text-right mt-2 md:mt-0">
                      <button 
                        onClick={() => setDetailedStudentId(student.id)}
                        className="text-xs font-bold text-blue-600 hover:text-blue-800 px-4 py-2.5 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors border border-blue-100 w-full md:w-auto text-center"
                      >
                        Open Profile
                      </button>
                    </div>
                  </div>
                ))}
                {sectionStudents.length === 0 && (
                   <div className="p-10 text-center text-slate-500 font-medium">No students found in this section.</div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}


// ==========================================
// 3. ADMIN DASHBOARD
// ==========================================

const InputGroup = ({ label, value, onChange, placeholder, type="text", required=false, accept }) => (
  <div className="flex flex-col gap-1.5 w-full">
    <label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{label} {required && <span className="text-red-500">*</span>}</label>
    <input 
      type={type} value={value} onChange={e => type === 'file' ? onChange(e) : onChange(e.target.value)} placeholder={placeholder} required={required} accept={accept}
      className="bg-white border border-slate-300 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl text-sm font-medium text-slate-800 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-all shadow-sm w-full file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
    />
  </div>
);

function AdminDashboard({ db, setDb }) {
  const [activeTab, setActiveTab] = useState('sections');
  
  const [viewStack, setViewStack] = useState([{ name: 'list', data: null }]);
  const currentView = viewStack[viewStack.length - 1];
  
  const pushView = (name, data = null) => setViewStack(prev => [...prev, { name, data }]);
  const popView = () => setViewStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  const handleTabSwitch = (tab) => { setActiveTab(tab); setViewStack([{ name: 'list', data: null }]); };

  // Search States
  const [secFilters, setSecFilters] = useState({ course: '', batch: '', branch: '', year: '', section: '' });
  const [secResults, setSecResults] = useState(null);
  
  const [stuFilters, setStuFilters] = useState({ name: '', year: '', branch: '', course: '' });
  const [stuResults, setStuResults] = useState(null);

  const [teachFilters, setTeachFilters] = useState({ name: '', course: '' });
  const [teachResults, setTeachResults] = useState(null);

  const handleTeachSearch = () => {
    let matches = db.teachers.filter(t => {
      if (teachFilters.name && !t.name?.toLowerCase().includes(teachFilters.name.toLowerCase())) return false;
      if (teachFilters.course && !t.course?.toLowerCase().includes(teachFilters.course.toLowerCase())) return false;
      return true;
    });
    setTeachResults(matches);
  };

  const handleSecSearch = () => {
    let matches = db.students.filter(s => {
      const c = s.collegeDetails || {};
      if (secFilters.course && !c.course?.toLowerCase().includes(secFilters.course.toLowerCase())) return false;
      if (secFilters.batch && !c.batch?.toLowerCase().includes(secFilters.batch.toLowerCase())) return false;
      if (secFilters.branch && !c.branch?.toLowerCase().includes(secFilters.branch.toLowerCase())) return false;
      if (secFilters.year && !c.year?.toLowerCase().includes(secFilters.year.toLowerCase())) return false;
      if (secFilters.section && s.section?.toLowerCase() !== secFilters.section.toLowerCase()) return false;
      return true;
    });
    const uniqueSections = [...new Set(matches.map(s => s.section))].filter(Boolean);
    setSecResults(uniqueSections);
  };

  const handleStuSearch = () => {
    let matches = db.students.filter(s => {
      const c = s.collegeDetails || {};
      if (stuFilters.name && !s.name.toLowerCase().includes(stuFilters.name.toLowerCase())) return false;
      if (stuFilters.year && !c.year?.toLowerCase().includes(stuFilters.year.toLowerCase())) return false;
      if (stuFilters.branch && !c.branch?.toLowerCase().includes(stuFilters.branch.toLowerCase())) return false;
      if (stuFilters.course && !c.course?.toLowerCase().includes(stuFilters.course.toLowerCase())) return false;
      return true;
    });
    setStuResults(matches);
  };

  const displaySections = secResults || [...new Set(db.students.map(s => s.section))].filter(Boolean).sort();
  const displayStudents = stuResults || db.students.slice(0, 5);
  const displayTeachers = teachResults || db.teachers.slice(0, 5);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full relative">
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-slate-200 flex flex-row md:flex-col shrink-0 overflow-x-auto md:overflow-y-auto scrollbar-hide z-10 shadow-sm md:shadow-none">
        <nav className="p-2 md:p-4 flex flex-row md:flex-col gap-2 min-w-max md:min-w-0 w-full">
          <button onClick={() => handleTabSwitch('sections')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${activeTab === 'sections' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-600 hover:bg-slate-50'}`}>
            <FolderOpen size={18} className={activeTab === 'sections' ? 'text-purple-600' : ''}/> Sections DB
          </button>
          <button onClick={() => handleTabSwitch('students')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${activeTab === 'students' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Users size={18} className={activeTab === 'students' ? 'text-purple-600' : ''}/> Student DB
          </button>
          <button onClick={() => handleTabSwitch('teachers')} className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-sm font-bold whitespace-nowrap ${activeTab === 'teachers' ? 'bg-purple-50 text-purple-700 shadow-sm border border-purple-100' : 'text-slate-600 hover:bg-slate-50'}`}>
            <BookOpen size={18} className={activeTab === 'teachers' ? 'text-purple-600' : ''}/> Faculty DB
          </button>
        </nav>
      </aside>

      <main className="flex-1 overflow-y-auto p-4 md:p-6 bg-slate-50">
        <div className="max-w-6xl mx-auto animate-fade-in-up">

          {/* SECTIONS FLOW */}
          {activeTab === 'sections' && currentView.name === 'list' && (
            <div>
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3"><Search size={18} className="text-purple-600"/> Deep Filter Sections</h3>
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 md:gap-4 mb-5">
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Course</label><input type="text" value={secFilters.course} onChange={e=>setSecFilters({...secFilters, course: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. B.Tech" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Branch</label><input type="text" value={secFilters.branch} onChange={e=>setSecFilters({...secFilters, branch: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. CS" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Year</label><input type="text" value={secFilters.year} onChange={e=>setSecFilters({...secFilters, year: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. 2nd" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Batch</label><input type="text" value={secFilters.batch} onChange={e=>setSecFilters({...secFilters, batch: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. 2024" /></div>
                   <div className="flex flex-col gap-1.5 col-span-2 lg:col-span-1"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Section (Opt)</label><input type="text" value={secFilters.section} onChange={e=>setSecFilters({...secFilters, section: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="All" /></div>
                </div>
                <button onClick={handleSecSearch} className="w-full md:w-auto bg-purple-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md transition-all">
                   Execute Search
                </button>
              </div>

              <h2 className="text-xl md:text-2xl font-bold text-slate-800 mb-6">Found Sections ({displaySections.length})</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
                {displaySections.map(sec => (
                  <div key={sec} onClick={() => pushView('section_students', sec)} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex items-center justify-between cursor-pointer hover:shadow-md hover:border-purple-300 transition-all group">
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800 mb-1 group-hover:text-purple-700 transition-colors">Section {sec}</h3>
                      <p className="text-sm font-medium text-slate-500">{db.students.filter(s => s.section === sec).length} Students Enrolled</p>
                    </div>
                    <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors shrink-0">
                      <ChevronRight size={24} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'sections' && currentView.name === 'section_students' && (
            <div>
              <button onClick={popView} className="mb-6 flex items-center justify-center sm:justify-start gap-2 text-purple-600 hover:text-purple-800 font-bold px-4 py-2 bg-white border border-purple-200 shadow-sm rounded-xl transition-colors w-full sm:w-fit"><ArrowLeft size={18}/> Back to Search</button>
              <h2 className="text-2xl font-bold text-slate-800 mb-6">Section {currentView.data} - Student Roster</h2>
              
              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="hidden md:grid grid-cols-12 gap-4 p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-500 text-xs uppercase tracking-wider">
                  <div className="col-span-2">Roll No</div>
                  <div className="col-span-4">Student Name</div>
                  <div className="col-span-3">Branch & Year</div>
                  <div className="col-span-3 text-right">Admin Action</div>
                </div>
                <div className="divide-y divide-slate-100">
                  {db.students.filter(s => s.section === currentView.data).map(student => (
                    <div key={student.id} className="flex flex-col md:grid md:grid-cols-12 gap-4 p-4 md:items-center hover:bg-slate-50 transition-colors">
                      <div className="hidden md:block col-span-2 font-bold text-slate-600 text-sm">{student.rollNo}</div>
                      
                      <div className="col-span-4 flex items-center gap-4">
                        <img src={student.photo} alt={student.name} className="w-12 h-12 rounded-full border-2 border-slate-200 shadow-sm shrink-0"/>
                        <div>
                          <span className="font-bold text-slate-800 text-lg block">{student.name}</span>
                          <span className="md:hidden text-sm font-bold text-slate-400 block">{student.rollNo} • {student.collegeDetails.branch}</span>
                        </div>
                      </div>
                      
                      <div className="hidden md:block col-span-3 text-sm font-medium text-slate-600">{student.collegeDetails.branch} ({student.collegeDetails.year})</div>
                      
                      <div className="col-span-3 text-left md:text-right mt-2 md:mt-0">
                        <button onClick={() => pushView('student_edit', student.id)} className="w-full md:w-auto text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2.5 rounded-xl transition-colors inline-flex items-center justify-center gap-2">
                          <Edit size={16} /> Edit Profile
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STUDENTS FLOW */}
          {activeTab === 'students' && currentView.name === 'list' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Student Database</h2>
                <button onClick={() => pushView('student_edit', null)} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 shadow-md w-full sm:w-auto">
                  <Plus size={18}/> Register New Student
                </button>
              </div>

              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3"><Search size={18} className="text-purple-600"/> Filter Directory</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-5">
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={stuFilters.name} onChange={e=>setStuFilters({...stuFilters, name: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. Alice" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Year</label><input type="text" value={stuFilters.year} onChange={e=>setStuFilters({...stuFilters, year: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. 2nd Year" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Branch</label><input type="text" value={stuFilters.branch} onChange={e=>setStuFilters({...stuFilters, branch: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. CS" /></div>
                   <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Course</label><input type="text" value={stuFilters.course} onChange={e=>setStuFilters({...stuFilters, course: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. B.Tech" /></div>
                </div>
                <button onClick={handleStuSearch} className="w-full md:w-auto bg-purple-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md transition-all">
                   Search Database
                </button>
              </div>

              <div className="bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold text-slate-600 text-sm flex justify-between">
                  <span>Displaying {displayStudents.length} Record(s)</span>
                  {stuResults === null && <span className="text-slate-400 italic">Default view</span>}
                </div>
                <div className="divide-y divide-slate-100">
                  {displayStudents.map(student => (
                    <div key={student.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 md:p-5 hover:bg-slate-50 gap-4 transition-colors">
                      <div className="flex items-center gap-4">
                        <img src={student.photo} alt={student.name} className="w-14 h-14 rounded-2xl border-2 border-slate-200 shadow-sm shrink-0"/>
                        <div>
                          <p className="font-bold text-slate-800 text-lg leading-tight">{student.name}</p>
                          <p className="text-sm text-slate-500 font-medium mt-0.5">{student.rollNo} • Sec {student.section}</p>
                        </div>
                      </div>
                      <button onClick={() => pushView('student_edit', student.id)} className="w-full md:w-auto text-sm font-bold text-purple-700 bg-purple-50 hover:bg-purple-100 px-6 py-3 rounded-xl transition-colors inline-flex items-center justify-center gap-2 border border-purple-200">
                        <Edit size={16} /> Admin Manage
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TEACHERS FLOW */}
          {activeTab === 'teachers' && currentView.name === 'list' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-800">Faculty Database</h2>
                <button onClick={() => pushView('teacher_edit', null)} className="bg-purple-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-purple-700 shadow-md w-full sm:w-auto">
                  <Plus size={18}/> Register Faculty
                </button>
              </div>
              
              <div className="bg-white p-5 md:p-6 rounded-3xl shadow-sm border border-slate-200 mb-8">
                <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 border-b pb-3"><Search size={18} className="text-purple-600"/> Filter Faculty</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4 mb-5">
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Name</label><input type="text" value={teachFilters.name} onChange={e=>setTeachFilters({...teachFilters, name: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. Ayush" /></div>
                  <div className="flex flex-col gap-1.5"><label className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase">Course</label><input type="text" value={teachFilters.course} onChange={e=>setTeachFilters({...teachFilters, course: e.target.value})} className="border border-slate-300 px-3 py-2.5 rounded-xl text-sm w-full" placeholder="e.g. B.Tech" /></div>
                </div>
                <button onClick={handleTeachSearch} className="w-full md:w-auto bg-purple-600 text-white px-8 py-3 rounded-xl text-sm font-bold hover:bg-purple-700 shadow-md transition-all">Search Faculty</button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                {displayTeachers.map(teacher => (
                  <div key={teacher.id} className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col hover:shadow-md transition-shadow relative">
                    <button onClick={() => pushView('teacher_edit', teacher.id)} className="absolute top-4 right-4 p-2.5 bg-slate-50 border border-slate-100 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-colors">
                      <Edit size={18} />
                    </button>
                    <div className="flex items-start justify-between mb-4 mt-2">
                      <div className="w-16 h-16 bg-purple-100 text-purple-600 rounded-2xl flex items-center justify-center font-bold text-3xl shadow-sm shrink-0">{teacher.name.charAt(6) || teacher.name.charAt(0)}</div>
                    </div>
                    <h3 className="font-bold text-xl text-slate-800 mb-1 leading-tight">{teacher.name}</h3>
                    <p className="text-sm text-slate-500 font-medium mb-5">{teacher.department}</p>
                    <div className="mt-auto pt-4 border-t border-slate-100">
                      <p className="text-[10px] text-slate-400 mb-2 uppercase tracking-wide font-bold">Assigned Sections</p>
                      <div className="flex flex-wrap gap-2">
                        {teacher.sections.map(sec => (
                          <span key={sec} className="bg-slate-50 border border-slate-200 text-slate-700 font-bold px-3 py-1 rounded-lg text-xs">Sec {sec}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SHARED EDIT FORMS */}
          {currentView.name === 'student_edit' && <AdminStudentForm studentId={currentView.data} db={db} setDb={setDb} onBack={popView} />}
          {currentView.name === 'teacher_edit' && <AdminTeacherForm teacherId={currentView.data} db={db} setDb={setDb} onBack={popView} />}

        </div>
      </main>
    </div>
  );
}

// ----------------------------------------------------
// Admin Data Entry Form Component: STUDENT
// ----------------------------------------------------
function AdminStudentForm({ studentId, db, setDb, onBack }) {
  const isNew = !studentId;
  const initialData = isNew ? {
     id: 'S' + Date.now(), name: '', rollNo: '', section: '', photo: 'https://i.pravatar.cc/150?u=new', password: '',
     personalDetails: { email: '', phone: '', parentPhone: '', address: '', dob: '', bloodGroup: '' },
     collegeDetails: { course: '', branch: '', year: '', batch: '', semester: '', advisor: '', faculties: [] },
     attendance: [], results: []
  } : db.students.find(s => s.id === studentId);

  const [formData, setFormData] = useState(initialData);
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleChange = (section, field, value) => {
     if (section) setFormData(prev => ({ ...prev, [section]: { ...prev[section], [field]: value } }));
     else setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const imageUrl = URL.createObjectURL(file);
      handleChange(null, 'photo', imageUrl);
    }
  };

  const handleResultUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const newResult = {
        id: Date.now(),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'DOC',
        size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
        date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        score: "Pending"
      };
      setFormData(prev => ({ ...prev, results: [newResult, ...prev.results] }));
    }
  };

  const handleSave = async (e) => {
     e.preventDefault();
     setErrorMsg('');

     // Duplicate Check Logic
     if (isNew) {
       const isDuplicate = db.students.some(s => 
         s.rollNo === formData.rollNo || 
         s.personalDetails.email.toLowerCase() === formData.personalDetails.email.toLowerCase()
       );
       if (isDuplicate) {
         setErrorMsg('This student is already present (Duplicate Roll No or Email).');
         return;
       }
     }

     try {
       let studentRecord = { ...formData };

       if (isNew) {
         const email = formData.personalDetails.email.toLowerCase().trim();
         const password = formData.password;

         if (!email.endsWith('@student.com')) {
           setErrorMsg('Student email must use @student.com domain.');
           return;
         }

         if (!password) {
           setErrorMsg('Student password is required for authentication.');
           return;
         }

         const userCred = await createUserWithEmailAndPassword(auth, email, password);
         studentRecord = { ...studentRecord, id: userCred.user.uid, personalDetails: { ...studentRecord.personalDetails, email } };
       }

       const studentDoc = doc(firestore, 'artifacts', appId, 'public', 'data', 'students', studentRecord.id);
       await setDoc(studentDoc, studentRecord);

       if (isNew) setDb(prev => ({ ...prev, students: [studentRecord, ...prev.students] }));
       else setDb(prev => ({ ...prev, students: prev.students.map(s => s.id === studentId ? studentRecord : s) }));

       setShowToast(true);
       setTimeout(() => { setShowToast(false); onBack(); }, 1500);
     } catch (error) {
       setErrorMsg('Failed to save student: ' + error.message);
     }
  };

  return (
    <div className="max-w-4xl mx-auto pb-10">
      {showToast && (
         <div className="fixed top-6 right-1/2 transform translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up w-max">
           <CheckCircle size={18} className="text-green-400"/>
           <span className="text-sm font-medium">Profile Saved Permanently</span>
         </div>
      )}

      <form onSubmit={handleSave}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <button type="button" onClick={onBack} className="flex items-center justify-center gap-2 text-slate-500 hover:text-slate-800 font-bold bg-white border border-slate-200 px-5 py-3 rounded-xl shadow-sm transition-all w-full sm:w-auto"><ArrowLeft size={18}/> Cancel & Back</button>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-md flex items-center justify-center gap-2 transition-transform active:scale-95 w-full sm:w-auto"><Save size={18}/> {isNew ? 'Create Student' : 'Save Changes Globally'}</button>
        </div>

        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-fade-in-up">
            <XCircle size={18} className="shrink-0 mt-0.5" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <div className="bg-white p-5 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-8">
          
          <div className="bg-blue-50 text-blue-800 p-4 rounded-xl border border-blue-100 flex items-start gap-3 text-sm">
            <Info size={24} className="shrink-0 mt-0.5" />
            <p><strong>Admin Global Sync Note:</strong> Core details (marked with *) are mandatory. You can upload files from your device. Details instantly sync to the student portal and faculty roster.</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-slate-100 pb-8">
            <div className="relative group shrink-0 mx-auto md:mx-0">
              <img src={formData.photo} className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-slate-100 shadow-sm object-cover" alt="Profile" />
              <label className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center text-white opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity text-xs font-bold flex-col gap-1">
                <Plus size={20} /> Upload Photo
                <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1 w-full">
               <InputGroup label="Full Name" value={formData.name} onChange={v => handleChange(null, 'name', v)} required={true} />
               <InputGroup label="Roll Number" value={formData.rollNo} onChange={v => handleChange(null, 'rollNo', v)} required={true} />
               <InputGroup label="Section" value={formData.section} onChange={v => handleChange(null, 'section', v)} required={true} />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8">
             <div className="space-y-4 bg-slate-50 p-5 md:p-6 rounded-3xl border border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg"><BookOpen size={20} className="text-purple-600"/> Academic Profile</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <InputGroup label="Course" value={formData.collegeDetails.course} onChange={v => handleChange('collegeDetails', 'course', v)} required={true} />
                   <InputGroup label="Branch" value={formData.collegeDetails.branch} onChange={v => handleChange('collegeDetails', 'branch', v)} required={true} />
                   <InputGroup label="Year" value={formData.collegeDetails.year} onChange={v => handleChange('collegeDetails', 'year', v)} required={true} />
                   <InputGroup label="Batch" value={formData.collegeDetails.batch} onChange={v => handleChange('collegeDetails', 'batch', v)} required={true} />
                   <InputGroup label="Semester" value={formData.collegeDetails.semester} onChange={v => handleChange('collegeDetails', 'semester', v)} />
                   <InputGroup label="Advisor (Opt)" value={formData.collegeDetails.advisor} onChange={v => handleChange('collegeDetails', 'advisor', v)} />
                </div>
             </div>

             <div className="space-y-4 bg-slate-50 p-5 md:p-6 rounded-3xl border border-slate-100">
                <h4 className="font-bold text-slate-800 flex items-center gap-2 mb-4 text-lg"><User size={20} className="text-emerald-600"/> Contact & Login Security</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   <div className="col-span-1 sm:col-span-2">
                     <InputGroup label="Login Email (@student.com)" type="email" value={formData.personalDetails.email} onChange={v => handleChange('personalDetails', 'email', v)} required={true} />
                   </div>
                   <div className="col-span-1 sm:col-span-2 border-b border-slate-200 pb-4 mb-2">
                     <InputGroup label="Portal Login Password" type="text" value={formData.password} onChange={v => handleChange(null, 'password', v)} required={true} />
                   </div>
                   <InputGroup label="Student Phone" value={formData.personalDetails.phone} onChange={v => handleChange('personalDetails', 'phone', v)} required={true} />
                   <InputGroup label="Parent Phone" value={formData.personalDetails.parentPhone} onChange={v => handleChange('personalDetails', 'parentPhone', v)} required={true} />
                   <div className="col-span-1 sm:col-span-2">
                     <InputGroup label="Home Address (Opt)" value={formData.personalDetails.address} onChange={v => handleChange('personalDetails', 'address', v)} />
                   </div>
                   <InputGroup label="Date of Birth" type="date" value={formData.personalDetails.dob} onChange={v => handleChange('personalDetails', 'dob', v)} />
                   <InputGroup label="Blood Group (Opt)" value={formData.personalDetails.bloodGroup || ''} onChange={v => handleChange('personalDetails', 'bloodGroup', v)} />
                </div>
             </div>
          </div>

          {/* Document/Result Upload Section */}
          <div className="bg-indigo-50/50 p-5 md:p-6 rounded-3xl border border-indigo-100">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><FileText size={20} className="text-indigo-600"/> Result & Document Vault</h4>
              <label className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 shadow-sm cursor-pointer inline-flex items-center justify-center gap-2 w-full sm:w-fit">
                <Plus size={16} /> Upload from Device
                <input type="file" className="hidden" onChange={handleResultUpload} accept=".pdf,.doc,.docx,image/*" />
              </label>
            </div>
            {formData.results.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {formData.results.map(res => (
                  <div key={res.id} className="bg-white p-3 rounded-xl border border-slate-200 flex justify-between items-center shadow-sm">
                    <div className="truncate pr-4">
                      <p className="font-bold text-sm text-slate-800 truncate">{res.name}</p>
                      <p className="text-xs text-slate-500">{res.date} • {res.size}</p>
                    </div>
                    <span className="bg-indigo-100 text-indigo-800 font-bold px-2 py-1 rounded text-xs shrink-0">{res.type}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500 italic text-center py-4">No documents uploaded yet.</p>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}

// ----------------------------------------------------
// Admin Data Entry Form Component: TEACHER
// ----------------------------------------------------
function AdminTeacherForm({ teacherId, db, setDb, onBack }) {
  const isNew = !teacherId;
  const initialData = isNew ? { id: 'T' + Date.now(), name: '', email: '', password: '', department: '', sections: [] } : db.teachers.find(t => t.id === teacherId);
  const [formData, setFormData] = useState(initialData);
  const [sectionsStr, setSectionsStr] = useState(initialData.sections.join(', '));
  const [showToast, setShowToast] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Dynamically calculate parsed sections for preview
  const previewSections = sectionsStr.split(',').map(s => s.trim().toUpperCase()).filter(Boolean);

  const handleSave = async (e) => {
     e.preventDefault();
     setErrorMsg('');

     // Duplicate Check Logic
     if (isNew) {
       const isDuplicate = db.teachers.some(t => t.email.toLowerCase() === formData.email.toLowerCase());
       if (isDuplicate) {
         setErrorMsg('This teacher is already present (Duplicate Email).');
         return;
       }
     }

     const finalData = { ...formData, sections: previewSections };

     try {
       const teacherDoc = doc(firestore, 'artifacts', appId, 'public', 'data', 'teachers', finalData.id);
       await setDoc(teacherDoc, finalData);

       if (isNew) setDb(prev => ({ ...prev, teachers: [finalData, ...prev.teachers] }));
       else setDb(prev => ({ ...prev, teachers: prev.teachers.map(t => t.id === teacherId ? finalData : t) }));

       setShowToast(true);
       setTimeout(() => { setShowToast(false); onBack(); }, 1500);
     } catch (error) {
       setErrorMsg('Failed to save teacher: ' + error.message);
     }
  };

  return (
    <div className="max-w-5xl mx-auto pb-10">
      {showToast && (
         <div className="fixed top-6 right-1/2 transform translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-full shadow-2xl z-50 flex items-center gap-3 animate-fade-in-up w-max">
           <CheckCircle size={18} className="text-green-400"/><span className="text-sm font-medium">Faculty Profile Saved</span>
         </div>
      )}
      
      <form onSubmit={handleSave}>
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
          <button type="button" onClick={onBack} className="flex items-center justify-center gap-2 text-slate-500 font-bold bg-white border border-slate-200 px-5 py-3 rounded-xl w-full sm:w-auto"><ArrowLeft size={18}/> Cancel</button>
          <button type="submit" className="bg-emerald-600 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md w-full sm:w-auto"><Save size={18}/> {isNew ? 'Register Faculty' : 'Save Changes Globally'}</button>
        </div>
        
        {errorMsg && (
          <div className="mb-6 bg-red-50 text-red-700 p-4 rounded-xl text-sm border border-red-100 flex items-start gap-3 animate-fade-in-up">
            <XCircle size={18} className="shrink-0 mt-0.5" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white p-6 md:p-8 rounded-3xl shadow-sm border border-slate-200 space-y-5 h-fit">
            <h3 className="text-xl font-bold text-slate-800 mb-2 border-b pb-4">Faculty Admin Profile</h3>
            <InputGroup label="Full Name" placeholder="e.g. Prof. Alan Turing" value={formData.name} onChange={v => setFormData({...formData, name: v})} required={true} />
            <InputGroup label="Login Email (@teacher.com)" type="email" placeholder="e.g. alan@teacher.com" value={formData.email} onChange={v => setFormData({...formData, email: v})} required={true} />
            <InputGroup label="Portal Password" type="text" placeholder="Set user password" value={formData.password} onChange={v => setFormData({...formData, password: v})} required={true} />
            <InputGroup label="Department" placeholder="e.g. Computer Science" value={formData.department} onChange={v => setFormData({...formData, department: v})} required={true} />
            <InputGroup label="Assigned Sections (Comma Separated)" placeholder="e.g. A, B, C" value={sectionsStr} onChange={v => setSectionsStr(v)} />
            <p className="text-xs text-slate-400 mt-2">Core login fields are marked with *.</p>
          </div>

          {!isNew && (
            <div className="lg:col-span-2 bg-slate-100 p-6 md:p-8 rounded-3xl border border-slate-200">
               <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-4 flex items-center gap-2 border-b border-slate-300 pb-4">
                 <Users className="text-purple-600"/> Live Roster Preview
               </h3>
               <p className="text-sm text-slate-600 mb-6">As you type sections above, this area instantly previews the exact student details this faculty member will gain access to.</p>
               
               <div className="space-y-6">
                  {previewSections.map(sec => {
                    const studentsInSection = db.students.filter(s => s.section === sec);
                    return (
                      <div key={sec} className="bg-white p-5 sm:p-6 rounded-2xl shadow-sm border border-slate-200">
                         <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b pb-3 mb-4 gap-2">
                           <h4 className="font-bold text-slate-800 text-lg">Section {sec}</h4>
                           <span className="bg-purple-100 text-purple-700 font-bold px-4 py-1.5 rounded-lg text-xs w-max">{studentsInSection.length} Students Enrolled</span>
                         </div>
                         
                         {studentsInSection.length > 0 ? (
                           <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                             {studentsInSection.map(stu => (
                               <div key={stu.id} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                 <img src={stu.photo} alt={stu.name} className="w-10 h-10 rounded-xl border border-slate-200 shrink-0 object-cover"/>
                                 <div className="overflow-hidden">
                                   <p className="text-sm font-bold text-slate-800 leading-tight truncate">{stu.name}</p>
                                   <p className="text-[10px] text-slate-500 font-medium truncate mt-0.5">{stu.rollNo} • {stu.personalDetails.phone}</p>
                                 </div>
                               </div>
                             ))}
                           </div>
                         ) : (
                           <p className="text-sm text-slate-400 italic">No students are currently registered under this section.</p>
                         )}
                      </div>
                    )
                  })}
                  {previewSections.length === 0 && (
                     <div className="bg-red-50 text-red-700 p-5 rounded-2xl border border-red-100 font-medium text-sm">
                       No sections assigned. Preview empty.
                     </div>
                  )}
               </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}