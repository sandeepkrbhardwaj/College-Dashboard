import React, { useState } from 'react';
import { Plus, Users, Search, Save, Trash2 } from 'lucide-react';

export default function AdminDashboard({ db, setDb }) {
  const [activeTab, setActiveTab] = useState('students');
  
  return (
    <div className="flex-1 flex flex-col md:flex-row h-full">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200">
        <button onClick={() => setActiveTab('students')} className={`w-full p-4 text-left font-bold ${activeTab === 'students' ? 'bg-purple-50 text-purple-600' : ''}`}>Student DB</button>
        <button onClick={() => setActiveTab('teachers')} className={`w-full p-4 text-left font-bold ${activeTab === 'teachers' ? 'bg-purple-50 text-purple-600' : ''}`}>Teacher DB</button>
      </aside>
      <main className="flex-1 p-8 bg-slate-50">
        <div className="flex justify-between mb-8">
          <h2 className="text-3xl font-bold capitalize">{activeTab} Database</h2>
          <button className="bg-purple-600 text-white px-6 py-2 rounded-xl font-bold">+ Register New</button>
        </div>
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden">
           <p className="p-10 text-center text-slate-400 italic">Admin forms for Read/Write access (Compulsory Fields & Master Key 123456789 validation).</p>
        </div>
      </main>
    </div>
  );
}