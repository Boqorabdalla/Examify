
import React from 'react';

// This makes html-docx-js and FileSaver available from the global scope
declare var htmlDocx: any;
declare var saveAs: any;

interface HandbookPreviewProps {
    content: string;
    onBack: () => void;
    generationStatus: { current: number; total: number };
    isLoading: boolean;
}

const HandbookPreview: React.FC<HandbookPreviewProps> = ({ content, onBack, generationStatus, isLoading }) => {

    // A simple markdown to HTML converter
    const convertMarkdownToHtml = (markdown: string) => {
        let html = markdown;
        // Headers (e.g., # Title, ## Chapter)
        html = html.replace(/^### (.*$)/gim, '<h3 style="font-size: 1.2em; color: #fde047; margin-top: 1.5em;">$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2 style="font-size: 1.5em; border-bottom: 1px solid #475569; padding-bottom: 5px; margin-top: 2em; color: #fcd34d;">$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1 style="text-align: center; font-size: 2em; color: #fbbf24;">$1</h1>');
        // Bold
        html = html.replace(/\*\*(.*?)\*\*/gim, '<strong>$1</strong>');
        // Italic
        html = html.replace(/\*(.*?)\*/gim, '<em>$1</em>');
        // Lists
        html = html.replace(/^\s*[-*] (.*$)/gim, '<ul><li>$1</li></ul>');
        html = html.replace(/<\/ul>\n<ul>/gim, ''); // Merge consecutive lists
        // New lines to paragraphs
        html = html.split('\n').map(p => p.trim() ? `<p>${p}</p>` : '').join('');
        // Remove empty paragraphs that might result
        html = html.replace(/<p><\/p>/g, '');
        
        return `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: auto; line-height: 1.6;">${html}</div>`;
    };

    const handleExport = () => {
        const htmlContent = convertMarkdownToHtml(content);
        // Extract title for filename
        const titleMatch = content.match(/^# (.*$)/im);
        const fileName = titleMatch ? `${titleMatch[1].replace(/\s+/g, '_')}_Handbook.docx` : 'Student_Handbook.docx';
        
        const converted = htmlDocx.asBlob(htmlContent);
        saveAs(converted, fileName);
    };

    const isGenerating = isLoading || (generationStatus.total > 0 && generationStatus.current < generationStatus.total);
    const generationComplete = !isLoading && generationStatus.total > 0 && generationStatus.current === generationStatus.total;


    return (
        <div>
            <div className="flex justify-between items-center mb-6 flex-wrap gap-2">
                <button onClick={onBack} disabled={isGenerating} className="px-4 py-2 text-sm font-medium text-amber-400 bg-slate-700 border border-slate-600 rounded-md shadow-sm hover:bg-slate-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:opacity-50 disabled:cursor-not-allowed">
                    &larr; Back to Setup
                </button>
                <button onClick={handleExport} disabled={isGenerating || !content} className="px-4 py-2 text-sm font-medium text-slate-900 bg-amber-400 border border-transparent rounded-md shadow-sm hover:bg-amber-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-900 focus:ring-amber-500 disabled:bg-amber-800 disabled:cursor-not-allowed">
                    Export to DOCX
                </button>
            </div>

            <div className="bg-slate-800 p-8 rounded-lg shadow-lg border border-slate-700 relative">
                
                {isGenerating && (
                    <div className="absolute top-4 right-4 bg-slate-900/80 backdrop-blur-sm text-amber-300 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-2">
                         <div className="w-3 h-3 rounded-full animate-spin border-2 border-dashed border-amber-500 border-t-transparent"></div>
                         <span>Generating Chapter {generationStatus.current} of {generationStatus.total}...</span>
                    </div>
                )}
                 {generationComplete && (
                    <div className="absolute top-4 right-4 bg-green-900/80 backdrop-blur-sm text-green-300 text-xs font-semibold px-3 py-1.5 rounded-full flex items-center space-x-2">
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                         <span>Generation Complete</span>
                    </div>
                )}


                <div 
                    className="prose prose-invert prose-p:text-slate-300 prose-headings:text-amber-400 max-w-none"
                    dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(content) }}
                />
            </div>
        </div>
    );
};

export default HandbookPreview;