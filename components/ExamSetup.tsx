
import React, { useState, useMemo, useRef } from 'react';
import { ExamParameters, QuestionDistribution, QuestionType } from '../types';
import { DIFFICULTY_LEVELS, EXAM_TYPES, QUESTION_TYPE_LABELS } from '../constants';
import Loader from './Loader';

// Declare global variables for libraries loaded via CDN
declare var mammoth: any;
declare var pdfjsLib: any;
declare var JSZip: any;

interface ExamSetupProps {
    onGenerate: (material: string, params: ExamParameters) => void;
    isLoading: boolean;
    error: string | null;
}

const ExamSetup: React.FC<ExamSetupProps> = ({ onGenerate, isLoading, error }) => {
    const [material, setMaterial] = useState('');
    const [examType, setExamType] = useState(EXAM_TYPES[0]);
    const [courseName, setCourseName] = useState('');
    const [duration, setDuration] = useState<number | undefined>(60);
    const [difficulty, setDifficulty] = useState(DIFFICULTY_LEVELS[1]);
    const [questionDistribution, setQuestionDistribution] = useState<QuestionDistribution>({
        [QuestionType.MCQ]: 5,
        [QuestionType.TRUE_FALSE]: 5,
        [QuestionType.MATCHING]: 0,
        [QuestionType.SHORT_ANSWER]: 0,
        [QuestionType.ESSAY]: 0,
    });
    const [fileName, setFileName] = useState<string | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [isParsing, setIsParsing] = useState(false); // State for file parsing
    const fileInputRef = useRef<HTMLInputElement>(null);

    const totalQuestions = useMemo(() => {
        return Object.values(questionDistribution).reduce((sum: number, count: number) => sum + count, 0);
    }, [questionDistribution]);

    const handleDistributionChange = (type: QuestionType, value: string) => {
        const count = parseInt(value, 10);
        if (!isNaN(count) && count >= 0) {
            setQuestionDistribution(prev => ({ ...prev, [type]: count }));
        }
    };

    // --- File Parsing Logic ---

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
            // Using `any` type for item as pdf.js types are not available globally
            fullText += textContent.items.map((item: any) => item.str).join(' ') + '\n';
        }
        return fullText;
    };

    const parsePptx = async (file: File): Promise<string> => {
        const arrayBuffer = await file.arrayBuffer();
        const zip = await JSZip.loadAsync(arrayBuffer);
        const slidePromises: Promise<string>[] = [];
        
        // Find slide XML files
        zip.folder("ppt/slides")?.forEach((relativePath, zipEntry) => {
            if (zipEntry.name.endsWith('.xml') && zipEntry.name.includes('ppt/slides/slide')) {
                slidePromises.push(zipEntry.async('string'));
            }
        });

        const slideXmls = await Promise.all(slidePromises);
        let fullText = '';
        
        slideXmls.forEach(xml => {
            // Basic XML parsing with regex to extract text from <a:t> tags
            const textNodes = xml.match(/<a:t.*?>(.*?)<\/a:t>/g) || [];
            const slideText = textNodes.map(node => node.replace(/<.*?>/g, '').trim()).join(' ');
            fullText += slideText + '\n\n';
        });
        
        return fullText.trim();
    };

    const handleFile = async (files: FileList | null) => {
        if (!files || files.length === 0) return;
        const file = files[0];
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        
        setFileName(file.name);
        setIsParsing(true);
        setMaterial('');

        try {
            let text = '';
            switch (fileExtension) {
                case 'txt':
                    text = await file.text();
                    break;
                case 'docx':
                    text = await parseDocx(file);
                    break;
                case 'pdf':
                    text = await parsePdf(file);
                    break;
                case 'pptx':
                    text = await parsePptx(file);
                    break;
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        handleFile(e.target.files);
    };
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
        handleFile(e.dataTransfer.files);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!material.trim()) {
            alert('Please provide or upload course material.');
            return;
        }
        if (totalQuestions === 0) {
            alert('Please specify at least one question to generate.');
            return;
        }
        onGenerate(material, {
            examType,
            courseName,
            duration,
            difficulty,
            questionDistribution,
        });
    };
    
    const clearFile = () => {
        setMaterial('');
        setFileName(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left Column: Course Material */}
                 <div
                    className={`bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700 transition-all duration-300 ${isDragging ? 'ring-2 ring-amber-500' : ''}`}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                >
                    <h2 className="text-xl font-semibold text-amber-400 mb-4">1. Course Material</h2>
                    
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept=".docx,.pdf,.pptx,.txt"
                    />

                    <div 
                        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer hover:border-amber-500 transition-colors duration-200 ${isDragging ? 'border-amber-600 bg-amber-900/20' : 'border-slate-600'}`}
                        onClick={() => fileInputRef.current?.click()}
                    >
                        <svg className="mx-auto h-12 w-12 text-slate-500" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="mt-2 text-sm text-slate-400">
                            <span className="font-medium text-amber-400">
                                Click to upload a file
                            </span>
                            {' '}or drag and drop
                        </p>
                        <p className="text-xs text-slate-500">DOCX, PDF, PPTX, or TXT files</p>
                    </div>

                    {fileName && (
                        <div className="mt-4 flex items-center justify-between bg-slate-700 p-2 rounded-md border border-slate-600">
                            <p className="text-sm font-medium text-slate-300 truncate flex-1 mr-2">{fileName}</p>
                            {isParsing ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 rounded-full animate-spin border-2 border-dashed border-amber-500 border-t-transparent"></div>
                                    <span className="text-xs text-slate-400">Parsing...</span>
                                </div>
                            ) : (
                                <button
                                    type="button"
                                    onClick={clearFile}
                                    className="text-slate-500 hover:text-red-500 focus:outline-none"
                                    aria-label="Remove file"
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            )}
                        </div>
                    )}

                    <div className="relative my-4">
                        <div className="absolute inset-0 flex items-center" aria-hidden="true">
                            <div className="w-full border-t border-slate-700" />
                        </div>
                        <div className="relative flex justify-center">
                            <span className="bg-slate-800 px-2 text-sm text-slate-500">Or</span>
                        </div>
                    </div>

                    <textarea
                        value={material}
                        onChange={(e) => {
                            setMaterial(e.target.value);
                             if (fileName) {
                                setFileName(null);
                                if (fileInputRef.current) fileInputRef.current.value = "";
                            }
                        }}
                        placeholder={isParsing ? "Parsing file..." : "Paste text here or upload a file above..."}
                        className="w-full h-64 p-3 border border-slate-600 bg-slate-700 rounded-md focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition duration-150 ease-in-out text-sm text-amber-50 disabled:bg-slate-700/50"
                        required
                        disabled={isParsing}
                    />
                </div>

                {/* Right Column: Exam Parameters */}
                <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                    <h2 className="text-xl font-semibold text-amber-400 mb-4">2. Exam Parameters</h2>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="courseName" className="block text-sm font-medium text-slate-300">Course Name</label>
                                <input type="text" id="courseName" value={courseName} onChange={e => setCourseName(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" required />
                            </div>
                            <div>
                                <label htmlFor="examType" className="block text-sm font-medium text-slate-300">Exam Type</label>
                                <select id="examType" value={examType} onChange={e => setExamType(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                    {EXAM_TYPES.map(type => <option key={type} value={type}>{type}</option>)}
                                </select>
                            </div>
                            <div>
                                <label htmlFor="duration" className="block text-sm font-medium text-slate-300">Duration (Minutes)</label>
                                <input type="number" id="duration" value={duration || ''} onChange={e => setDuration(e.target.value ? parseInt(e.target.value) : undefined)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm" />
                            </div>
                            <div>
                                <label htmlFor="difficulty" className="block text-sm font-medium text-slate-300">Difficulty Level</label>
                                <select id="difficulty" value={difficulty} onChange={e => setDifficulty(e.target.value)} className="mt-1 block w-full border border-slate-600 bg-slate-700 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm">
                                    {DIFFICULTY_LEVELS.map(level => <option key={level} value={level}>{level}</option>)}
                                </select>
                            </div>
                        </div>
                        
                        <div>
                           <h3 className="text-lg font-medium text-slate-200 mb-2">Question Distribution</h3>
                           <div className="grid grid-cols-2 md:grid-cols-3 gap-4 p-4 border border-slate-700 rounded-md bg-slate-700/50">
                                {Object.values(QuestionType).map(type => (
                                    <div key={type}>
                                        <label htmlFor={`dist_${type}`} className="block text-sm font-medium text-slate-400">{QUESTION_TYPE_LABELS[type]}</label>
                                        <input
                                            type="number"
                                            id={`dist_${type}`}
                                            min="0"
                                            value={questionDistribution[type]}
                                            onChange={e => handleDistributionChange(type, e.target.value)}
                                            className="mt-1 block w-full border border-slate-600 bg-slate-900 rounded-md shadow-sm py-2 px-3 text-amber-50 focus:ring-amber-500 focus:border-amber-500 sm:text-sm"
                                        />
                                    </div>
                                ))}
                                <div className="col-span-full mt-2 text-center">
                                    <p className="text-md font-semibold text-slate-300">Total Questions: {totalQuestions}</p>
                                </div>
                           </div>
                        </div>
                    </div>
                </div>
            </div>

            {error && <div className="mt-6 p-4 bg-red-900/50 border border-red-500/30 text-red-300 rounded-md">{error}</div>}

            <div className="flex justify-center mt-8">
                <button
                    type="submit"
                    disabled={isLoading || isParsing}
                    className="flex items-center justify-center w-full max-w-xs px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-slate-900 bg-amber-500 hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed"
                >
                    {isLoading ? <Loader /> : 'Generate Exam'}
                </button>
            </div>
        </form>
    );
};

export default ExamSetup;
