import React from 'react';
import { MOCK_PATIENTS } from '../constants.ts';
import { Activity, Users, FileText, Search, AlertCircle, CheckCircle2 } from 'lucide-react';

export const Sidebar: React.FC = () => {
  return (
    <div className="w-64 h-full border-r border-zinc-800 bg-black flex flex-col">
      {/* Header */}
      <div className="h-16 flex items-center px-4 border-b border-zinc-800">
        <Activity className="text-blue-500 mr-2" size={24} />
        <span className="font-bold text-lg text-white tracking-tight">NeuroRad AI</span>
      </div>

      {/* Navigation */}
      <div className="flex flex-col p-2 gap-1">
        <button className="flex items-center px-3 py-2 text-sm font-medium bg-zinc-900 text-white rounded-md">
          <Users size={16} className="mr-3 text-blue-400" />
          Worklist
        </button>
        <button className="flex items-center px-3 py-2 text-sm font-medium text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-md transition-colors">
          <FileText size={16} className="mr-3" />
          Reports
        </button>
      </div>

      {/* Search */}
      <div className="px-3 py-2">
        <div className="relative">
          <Search className="absolute left-2.5 top-2 text-zinc-500" size={14} />
          <input 
            type="text" 
            placeholder="Search patient..." 
            className="w-full bg-zinc-900 border border-zinc-800 text-zinc-300 text-xs rounded-md pl-8 pr-2 py-1.5 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
      </div>

      {/* Patient List */}
      <div className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
        <h3 className="px-2 text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Today's Queue</h3>
        {MOCK_PATIENTS.map((patient) => (
          <div key={patient.id} className="group flex flex-col p-3 rounded-md hover:bg-zinc-900 cursor-pointer border border-transparent hover:border-zinc-800 transition-all">
            <div className="flex justify-between items-start mb-1">
              <span className="text-sm font-medium text-zinc-200 group-hover:text-blue-400">{patient.name}</span>
              {patient.status === 'critical' && <AlertCircle size={14} className="text-red-500" />}
              {patient.status === 'stable' && <CheckCircle2 size={14} className="text-green-500" />}
              {patient.status === 'review' && <Activity size={14} className="text-yellow-500" />}
            </div>
            <div className="flex justify-between items-center text-xs text-zinc-500">
              <span>{patient.id}</span>
              <span>{patient.modality}</span>
            </div>
          </div>
        ))}
      </div>

      {/* User Footer */}
      <div className="p-4 border-t border-zinc-800">
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white">
            DR
          </div>
          <div className="ml-3">
            <p className="text-sm font-medium text-white">Dr. A. Silva</p>
            <p className="text-xs text-zinc-500">Radiology Lead</p>
          </div>
        </div>
      </div>
    </div>
  );
};