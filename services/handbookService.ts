
import { GoogleGenAI } from "@google/genai";
import { CourseOutline, ChapterDetails } from "../types";

const getApiKey = (): string => {
    if (typeof process !== 'undefined' && process.env && process.env.API_KEY) {
        return process.env.API_KEY;
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_KEY) {
        // @ts-ignore
        return import.meta.env.VITE_API_KEY;
    }
    if (typeof window !== 'undefined' && (window as any).process?.env?.API_KEY) {
        return (window as any).process.env.API_KEY;
    }
    return '';
};

const buildChapterPrompt = (material: string, courseTitle: string, chapter: ChapterDetails): string => {
    return `
    You are an expert academic writer. Write the content for chapter "${chapter.name}" for the course "${courseTitle}".
    
    **CRITICAL LANGUAGE RULE:** You MUST detect the language of the "Reference Material" section below. 
    - If the material is in Arabic, write this entire chapter in Arabic. Use Arabic headers and terminology.
    - If the material is in English, write this entire chapter in English.
    - Match the tone and academic level of the source material.

    **Reference Material:**
    ---
    ${material}
    ---

    **Chapter Specifications:**
    - Chapter Title: ${chapter.name}
    - Key Sub-Topics to Cover: ${chapter.subChapters.split(/[\n,]/).map(s => s.trim()).filter(s => s).join(', ')}

    **Instructions:**
    1. Write a substantial, in-depth exploration of the topics. Use examples directly from the reference material.
    2. Format using Markdown. Start with the chapter title as a Level 2 heading (##). Use Level 3 headings for sub-topics.
    3. Ensure content strictly adheres to the provided source material.
    `;
};


export const generateHandbook = async (
    material: string,
    outline: CourseOutline,
    onChunk: (chunk: string) => void,
    onProgress: (current: number, total: number) => void
): Promise<void> => {
    
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Gemini API Key is missing.");
    
    const ai = new GoogleGenAI({ apiKey });

    // Start with the main title (The AI will handle the inner language)
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
            console.error(`Error generating chapter ${chapter.id}:`, error);
            onChunk(`\n\n## Error: Could not generate content for chapter "${chapter.name}".`);
        }
    }
};
