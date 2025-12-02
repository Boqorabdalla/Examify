
import React, { useState, useEffect, useRef } from 'react';
import { Exam, Question, QuestionType, MCQQuestion, TrueFalseQuestion, ShortAnswerQuestion, EssayQuestion, MatchingQuestion, Institution } from '../types';
import { QUESTION_TYPE_LABELS } from '../constants';
import { regenerateQuestion } from '../services/geminiService';


// This makes html-docx-js and FileSaver available from the global scope
declare var htmlDocx: any;
declare var saveAs: any;
declare var renderMathInElement: any;

interface ExamPreviewProps {
    exam: Exam;
    institution: Institution;
    onBack: () => void;
    onUpdateExam: (exam: Exam) => void;
    onSaveExam: (exam: Exam) => void;
    sourceMaterial?: string; // Optional context for regeneration
}

// --- Math Renderer Component ---
const MathRenderer: React.FC<{ text: string, className?: string, inline?: boolean }> = ({ text, className, inline }) => {
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (containerRef.current && typeof renderMathInElement === 'function') {
            try {
                renderMathInElement(containerRef.current, {
                    delimiters: [
                        {left: '$$', right: '$$', display: true},
                        {left: '$', right: '$', display: false},
                        {left: '\\(', right: '\\)', display: false},
                        {left: '\\[', right: '\\]', display: true}
                    ],
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                console.warn("KaTeX rendering error:", e);
            }
        }
    }, [text]);

    // Simply rendering the text. KaTeX auto-render will find the delimiters inside.
    const Component = inline ? 'span' : 'div';
    // @ts-ignore
    return <Component ref={containerRef} className={className}>{text}</Component>;
};


