
import React, { useState } from 'react';
import { Exam, Institution, User, UserRole, InstitutionStatus, Announcement } from './types';
import LoginPage from './components/auth/LoginPage';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import InstitutionPortal from './components/institution/InstitutionPortal';
import { INITIAL_USERS, INITIAL_INSTITUTIONS } from './services/mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [institutions, setInstitutions] = useState<Institution[]>(INITIAL_INSTITUTIONS);
  const [savedExams, setSavedExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);

  // --- Auth ---
  const handleLogin = (username: string, password_provided: string) => {
    const user = users.find(u => u.username === username);
    if (user && user.password === password_provided) {
       if (user.institutionId) {
        const institution = institutions.find(i => i.id === user.institutionId);
        if (institution?.status === InstitutionStatus.SUSPENDED) {
          setError('This institution account has been suspended. Please contact support.');
          return;
        }
      }
      setCurrentUser(user);
      setError(null);
    } else {
      setError('Invalid username or password.');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  // --- User Credential Management ---
  const handleUpdateUserCredentials = (userId: string, newUsername: string, newPassword_provided: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId ? { ...user, username: newUsername, password: newPassword_provided } : user
    ));
    // If the current user is the one being updated, update their state as well
    if (currentUser?.id === userId) {
      setCurrentUser(prev => prev ? { ...prev, username: newUsername, password: newPassword_provided } : null);
    }
  };

  // --- Super Admin: Institution CRUD ---
  const handleRegisterInstitution = (
    name: string, 
    initialUser: { username: string, password_provided: string },
    details: { type: string, staffName: string, phone: string, location: string }
  ) => {
    const newInstitution: Institution = {
      id: `inst_${Date.now()}`,
      name,
      status: InstitutionStatus.ACTIVE,
      type: details.type,
      staffName: details.staffName,
      phone: details.phone,
      location: details.location
    };
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: initialUser.username,
      password: initialUser.password_provided,
      role: UserRole.TEACHER,
      institutionId: newInstitution.id,
    };
    setInstitutions(prev => [...prev, newInstitution]);
    setUsers(prev => [...prev, newUser]);
  };
  
  const handleUpdateInstitution = (instId: string, updatedData: Partial<Institution>) => {
    setInstitutions(prev => prev.map(inst => inst.id === instId ? { ...inst, ...updatedData } : inst));
  };

  const handleDeleteInstitution = (instId: string) => {
    setInstitutions(prev => prev.filter(inst => inst.id !== instId));
    setUsers(prev => prev.filter(u => u.institutionId !== instId));
    setSavedExams(prev => prev.filter(e => e.institutionId !== instId));
  };

  const handleToggleInstitutionStatus = (instId: string) => {
    setInstitutions(prev => prev.map(inst => 
      inst.id === instId 
        ? { ...inst, status: inst.status === InstitutionStatus.ACTIVE ? InstitutionStatus.SUSPENDED : InstitutionStatus.ACTIVE } 
        : inst
    ));
  };

  // --- Super Admin: Announcements ---
  const handleCreateAnnouncement = (title: string, content: string, institutionIds?: string[]) => {
    const newAnnouncement: Announcement = {
      id: `anno_${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      institutionIds,
    };
    setAnnouncements(prev => [newAnnouncement, ...prev]);
  };
  
  // --- Institution Portal: User Management ---
  const handleAddUser = (username: string, password_provided: string, institutionId: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password: password_provided,
      role: UserRole.TEACHER,
      institutionId,
    };
    setUsers(prev => [...prev, newUser]);
  };
  
  const handleDeleteUser = (userId: string) => {
    setUsers(prev => prev.filter(u => u.id !== userId));
  };

  // --- Institution Portal: Exam Bank ---
  const handleSaveExam = (exam: Exam) => {
    setSavedExams(prev => {
        // Check if exam already exists, update it, otherwise add it
        const existingIndex = prev.findIndex(e => e.id === exam.id);
        if (existingIndex > -1) {
            const updatedExams = [...prev];
            updatedExams[existingIndex] = exam;
            return updatedExams;
        }
        return [...prev, exam];
    });
  };

  const handleDeleteSavedExam = (examId: string) => {
    setSavedExams(prev => prev.filter(e => e.id !== examId));
  };
  
  const currentInstitution = institutions.find(inst => inst.id === currentUser?.institutionId);

  const renderContent = () => {
    if (!currentUser) {
      return <LoginPage onLogin={handleLogin} error={error} />;
    }

    switch (currentUser.role) {
      case UserRole.SUPER_ADMIN:
        return <SuperAdminDashboard 
                  currentUser={currentUser}
                  institutions={institutions} 
                  users={users}
                  announcements={announcements}
                  onRegisterInstitution={handleRegisterInstitution} 
                  onUpdateInstitution={handleUpdateInstitution}
                  onDeleteInstitution={handleDeleteInstitution}
                  onToggleStatus={handleToggleInstitutionStatus}
                  onCreateAnnouncement={handleCreateAnnouncement}
                  onUpdateCredentials={handleUpdateUserCredentials}
                />;
      case UserRole.TEACHER:
        if(currentInstitution){
           return <InstitutionPortal 
                    currentUser={currentUser}
                    institution={currentInstitution} 
                    usersInInstitution={users.filter(u => u.institutionId === currentInstitution.id)}
                    savedExams={savedExams.filter(e => e.institutionId === currentInstitution.id)}
                    announcements={announcements} // Pass the full array
                    onAddUser={(username, password) => handleAddUser(username, password, currentInstitution.id)}
                    onDeleteUser={handleDeleteUser}
                    onSaveExam={handleSaveExam}
                    onDeleteSavedExam={handleDeleteSavedExam}
                  />;
        }
        return <div>Error: Institution not found.</div>
      default:
        return <div>Error: Unknown user role.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50 font-sans">
      <header className="bg-slate-800 shadow-md shadow-amber-500/10 sticky top-0 z-50">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <svg className="h-8 w-8 text-amber-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h1 className="text-2xl font-bold text-amber-400">Examify</h1>
            </div>
            {currentUser && (
               <div className="flex items-center space-x-4">
                  <span className="text-sm font-medium text-slate-300">
                    Welcome, <span className="font-bold text-amber-400">{currentUser.username}</span>
                    {currentUser.role === UserRole.TEACHER && currentInstitution && ` (${currentInstitution.name})`}
                  </span>
                  <button
                    onClick={handleLogout}
                    className="px-3 py-1.5 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-md hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500"
                  >
                    Logout
                  </button>
               </div>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        {renderContent()}
      </main>
    </div>
  );
};

export default App;