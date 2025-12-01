
import React, { useState, useRef } from 'react';
import { CourseOutline, ChapterDetails } from '../../types';
import Loader from '../Loader';

// Declare global variables for libraries loaded via CDN
declare var mammoth: any;
declare var pdfjsLib: any;
declare var JSZip: any;

interface HandbookSetupProps {
    onGenerate: (material: string, outline: CourseOutline) => void;
    isLoading: boolean;
    error: string | null;
}

const HandbookSetup: React.FC<HandbookSetupProps> = ({ onGenerate, isLoading, error }) => {
    const [material, setMaterial] = useState('');
    const [courseTitle, setCourseTitle] = useState('');
    const [totalPages, setTotalPages] = useState(10);
    const [numChapters, setNumChapters] = useState(1);
    const [chapters, setChapters] = useState<ChapterDetails[]>([{ id: 1, name: '', pages: 1, subChapters: '' }]);
    
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    
    // --- Dynamic Chapter Handling ---
    const handleNumChaptersChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        let count = parseInt(e.target.value, 10);
        if (isNaN(count) || count < 1) count = 1;
        if (count > 20) count = 20; // Cap at 20 chapters
        
        setNumChapters(count);
        
        const newChapters = Array.from({ length: count }, (_, i) => {
            return chapters[i] || { id: i + 1, name: '', pages: 1, subChapters: '' };
        });
        setChapters(newChapters);
    };

    const handleChapterChange = (id: number, field: keyof Omit<ChapterDetails, 'id'>, value: string | number) => {
        setChapters(prev => prev.map(ch => ch.id === id ? { ...ch, [field]: value } : ch));
    };


    // --- File Parsing Logic (Adapted from ExamSetup) ---
    const parseDocx = (file: File): Promise<string> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (event) => {
                if (event.target?.result) {
                    try {
                        const result = await mammoth.extractRawText({ arrayBuffer: event.target.result });
                        resolve(result.value);
                    } catch (err) {
                        reject(err);
                    }
                } else {
                    reject(new Error("Couldn't read file"));
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    };

    const parsePdf = async (file: File): Promise<string> => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.16.105/pdf.worker.min.js`;
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return fullText;
    };

    const parsePptx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slidePromises: Promise<string>[] = [];
        zip.folder("ppt/slides")?.forEach((_, zipEntry) => {
            if (zipEntry.name.endsWith('.xml') && zipEntry.name.includes('ppt/slides/slide')) {
                slidePromises.push(zipEntry.async('string'));
            }
        });
        const slideXmls = await Promise.all(slidePromises);
        let fullText = '';
        slideXmls.forEach(xml => {
            const textNodes = xml.match(/<a:t.*?>(.*?)<\/a:t>/g) || [];
            const slideText = textNodes.map(node => node.replace(/<.*?>/g, '').trim()).join(' ');
            fullText += slideText + '\n\n';
        });
        return fullText.trim();
    };

    const handleFile = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        setFileName(file.name);
        setIsParsing(true);
        setMaterial('');

        try {
            let text = '';
            const fileExtension = file.name.split('.').pop()?.toLowerCase();
            switch (fileExtension) {
                case 'txt': text = await file.text(); break;
                case 'docx': text = await parseDocx(file); break;
                case 'pdf': text = await parsePdf(file); break;
                case 'pptx': text = await parsePptx(file); break;
                default:
                    alert('Unsupported file type. Please upload a .docx, .pdf, or .pptx file.');
                    setFileName(null);
                    return;
            }
            setMaterial(text);
        } catch (error: any) {
            console.error('Error parsing file:', error);
            alert(`An error occurred while parsing the file: ${error.message}`);
            setFileName(null);
        } finally {
            setIsParsing(false);
        }
    };
    
    // --- Event Handlers ---
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => handleFile(e.target.files);
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); handleFile(e.dataTransfer.files); };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!material.trim()) {
            alert('Please upload reference material.');
            return;
        }
        if (!courseTitle.trim()) {
            alert('Please provide a course title.');
            return;
        }
        const outline: CourseOutline = { courseTitle, totalPages, chapters };
        onGenerate(material, outline);
    };
    
    const clearFile = () => {
        setMaterial('');
        setFileName(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            {/* Top Row: Course Outline */}
            <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <h2 className="text-xl font-semibold text-amber-400 mb-4">1. Course Outline</h2>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label htmlFor="courseTitle" className="block text-sm font-medium text-slate-300">Course Title</label>
                            <input type="text" id="courseTitle" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                        </div>
                        <div>
                            <label htmlFor="totalPages" className="block text-sm font-medium text-slate-300">Approx. Total Pages</label>
                            <input type="number" id="totalPages" value={totalPages} onChange={e => setTotalPages(parseInt(e.target.value) || 1)} min="1" className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                        </div>
                        <div>
                            <label htmlFor="numChapters" className="block text-sm font-medium text-slate-300">Number of Chapters</label>
                            <input type="number" id="numChapters" value={numChapters} onChange={handleNumChaptersChange} min="1" max="20" className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                        </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-700">
                        {chapters.map(ch => (
                            <div key={ch.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start p-3 bg-slate-700/50 rounded-md">
                                <span className="md:col-span-1 text-lg font-bold text-slate-400 pt-2">Ch. {ch.id}</span>
                                <div className="md:col-span-4">
                                    <label className="block text-xs font-medium text-slate-300">Chapter Name</label>
                                    <input type="text" value={ch.name} onChange={e => handleChapterChange(ch.id, 'name', e.target.value)} placeholder={`e.g., Introduction to AI`} className="mt-1 block w-full border border-slate-600 bg-slate-900 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-medium text-slate-300">Page Count</label>
                                    <input type="number" min="1" value={ch.pages} onChange={e => handleChapterChange(ch.id, 'pages', parseInt(e.target.value) || 1)} className="mt-1 block w-full border border-slate-600 bg-slate-900 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                                </div>
                                <div className="md:col-span-5">
                                    <label className="block text-xs font-medium text-slate-300">Sub-Chapters / Topics</label>
                                    <textarea value={ch.subChapters} onChange={e => handleChapterChange(ch.id, 'subChapters', e.target.value)} placeholder="One topic per line..." rows={2} className="mt-1 block w-full border border-slate-600 bg-slate-900 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Row: Reference Material Upload */}
            <div
                className={`bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 transition-all duration-300 ${isDragging ? 'ring-2 ring-amber-500' : ''}`}
                onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}
            >
                <h2 className="text-xl font-semibold text-amber-400 mb-4">2. Reference Material</h2>
                <p className="text-sm text-slate-400 mb-4">Upload the source of truth for the handbook. The AI will ONLY use content from this document.</p>
                <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".docx,.pdf,.pptx,.txt" />

                <div className="flex items-center space-x-4">
                    <div 
                        className="flex-1 border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-amber-500 transition-colors duration-200"
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" /></svg>
                        <p className="mt-2 text-sm text-slate-400"><span className="font-medium text-amber-400">Click to upload</span> or drag and drop</p>
                        <p className="text-xs text-slate-500">DOCX, PDF, PPTX, or TXT</p>
                    </div>

                    <div className="flex-1">
                        {fileName && (
                            <div className="flex items-center justify-between bg-slate-700 p-2 rounded-md border border-slate-600">
                                <p className="text-sm font-medium text-slate-300 truncate flex-1 mr-2">{fileName}</p>
                                {isParsing ? (
                                    <div className="flex items-center space-x-2">
                                        <div className="w-4 h-4 rounded-full animate-spin border-2 border-dashed border-amber-500 border-t-transparent"></div>
                                        <span className="text-xs text-slate-400">Parsing...</span>
                                    </div>
                                ) : (
                                    <button type="button" onClick={clearFile} className="text-slate-500 hover:text-red-500 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" /></svg></button>
                                )}
                            </div>
                        )}
                        {!fileName && <p className="text-sm text-center text-slate-500">No file selected.</p>}
                    </div>
                </div>
            </div>

            {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-500/30 text-red-300 rounded-md">{error}</div>}

            <div className="flex justify-center mt-8">
                <button
                    type="submit"
                    disabled={isLoading || isParsing || !material}
                    className="flex items-center justify-center w-full max-w-xs px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader /> : 'Generate Handbook'}
                </button>
            </div>
        </form>
    );
};

export default HandbookSetup;
