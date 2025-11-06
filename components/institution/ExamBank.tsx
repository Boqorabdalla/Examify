
import React from 'react';
import { Exam } from '../../types';

interface ExamBankProps {
  exams: Exam[];
  onLoad: (exam: Exam) => void;
  onDelete: (examId: string) => void;
}

const ExamBank: React.FC<ExamBankProps> = ({ exams, onLoad, onDelete }) => {
  return (
    <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
      <h3 className="text-xl font-semibold text-amber-400 mb-4">Exam Bank</h3>
      <div className="overflow-x-auto">
        {exams.length > 0 ? (
          <table className="min-w-full divide-y divide-slate-700">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Course Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Exam Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Questions</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-slate-800 divide-y divide-slate-700">
              {exams.map((exam) => (
                <tr key={exam.id} className="hover:bg-slate-700/50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-amber-50">{exam.courseName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{exam.examType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">{exam.questions.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                    <button onClick={() => onLoad(exam)} className="text-amber-400 hover:text-amber-300">View/Edit</button>
                    <button onClick={() => onDelete(exam.id)} className="text-red-500 hover:text-red-400">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className="text-center text-slate-500 py-4">No exams have been saved to the bank yet.</p>
        )}
      </div>
    </div>
  );
};

export default ExamBank;
