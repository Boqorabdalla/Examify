
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { Exam, ExamParameters, Question, QuestionType } from "../types";

// Helper to safely get the API Key in both Node and Vite/Netlify environments
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

const questionProperties = {
    type: { type: Type.STRING, enum: Object.values(QuestionType) },
    question: { type: Type.STRING },
    options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    answer: { type: Type.STRING, nullable: true },
    premises: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    responses: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
    answers: {
        type: Type.ARRAY,
        items: {
            type: Type.OBJECT,
            properties: {
                premise: { type: Type.STRING },
                response: { type: Type.STRING }
            },
            required: ["premise", "response"]
        },
        nullable: true
    },
};

const responseSchema = {
    type: Type.OBJECT,
    properties: {
        courseName: { type: Type.STRING },
        examType: { type: Type.STRING },
        duration: { type: Type.INTEGER, nullable: true },
        questions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: questionProperties,
                required: ["type", "question"]
            }
        }
    },
    required: ["courseName", "examType", "questions"]
};

const singleQuestionSchema: Schema = {
    type: Type.OBJECT,
    properties: questionProperties,
    required: ["type", "question"]
};

const buildPrompt = (material: string, params: ExamParameters): string => {
    const questionRequests = Object.entries(params.questionDistribution)
        .filter(([, count]) => count > 0)
        .map(([type, count]) => `${count} ${type.replace('_', ' ')} questions`)
        .join(', ');

    return `
    Based on the following course material, please generate an exam.

    **Course Material:**
    ---
    ${material}
    ---

    **Exam Specifications:**
    - Course Name: ${params.courseName}
    - Exam Type: ${params.examType}
    - Difficulty Level: ${params.difficulty}
    ${params.duration ? `- Exam Duration (minutes): ${params.duration}` : ''}
    - Question Distribution: Generate exactly ${questionRequests}.

    **CRITICAL INSTRUCTIONS:**
    1.  **LANGUAGE MATCHING:** You MUST detect the language of the provided "Course Material". 
        - If the material is in Arabic, the entire exam (questions, options, answers) MUST be in Arabic.
        - If the material is in English, the entire exam MUST be in English.
        - Do NOT mix languages unless the material itself is a language-learning text.
    2.  Ensure all questions are directly derived from the provided material.
    3.  **Mathematics & Sciences:** For ANY mathematical equations, formulas, or scientific notation, you MUST use standard LaTeX syntax: $E=mc^2$ or $$x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$$.
    4.  For Multiple Choice (MCQ) questions, provide 4 plausible options with one clear correct answer.
    5.  For True/False questions, provide the answer as a string in the language of the material (e.g., "True" or "False" in English; "صح" or "خطأ" in Arabic) in the 'answer' field.
    6.  For Matching questions, provide exactly 5 premises and 5 corresponding responses.
    7.  Adhere strictly to the JSON schema.
    `;
};


export const generateExam = async (material: string, params: ExamParameters, institutionId: string, creatorId: string, creatorUsername: string): Promise<Exam> => {
    const apiKey = getApiKey();
    if (!apiKey) {
        throw new Error("Gemini API Key is missing.");
    }

    const ai = new GoogleGenAI({ apiKey });
    const prompt = buildPrompt(material, params);

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: responseSchema,
                temperature: 0.7,
            },
        });
        
        const jsonText = response.text.trim();
        const rawExam = JSON.parse(jsonText);

        const sanitizedExam: Exam = {
            id: `exam_${Date.now()}`,
            institutionId,
            creatorId,
            creatorUsername,
            courseName: rawExam.courseName || params.courseName,
            examType: rawExam.examType || params.examType,
            duration: rawExam.duration,
            questions: (rawExam.questions || []).map((q: any) => {
                const baseQuestion = {
                    id: crypto.randomUUID(),
                    question: q.question || 'Error: Question text was not generated.',
                    type: q.type,
                };

                switch (q.type) {
                    case QuestionType.MCQ:
                        return {
                            ...baseQuestion,
                            options: q.options || [],
                            answer: String(q.answer || ''),
                        };
                    case QuestionType.TRUE_FALSE:
                        // Handle Arabic and English True values
                        const val = String(q.answer || '').toLowerCase();
                        const isTrue = val === 'true' || val === 'صح' || val === 'صحيح' || val === 'صواب' || val === 'yes';
                        return {
                            ...baseQuestion,
                            answer: isTrue,
                        };
                    case QuestionType.MATCHING:
                        return {
                            ...baseQuestion,
                            premises: q.premises || [],
                            responses: q.responses || [],
                            answers: q.answers || [],
                        };
                    case QuestionType.SHORT_ANSWER:
                    case QuestionType.ESSAY:
                        return {
                            ...baseQuestion,
                            answer: q.answer || '',
                        };
                    default:
                        return {
                            ...baseQuestion,
                            type: QuestionType.ESSAY,
                            question: `Unsupported Type: ${q.type}`,
                            answer: '',
                        };
                }
            })
        };

        return sanitizedExam;
    } catch (error) {
        console.error("Error generating exam:", error);
        throw new Error(error instanceof Error ? error.message : "Generation failed.");
    }
};

export const regenerateQuestion = async (material: string, currentQuestion: Question, instruction: string): Promise<Question> => {
    const apiKey = getApiKey();
    if (!apiKey) throw new Error("Gemini API Key is missing.");

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `
    Modify this exam question based on the instruction.
    **LANGUAGE RULE:** The rewritten question MUST be in the same language as the original question and the provided material.
    
    **Material Context:** ${material.substring(0, 3000)}

    **Current Question:**
    Type: ${currentQuestion.type}
    Question: ${currentQuestion.question}
    Answer: ${JSON.stringify((currentQuestion as any).answer)}

    **User Instruction:** "${instruction}"
    
    Return a single JSON object matching the question schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: singleQuestionSchema,
                temperature: 0.7,
            },
        });

        const jsonText = response.text.trim();
        const rawQuestion = JSON.parse(jsonText);

        const baseQuestion = {
            id: currentQuestion.id,
            question: rawQuestion.question || 'Error',
            type: currentQuestion.type,
        };

        switch (currentQuestion.type) {
            case QuestionType.MCQ:
                return { ...baseQuestion, type: QuestionType.MCQ, options: rawQuestion.options || [], answer: String(rawQuestion.answer || '') };
            case QuestionType.TRUE_FALSE:
                const val = String(rawQuestion.answer || '').toLowerCase();
                const isTrue = val === 'true' || val === 'صح' || val === 'صحيح' || val === 'صواب';
                return { ...baseQuestion, type: QuestionType.TRUE_FALSE, answer: isTrue };
            case QuestionType.MATCHING:
                return { ...baseQuestion, type: QuestionType.MATCHING, premises: rawQuestion.premises || [], responses: rawQuestion.responses || [], answers: rawQuestion.answers || [] };
            case QuestionType.SHORT_ANSWER:
                return { ...baseQuestion, type: QuestionType.SHORT_ANSWER, answer: rawQuestion.answer || '' };
            case QuestionType.ESSAY:
                return { ...baseQuestion, type: QuestionType.ESSAY, answer: rawQuestion.answer || '' };
            default:
                throw new Error("Unsupported type");
        }
    } catch (error) {
        console.error("Error regenerating question:", error);
        throw new Error("Regeneration failed.");
    }
};
