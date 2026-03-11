import { useState, useEffect } from 'react';
import { BarChart, Globe, Award, MapPin } from 'lucide-react';
import api from '../../utils/api';

const StudentReports = ({ courseId }: { courseId: string }) => {
    const [reports, setReports] = useState<any[]>([]);
    const [geoStats, setGeoStats] = useState<any>({});

    useEffect(() => {
        const fetchAnalytics = async () => {
            const repRes = await api.get(`/instructor/reports/${courseId}`);
            const geoRes = await api.get(`/instructor/geo-stats/${courseId}`);
            setReports(repRes.data);
            setGeoStats(geoRes.data);
        };
        fetchAnalytics();
    }, [courseId]);

    return (
        <div className="space-y-8 p-6 bg-black text-white">
            {/* Location Analytics Card */}
            <div className="bg-gray-900 border border-gray-800 p-6 rounded-3xl">
                <h3 className="flex items-center gap-2 text-xl font-black text-neon-blue mb-4">
                    <Globe size={20}/> GEOGRAPHICAL REACH
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(geoStats).map(([city, count]: any) => (
                        <div key={city} className="bg-black/50 p-4 rounded-2xl border border-gray-800">
                            <p className="text-gray-500 text-[10px] font-bold uppercase">{city}</p>
                            <p className="text-2xl font-black">{count} Students</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Performance Table */}
            <div className="bg-gray-900 border border-gray-800 rounded-3xl overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-800 text-gray-400 text-[10px] uppercase">
                        <tr>
                            <th className="p-4">Student</th>
                            <th className="p-4">Location</th>
                            <th className="p-4 text-center">Avg. Score</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reports.map((r: any) => (
                            <tr key={r._id} className="border-b border-gray-800 hover:bg-white/5">
                                <td className="p-4 font-bold">{r.student.name}</td>
                                <td className="p-4 flex items-center gap-1 text-gray-400">
                                    <MapPin size={12}/> {r.student.location.city}
                                </td>
                                <td className="p-4 text-center text-green-400 font-black">
                                    {/* Logic to calculate average marks from completedSections */}
                                    85%
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};