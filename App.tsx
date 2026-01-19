
import React, { useState, useEffect } from 'react';
import { Exam, Institution, User, UserRole, InstitutionStatus, Announcement } from './types';
import LoginPage from './components/auth/LoginPage';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import InstitutionPortal from './components/institution/InstitutionPortal';
import { supabase } from './services/supabaseClient';
import Loader from './components/Loader';
import Logo from './components/Logo';
import { INITIAL_INSTITUTIONS, INITIAL_USERS } from './services/mockData';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [savedExams, setSavedExams] = useState<Exam[]>([]);
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showDbSetup, setShowDbSetup] = useState<boolean>(false);

  // --- Data Fetching & Mapping ---

  const mapInstitution = (i: any): Institution => ({
    id: i.id,
    name: i.name,
    logo: i.logo || undefined,
    status: i.status as InstitutionStatus,
    type: i.type,
    staffName: i.staff_name,
    phone: i.phone,
    location: i.location,
    handbookGenerationEnabled: i.handbook_enabled,
  });

  const mapUser = (u: any): User => ({
    id: u.id,
    username: u.username,
    password: u.password,
    role: u.role as UserRole,
    institutionId: u.institution_id || undefined,
  });

  const mapExam = (e: any): Exam => ({
    id: e.id,
    institutionId: e.institution_id,
    creator_id: e.creator_id,
    creator_username: e.creator_username,
    course_name: e.course_name,
    exam_type: e.exam_type,
    duration: e.duration,
    questions: e.questions || [],
  } as any); // Casting for simplicity in mapping

  const mapAnnouncement = (a: any): Announcement => ({
    id: a.id,
    title: a.title,
    content: a.content,
    createdAt: a.created_at,
    institutionIds: a.institution_ids || undefined,
  });

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      setShowDbSetup(false);
      
      try {
        const [instRes, userRes, examRes, annoRes] = await Promise.all([
          supabase.from('institutions').select('*'),
          supabase.from('users').select('*'),
          supabase.from('exams').select('*'),
          supabase.from('announcements').select('*').order('created_at', { ascending: false })
        ]);

        const errors = [];
        if (instRes.error) errors.push(`Institutions: ${instRes.error.message}`);
        if (userRes.error) errors.push(`Users: ${userRes.error.message}`);
        if (examRes.error) errors.push(`Exams: ${examRes.error.message}`);
        if (annoRes.error) errors.push(`Announcements: ${annoRes.error.message}`);

        if (errors.length > 0) {
          console.error("Supabase Fetch Errors:", errors);
          if (errors.some(e => e.includes('does not exist') || e.includes('schema cache') || e.includes('Could not find the table'))) {
            setShowDbSetup(true);
            setError("Database tables are missing. Please run the setup script.");
          } else {
            setError(`Failed to load data: ${errors[0]}`);
          }
        }

        if (instRes.data) setInstitutions(instRes.data.map(mapInstitution));
        if (userRes.data) setUsers(userRes.data.map(mapUser));
        if (examRes.data) setSavedExams(examRes.data.map(e => ({
            id: e.id,
            institutionId: e.institution_id,
            creatorId: e.creator_id,
            creatorUsername: e.creator_username,
            courseName: e.course_name,
            examType: e.exam_type,
            duration: e.duration,
            questions: e.questions
        })));
        if (annoRes.data) setAnnouncements(annoRes.data.map(mapAnnouncement));

      } catch (e) {
        console.error("Unexpected error fetching data:", e);
        setError("Failed to load application data. Check console for details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

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

  // --- Database Seeding ---
  const handleSeedData = async () => {
    setIsLoading(true);
    try {
        const dbInsts = INITIAL_INSTITUTIONS.map(i => ({
            id: i.id,
            name: i.name,
            logo: i.logo || null,
            status: i.status,
            type: i.type,
            staff_name: i.staffName,
            phone: i.phone,
            location: i.location,
            handbook_enabled: i.handbookGenerationEnabled
        }));

        const { error: instError } = await supabase.from('institutions').upsert(dbInsts);
        if(instError) throw instError;

        const dbUsers = INITIAL_USERS
            .filter(u => u.role !== UserRole.SUPER_ADMIN)
            .map(u => ({
                id: u.id,
                username: u.username,
                password: u.password,
                role: u.role,
                institution_id: u.institutionId
            }));
            
        if(dbUsers.length > 0) {
            const { error: userError } = await supabase.from('users').upsert(dbUsers);
            if(userError) throw userError;
        }

        window.location.reload(); 
    } catch(e: any) {
        console.error("Seeding error:", e);
        setError("Failed to seed data: " + e.message);
        setIsLoading(false);
    }
  };

  const handleUpdateUserCredentials = async (userId: string, newUsername: string, newPassword_provided: string) => {
    try {
        const { error } = await supabase.from('users').update({ username: newUsername, password: newPassword_provided }).eq('id', userId);
        if (error) throw error;
        setUsers(prev => prev.map(user => user.id === userId ? { ...user, username: newUsername, password: newPassword_provided } : user));
        if (currentUser?.id === userId) setCurrentUser(prev => prev ? { ...prev, username: newUsername, password: newPassword_provided } : null);
    } catch (e: any) { alert(`Failed to update credentials: ${e.message}`); }
  };

  const handleRegisterInstitution = async (name: string, username: string, password_provided: string, details: any) => {
    const newId = `inst_${Date.now()}`;
    const newUserId = `user_${Date.now()}`;
    try {
        await supabase.from('institutions').insert([{ id: newId, name, status: InstitutionStatus.ACTIVE, ...details }]);
        await supabase.from('users').insert([{ id: newUserId, username, password: password_provided, role: UserRole.TEACHER, institution_id: newId }]);
        window.location.reload();
    } catch (e: any) { alert(`Failed to register: ${e.message}`); }
  };
  
  const handleUpdateInstitution = async (instId: string, updatedData: any) => {
    try {
        await supabase.from('institutions').update(updatedData).eq('id', instId);
        setInstitutions(prev => prev.map(inst => inst.id === instId ? { ...inst, ...updatedData } : inst));
    } catch (e: any) { alert(`Failed to update: ${e.message}`); }
  };

  const handleDeleteInstitution = async (instId: string) => {
    try {
        await supabase.from('users').delete().eq('institution_id', instId);
        await supabase.from('exams').delete().eq('institution_id', instId);
        await supabase.from('institutions').delete().eq('id', instId);
        setInstitutions(prev => prev.filter(inst => inst.id !== instId));
    } catch (e: any) { alert(`Failed to delete: ${e.message}`); }
  };

  const handleToggleInstitutionStatus = async (instId: string) => {
    const inst = institutions.find(i => i.id === instId);
    if (!inst) return;
    const newStatus = inst.status === InstitutionStatus.ACTIVE ? InstitutionStatus.SUSPENDED : InstitutionStatus.ACTIVE;
    try {
        await supabase.from('institutions').update({ status: newStatus }).eq('id', instId);
        setInstitutions(prev => prev.map(i => i.id === instId ? { ...i, status: newStatus } : i));
    } catch (e) { console.error(e); }
  };

  const handleCreateAnnouncement = async (title: string, content: string, institutionIds?: string[]) => {
    try {
        const newId = `anno_${Date.now()}`;
        await supabase.from('announcements').insert([{ id: newId, title, content, created_at: new Date().toISOString(), institution_ids: institutionIds }]);
        setAnnouncements(prev => [{ id: newId, title, content, createdAt: new Date().toISOString(), institutionIds }, ...prev]);
    } catch (e: any) { alert(e.message); }
  };
  
  const handleAddUser = async (username: string, password_provided: string, institutionId: string) => {
    try {
        const id = `user_${Date.now()}`;
        await supabase.from('users').insert([{ id, username, password: password_provided, role: UserRole.TEACHER, institution_id: institutionId }]);
        setUsers(prev => [...prev, { id, username, password: password_provided, role: UserRole.TEACHER, institutionId }]);
    } catch (e: any) { alert(e.message); }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
        await supabase.from('users').delete().eq('id', userId);
        setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) { alert(e.message); }
  };

  const handleSaveExam = async (exam: Exam) => {
    try {
        const exists = savedExams.some(e => e.id === exam.id);
        const data = {
            id: exam.id,
            institution_id: exam.institutionId,
            creator_id: exam.creatorId,
            creator_username: exam.creatorUsername,
            course_name: exam.courseName,
            exam_type: exam.examType,
            duration: exam.duration,
            questions: exam.questions
        };
        if (exists) {
            await supabase.from('exams').update(data).eq('id', exam.id);
            setSavedExams(prev => prev.map(e => e.id === exam.id ? exam : e));
        } else {
            await supabase.from('exams').insert([data]);
            setSavedExams(prev => [...prev, exam]);
        }
    } catch (e: any) { alert(e.message); }
  };

  const handleDeleteSavedExam = async (examId: string) => {
    try {
        await supabase.from('exams').delete().eq('id', examId);
        setSavedExams(prev => prev.filter(e => e.id !== examId));
    } catch (e: any) { alert(e.message); }
  };
  
  const currentInstitution = institutions.find(inst => inst.id === currentUser?.institutionId);

  const renderContent = () => {
    if (isLoading) return <div className="flex flex-col items-center justify-center min-h-[60vh]"><Loader /><p className="mt-4 text-slate-400">Syncing with Supabase...</p></div>;
    if (showDbSetup) return <div className="p-8 text-center text-red-400">Database setup required. Check instructions in original script.</div>;
    if (!currentUser) return <LoginPage onLogin={handleLogin} error={error} />;

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
                  onSeedData={handleSeedData}
                />;
      case UserRole.TEACHER:
        if(currentInstitution){
           return <InstitutionPortal 
                    currentUser={currentUser}
                    institution={currentInstitution} 
                    usersInInstitution={users.filter(u => u.institutionId === currentInstitution.id)}
                    savedExams={savedExams.filter(e => e.institutionId === currentInstitution.id)}
                    announcements={announcements} 
                    onAddUser={(username, password) => handleAddUser(username, password, currentInstitution.id)}
                    onDeleteUser={handleDeleteUser}
                    onSaveExam={handleSaveExam}
                    onDeleteSavedExam={handleDeleteSavedExam}
                    onUpdateCredentials={handleUpdateUserCredentials}
                  />;
        }
        return <div className="text-center p-8">Institution not linked. Contact admin.</div>;
      default: return <div>Unknown role.</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-amber-50 font-sans">
      <header className="bg-slate-800 border-b border-slate-700/50 sticky top-0 z-50 backdrop-blur-md bg-slate-800/80">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={() => window.location.reload()}>
              <Logo className="h-10 w-10" />
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-amber-400 to-amber-200">Examify</h1>
            </div>
            {currentUser && (
               <div className="flex items-center space-x-4">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest">{currentUser.role.replace('_', ' ')}</span>
                    <span className="text-sm font-medium text-slate-300">{currentUser.username}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 text-sm font-bold text-slate-900 bg-amber-400 rounded-xl hover:bg-amber-300 transition-all shadow-lg shadow-amber-500/10 active:scale-95"
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
