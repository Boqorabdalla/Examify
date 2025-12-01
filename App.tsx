
import React, { useState, useEffect } from 'react';
import { Exam, Institution, User, UserRole, InstitutionStatus, Announcement } from './types';
import LoginPage from './components/auth/LoginPage';
import SuperAdminDashboard from './components/superadmin/SuperAdminDashboard';
import InstitutionPortal from './components/institution/InstitutionPortal';
import { supabase } from './services/supabaseClient';
import Loader from './components/Loader';
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
    creatorId: e.creator_id,
    creatorUsername: e.creator_username,
    courseName: e.course_name,
    examType: e.exam_type,
    duration: e.duration,
    questions: e.questions || [],
  });

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
          // Check for "relation does not exist" or "schema cache" which means tables haven't been created
          if (errors.some(e => e.includes('does not exist') || e.includes('schema cache') || e.includes('Could not find the table'))) {
            setShowDbSetup(true);
            setError("Database tables are missing. Please run the setup script.");
          } else {
            setError(`Failed to load data: ${errors[0]}`);
          }
        }

        if (instRes.data) setInstitutions(instRes.data.map(mapInstitution));
        if (userRes.data) setUsers(userRes.data.map(mapUser));
        if (examRes.data) setSavedExams(examRes.data.map(mapExam));
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
    // Note: In a production app, auth should be handled via supabase.auth.signInWithPassword
    // This maintains the existing logic of checking the fetched users table.
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
        // 1. Institutions
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

        // 2. Users (Skip Super Admin to preserve SQL script default or current password)
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

        // Refresh Page to load new data
        window.location.reload(); 

    } catch(e: any) {
        console.error("Seeding error:", e);
        setError("Failed to seed data: " + e.message);
        setIsLoading(false);
    }
  };

  // --- User Credential Management ---
  const handleUpdateUserCredentials = async (userId: string, newUsername: string, newPassword_provided: string) => {
    try {
        const { error } = await supabase
            .from('users')
            .update({ username: newUsername, password: newPassword_provided })
            .eq('id', userId);
        
        if (error) throw error;

        setUsers(prev => prev.map(user => 
            user.id === userId ? { ...user, username: newUsername, password: newPassword_provided } : user
        ));
        
        if (currentUser?.id === userId) {
            setCurrentUser(prev => prev ? { ...prev, username: newUsername, password: newPassword_provided } : null);
        }
    } catch (e: any) {
        console.error("Error updating credentials:", e);
        alert(`Failed to update credentials: ${e.message}`);
    }
  };

  // --- Super Admin: Institution CRUD ---
  const handleRegisterInstitution = async (
    name: string,
    username: string,
    password_provided: string,
    details: { type: string; staffName: string; phone: string; location: string; handbookEnabled: boolean; }
  ) => {
    const newInstitution: Institution = {
      id: `inst_${Date.now()}`,
      name,
      status: InstitutionStatus.ACTIVE,
      type: details.type,
      staffName: details.staffName,
      phone: details.phone,
      location: details.location,
      handbookGenerationEnabled: details.handbookEnabled,
    };
    const newUser: User = {
      id: `user_${Date.now()}`,
      username: username,
      password: password_provided,
      role: UserRole.TEACHER,
      institutionId: newInstitution.id,
    };

    try {
        // Insert Institution
        const { error: instError } = await supabase.from('institutions').insert([{
            id: newInstitution.id,
            name: newInstitution.name,
            status: newInstitution.status,
            type: newInstitution.type,
            staff_name: newInstitution.staffName,
            phone: newInstitution.phone,
            location: newInstitution.location,
            handbook_enabled: newInstitution.handbookGenerationEnabled,
            logo: newInstitution.logo || null
        }]);

        if (instError) throw instError;

        // Insert User
        const { error: userError } = await supabase.from('users').insert([{
            id: newUser.id,
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
            institution_id: newUser.institutionId
        }]);

        if (userError) throw userError;

        setInstitutions(prev => [...prev, newInstitution]);
        setUsers(prev => [...prev, newUser]);

    } catch (e: any) {
        console.error("Error registering institution:", e);
        alert(`Failed to register institution: ${e.message}`);
    }
  };
  
  const handleUpdateInstitution = async (instId: string, updatedData: Partial<Institution>) => {
    try {
        const dbUpdates: any = {};
        if (updatedData.name) dbUpdates.name = updatedData.name;
        if (updatedData.type) dbUpdates.type = updatedData.type;
        if (updatedData.staffName) dbUpdates.staff_name = updatedData.staffName;
        if (updatedData.phone) dbUpdates.phone = updatedData.phone;
        if (updatedData.location) dbUpdates.location = updatedData.location;
        if (updatedData.logo) dbUpdates.logo = updatedData.logo;
        if (updatedData.handbookGenerationEnabled !== undefined) dbUpdates.handbook_enabled = updatedData.handbookGenerationEnabled;
        if (updatedData.status) dbUpdates.status = updatedData.status;

        const { error } = await supabase.from('institutions').update(dbUpdates).eq('id', instId);
        if (error) throw error;

        setInstitutions(prev => prev.map(inst => inst.id === instId ? { ...inst, ...updatedData } : inst));
    } catch (e: any) {
        console.error("Error updating institution:", e);
        alert(`Failed to update institution: ${e.message}`);
    }
  };

  const handleDeleteInstitution = async (instId: string) => {
    try {
        // 1. Delete associated users
        await supabase.from('users').delete().eq('institution_id', instId);
        // 2. Delete associated exams
        await supabase.from('exams').delete().eq('institution_id', instId);
        // 3. Delete institution
        const { error } = await supabase.from('institutions').delete().eq('id', instId);

        if (error) throw error;

        setInstitutions(prev => prev.filter(inst => inst.id !== instId));
        setUsers(prev => prev.filter(u => u.institutionId !== instId));
        setSavedExams(prev => prev.filter(e => e.institutionId !== instId));
    } catch (e: any) {
        console.error("Error deleting institution:", e);
        alert(`Failed to delete institution: ${e.message}`);
    }
  };

  const handleToggleInstitutionStatus = async (instId: string) => {
    const inst = institutions.find(i => i.id === instId);
    if (!inst) return;
    const newStatus = inst.status === InstitutionStatus.ACTIVE ? InstitutionStatus.SUSPENDED : InstitutionStatus.ACTIVE;
    
    try {
        const { error } = await supabase.from('institutions').update({ status: newStatus }).eq('id', instId);
        if (error) throw error;

        setInstitutions(prev => prev.map(i => 
            i.id === instId ? { ...i, status: newStatus } : i
        ));
    } catch (e) {
        console.error("Error toggling status:", e);
    }
  };

  // --- Super Admin: Announcements ---
  const handleCreateAnnouncement = async (title: string, content: string, institutionIds?: string[]) => {
    const newAnnouncement: Announcement = {
      id: `anno_${Date.now()}`,
      title,
      content,
      createdAt: new Date().toISOString(),
      institutionIds,
    };

    try {
        const { error } = await supabase.from('announcements').insert([{
            id: newAnnouncement.id,
            title: newAnnouncement.title,
            content: newAnnouncement.content,
            created_at: newAnnouncement.createdAt,
            institution_ids: newAnnouncement.institutionIds || null
        }]);

        if (error) throw error;
        setAnnouncements(prev => [newAnnouncement, ...prev]);
    } catch (e: any) {
        console.error("Error creating announcement:", e);
        alert(`Failed to create announcement: ${e.message}`);
    }
  };
  
  // --- Institution Portal: User Management ---
  const handleAddUser = async (username: string, password_provided: string, institutionId: string) => {
    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password: password_provided,
      role: UserRole.TEACHER,
      institutionId,
    };

    try {
        const { error } = await supabase.from('users').insert([{
            id: newUser.id,
            username: newUser.username,
            password: newUser.password,
            role: newUser.role,
            institution_id: newUser.institutionId
        }]);
        if (error) throw error;
        setUsers(prev => [...prev, newUser]);
    } catch (e: any) {
        console.error("Error adding user:", e);
        alert(`Failed to add user: ${e.message}`);
    }
  };
  
  const handleDeleteUser = async (userId: string) => {
    try {
        const { error } = await supabase.from('users').delete().eq('id', userId);
        if (error) throw error;
        setUsers(prev => prev.filter(u => u.id !== userId));
    } catch (e: any) {
        console.error("Error deleting user:", e);
        alert(`Failed to delete user: ${e.message}`);
    }
  };

  // --- Institution Portal: Exam Bank ---
  const handleSaveExam = async (exam: Exam) => {
    try {
        // Check if exists locally to decide insert vs update (simple optimization)
        const exists = savedExams.some(e => e.id === exam.id);
        const examData = {
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
            const { error } = await supabase.from('exams').update(examData).eq('id', exam.id);
            if (error) throw error;
             setSavedExams(prev => prev.map(e => e.id === exam.id ? exam : e));
        } else {
            const { error } = await supabase.from('exams').insert([examData]);
            if (error) throw error;
             setSavedExams(prev => [...prev, exam]);
        }
    } catch (e: any) {
        console.error("Error saving exam:", e);
        alert(`Failed to save exam: ${e.message}`);
    }
  };

  const handleDeleteSavedExam = async (examId: string) => {
    try {
        const { error } = await supabase.from('exams').delete().eq('id', examId);
        if (error) throw error;
        setSavedExams(prev => prev.filter(e => e.id !== examId));
    } catch (e: any) {
        console.error("Error deleting exam:", e);
        alert(`Failed to delete exam: ${e.message}`);
    }
  };
  
  const currentInstitution = institutions.find(inst => inst.id === currentUser?.institutionId);

  const renderDbSetup = () => (
    <div className="flex flex-col items-center justify-center min-h-[80vh] p-4 text-center">
        <div className="bg-slate-800 p-8 rounded-lg shadow-xl border border-slate-700 max-w-4xl w-full text-left">
            <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mr-2 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Database Setup Required
            </h2>
            <p className="text-slate-300 mb-4">
                The application connected to Supabase, but the required tables were not found. 
                Please run the following SQL script in your <a href="https://supabase.com/dashboard/project/qyjjowlejuonyfexrgly/sql/new" target="_blank" rel="noreferrer" className="text-blue-400 underline hover:text-blue-300">Supabase SQL Editor</a> to initialize the database.
            </p>

            <div className="bg-slate-900 p-4 rounded-md border border-slate-700 overflow-auto max-h-96 relative group">
                <button 
                    onClick={() => {
                        const code = document.getElementById('sql-code')?.innerText;
                        if(code) navigator.clipboard.writeText(code);
                        alert("SQL copied to clipboard!");
                    }}
                    className="absolute top-4 right-4 px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold rounded shadow-sm z-10"
                >
                    Copy SQL
                </button>
                <pre id="sql-code" className="text-xs sm:text-sm font-mono text-green-400 whitespace-pre-wrap">
{`-- 1. Create Institutions Table
create table if not exists public.institutions (
  id text primary key,
  name text not null,
  logo text,
  status text not null,
  type text,
  staff_name text,
  phone text,
  location text,
  handbook_enabled boolean default false
);

-- 2. Create Users Table
create table if not exists public.users (
  id text primary key,
  username text not null unique,
  password text not null,
  role text not null,
  institution_id text references public.institutions(id)
);

-- 3. Create Exams Table
create table if not exists public.exams (
  id text primary key,
  institution_id text references public.institutions(id),
  creator_id text,
  creator_username text,
  course_name text,
  exam_type text,
  duration int,
  questions jsonb
);

-- 4. Create Announcements Table
create table if not exists public.announcements (
  id text primary key,
  title text not null,
  content text not null,
  created_at timestamptz default now(),
  institution_ids text[]
);

-- 5. Create Default Super Admin (Login: superadmin / password)
insert into public.users (id, username, password, role)
values ('user_super', 'superadmin', 'password', 'SUPER_ADMIN')
on conflict (id) do nothing;
`}
                </pre>
            </div>

            <div className="mt-8 flex justify-end">
                 <button 
                    onClick={() => window.location.reload()} 
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-900 font-bold rounded-md shadow-lg transform transition hover:scale-105"
                >
                    I have run the script - Reload App
                </button>
            </div>
        </div>
    </div>
  );

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
             <Loader />
             <p className="mt-4 text-slate-400">Loading data from Supabase...</p>
        </div>
      );
    }

    if (showDbSetup) {
        return renderDbSetup();
    }

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
        return (
            <div className="flex flex-col items-center justify-center p-8 text-center">
                <div className="text-red-400 text-xl mb-2">Error: Institution Not Found</div>
                <p className="text-slate-400">Your user account is not linked to a valid institution.</p>
                <button onClick={handleLogout} className="mt-4 text-amber-400 hover:underline">Return to Login</button>
            </div>
        );
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
