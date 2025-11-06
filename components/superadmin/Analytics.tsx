
import React, { useEffect, useRef } from 'react';
import { Institution, User, UserRole, InstitutionStatus } from '../../types';

// Make sure Chart.js is available in the global scope
declare var Chart: any;

interface AnalyticsProps {
    institutions: Institution[];
    users: User[];
}

const Analytics: React.FC<AnalyticsProps> = ({ institutions, users }) => {
    const totalInstitutions = institutions.length;
    const totalTeachers = users.filter(u => u.role === UserRole.TEACHER).length;
    const statusChartRef = useRef<HTMLCanvasElement | null>(null);
    const usersChartRef = useRef<HTMLCanvasElement | null>(null);

    useEffect(() => {
        let statusChartInstance: any;
        let usersChartInstance: any;

        if (statusChartRef.current && usersChartRef.current) {
            const statusCtx = statusChartRef.current.getContext('2d');
            const usersCtx = usersChartRef.current.getContext('2d');

            // Data for Status Doughnut Chart
            const activeCount = institutions.filter(i => i.status === InstitutionStatus.ACTIVE).length;
            const suspendedCount = institutions.filter(i => i.status === InstitutionStatus.SUSPENDED).length;

            // Data for Users per Institution Bar Chart
            const institutionUserCounts = institutions.map(inst => ({
                name: inst.name,
                count: users.filter(u => u.institutionId === inst.id && u.role === UserRole.TEACHER).length
            }));
            
            Chart.defaults.color = '#94a3b8'; // slate-400
            Chart.defaults.borderColor = '#334155'; // slate-700

            statusChartInstance = new Chart(statusCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Active', 'Suspended'],
                    datasets: [{
                        data: [activeCount, suspendedCount],
                        backgroundColor: ['#10b981' /* green-500 */, '#ef4444' /* red-500 */],
                        borderColor: '#1e293b' /* slate-800 */,
                        borderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                             labels: {
                                color: '#fcd34d' // amber-400
                            }
                        },
                        title: {
                            display: true,
                            text: 'Institutions by Status',
                            color: '#fcd34d' // amber-400
                        }
                    }
                }
            });

            usersChartInstance = new Chart(usersCtx, {
                type: 'bar',
                data: {
                    labels: institutionUserCounts.map(i => i.name),
                    datasets: [{
                        label: '# of Teachers',
                        data: institutionUserCounts.map(i => i.count),
                        backgroundColor: 'rgba(252, 211, 77, 0.6)', // amber-400 with opacity
                        borderColor: '#fcd34d', // amber-400
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    indexAxis: 'y',
                    scales: {
                        x: {
                            beginAtZero: true,
                            ticks: {
                                color: '#94a3b8', // slate-400
                                stepSize: 1
                            }
                        },
                        y: {
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
                            text: 'Teachers per Institution',
                            color: '#fcd34d' // amber-400
                        }
                    }
                }
            });
        }

        return () => {
            if (statusChartInstance) statusChartInstance.destroy();
            if (usersChartInstance) usersChartInstance.destroy();
        };
    }, [institutions, users]);

    // FIX: Changed JSX.Element to React.ReactNode to resolve namespace error.
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
                <h3 className="text-xl font-semibold text-amber-400 mb-4">Platform Overview</h3>
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    <StatCard 
                        title="Total Institutions" 
                        value={totalInstitutions} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>} 
                    />
                    <StatCard 
                        title="Total Teachers" 
                        value={totalTeachers} 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M15 21v-1a6 6 0 00-5.176-5.97M15 21h6m-6-1a6 6 0 00-9-5.197M15 21h6" /></svg>}
                    />
                    <StatCard 
                        title="Exams Generated" 
                        value="N/A" 
                        icon={<svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
                    />
                </div>
                <p className="text-xs text-slate-500 mt-4">* Exam generation stats are not yet tracked.</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                <div className="lg:col-span-2 bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                    <div className="relative h-64 md:h-80">
                        <canvas ref={statusChartRef}></canvas>
                    </div>
                </div>
                <div className="lg:col-span-3 bg-slate-800 p-6 rounded-lg shadow-md border border-slate-700">
                    <div className="relative h-64 md:h-80">
                         <canvas ref={usersChartRef}></canvas>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Analytics;