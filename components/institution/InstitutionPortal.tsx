import React, { useState } from 'react';
import { Exam, ExamParameters, Institution, User, Announcement, CourseOutline } from '../../types';
import ExamSetup from '../ExamSetup';
import { ExamPreview } from '../ExamPreview';
import { generateExam } from '../../services/geminiService';
import { generateHandbook } from '../../services/handbookService';
import ExamBank from './ExamBank';
import UserManagement from './UserManagement';
import InstitutionAnalytics from './InstitutionAnalytics';
import ProfileSettings from '../superadmin/ProfileSettings';
import HandbookSetup from './HandbookSetup';
import HandbookPreview from './HandbookPreview';

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
    onUpdateCredentials: (userId: string, newUsername: string, newPassword_provided: string) => void;
}

type ActiveView = 'analytics' | 'exam_generator' | 'handbook_generator' | 'bank' | 'users' | 'profile';


const InstitutionPortal: React.FC<InstitutionPortalProps> = ({ 
    currentUser,
    institution, 
    usersInInstitution, 
    savedExams,
    announcements,
    onAddUser,
    onDeleteUser,
    onSaveExam,
    onDeleteSavedExam,
    onUpdateCredentials
}) => {
  const [activeView, setActiveView] = useState<ActiveView>('analytics');
  
  // Exam Generator State
  const [currentExam, setCurrentExam] = useState<Exam | null>(null);
  const [examIsLoading, setExamIsLoading] = useState<boolean>(false);
  const [examError, setExamError] = useState<string | null>(null);
  const [generatorStep, setGeneratorStep] = useState<'setup' | 'preview'>('setup');
  // New state to hold source material for the "Magic Wand" feature
  const [currentMaterial, setCurrentMaterial] = useState<string>('');

  // Handbook Generator State
  const [handbookContent, setHandbookContent] = useState<string | null>(null);
  const [handbookIsLoading, setHandbookIsLoading] = useState<boolean>(false);
  const [handbookError, setHandbookError] = useState<string | null>(null);
  const [handbookStep, setHandbookStep] = useState<'setup' | 'preview'>('setup');
  const [generationStatus, setGenerationStatus] = useState({ current: 0, total: 0 });


  const relevantAnnouncements = announcements.filter(anno => 
    !anno.institutionIds || // It's a global announcement
    anno.institutionIds.length === 0 || // Also global (empty array)
    anno.institutionIds.includes(institution.id) // It's targeted to this institution
  );

  const latestAnnouncement = relevantAnnouncements.length > 0 ? relevantAnnouncements[0] : null;

  // --- Exam Generation Handlers ---
  const handleGenerateExam = async (material: string, params: ExamParameters) => {
    setExamIsLoading(true);
    setExamError(null);
    setCurrentExam(null);
    setCurrentMaterial(material); // Store material for regeneration context

    try {
      const generatedExam = await generateExam(material, params, institution.id, currentUser.id, currentUser.username);
      setCurrentExam(generatedExam);
      setGeneratorStep('preview');
    } catch (e) {
      setExamError(e instanceof Error ? `Error generating exam: ${e.message}` : 'An unknown error occurred.');
      console.error(e);
    } finally {
      setExamIsLoading(false);
    }
  };

  const handleBackToExamSetup = () => {
    setGeneratorStep('setup');
    setCurrentExam(null);
    setExamError(null);
    setCurrentMaterial('');
  };
  
  const handleUpdateExam = (updatedExam: Exam) => {
    setCurrentExam(updatedExam);
  };

  const handleSaveAndExit = (exam: Exam) => {
    onSaveExam(exam);
    handleBackToExamSetup();
    alert("Exam saved to bank!");
  };

  const handleLoadExamFromBank = (exam: Exam) => {
    setCurrentExam(exam);
    setGeneratorStep('preview');
    setActiveView('exam_generator');
    // Note: Loaded exams won't have 'currentMaterial' context for regeneration unless we save material to DB too.
    // For now, we leave it empty, which means regeneration might be less context-aware or disabled.
    setCurrentMaterial(''); 
  };

  // --- Handbook Generation Handlers ---
  const handleGenerateHandbook = async (material: string, outline: CourseOutline) => {
    setHandbookIsLoading(true);
    setHandbookError(null);
    setHandbookContent('');
    setGenerationStatus({ current: 0, total: outline.chapters.length });
    setHandbookStep('preview');

    try {
        await generateHandbook(
            material,
            outline,
            (chunk) => setHandbookContent(prev => (prev || '') + chunk),
            (current, total) => setGenerationStatus({ current, total })
        );
    } catch (e) {
        setHandbookError(e instanceof Error ? `Error generating handbook: ${e.message}` : 'An unknown error occurred.');
        console.error(e);
    } finally {
        setHandbookIsLoading(false);
    }
  };
  
  const handleBackToHandbookSetup = () => {
      setHandbookStep('setup');
      setHandbookContent(null);
      setHandbookError(null);
      setGenerationStatus({ current: 0, total: 0 });
  }

  // --- View Rendering ---
  const renderActiveView = () => {
    switch(activeView) {
      case 'analytics':
        return <InstitutionAnalytics exams={savedExams} users={usersInInstitution} />;
      case 'exam_generator':
        return generatorStep === 'setup' 
          ? <ExamSetup onGenerate={handleGenerateExam} isLoading={examIsLoading} error={examError} />
          : currentExam && <ExamPreview 
                              exam={currentExam} 
                              institution={institution}
                              onBack={handleBackToExamSetup} 
                              onUpdateExam={handleUpdateExam}
                              onSaveExam={handleSaveAndExit}
                              sourceMaterial={currentMaterial}
                           />;
      case 'handbook_generator':
          if (!institution.handbookGenerationEnabled) return null;
          return handbookStep === 'setup'
            ? <HandbookSetup onGenerate={handleGenerateHandbook} isLoading={handbookIsLoading} error={handbookError} />
            : <HandbookPreview 
                content={handbookContent || ''} 
                onBack={handleBackToHandbookSetup}
                generationStatus={generationStatus}
                isLoading={handbookIsLoading}
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
      case 'profile':
        return <ProfileSettings user={currentUser} onUpdateCredentials={onUpdateCredentials} />;
      default:
        return null;
    }
  };

  const TabButton: React.FC<{view: ActiveView; label: string}> = ({ view, label }) => (
    <button
      onClick={() => {
        setActiveView(view);
        if (view !== 'exam_generator') {
            handleBackToExamSetup(); // Reset exam generator when switching away
        }
        if (view !== 'handbook_generator') {
            handleBackToHandbookSetup(); // Reset handbook generator when switching away
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
                    <p className="text-sm text-slate-400">Generation Suite</p>
                </div>
            </div>
            <div className="flex flex-wrap justify-end space-x-2 p-1 bg-slate-700 rounded-lg">
                <TabButton view="analytics" label="Analytics" />
                <TabButton view="exam_generator" label="Exam Generator" />
                {institution.handbookGenerationEnabled && <TabButton view="handbook_generator" label="Handbook Generator" />}
                <TabButton view="bank" label="Exam Bank" />
                <TabButton view="users" label="User Management" />
                <TabButton view="profile" label="Profile" />
            </div>
        </div>

        <div>
            {renderActiveView()}
        </div>
    </div>
  );
};

export default InstitutionPortal;