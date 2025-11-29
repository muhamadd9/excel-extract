import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import logoImage from '@/assets/logo.png';

const Login = () => {
    const { register, handleSubmit, formState: { isSubmitting } } = useForm<{ email: string; password: string }>();

    const { login, user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        if (user) navigate('/');
    }, [user, navigate]);

    const onSubmit = async ({ email, password }: { email: string; password: string }) => {
        try {
            await login(email, password);
            toast.success('مرحباً بعودتك!');
            navigate('/');
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'فشل تسجيل الدخول');
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-white via-[rgba(29,107,115,0.05)] to-white" dir="rtl">
            <div className="flex-1 flex items-center justify-center py-20 px-4">
                <Card className="w-full max-w-md shadow-2xl border-0 border-t-4" style={{ borderColor: '#1D6B73' }}>
                    <CardHeader
                        className="text-center space-y-4 text-white rounded-t-lg pb-8"
                        style={{
                            background: 'linear-gradient(90deg, #1D6B73 0%, #155159 100%)',
                        }}
                    >
                        <div className="flex justify-center">
                            <img src={logoImage} alt="KFU Logo" className="h-20 w-20 object-contain" />
                        </div>
                        <CardTitle className="text-2xl">تسجيل الدخول</CardTitle>
                        <CardDescription className="text-white/90">وحدة التصنيفات العالمية - عمادة التطوير وضمان الجودة</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2" dir="rtl">
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    {...register('email', { required: true })}
                                    placeholder="example@email.com"
                                    dir="ltr"
                                />
                            </div>

                            <div className="space-y-2" dir="rtl">
                                <Label htmlFor="password">كلمة المرور</Label>
                                <Input
                                    id="password"
                                    type="password"
                                    {...register('password', { required: true, minLength: 6 })}
                                    placeholder="••••••••"
                                />
                            </div>

                            <Button
                                type="submit"
                                className="w-full font-semibold shadow-lg text-white"
                                style={{ backgroundColor: '#1D6B73' }}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'جاري التحميل...' : 'تسجيل الدخول'}
                            </Button>

                            <div className="text-center text-sm" dir="rtl">
                                <button
                                    type="button"
                                    onClick={() => navigate('/signup')}
                                    className="text-[#1D6B73] hover:text-[#155159] hover:underline"
                                >
                                    ليس لديك حساب؟ سجل الآن
                                </button>
                            </div>

                            <div className="text-center">
                                <button
                                    type="button"
                                    onClick={() => navigate('/')}
                                    className="text-sm text-gray-500 hover:text-gray-700"
                                >
                                    ← الرجوع للصفحة الرئيسية
                                </button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Login;


