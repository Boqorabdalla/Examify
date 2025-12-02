
import { GoogleGenAI, Type } from "@google/genai";
import { Exam, ExamParameters, QuestionType } from "../types";

// Updated Schema: Removed 'answerBoolean' and consolidated into a single 'answer' string field.
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
                properties: {
                    type: { type: Type.STRING, enum: Object.values(QuestionType) },
                    question: { type: Type.STRING },
                    options: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true },
                    answer: { type: Type.STRING, nullable: true }, // Unified answer field for all question types
                    premises: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }, // For Matching
                    responses: { type: Type.ARRAY, items: { type: Type.STRING }, nullable: true }, // For Matching
                    answers: { // For Matching
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
                },
                required: ["type", "question"]
            }
        }
    },
    required: ["courseName", "examType", "questions"]
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

    **Instructions:**
    1.  Ensure all questions are directly derived from the provided course material.
    2.  For Multiple Choice (MCQ) questions, provide 4 plausible options with one clear correct answer. Populate the 'options' and 'answer' fields.
    3.  For True/False questions, create a statement and provide the answer as a string ("True" or "False") in the 'answer' field.
    4.  For Matching questions, provide exactly 5 premises and 5 corresponding responses. The lists must be of equal length (5 items each). Then provide the correct pairings in the 'answers' field.
    5.  For Short Answer questions, ask for a concise response and provide a model answer in the 'answer' field.
    6.  For Essay questions, pose a question that requires a detailed response and provide a summary of key points or a model answer in the 'answer' field.
    7.  Adhere strictly to the JSON schema provided for the response. Do not add any extra fields. The output must be a single, valid JSON object.
    `;
};


export const generateExam = async (material: string, params: ExamParameters, institutionId: string, creatorId: string, creatorUsername: string): Promise<Exam> => {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
        throw new Error("Gemini API Key is missing. Please check your environment configuration.");
    }
    
    // Initialize AI client lazily to avoid crashes on app load if environment is misconfigured
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

        // Sanitize and structure the data to prevent runtime errors from malformed API responses.
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
                        return {
                            ...baseQuestion,
                            answer: q.answer?.toLowerCase() === 'true',
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
                        // This will render gracefully in the UI instead of crashing
                        return {
                            ...baseQuestion,
                            type: QuestionType.ESSAY,
                            question: `Unsupported Question Type Received: '${q.type}'. Original text: ${q.question}`,
                            answer: `Raw data: ${JSON.stringify(q)}`,
                        };
                }
            })
        };

        return sanitizedExam;
    } catch (error) {
        console.error("Error calling Gemini API or parsing response:", error);
        if (error instanceof Error) {
            throw new Error(`Failed to generate exam: ${error.message}`);
        }
        throw new Error("An unknown error occurred while generating the exam.");
    }
};
