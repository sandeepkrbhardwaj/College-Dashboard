import React, { useState } from 'react';
import { CalendarCheck, User, BookOpen, FileText, Activity, Clock, Users } from 'lucide-react';

const ReadOnlyField = ({ label, value }) => (
  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
    <p className="text-[10px] font-bold text-slate-400 mb-1 uppercase tracking-wider">{label}</p>
    <p className="font-bold text-slate-800 text-sm">{value || 'N/A'}</p>
  </div>
);

export default function StudentDashboard({ db, user }) {
  const [activeTab, setActiveTab] = useState('attendance');
  const student = db.students.find(s => s.id === user.id);
  
  const assignedFaculties = db.teachers
    .filter(t => t.sections.includes(student.section))
    .map(t => ({ subject: t.department, name: t.name }));

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden">
      <aside className="w-full md:w-64 bg-white border-b md:border-r border-slate-200 flex flex-row md:flex-col shrink-0 overflow-x-auto">
        <nav className="p-2 md:p-4 flex flex-row md:flex-col gap-2 w-full">
          {['attendance', 'results', 'details', 'college'].map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 rounded-lg text-sm font-bold capitalize ${activeTab === tab ? 'bg-blue-50 text-blue-600' : 'text-slate-500'}`}>{tab}</button>
          ))}
        </nav>
      </aside>
      <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
           {activeTab === 'details' && (
             <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100">
               <h2 className="text-2xl font-bold mb-6">Personal Profile</h2>
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <ReadOnlyField label="Name" value={student.name} />
                 <ReadOnlyField label="Email" value={student.personalDetails.email} />
                 <ReadOnlyField label="Phone" value={student.personalDetails.phone} />
                 <ReadOnlyField label="Address" value={student.personalDetails.address} />
               </div>
             </div>
           )}
           {activeTab === 'attendance' && <div className="p-10 bg-white rounded-3xl text-center font-bold text-slate-400">Attendance Calendar & Logs...</div>}
        </div>
      </main>
    </div>
  );
}