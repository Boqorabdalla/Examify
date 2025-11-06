
import React, { useState } from 'react';
import { Institution, User, UserRole, InstitutionStatus, Announcement } from '../../types';
import EditInstitutionModal from './EditInstitutionModal';
import Analytics from './Analytics';
import Announcements from './Announcements';
import ProfileSettings from './ProfileSettings';

interface SuperAdminDashboardProps {
  currentUser: User;
  institutions: Institution[];
  users: User[];
  announcements: Announcement[];
  onRegisterInstitution: (
    name: string, 
    initialUser: { username: string, password_provided: string },
    details: { type: string, staffName: string, phone: string, location: string }
  ) => void;
  onUpdateInstitution: (id: string, data: Partial<Institution>) => void;
  onDeleteInstitution: (id: string) => void;
  onToggleStatus: (id: string) => void;
  onCreateAnnouncement: (title: string, content: string, institutionIds?: string[]) => void;
  onUpdateCredentials: (userId: string, newUsername: string, newPassword_provided: string) => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ 
  currentUser,
  institutions, 
  users, 
  announcements,
  onRegisterInstitution, 
  onUpdateInstitution,
  onDeleteInstitution,
  onToggleStatus,
  onCreateAnnouncement,
  onUpdateCredentials
}) => {
  // Form state
  const [newInstName, setNewInstName] = useState('');
  const [newInstType, setNewInstType] = useState('');
  const [newInstStaffName, setNewInstStaffName] = useState('');
  const [newInstPhone, setNewInstPhone] = useState('');
  const [newInstLocation, setNewInstLocation] = useState('');

  const [message, setMessage] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInstitution, setEditingInstitution] = useState<Institution | null>(null);
  const [activeTab, setActiveTab] = useState('analytics'); // Default to analytics

  const handleEditClick = (institution: Institution) => {
    setEditingInstitution(institution);
    setIsModalOpen(true);
  };

  const handleModalSave = (updatedData: Partial<Institution>) => {
    if (editingInstitution) {
      onUpdateInstitution(editingInstitution.id, updatedData);
    }
    setIsModalOpen(false);
    setEditingInstitution(null);
  };

  const handleDeleteClick = (institution: Institution) => {
    if (window.confirm(`Are you sure you want to delete ${institution.name}? This action cannot be undone.`)) {
      onDeleteInstitution(institution.id);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInstName.trim() || !newInstType.trim() || !newInstStaffName.trim() || !newInstPhone.trim() || !newInstLocation.trim()) {
        setMessage('All institution fields are required.');
        return;
    };
    
    const simpleName = newInstName.trim().toLowerCase().replace(/\s+/g, '_');
    const initialUser = {
        username: `teacher_${simpleName}`,
        password_provided: 'password'
    };
    
    const details = {
        type: newInstType,
        staffName: newInstStaffName,
        phone: newInstPhone,
        location: newInstLocation
    };

    onRegisterInstitution(newInstName, initialUser, details);
    setMessage(`Institution "${newInstName}" created with user "${initialUser.username}" and password "password".`);
    
    // Reset form
    setNewInstName('');
    setNewInstType('');
    setNewInstStaffName('');
    setNewInstPhone('');
    setNewInstLocation('');

    setTimeout(() => setMessage(null), 5000);
  };
  
  const getInstitutionUserCount = (instId: string) => {
      return users.filter(u => u.institutionId === instId && u.role === UserRole.TEACHER).length;
  }

  const renderTabs = () => {
    return (
        <div className="border-b border-slate-700 mb-6">
            <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                 <button onClick={() => setActiveTab('analytics')} className={`${activeTab === 'analytics' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Analytics
                </button>
                <button onClick={() => setActiveTab('institutions')} className={`${activeTab === 'institutions' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Institutions
                </button>
                <button onClick={() => setActiveTab('announcements')} className={`${activeTab === 'announcements' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Announcements
                </button>
                <button onClick={() => setActiveTab('profile')} className={`${activeTab === 'profile' ? 'border-amber-500 text-amber-400' : 'border-transparent text-slate-400 hover:text-slate-300 hover:border-slate-500'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm`}>
                    Profile
                </button>
            </nav>
        </div>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
        case 'analytics':
            return <Analytics institutions={institutions} users={users} />;
        case 'announcements':
            return <Announcements 
                      announcements={announcements} 
                      institutions={institutions} 
                      onCreateAnnouncement={onCreateAnnouncement} 
                    />;
        case 'profile':
            return <ProfileSettings user={currentUser} onUpdateCredentials={onUpdateCredentials} />;
        case 'institutions':
            return (
                 <div className="space-y-8">
                    <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                        <h3 className="text-xl font-semibold text-amber-400 mb-4">Register New Institution</h3>
                        <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Institution Name</label>
                                <input type="text" value={newInstName} onChange={(e) => setNewInstName(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Institution Type (e.g., University)</label>
                                <input type="text" value={newInstType} onChange={(e) => setNewInstType(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                             <div>
                                <label className="block text-sm font-medium text-slate-300">Responsible Staff Name</label>
                                <input type="text" value={newInstStaffName} onChange={(e) => setNewInstStaffName(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300">Phone Number</label>
                                <input type="text" value={newInstPhone} onChange={(e) => setNewInstPhone(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                             <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-medium text-slate-300">Location / City</label>
                                <input type="text" value={newInstLocation} onChange={(e) => setNewInstLocation(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="w-full sm:w-auto px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500">
                                Register
                            </button>
                        </div>
                        </form>
                        {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
                    </div>
                    <div className="bg-slate-800 rounded-lg shadow-md border border-slate-700 overflow-hidden">
                        <h3 className="text-xl font-semibold text-amber-400 mb-4 p-6">Manage Institutions</h3>
                        <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-slate-700">
                            <thead className="bg-slate-700/50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Name</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Location</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Teachers</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
                            </tr>
                            </thead>
                            <tbody className="bg-slate-800 divide-y divide-slate-700">
                            {institutions.map((inst) => (
                                <tr key={inst.id} className="hover:bg-slate-700/50">
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-50">{inst.name}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{inst.location}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm">
                                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${inst.status === InstitutionStatus.ACTIVE ? 'bg-green-900 text-green-300' : 'bg-red-900 text-red-300'}`}>
                                    {inst.status}
                                    </span>
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{getInstitutionUserCount(inst.id)}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                                    <button onClick={() => onToggleStatus(inst.id)} className={`px-2 py-1 text-xs rounded ${inst.status === InstitutionStatus.ACTIVE ? 'bg-yellow-600 hover:bg-yellow-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}>
                                        {inst.status === InstitutionStatus.ACTIVE ? 'Suspend' : 'Activate'}
                                    </button>
                                    <button onClick={() => handleEditClick(inst)} className="text-amber-400 hover:text-amber-300">Edit</button>
                                    <button onClick={() => handleDeleteClick(inst)} className="text-red-500 hover:text-red-400">Delete</button>
                                </td>
                                </tr>
                            ))}
                            </tbody>
                        </table>
                        </div>
                    </div>
                </div>
            );
        default:
            return null;
    }
  };

  return (
    <div className="space-y-6">
      {renderTabs()}
      {renderContent()}
      {isModalOpen && editingInstitution && (
        <EditInstitutionModal
          institution={editingInstitution}
          onClose={() => setIsModalOpen(false)}
          onSave={handleModalSave}
        />
      )}
    </div>
  );
};

export default SuperAdminDashboard;