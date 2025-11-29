import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileSpreadsheet, Table as TableIcon, Loader2, X, Plus, Download, BarChart3 } from 'lucide-react';
import logoImage from '@/assets/logo.png';
import { toast } from 'sonner';
import { excelAPI } from '@/lib/api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";

const PRIMARY_COLOR = '#1D6B73';
const PRIMARY_DARK = '#155159';
const PRIMARY_LIGHT = '#21848D';
const PRIMARY_SOFT = '#E5F2F4';

const COMPARISON_COLORS = [
    '#C69A47',
    '#C69A47',
    '#C69A47',
    '#C69A47',
    '#C69A47',
];

const Home = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [file, setFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [uploading, setUploading] = useState(false);
    const [selectedFiles, setSelectedFiles] = useState<any[]>([]);
    const [allExcelFiles, setAllExcelFiles] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [showUpload, setShowUpload] = useState(false);
    const [numericMetric, setNumericMetric] = useState<'sum' | 'average'>('sum');

    useEffect(() => {
        if (user) {
            loadAllExcelFiles();
        } else {
            setAllExcelFiles([]);
            setSelectedFiles([]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            const validTypes = [
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'text/csv',
            ];

            if (validTypes.includes(selectedFile.type) ||
                selectedFile.name.match(/\.(xlsx|xls|csv)$/i)) {
                setFile(selectedFile);
            } else {
                toast.error('Please upload a valid Excel file (.xlsx, .xls, .csv)');
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            toast.error('Please select a file');
            return;
        }

        if (!user) {
            toast.error('Please login to upload files');
            navigate('/login');
            return;
        }

        setUploading(true);
        const formData = new FormData();
        formData.append('file', file);
        if (description) {
            formData.append('description', description);
        }
        if (displayName.trim()) {
            formData.append('displayName', displayName.trim());
        }

        try {
            const response = await excelAPI.upload(formData);
            toast.success('Excel file uploaded successfully!');
            setFile(null);
            setDescription('');
            setDisplayName('');
            setShowUpload(false);
            loadAllExcelFiles();
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to upload file');
        } finally {
            setUploading(false);
        }
    };

    const loadAllExcelFiles = async () => {
        setLoading(true);
        try {
            const response = await excelAPI.getAll({ limit: 100 });
            setAllExcelFiles(response.data.data.excelFiles);
        } catch (error) {
            console.error('Failed to load files:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleFileSelection = async (id: string) => {
        const isSelected = selectedFiles.some(f => f._id === id);

        if (isSelected) {
            setSelectedFiles(prev => prev.filter(f => f._id !== id));
        } else {
            try {
                const response = await excelAPI.getById(id);
                setSelectedFiles(prev => [...prev, response.data.data]);
            } catch (error: any) {
                toast.error('Failed to load file');
            }
        }
    };

    const removeFileFromSelection = (id: string) => {
        setSelectedFiles(prev => prev.filter(f => f._id !== id));
    };

    const perFileNumericData = useMemo(() => {
        const dataMap: Record<string, { sum: { name: string; value: number }[]; average: { name: string; value: number }[] }> = {};

        selectedFiles.forEach((file) => {
            const sumData: { name: string; value: number }[] = [];
            const avgData: { name: string; value: number }[] = [];

            (file.headers || []).forEach((header: string) => {
                const numericValues = (file.data || [])
                    .map((row: any) => parseFloat(String(row[header] ?? '')))
                    .filter((value) => !isNaN(value));

                if (numericValues.length > 0) {
                    const sum = numericValues.reduce((acc, value) => acc + value, 0);
                    const average = sum / numericValues.length;
                    sumData.push({ name: header, value: Math.round(sum * 100) / 100 });
                    avgData.push({ name: header, value: Math.round(average * 100) / 100 });
                }
            });

            dataMap[file._id] = {
                sum: sumData,
                average: avgData,
            };
        });

        return dataMap;
    }, [selectedFiles]);

    const dashboardStats = useMemo(() => {
        const totalSelectedRows = selectedFiles.reduce((acc, file) => acc + (file.rowCount || 0), 0);
        const latestUploadDate = allExcelFiles.reduce((latest, file) => {
            const time = new Date(file.createdAt).getTime();
            return time > latest ? time : latest;
        }, 0);

        return {
            totalSelectedRows,
            latestUploadDate,
        };
    }, [selectedFiles, allExcelFiles]);

    const { totalSelectedRows, latestUploadDate } = dashboardStats;
    const latestUploadDateText = latestUploadDate ? new Date(latestUploadDate).toLocaleDateString('ar') : '—';
    const formattedSelectedRows = totalSelectedRows.toLocaleString('ar');

    const downloadChart = async (chartId: string, label: string) => {
        if (selectedFiles.length < 2) {
            toast.error('يرجى اختيار ملفين على الأقل للمقارنة');
            return;
        }

        const chartElement = document.getElementById(chartId);
        if (!chartElement) {
            toast.error('خطأ في إنشاء المخطط');
            return;
        }

        try {
            toast.info('جاري تجهيز المخطط...');
            const canvas = await html2canvas(chartElement, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
            });

            const link = document.createElement('a');
            link.download = `${label}_${selectedFiles.map(f => f.displayName || f.fileName).join('_')}_${Date.now()}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            toast.success('تم تحميل المخطط بنجاح');
        } catch (error) {
            console.error('Error downloading chart:', error);
            toast.error('فشل تحميل المخطط');
        }
    };

    const deleteExcelById = async (id: string) => {
        setDeletingId(id);
        try {
            await excelAPI.delete(id);
            toast.success('تم حذف الملف بنجاح');
            setSelectedFiles(prev => prev.filter((item) => item._id !== id));
            setAllExcelFiles((prev) => prev.filter((item) => item._id !== id));
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل في حذف الملف');
        } finally {
            setDeletingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-white via-[rgba(29,107,115,0.05)] to-white" dir="rtl">
            {/* Header */}
            <header className="bg-gradient-to-r from-[rgba(29,107,115,0.95)] via-[rgba(17,87,93,0.95)] to-[rgba(12,70,75,0.95)] text-white shadow-lg">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <img src={logoImage} alt="KFU Logo" className="h-14 w-14 object-contain" />
                            <div className="flex flex-col">
                                <h1 className="text-lg font-bold leading-tight">وحدة التصنيفات العالمية</h1>
                                <p className="text-xs opacity-90">عمادة التطوير وضمان الجودة</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-4">
                            {user ? (
                                <>
                                    <span className="text-sm opacity-90">مرحباً، {user.fullname}</span>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                                        onClick={() => {
                                            localStorage.removeItem('artscape_token');
                                            window.location.reload();
                                        }}
                                    >
                                        تسجيل خروج
                                    </Button>
                                </>
                            ) : (
                                <>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="bg-white/10 border-white/30 text-white hover:bg-white/20"
                                        onClick={() => navigate('/login')}
                                    >
                                        تسجيل دخول
                                    </Button>
                                    <Button
                                        size="sm"
                                        className="bg-white hover:bg-white/90 border border-white/30 font-semibold text-[#1D6B73]"
                                        onClick={() => navigate('/signup')}
                                    >
                                        إنشاء حساب
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-6 space-y-6">
                <Card className="overflow-hidden border-none bg-gradient-to-r from-[rgba(29,107,115,0.95)] via-[rgba(12,70,75,0.95)] to-[rgba(26,95,103,0.9)] text-white shadow-xl rounded-3xl">
                    <CardContent className="p-6 md:p-10">
                        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                            <div className="space-y-3 max-w-3xl">
                                <p className="text-xs uppercase tracking-[0.45em] text-white/70">لوحة البيانات</p>
                                <h2 className="text-2xl md:text-3xl font-bold">استعرض وقارن ملفات Excel بثقة</h2>
                                <p className="text-sm text-white/90 leading-relaxed">
                                    اختر ملفاتك، قارن البيانات رقمياً، وشارك النتائج مع فريقك من خلال تجربة تفاعلية مبسطة
                                    ومصممة بعناية.
                                </p>
                            </div>
                            <div className="grid w-full gap-4 sm:grid-cols-2 lg:w-auto">
                                <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur">
                                    <p className="text-xs text-white/80">الملفات المتاحة</p>
                                    <p className="text-2xl font-bold mt-1">{allExcelFiles.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur">
                                    <p className="text-xs text-white/80">الملفات المحددة</p>
                                    <p className="text-2xl font-bold mt-1">{selectedFiles.length}</p>
                                </div>
                                <div className="rounded-2xl bg-white/10 p-4 border border-white/20 backdrop-blur sm:col-span-2">
                                    <p className="text-xs text-white/80">آخر تحديث</p>
                                    <p className="text-xl font-semibold mt-1">{latestUploadDateText}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                    <Card className="shadow-lg border border-gray-100 bg-white rounded-2xl">
                        <CardHeader className="py-4 px-5 border-b border-gray-100 rounded-t-2xl bg-gradient-to-r from-white to-gray-50">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 rounded-xl bg-[rgba(29,107,115,0.1)] text-[#1D6B73]">
                                        <TableIcon className="h-5 w-5" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-base font-semibold text-[#0F3D42]">
                                            الملفات المرفوعة
                                        </CardTitle>
                                        <p className="text-xs text-gray-500">اختر ملفين أو أكثر لعرض المقارنات</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600">
                                        {selectedFiles.length} ملف/ملفات محددة
                                    </span>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 text-xs font-semibold border-[#1D6B73] text-[#1D6B73]"
                                        onClick={loadAllExcelFiles}
                                    >
                                        تحديث
                                    </Button>
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent className="p-5">
                            {loading ? (
                                <div className="flex justify-center py-8">
                                    <Loader2 className="h-6 w-6 animate-spin text-[#1D6B73]" />
                                </div>
                            ) : allExcelFiles.length > 0 ? (
                                <div className="space-y-3">
                                    {allExcelFiles.map((file) => {
                                        const isSelected = selectedFiles.some(f => f._id === file._id);
                                        return (
                                            <div
                                                key={file._id}
                                                className={`flex justify-between items-center p-4 rounded-2xl transition-all cursor-pointer border ${isSelected
                                                    ? 'bg-[#1D6B73]/10 border-[#1D6B73]'
                                                    : 'bg-gray-50 hover:bg-gray-100 border-gray-200'
                                                    }`}
                                                onClick={() => toggleFileSelection(file._id)}
                                            >
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${isSelected ? 'bg-[#1D6B73] border-[#1D6B73]' : 'border-gray-300'
                                                        }`}>
                                                        {isSelected && <div className="w-2 h-2 bg-white rounded-full" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="font-semibold text-sm text-[#0F3D42]">
                                                            {file.displayName || file.fileName}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {file.rowCount} صف • {new Date(file.createdAt).toLocaleDateString('ar')}
                                                        </p>
                                                    </div>
                                                </div>
                                                {user?.role === 'admin' && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-8 w-8 p-0 border border-[#1D6B73]/40 text-[#1D6B73] hover:bg-[rgba(29,107,115,0.08)]"
                                                        onClick={(event) => {
                                                            event.stopPropagation();
                                                            deleteExcelById(file._id);
                                                        }}
                                                        disabled={deletingId === file._id}
                                                    >
                                                        {deletingId === file._id ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <X className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-gray-500 py-8 text-sm">لا توجد ملفات مرفوعة</p>
                            )}
                        </CardContent>
                    </Card>

                    <div className="space-y-6">
                        {user?.role === 'admin' && (
                            <Card className="shadow-lg border border-gray-100 bg-white rounded-2xl">
                                <CardHeader className="py-4 px-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                    <div>
                                        <CardTitle className="text-sm font-semibold text-[#0F3D42]">إدارة رفع الملفات</CardTitle>
                                        <p className="text-xs text-gray-500 mt-1">يدعم النظام ملفات .xlsx و .xls و .csv</p>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className={`h-8 px-3 text-xs font-semibold border-[#1D6B73] ${showUpload ? 'bg-[#1D6B73] text-white' : 'text-[#1D6B73]'}`}
                                        onClick={() => {
                                            if (showUpload) {
                                                setFile(null);
                                                setDescription('');
                                                setDisplayName('');
                                            }
                                            setShowUpload(prev => !prev);
                                        }}
                                    >
                                        {showUpload ? 'إخفاء النموذج' : 'إظهار النموذج'}
                                    </Button>
                                </CardHeader>
                                {showUpload ? (
                                    <CardContent className="px-5 pb-5 pt-4 space-y-4">
                                        <div>
                                            <Label htmlFor="file" className="text-xs text-gray-700 mb-1 block">
                                                اختر ملف Excel
                                            </Label>
                                            <Input
                                                id="file"
                                                type="file"
                                                accept=".xlsx,.xls,.csv"
                                                onChange={handleFileChange}
                                                className="cursor-pointer text-sm h-10"
                                            />
                                            {file && (
                                                <p className="text-xs mt-1 flex items-center gap-1 text-[#1D6B73]">
                                                    {file.name}
                                                    <FileSpreadsheet className="h-3 w-3" />
                                                </p>
                                            )}
                                        </div>
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <Label htmlFor="displayName" className="text-xs text-gray-700 mb-1 block">
                                                    اسم الملف
                                                </Label>
                                                <Input
                                                    id="displayName"
                                                    value={displayName}
                                                    onChange={(e) => setDisplayName(e.target.value)}
                                                    placeholder="اسم الملف"
                                                    className="text-sm h-10"
                                                />
                                            </div>
                                            <div>
                                                <Label htmlFor="description" className="text-xs text-gray-700 mb-1 block">
                                                    وصف (اختياري)
                                                </Label>
                                                <Textarea
                                                    id="description"
                                                    value={description}
                                                    onChange={(e) => setDescription(e.target.value)}
                                                    placeholder="أضف وصفاً مختصراً"
                                                    className="text-sm min-h-[80px]"
                                                />
                                            </div>
                                        </div>
                                        <Button
                                            onClick={handleUpload}
                                            disabled={!file || uploading}
                                            className="w-full text-white font-semibold h-10 bg-gradient-to-r from-[#1D6B73] to-[#155159]"
                                            size="sm"
                                        >
                                            {uploading ? (
                                                <>
                                                    جاري الرفع...
                                                    <Loader2 className="ml-2 h-4 w-4 animate-spin" />
                                                </>
                                            ) : (
                                                <>
                                                    رفع الملف
                                                    <Upload className="ml-2 h-4 w-4" />
                                                </>
                                            )}
                                        </Button>
                                    </CardContent>
                                ) : (
                                    <CardContent className="px-5 pb-5 pt-4 text-xs text-gray-500">
                                        اضغط على زر "إظهار النموذج" لبدء رفع ملف جديد وإدارته من هذا القسم.
                                    </CardContent>
                                )}
                            </Card>
                        )}

                        <Card className="shadow-lg border border-gray-100 bg-white rounded-2xl">
                            <CardHeader className="py-4 px-5 border-b border-gray-100">
                                <CardTitle className="text-base font-semibold text-[#0F3D42]">نظرة سريعة</CardTitle>
                                <p className="text-xs text-gray-500 mt-1">ملخص سريع عن الملفات المحددة والإحصائيات العامة</p>
                            </CardHeader>
                            <CardContent className="px-5 pb-5 pt-4 space-y-4">
                                <div className="grid gap-3 sm:grid-cols-2">
                                    <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/70">
                                        <p className="text-xs text-gray-500">إجمالي الصفوف المحددة</p>
                                        <p className="text-xl font-bold text-[#1D6B73] mt-1">{formattedSelectedRows}</p>
                                    </div>
                                    <div className="rounded-xl border border-gray-100 p-4 bg-gray-50/70">
                                        <p className="text-xs text-gray-500">آخر تحديث</p>
                                        <p className="text-xl font-bold text-[#1D6B73] mt-1">{latestUploadDateText}</p>
                                    </div>
                                </div>
                                {selectedFiles.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {selectedFiles.map((file) => (
                                            <span
                                                key={file._id}
                                                className="px-3 py-1 rounded-full bg-[#1D6B73]/10 text-[#1D6B73] text-xs font-medium"
                                            >
                                                {file.displayName || file.fileName}
                                            </span>
                                        ))}
                                    </div>
                                ) : (
                                    <ul className="list-disc pr-5 text-xs text-gray-500 space-y-1">
                                        <li>اختر ملفين على الأقل لبدء تحليل المقارنة.</li>
                                        <li>استخدم البطاقات بالأسفل لاستعراض البيانات التفصيلية.</li>
                                    </ul>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </div>

                {/* Per-file Charts */}
                {selectedFiles.length >= 2 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <div>
                                <h3 className="text-lg font-bold text-[#0F3D42]">مخططات تفصيلية لكل ملف</h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    يتم عرض بيانات كل ملف بشكل منفصل، ويمكنك التبديل بين مجموع القيم ومتوسطها.
                                </p>
                            </div>
                            <div className="flex items-center gap-2 rounded-full bg-gray-100 p-1">
                                {(['sum', 'average'] as const).map(metric => (
                                    <button
                                        key={metric}
                                        onClick={() => setNumericMetric(metric)}
                                        className={`px-3 py-1 text-xs font-semibold rounded-full transition ${numericMetric === metric
                                            ? 'bg-white text-[#1D6B73] shadow'
                                            : 'text-gray-500'
                                            }`}
                                        type="button"
                                    >
                                        {metric === 'sum' ? 'المجموع' : 'المتوسط'}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid gap-6 lg:grid-cols-2">
                            {selectedFiles.map((file, index) => {
                                const chartId = `file-chart-${file._id}`;
                                const chartData = perFileNumericData[file._id]?.[numericMetric] || [];
                                const chartLabel = `${numericMetric === 'sum' ? 'المجموع' : 'المتوسط'}_${file.displayName || file.fileName}`;

                                return (
                                    <Card key={file._id} className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                                        <CardHeader className="py-4 px-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
                                            <div>
                                                <CardTitle className="text-base font-semibold text-[#0F3D42]">
                                                    {file.displayName || file.fileName}
                                                </CardTitle>
                                                <p className="text-xs text-gray-500 mt-1">{file.rowCount} صف</p>
                                            </div>
                                            <Button
                                                size="sm"
                                                className="h-8 px-3 text-xs font-semibold text-white bg-[#1D6B73]"
                                                onClick={() => downloadChart(chartId, chartLabel)}
                                            >
                                                <Download className="h-3 w-3 ml-1" />
                                                تحميل
                                            </Button>
                                        </CardHeader>
                                        <CardContent className="p-5">
                                            <div
                                                id={chartId}
                                                className="p-4 rounded-2xl border border-gray-100"
                                            >
                                                {chartData.length > 0 ? (
                                                    <ResponsiveContainer width="100%" height={320}>
                                                        <BarChart data={chartData} margin={{ top: 20, right: 20, left: 0, bottom: 80 }}>
                                                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.5} />
                                                            <XAxis
                                                                dataKey="name"
                                                                tick={{ fill: PRIMARY_COLOR, fontSize: 11, fontWeight: 'bold' }}
                                                                angle={-35}
                                                                textAnchor="start"
                                                                height={90}
                                                                interval={0}
                                                                dy={10}
                                                            />
                                                            <YAxis
                                                                tick={{
                                                                    fill: PRIMARY_COLOR,
                                                                    fontSize: 11,
                                                                    fontWeight: 'bold',
                                                                    dx: -25,
                                                                }}

                                                            />
                                                            <Tooltip
                                                                contentStyle={{
                                                                    backgroundColor: '#ffffff',
                                                                    border: '2px solid #1D6B73',
                                                                    borderRadius: '6px',
                                                                    color: '#1D6B73',
                                                                    fontSize: '12px',
                                                                    fontWeight: '500',
                                                                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
                                                                }}
                                                                cursor={{ fill: 'rgba(0, 64, 122, 0.05)' }}
                                                            />
                                                            <Bar
                                                                dataKey="value"
                                                                name={numericMetric === 'sum' ? 'المجموع' : 'المتوسط'}
                                                                fill={COMPARISON_COLORS[index % COMPARISON_COLORS.length]}
                                                                radius={[8, 8, 0, 0]}
                                                            />
                                                        </BarChart>
                                                    </ResponsiveContainer>
                                                ) : (
                                                    <div className="flex h-64 flex-col items-center justify-center text-gray-500">
                                                        <BarChart3 className="h-12 w-12 mb-2 opacity-30" />
                                                        <p className="text-sm font-medium">لا توجد بيانات رقمية في هذا الملف</p>
                                                        <p className="text-xs mt-1 text-gray-400">تأكد من وجود أعمدة رقمية قابلة للتحليل</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* Comparison Tables - Multiple Files */}
                {selectedFiles.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                            <h3 className="text-lg font-bold text-[#0F3D42]">تفاصيل الملفات المحددة</h3>
                            <p className="text-xs text-gray-500">يمكنك إزالة أي ملف من المقارنة عبر زر الإغلاق</p>
                        </div>
                        <div className="grid gap-4 lg:grid-cols-2">
                            {selectedFiles.map((excelData) => (
                                <Card key={excelData._id} className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                                    <CardHeader
                                        className="py-3 px-5 text-white rounded-t-2xl"
                                        style={{ background: `linear-gradient(120deg, ${PRIMARY_COLOR}, ${PRIMARY_DARK})` }}
                                    >
                                        <div className="flex justify-between items-center">
                                            <CardTitle className="text-sm font-semibold">
                                                {excelData.displayName || excelData.fileName}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs opacity-90">{excelData.rowCount} صف</span>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-white hover:bg-white/20 h-6 w-6 p-0"
                                                    onClick={() => removeFileFromSelection(excelData._id)}
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        </div>
                                        {excelData.description && (
                                            <p className="text-xs opacity-90 mt-1">{excelData.description}</p>
                                        )}
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="overflow-x-auto">
                                            <Table className="border-collapse text-sm" dir="rtl">
                                                <TableHeader>
                                                    <TableRow
                                                        style={{ background: `linear-gradient(90deg, ${PRIMARY_COLOR}, ${PRIMARY_DARK})` }}
                                                    >
                                                        {excelData.headers.map((header: string, index: number) => (
                                                            <TableHead
                                                                key={index}
                                                                className="text-white font-semibold text-center border border-white/20 py-2 text-xs"
                                                            >
                                                                {header}
                                                            </TableHead>
                                                        ))}
                                                    </TableRow>
                                                </TableHeader>
                                                <TableBody>
                                                    {excelData.data.map((row: any, rowIndex: number) => (
                                                        <TableRow
                                                            key={rowIndex}
                                                            className={rowIndex % 2 === 0 ? 'bg-[rgba(29,107,115,0.06)]' : 'bg-white'}
                                                        >
                                                            {excelData.headers.map((header: string, cellIndex: number) => (
                                                                <TableCell
                                                                    key={cellIndex}
                                                                    className="text-center border border-gray-200 py-2 text-xs text-gray-700"
                                                                >
                                                                    {row[header] || '-'}
                                                                </TableCell>
                                                            ))}
                                                        </TableRow>
                                                    ))}
                                                </TableBody>
                                            </Table>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}

                {/* Empty State */}
                {!user && (
                    <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <FileSpreadsheet className="h-20 w-20 text-[#1D6B73]/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">
                                مرحباً بك في وحدة التصنيفات العالمية
                            </h3>
                            <p className="text-gray-500 mb-6 text-sm">
                                قم بتسجيل الدخول لعرض ومقارنة ملفات Excel
                            </p>
                            <div className="flex gap-3 justify-center">
                                <Button
                                    onClick={() => navigate('/login')}
                                    className="font-semibold text-white"
                                    style={{ backgroundColor: PRIMARY_COLOR }}
                                >
                                    تسجيل دخول
                                </Button>
                                <Button
                                    onClick={() => navigate('/signup')}
                                    variant="outline"
                                    className="hover:bg-[rgba(29,107,115,0.08)]"
                                    style={{ borderColor: PRIMARY_COLOR, color: PRIMARY_COLOR }}
                                >
                                    إنشاء حساب جديد
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {user && selectedFiles.length === 0 && allExcelFiles.length === 0 && !loading && (
                    <Card className="shadow-lg border border-gray-200 bg-white rounded-2xl">
                        <CardContent className="p-12 text-center">
                            <FileSpreadsheet className="h-20 w-20 text-[#1D6B73]/30 mx-auto mb-4" />
                            <h3 className="text-xl font-bold text-gray-700 mb-2">لا توجد بيانات لعرضها</h3>
                            <p className="text-gray-500 text-sm">
                                {user.role === 'admin'
                                    ? 'ارفع ملف Excel لبدء استخراج وعرض البيانات'
                                    : 'لا توجد ملفات متاحة للعرض حالياً'}
                            </p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
};

export default Home;
