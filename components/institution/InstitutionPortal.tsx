import React, { useState } from 'react';
import { Exam, ExamParameters, Institution, User, Announcement } from '../../types';
import ExamSetup from '../ExamSetup';
import { ExamPreview } from '../ExamPreview';
import { generateExam } from '../../services/geminiService';
import ExamBank from './ExamBank';
import UserManagement from './UserManagement';
import InstitutionAnalytics from './InstitutionAnalytics';

interface InstitutionPortalProps {
    currentUser: User;
    institution: Institution;
    usersInInstitution: User[];
    savedExams: Exam[];
    announcements: Announcement[];
    onAddUser: (username: string, password_provided: string) => void;
    onDeleteUser: (userId: string) => void;
    onSaveExam: (exam: Exam) => void;
    onDeleteSavedExam: (examId: string) => void;
}

const InstitutionPortal: React.FC<InstitutionPortalProps> = ({ 
    currentUser,
    institution, 
    usersInInstitution, 
    savedExams,
    announcements,
    onAddUser,
    onDeleteUser,
    onSaveExam,
    onDeleteSavedExam
}) => {
  const [activeView, setActiveView] = useState<'analytics' | 'generator' | 'bank' | 'users'>('analytics');
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  const [generatorStep, setGeneratorStep] = useState<'setup' | 'preview'>('setup');

  const relevantAnnouncements = announcements.filter(anno => 
    !anno.institutionIds || // It's a global announcement
    anno.institutionIds.length === 0 || // Also global (empty array)
    anno.institutionIds.includes(institution.id) // It's targeted to this institution
  );

  const latestAnnouncement = relevantAnnouncements.length > 0 ? relevantAnnouncements[0] : null;

  const handleGenerateExam = async (material: string, params: ExamParameters) => {
    setIsLoading(true);
    setError(null);
    setCurrentExam(null);
    try {
      const generatedExam = await generateExam(material, params, institution.id, currentUser.id, currentUser.username);
      setCurrentExam(generatedExam);
      setGeneratorStep('preview');
    } catch (e) {
      setError(e instanceof Error ? `Error generating exam: ${e.message}` : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBackToSetup = () => {
    setGeneratorStep('setup');
    setCurrentExam(null);
    setError(null);
  };
  
  const handleUpdateExam = (updatedExam: Exam) => {
    setCurrentExam(updatedExam);
  };

  const handleSaveAndExit = (exam: Exam) => {
    onSaveExam(exam);
    handleBackToSetup();
    alert("Exam saved to bank!");
  };

  const handleLoadExamFromBank = (exam: Exam) => {
    setCurrentExam(exam);
    setGeneratorStep('preview');
    setActiveView('generator');
  };

  const renderActiveView = () => {
    switch(activeView) {
      case 'analytics':
        return <InstitutionAnalytics exams={savedExams} users={usersInInstitution} />;
      case 'generator':
        return generatorStep === 'setup' 
          ? <ExamSetup onGenerate={handleGenerateExam} isLoading={isLoading} error={error} />
          : currentExam && <ExamPreview 
                              exam={currentExam} 
                              institution={institution}
                              onBack={handleBackToSetup} 
                              onUpdateExam={handleUpdateExam}
                              onSaveExam={handleSaveAndExit}
                           />;
      case 'bank':
        return <ExamBank 
                 exams={savedExams} 
                 onDelete={onDeleteSavedExam} 
                 onLoad={handleLoadExamFromBank} 
               />;
      case 'users':
        return <UserManagement 
                 users={usersInInstitution}
                 onAddUser={onAddUser}
                 onDeleteUser={onDeleteUser}
               />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{view: 'analytics' | 'generator' | 'bank' | 'users'; label: string}> = ({ view, label }) => (
    <button
      onClick={() => {
        setActiveView(view);
        if (view !== 'generator') {
            handleBackToSetup(); // Reset generator when switching tabs away from it
        }
      }}
      className={`px-4 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${activeView === view ? 'bg-amber-500 text-slate-900' : 'text-slate-300 hover:bg-slate-600'}`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
        {latestAnnouncement && (
            <div className="bg-sky-900/70 border-l-4 border-sky-500 text-sky-200 p-4 rounded-md shadow-sm flex items-start space-x-3" role="alert">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-sky-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold text-sky-300">{latestAnnouncement.title}</p>
                  <p className="text-sm">{latestAnnouncement.content}</p>
                </div>
            </div>
        )}

        <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700">
            <div className="flex items-center space-x-4">
                {institution.logo && <div className="p-1 bg-white/10 rounded-md"><img src={institution.logo} alt="Logo" className="h-12 w-12 object-contain"/></div>}
                <div>
                    <h2 className="text-xl font-bold text-amber-400">{institution.name}</h2>
                    <p className="text-sm text-slate-400">Exam Generation Suite</p>
                </div>
            </div>
            <div className="flex space-x-2 p-1 bg-slate-700 rounded-lg">
                <TabButton view="analytics" label="Analytics" />
                <TabButton view="generator" label="Exam Generator" />
                <TabButton view="bank" label="Exam Bank" />
                <TabButton view="users" label="User Management" />
            </div>
        </div>

        <div>
            {renderActiveView()}
        </div>
    </div>
  );
};

export default InstitutionPortal;