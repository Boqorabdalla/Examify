import { GoogleGenAI } from "@google/genai";
import { CourseOutline, ChapterDetails } from "../types";

// Helper to safely get the API Key in both Node and Vite/Netlify environments
const getApiKey = (): string => {
    // 1. Check process.env (Standard Node/Webpack)
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // 2. Check import.meta.env (Vite/Netlify)
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    // 3. Check global window polyfill (Fallback)
    if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
        return (window as any).process.env.API_KEY;
    }
    return '';
};

const buildChapterPrompt = (material: string, courseTitle: string, chapter: ChapterDetails): string => {
    return `
    You are an expert academic writer and curriculum developer. Your task is to write the content for a single chapter titled "${chapter.name}" for the course "${courseTitle}".
    You MUST ONLY use the information provided in the "Reference Material" section below as the source of truth. Do not invent facts, concepts, or examples. All content must be directly derived from the provided text.

    **Reference Material:**
    ---
    ${material}
    ---

    **Chapter Specifications:**
    - Chapter Title: ${chapter.name}
    - Key Sub-Topics to Cover: ${chapter.subChapters.split(/[\n,]/).map(s => s.trim()).filter(s => s).join(', ')}

    **Instructions:**
    1.  Write a substantial, in-depth exploration of the chapter's topics. Be extremely detailed and comprehensive.
    2.  Elaborate on key concepts, provide detailed explanations, and use examples from the reference material where appropriate. Aim for a verbose and thorough output that would be suitable for a university-level handbook.
    3.  The goal is to generate approximately ${chapter.pages} pages worth of content for this chapter.
    4.  Do not write any other chapters or introductory/concluding remarks for the entire book. Focus solely on this chapter's content.
    5.  Format the output using Markdown. Start with the chapter title as a Level 2 heading (e.g., "## ${chapter.name}"). Use Level 3 headings for sub-topics.
    6.  Ensure the generated content strictly adheres to the provided reference material.
    `;
};


export const generateHandbook = async (
    material: string,
    outline: CourseOutline,
    onChunk: (chunk: string) => void,
    onProgress: (current: number, total: number) => void
): Promise<void> => {
    
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please add 'VITE_API_KEY' to your Netlify Environment Variables.");
    }
    
    const ai = new GoogleGenAI({ apiKey });

    // Start with the main title
    const titleChunk = `# ${outline.courseTitle}\n\n`;
    onChunk(titleChunk);

    const totalChapters = outline.chapters.length;
    let chapterCount = 0;

    for (const chapter of outline.chapters) {
        chapterCount++;
        onProgress(chapterCount, totalChapters);
        const prompt = buildChapterPrompt(material, outline.courseTitle, chapter);

        try {
            const response = await ai.models.generateContent({
                model: "gemini-3-pro-preview",
                contents: prompt,
                config: {
                    temperature: 0.6,
                },
            });

            const chapterContent = response.text.trim();
            onChunk(`\n\n${chapterContent}\n\n`);

        } catch (error) {
            console.error(`Error generating chapter ${chapter.id} ("${chapter.name}"):`, error);
            const errorChunk = `\n\n## Chapter ${chapter.id}: ${chapter.name}\n\n> *Error: Could not generate content for this chapter.*`;
            onChunk(errorChunk);
             if (error instanceof Error) {
                throw new Error(`Failed to generate chapter "${chapter.name}": ${error.message}`);
            }
            throw new Error(`An unknown error occurred while generating chapter "${chapter.name}".`);
        }
    }
};