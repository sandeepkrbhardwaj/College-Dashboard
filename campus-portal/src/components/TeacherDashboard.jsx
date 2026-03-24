import React, { useState, useEffect } from 'react';
import { Users, CheckCircle, ArrowLeft, Calendar } from 'lucide-react';

export default function TeacherDashboard({ db, setDb, user }) {
  const [selectedSection, setSelectedSection] = useState(user.sections[0]);
  const [attendanceDate, setAttendanceDate] = useState('2026-03-24');
  const students = db.students.filter(s => s.section === selectedSection);

  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200">
        <div className="p-4 font-bold text-slate-400 text-xs uppercase">Your Sections</div>
        {user.sections.map(sec => (
          <button key={sec} onClick={() => setSelectedSection(sec)} className={`w-full p-4 text-left font-bold ${selectedSection === sec ? 'bg-emerald-50 text-emerald-600' : ''}`}>Section {sec}</button>
        ))}
      </aside>
      <main className="flex-1 p-6 bg-slate-50 overflow-y-auto">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">Section {selectedSection} Attendance</h2>
            <input type="date" value={attendanceDate} onChange={e => setAttendanceDate(e.target.value)} className="border p-2 rounded-xl" />
          </div>
          <div className="space-y-4">
            {students.map(s => (
              <div key={s.id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-slate-200">
                <div className="flex items-center gap-4">
                  <img src={s.photo} className="w-20 h-20 rounded-xl object-cover" alt="" />
                  <div className="font-bold text-lg">{s.name}</div>
                </div>
                <div className="flex gap-2">
                  <button className="px-6 py-2 bg-green-100 text-green-700 rounded-lg font-bold">Present</button>
                  <button className="px-6 py-2 bg-red-100 text-red-700 rounded-lg font-bold">Absent</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}