export const ExamPreview: React.FC<ExamPreviewProps> = ({ exam, institution, onBack, onUpdateExam, onSaveExam, sourceMaterial }) => {
    const [editableExam, setEditableExam] = useState<Exam>(exam);
    
    // Regeneration State
    const [regeneratingQuestionId, setRegeneratingQuestionId] = useState<string | null>(null);
    const [regenerationInstruction, setRegenerationInstruction] = useState('');
    const [isRegenerating, setIsRegenerating] = useState(false);

    const handleQuestionChange = (questionId: string, field: string, value: string | boolean) => {
        const updatedQuestions = editableExam.questions.map(q => {
            if (q.id === questionId) {
                return { ...q, [field]: value };
            }
            return q;
        });
        const updatedExam = { ...editableExam, questions: updatedQuestions };
        setEditableExam(updatedExam);
        onUpdateExam(updatedExam);
    };
    
    const handleOptionChange = (questionId: string, optionIndex: number, value: string) => {
        const updatedQuestions = editableExam.questions.map(q => {
            if (q.id === questionId && q.type === QuestionType.MCQ) {
                const mcq = q as MCQQuestion;
                const oldOptionValue = mcq.options[optionIndex];
                const updatedOptions = [...mcq.options];
                updatedOptions[optionIndex] = value;
                
                // If the edited option was the answer, update the answer field as well
                const newAnswer = mcq.answer === oldOptionValue ? value : mcq.answer;

                return { ...q, options: updatedOptions, answer: newAnswer };
            }
            return q;
        });
        const updatedExam = { ...editableExam, questions: updatedQuestions };
        setEditableExam(updatedExam);
        onUpdateExam(updatedExam);
    };

    const handleDeleteQuestion = (questionId: string) => {
        if (!window.confirm("Are you sure you want to delete this question?")) return;
        const updatedQuestions = editableExam.questions.filter(q => q.id !== questionId);
        const updatedExam = { ...editableExam, questions: updatedQuestions };
        setEditableExam(updatedExam);
        onUpdateExam(updatedExam);
    };

    const handleReshuffle = () => {
        const groupedQuestions = editableExam.questions.reduce((acc, q) => {
            if (!acc[q.type]) {
                acc[q.type] = [];
            }
            acc[q.type].push(q);
            return acc;
        }, {} as Record<QuestionType, Question[]>);

        const shuffledQuestions: Question[] = [];
        Object.values(QuestionType).forEach(type => {
            if (groupedQuestions[type]) {
                const group = groupedQuestions[type];
                for (let i = group.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [group[i], group[j]] = [group[j], group[i]];
                }
                shuffledQuestions.push(...group);
            }
        });
        
        const updatedExam = { ...editableExam, questions: shuffledQuestions };
        setEditableExam(updatedExam);
        onUpdateExam(updatedExam);
    };
    
    // --- Magic Wand Logic ---
    const openRegenerationModal = (q: Question) => {
        setRegeneratingQuestionId(q.id);
        setRegenerationInstruction("Please generate a similar question but with different values/context.");
    };

    const confirmRegenerate = async () => {
        if (!regeneratingQuestionId || !sourceMaterial) return;
        
        const questionToRegenerate = editableExam.questions.find(q => q.id === regeneratingQuestionId);
        if (!questionToRegenerate) return;

        setIsRegenerating(true);
        try {
            const newQuestion = await regenerateQuestion(sourceMaterial, questionToRegenerate, regenerationInstruction);
            
            const updatedQuestions = editableExam.questions.map(q => 
                q.id === regeneratingQuestionId ? newQuestion : q
            );
            
            const updatedExam = { ...editableExam, questions: updatedQuestions };
            setEditableExam(updatedExam);
            onUpdateExam(updatedExam);
            
            // Close modal
            setRegeneratingQuestionId(null);
            setRegenerationInstruction('');
        } catch (error) {
            alert("Failed to regenerate question. Please try again.");
            console.error(error);
        } finally {
            setIsRegenerating(false);
        }
    };


    const generateHtmlContent = (includeAnswers: boolean) => {
        let htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; direction: auto;">
                ${institution.logo ? `<div style="text-align: center; margin-bottom: 20px;"><img src="${institution.logo}" alt="Institution Logo" style="max-height: 100px; max-width: 200px;"/></div>` : ''}
                <h1 style="text-align: center;">${editableExam.courseName}</h1>
                <h2 style="text-align: center;">${editableExam.examType}${includeAnswers ? ' - Answer Key' : ''}</h2>
                ${editableExam.duration ? `<p style="text-align: center;"><strong>Duration:</strong> ${editableExam.duration} minutes</p>` : ''}
                <hr style="margin-bottom: 25px;" />
        `;

        let lastQuestionType: QuestionType | null = null;
        let partCounter = 0;
        const questionCounters: { [key in QuestionType]?: number } = {};

        editableExam.questions.forEach((q) => {
            const isNewPart = q.type !== lastQuestionType;
            if (isNewPart) {
                lastQuestionType = q.type;
                partCounter++;
                questionCounters[q.type] = 1;
                htmlContent += `<h3 style="font-size: 1.2em; font-weight: bold; margin-top: 25px; margin-bottom: 15px; border-bottom: 1px solid #999; padding-bottom: 5px;">Part ${partCounter}: ${QUESTION_TYPE_LABELS[q.type]}</h3>`;
            } else {
                 if(questionCounters[q.type]){
                    questionCounters[q.type]!++;
                 }
            }
            
            const currentQuestionNumber = questionCounters[q.type] || 1;

            htmlContent += `<div style="margin-bottom: 15px; page-break-inside: avoid;">`;
            
            if (includeAnswers) {
                // Answer Key Export
                htmlContent += `<p style="margin-bottom: 5px;"><strong>${currentQuestionNumber}. Question:</strong> ${q.question}</p>`;
                htmlContent += `<p style="margin-bottom: 5px; background-color: #e8f5e9; padding: 5px; border-radius: 4px;"><strong>Answer:</strong> `;
                 switch (q.type) {
                    case QuestionType.MCQ:
                        const mcq = q as MCQQuestion;
                        const index = mcq.options.findIndex(o => o === mcq.answer);
                        const letter = index >= 0 ? String.fromCharCode(97 + index) + '. ' : '';
                        htmlContent += `${letter}${mcq.answer || 'No Answer Selected'}`;
                        break;
                    case QuestionType.TRUE_FALSE:
                        htmlContent += `${(q as TrueFalseQuestion).answer ? 'True' : 'False'}`;
                        break;
                    case QuestionType.MATCHING:
                        const matchQ = q as MatchingQuestion;
                        htmlContent += `</p><ul style="list-style: none; padding-left: 15px; margin-top: 0; background-color: #e8f5e9; padding: 5px; border-radius: 4px;">`;
                        matchQ.answers.forEach(ans => {
                            htmlContent += `<li>${ans.premise} &rarr; ${ans.response}</li>`;
                        });
                        htmlContent += `</ul>`;
                        break;
                    case QuestionType.SHORT_ANSWER:
                    case QuestionType.ESSAY:
                        htmlContent += `${(q as ShortAnswerQuestion | EssayQuestion).answer.replace(/\n/g, '<br>')}`;
                        break;
                }
                 if (q.type !== QuestionType.MATCHING) htmlContent += `</p>`;

            } else {
                // Student Copy Export
                htmlContent += `<p><strong>${currentQuestionNumber}. ${q.question}</strong></p>`;
                switch (q.type) {
                    case QuestionType.MCQ:
                        htmlContent += '<ol type="a" style="margin-left: 20px;">';
                        (q as MCQQuestion).options.forEach(opt => {
                            htmlContent += `<li>${opt}</li>`;
                        });
                        htmlContent += '</ol>';
                        break;
                    case QuestionType.MATCHING:
                        const matchQ = q as MatchingQuestion;
                        htmlContent += `
                            <table style="width: 100%; border-collapse: collapse; margin-top: 10px;">
                                <tr>
                                    <td style="width: 50%; vertical-align: top; padding: 5px;">
                                        <strong>Column A</strong>
                                        <ol style="margin: 0; padding-left: 20px;">
                                            ${matchQ.premises.map(p => `<li>${p}</li>`).join('')}
                                        </ol>
                                    </td>
                                    <td style="width: 50%; vertical-align: top; padding: 5px;">
                                        <strong>Column B</strong>
                                        <ol type="a" style="margin: 0; padding-left: 20px;">
                                            ${matchQ.responses.map(r => `<li>${r}</li>`).join('')}
                                        </ol>
                                    </td>
                                </tr>
                            </table>
                        `;
                        break;
                    case QuestionType.SHORT_ANSWER:
                    case QuestionType.ESSAY:
                        // Add space for writing
                         htmlContent += `<br/><br/><br/>`;
                        break;
                }
            }
            htmlContent += `</div>`;
        });
        
        htmlContent += `</div>`;
        return htmlContent;
    };

    const handleExport = (isAnswerKey: boolean) => {
        const htmlBody = generateHtmlContent(isAnswerKey);
        
        // Wrap in full HTML document structure with UTF-8 charset
        // This is crucial for rendering Arabic and other non-ASCII characters correctly in MS Word.
        const fullHtml = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <title>${editableExam.courseName} - ${isAnswerKey ? 'Answer Key' : 'Exam'}</title>
                <style>
                    body { font-family: 'Arial', sans-serif; line-height: 1.5; }
                </style>
            </head>
            <body>
                ${htmlBody}
            </body>
            </html>
        `;

        const fileName = `${editableExam.courseName}_${editableExam.examType}_${isAnswerKey ? 'AnswerKey' : 'Exam'}.docx`;
        const converted = htmlDocx.asBlob(fullHtml);
        saveAs(converted, fileName);
    };

    const isMath = (text: string) => text.includes('$');

    const renderQuestionEditor = (q: Question) => {
        switch (q.type) {
            case QuestionType.MCQ:
                const mcq = q as MCQQuestion;
                return (
                    <div className="space-y-2 mt-2">
                        {mcq.options.map((option, i) => (
                            <div key={i} className="flex flex-col">
                                <div className="flex items-center">
                                    <span className="mr-2 text-slate-400">{String.fromCharCode(97 + i)}.</span>
                                    <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => handleOptionChange(q.id, i, e.target.value)}
                                        className={`w-full p-1 border-b-2 outline-none transition-colors rounded-l-md bg-transparent text-slate-300 ${option === mcq.answer ? 'bg-green-900/50 border-green-500' : 'border-slate-600 focus:border-amber-400'}`}
                                    />
                                    {option === mcq.answer && (
                                        <div className="bg-green-900/50 p-1 rounded-r-md border-b-2 border-green-500 flex items-center">
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                            </svg>
                                        </div>
                                    )}
                                </div>
                                {/* Math Preview for Options */}
                                {isMath(option) && (
                                    <MathRenderer text={option} className="text-amber-300/80 text-sm ml-6 mb-2 mt-1" />
                                )}
                            </div>
                        ))}
                         <div className="flex items-center pt-2">
                            <strong className="mr-2 text-sm text-green-400">Correct Answer:</strong>
                            <select
                                value={mcq.answer}
                                onChange={(e) => handleQuestionChange(q.id, 'answer', e.target.value)}
                                className="p-1 border border-slate-600 rounded-md shadow-sm focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-slate-700 text-amber-50"
                            >
                                {mcq.options.map((opt, i) => (
                                    <option key={i} value={opt}>{opt}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                );
            case QuestionType.TRUE_FALSE:
                const tf = q as TrueFalseQuestion;
                return (
                    <div className="mt-2">
                        <strong className="mr-2 text-sm text-green-400">Answer:</strong>
                        <select
                            value={String(tf.answer)}
                            onChange={(e) => handleQuestionChange(q.id, 'answer', e.target.value === 'true')}
                             className="p-1 border-b-2 border-slate-600 focus:border-green-500 outline-none bg-transparent"
                        >
                            <option value="true">True</option>
                            <option value="false">False</option>
                        </select>
                    </div>
                );
            case QuestionType.MATCHING:
                const matchQ = q as MatchingQuestion;
                return (
                    <div className="mt-2 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
                        <div>
                            <h4 className="font-semibold text-slate-300 mb-1">Column A (Premises)</h4>
                            <ol className="list-decimal list-inside text-slate-400">
                                {matchQ.premises.map((p, i) => <li key={i} className="p-1"><MathRenderer text={p} inline /></li>)}
                            </ol>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-300 mb-1">Column B (Responses)</h4>
                            <ol className="text-slate-400" style={{ listStyleType: 'lower-alpha', paddingLeft: '1.2em' }}>
                                {matchQ.responses.map((r, i) => <li key={i} className="p-1"><MathRenderer text={r} inline /></li>)}
                            </ol>
                        </div>
                        <div className="col-span-2 mt-2">
                            <strong className="mr-2 text-sm text-green-400">Correct Matches:</strong>
                            <div className="text-sm text-slate-300 mt-1">
                                {matchQ.answers.map((ans, i) => (
                                    <span key={i} className="mr-4 bg-green-900/50 p-1 rounded inline-block mb-1">
                                        <MathRenderer text={ans.premise} inline /> &rarr; <MathRenderer text={ans.response} inline />
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                 const sa = q as ShortAnswerQuestion | EssayQuestion;
                 return (
                    <div className="mt-2">
                        {/* Math Preview for Answer */}
                        {isMath(sa.answer) && (
                            <div className="mb-2 p-2 bg-slate-700/50 rounded border border-slate-600">
                                <span className="text-xs text-slate-400 block mb-1">Answer Preview:</span>
                                <MathRenderer text={sa.answer} className="text-amber-50" />
                            </div>
                        )}
                        <strong className="mr-2 text-sm text-green-400">Answer:</strong>
                        <textarea
                            value={sa.answer}
                            onChange={(e) => handleQuestionChange(q.id, 'answer', e.target.value)}
                            className="w-full p-2 mt-1 border border-slate-600 rounded-md focus:ring-1 focus:ring-green-500 bg-slate-700 text-slate-200"
                            rows={3}
                        />
                    </div>
                 );
        }
    };
    
    let lastQuestionType: QuestionType | null = null;
    let partCounter = 0;
    const questionCounters: { [key in QuestionType]?: number } = {};


    return (
        <div className="relative">
            {/* --- Regeneration Modal --- */}
            {regeneratingQuestionId && (
                <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-xl border border-slate-600 w-full max-w-md p-6">
                        <h3 className="text-xl font-bold text-amber-400 mb-2 flex items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                            </svg>
                            Regenerate Question
                        </h3>
                        <p className="text-slate-300 text-sm mb-4">
                            Provide instructions on how the AI should rewrite this question.
                        </p>
                        <textarea
                            value={regenerationInstruction}
                            onChange={(e) => setRegenerationInstruction(e.target.value)}
                            className="w-full p-2 border border-slate-600 bg-slate-900 rounded-md text-slate-200 text-sm focus:ring-purple-500 focus:border-purple-500 mb-4"
                            rows={3}
                            placeholder="e.g., Make it harder, change the numbers, fix the typo..."
                        />
                        <div className="flex justify-end space-x-2">
                            <button 
                                onClick={() => setRegeneratingQuestionId(null)}
                                className="px-4 py-2 text-slate-400 hover:text-slate-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRegenerate}
                                disabled={isRegenerating}
                                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-md font-medium flex items-center"
                            >
                                {isRegenerating ? 'Working...' : 'Regenerate'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <button onClick={onBack} className="px-4 py-2 text-sm font-medium text-amber-400 bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500">
                    &larr; Back to Setup
                </button>
                 <div className="flex flex-wrap space-x-2">
                    <button onClick={() => onSaveExam(editableExam)} className="px-4 py-2 text-sm font-medium text-slate-900 bg-blue-400 border border-transparent rounded-md shadow-sm hover:bg-blue-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-blue-500">
                        Save to Exam Bank
                    </button>
                    <button onClick={handleReshuffle} className="px-4 py-2 text-sm font-medium text-slate-900 bg-slate-400 border border-transparent rounded-md shadow-sm hover:bg-slate-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-gray-500">
                        Reshuffle
                    </button>
                    <button onClick={() => handleExport(false)} className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-md shadow-sm hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500">
                        Export Exam
                    </button>
                    <button onClick={() => handleExport(true)} className="px-4 py-2 text-sm font-medium text-slate-900 bg-green-500 border border-transparent rounded-md shadow-sm hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-green-500">
                        Export Key
                    </button>
                 </div>
            </div>

            <div id="exam-content" className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700">
                {institution.logo && <div className="text-center mb-6 p-2 bg-white/10 rounded-md inline-block mx-auto"><img src={institution.logo} alt="Institution Logo" className="max-h-24 mx-auto"/></div>}
                <h1 className="text-3xl font-bold text-center mb-2 text-amber-400">{editableExam.courseName}</h1>
                <h2 className="text-xl text-center text-slate-300 mb-4">{editableExam.examType}</h2>
                {editableExam.duration && <p className="text-center text-slate-400 mb-8">Duration: {editableExam.duration} minutes</p>}

                {editableExam.questions.map((q) => {
                    const isNewPart = q.type !== lastQuestionType;
                    if (isNewPart) {
                        lastQuestionType = q.type;
                        partCounter++;
                        questionCounters[q.type] = 1;
                    } else {
                        if(questionCounters[q.type]){
                            questionCounters[q.type]!++;
                        }
                    }
                    
                    const currentQuestionNumber = questionCounters[q.type] || 1;

                    return (
                        <React.Fragment key={q.id}>
                            {isNewPart && (
                                <div className="pt-8 pb-2">
                                    <h3 className="text-xl font-semibold text-amber-400 border-b-2 border-amber-500/30 pb-2">
                                        Part {partCounter}: {QUESTION_TYPE_LABELS[q.type]}
                                    </h3>
                                </div>
                            )}
                            <div className="mb-6 mt-4 p-4 border-l-4 border-slate-700 hover:border-amber-400 transition-colors duration-200 group relative">
                                <div className="flex justify-between items-start">
                                    <div className="flex-grow">
                                        
                                        {/* Question Text Editor & Preview */}
                                        <div className="flex flex-col">
                                            {isMath(q.question) && (
                                                <div className="mb-2 p-3 bg-slate-900/50 rounded-md border border-slate-600 shadow-inner">
                                                     <span className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-1 block">Math Preview</span>
                                                     <div className="text-lg text-amber-50">
                                                        <span className="font-bold mr-2">{currentQuestionNumber}.</span>
                                                        <MathRenderer text={q.question} inline />
                                                     </div>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-start">
                                                <span className="mr-2 font-bold text-slate-300 mt-1">{currentQuestionNumber}.</span>
                                                <textarea
                                                    value={q.question}
                                                    onChange={(e) => handleQuestionChange(q.id, 'question', e.target.value)}
                                                    className="w-full p-1 -m-1 border-none focus:ring-1 focus:ring-amber-400 rounded-md bg-transparent text-amber-50 font-mono text-sm"
                                                    placeholder="Question text (use $ for math)..."
                                                    rows={Math.max(2, Math.ceil(q.question.length / 80))}
                                                />
                                            </div>
                                        </div>

                                        {renderQuestionEditor(q)}
                                    </div>
                                    <div className="flex flex-col ml-4 space-y-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                        {/* Magic Wand Button */}
                                        {sourceMaterial && (
                                            <button 
                                                onClick={() => openRegenerationModal(q)} 
                                                title="Regenerate this question with AI"
                                                className="p-1 text-purple-400 hover:text-purple-300 bg-slate-700/50 rounded hover:bg-slate-700"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" clipRule="evenodd" />
                                                </svg>
                                            </button>
                                        )}
                                        {/* Delete Button */}
                                        <button 
                                            onClick={() => handleDeleteQuestion(q.id)} 
                                            title="Delete Question"
                                            className="p-1 text-red-500 hover:text-red-400 bg-slate-700/50 rounded hover:bg-slate-700"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" /></svg>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </React.Fragment>
                    )
                })}
            </div>
        </div>
    );
};
