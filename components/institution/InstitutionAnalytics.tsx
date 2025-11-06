import React, { useEffect, useRef } from 'react';
import { Exam, User } from '../../types';

// Make sure Chart.js is available in the global scope
declare var Chart: any;

interface InstitutionAnalyticsProps {
    exams: Exam[];
    users: User[];
}

const InstitutionAnalytics: React.FC<InstitutionAnalyticsProps> = ({ exams, users }) => {
    const totalExams = exams.length;
    const totalTeachers = users.length;
    const chartRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let chartInstance: any;

        if (chartRef.current) {
            const ctx = chartRef.current.getContext('2d');

            const examsPerTeacher = exams.reduce((acc, exam) => {
                acc[exam.creatorUsername] = (acc[exam.creatorUsername] || 0) + 1;
                return acc;
            }, {} as Record<string, number>);

            const sortedTeachers = Object.entries(examsPerTeacher).sort((a, b) => b[1] - a[1]);

            Chart.defaults.color = '#94a3b8'; // slate-400
            Chart.defaults.borderColor = '#334155'; // slate-700

            chartInstance = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: sortedTeachers.map(t => t[0]),
                    datasets: [{
                        label: '# of Exams Created',
                        data: sortedTeachers.map(t => t[1]),
                        backgroundColor: 'rgba(252, 211, 77, 0.6)', // amber-400 with opacity
                        borderColor: '#fcd34d', // amber-400
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    scales: {
                        y: {
                            beginAtZero: true,
                            ticks: {
                                color: '#94a3b8', // slate-400
                                stepSize: 1
                            }
                        },
                        x: {
                           ticks: {
                                color: '#94a3b8' // slate-400
                            }
                        }
                    },
                    plugins: {
                        legend: {
                            display: false
                        },
                        title: {
                            display: true,
                            text: 'Exams Created per Teacher',
                            color: '#fcd34d' // amber-400
                        }
                    }
                }
            });
        }

        return () => {
            if (chartInstance) chartInstance.destroy();
        };
    }, [exams]);

    const StatCard: React.FC<{title: string; value: number | string; icon: React.ReactNode}> = ({ title, value, icon }) => (
        <div className="bg-slate-800 overflow-hidden shadow-md rounded-lg border border-slate-700">
            <div className="p-5 flex items-center space-x-4">
                <div className="flex-shrink-0 p-3 rounded-full bg-slate-700">
                    {icon}
                </div>
                <div>
                    <dt className="text-sm font-medium text-slate-400 truncate">{title}</dt>
                    <dd className="text-3xl font-semibold text-amber-50">{value}</dd>
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Institution Overview</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                     <StatCard 
                        title="Total Exams in Bank" 
                        value={totalExams} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    />
                    <StatCard 
                        title="Total Teachers" 
                        value={totalTeachers} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 21h6m-6-1a6 6 0 00-9-5.197M15 21h6" /></svg>}
                    />
                </div>
            </div>
            
             <div className="bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                <div className="relative h-96">
                     <canvas ref={chartRef}></canvas>
                </div>
            </div>
        </div>
    );
};

export default InstitutionAnalytics;