
import React, { useState } from 'react';
import { Announcement, Institution } from '../../types';

interface AnnouncementsProps {
    announcements: Announcement[];
    institutions: Institution[];
    onCreateAnnouncement: (title: string, content: string, institutionIds?: string[]) => void;
}

const Announcements: React.FC<AnnouncementsProps> = ({ announcements, institutions, onCreateAnnouncement }) => {
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [message, setMessage] = useState('');
    const [targetScope, setTargetScope] = useState<'all' | 'specific'>('all');
    const [selectedInstitutions, setSelectedInstitutions] = useState<string[]>([]);

    const handleCheckboxChange = (instId: string) => {
        setSelectedInstitutions(prev => 
            prev.includes(instId) 
                ? prev.filter(id => id !== instId)
                : [...prev, instId]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || !content.trim()) {
            setMessage('Title and content cannot be empty.');
            return;
        }

        let finalInstitutionIds: string[] | undefined = undefined;
        if (targetScope === 'specific') {
            if (selectedInstitutions.length === 0) {
                setMessage('Please select at least one institution.');
                return;
            }
            finalInstitutionIds = selectedInstitutions;
        }

        onCreateAnnouncement(title, content, finalInstitutionIds);
        
        // Reset form
        setTitle('');
        setContent('');
        setTargetScope('all');
        setSelectedInstitutions([]);
        setMessage('Announcement posted successfully!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="space-y-8">
            <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Create Announcement</h3>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="anno-title" className="block text-sm font-medium text-slate-300">Title</label>
                        <input
                            type="text"
                            id="anno-title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                        />
                    </div>
                    <div>
                        <label htmlFor="anno-content" className="block text-sm font-medium text-slate-300">Content</label>
                        <textarea
                            id="anno-content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={4}
                            className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                        />
                    </div>
                    
                    {/* --- Target Audience Selection --- */}
                    <fieldset className="space-y-2">
                        <legend className="text-sm font-medium text-slate-300">Audience</legend>
                        <div className="flex items-center space-x-4">
                             <div className="flex items-center">
                                <input id="scope-all" name="scope" type="radio" value="all" checked={targetScope === 'all'} onChange={() => setTargetScope('all')} className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-slate-500 bg-slate-700" />
                                <label htmlFor="scope-all" className="ml-2 block text-sm text-slate-300">All Institutions</label>
                            </div>
                            <div className="flex items-center">
                                <input id="scope-specific" name="scope" type="radio" value="specific" checked={targetScope === 'specific'} onChange={() => setTargetScope('specific')} className="focus:ring-amber-500 h-4 w-4 text-amber-600 border-slate-500 bg-slate-700" />
                                <label htmlFor="scope-specific" className="ml-2 block text-sm text-slate-300">Specific Institutions</label>
                            </div>
                        </div>
                    </fieldset>

                    {targetScope === 'specific' && (
                        <div className="border border-slate-700 p-4 rounded-md max-h-48 overflow-y-auto bg-slate-900">
                            <p className="text-sm font-medium text-slate-300 mb-2">Select Institutions</p>
                            <div className="space-y-2">
                                {institutions.map(inst => (
                                    <div key={inst.id} className="flex items-center">
                                        <input
                                            id={`inst-${inst.id}`}
                                            type="checkbox"
                                            checked={selectedInstitutions.includes(inst.id)}
                                            onChange={() => handleCheckboxChange(inst.id)}
                                            className="h-4 w-4 text-amber-600 border-slate-500 rounded focus:ring-amber-500 bg-slate-700"
                                        />
                                        <label htmlFor={`inst-${inst.id}`} className="ml-2 text-sm text-slate-300">{inst.name}</label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}


                    <div className="flex justify-end">
                        <button type="submit" className="px-6 py-2 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-amber-500">
                            Post Announcement
                        </button>
                    </div>
                </form>
                {message && <p className="mt-3 text-sm text-green-400">{message}</p>}
            </div>

            <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Recent Announcements</h3>
                <div className="space-y-4">
                    {announcements.length > 0 ? announcements.map(anno => (
                        <div key={anno.id} className="p-4 border border-slate-700 rounded-md bg-slate-700/50">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="font-bold text-slate-200">{anno.title}</p>
                                    <p className="text-sm text-slate-400 mt-1">{anno.content}</p>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${!anno.institutionIds || anno.institutionIds.length === 0 ? 'bg-sky-900 text-sky-300' : 'bg-yellow-900 text-yellow-300'}`}>
                                    {!anno.institutionIds || anno.institutionIds.length === 0 ? 'Global' : 'Targeted'}
                                </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-2">{new Date(anno.createdAt).toLocaleString()}</p>
                        </div>
                    )) : (
                        <p className="text-sm text-slate-500">No announcements have been posted.</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Announcements;
