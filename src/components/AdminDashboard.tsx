import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  Home, 
  UserCheck, 
  CreditCard, 
  HandCoins, 
  Users, 
  MessageSquare, 
  FileText, 
  Settings, 
  LogOut,
  Bell,
  Search,
  TrendingUp,
  DollarSign,
  Clock,
  CheckCircle,
  Menu,
  X
} from 'lucide-react';

interface Mitra {
  id: string;
  nama: string;
  email: string;
  wa: string;
  status_verifikasi: string;
  saldo: number;
}

interface TopUp {
  id: string;
  mitra_id: string;
  nominal: number;
  wa: string;
  status: string;
  mitra?: {
    nama: string;
    email: string;
    wa: string;
  };
}

interface ChatMessage {
  id: string;
  from_id: string;
  to_id: string;
  message: string;
  timestamp: string;
}

interface Invoice {
  id: string;
  pesanan_id: string;
  mitra_id: string;
  waktu_mulai: string;
  waktu_selesai: string;
  total: number;
  mitra?: {
    nama: string;
    email: string;
  };
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('beranda');
  const [mitras, setMitras] = useState<Mitra[]>([]);
  const [topups, setTopups] = useState<TopUp[]>([]);
  const [chats, setChats] = useState<ChatMessage[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [newChatMessage, setNewChatMessage] = useState('');
  const [selectedMitra, setSelectedMitra] = useState('');
  const [manualSaldo, setManualSaldo] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchMitras();
    fetchTopups();
    fetchChats();
    fetchInvoices();
  }, []);

  const fetchMitras = async () => {
    const { data, error } = await supabase
      .from('mitra')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data mitra',
        variant: 'destructive',
      });
    } else {
      setMitras(data || []);
    }
  };

  const fetchTopups = async () => {
    const { data, error } = await supabase
      .from('topup')
      .select(`
        *,
        mitra (nama, email, wa)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data topup',
        variant: 'destructive',
      });
    } else {
      setTopups(data || []);
    }
  };

  const fetchChats = async () => {
    const { data, error } = await supabase
      .from('chat')
      .select('*')
      .order('timestamp', { ascending: false });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data chat',
        variant: 'destructive',
      });
    } else {
      setChats(data || []);
    }
  };

  const fetchInvoices = async () => {
    const { data, error } = await supabase
      .from('invoice')
      .select(`
        *,
        mitra (nama, email)
      `)
      .order('created_at', { ascending: false });
    
    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data invoice',
        variant: 'destructive',
      });
    } else {
      setInvoices(data || []);
    }
  };

  const verifyMitra = async (mitraId: string) => {
    const { error } = await supabase
      .from('mitra')
      .update({ status_verifikasi: 'sudah' })
      .eq('id', mitraId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal memverifikasi mitra',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Mitra berhasil diverifikasi',
      });
      fetchMitras();
    }
  };

  const approveTopup = async (topupId: string, mitraId: string, nominal: number) => {
    const { error: topupError } = await supabase
      .from('topup')
      .update({ status: 'disetujui' })
      .eq('id', topupId);

    if (topupError) {
      toast({
        title: 'Error',
        description: 'Gagal menyetujui topup',
        variant: 'destructive',
      });
      return;
    }

    const { data: currentMitra, error: fetchError } = await supabase
      .from('mitra')
      .select('saldo')
      .eq('id', mitraId)
      .single();

    if (fetchError) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data saldo mitra',
        variant: 'destructive',
      });
      return;
    }

    const { error: saldoError } = await supabase
      .from('mitra')
      .update({ saldo: currentMitra.saldo + nominal })
      .eq('id', mitraId);

    if (saldoError) {
      toast({
        title: 'Error',
        description: 'Gagal menambah saldo mitra',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Topup berhasil disetujui dan saldo ditambahkan',
      });
      fetchTopups();
      fetchMitras();
    }
  };

  const rejectTopup = async (topupId: string) => {
    const { error } = await supabase
      .from('topup')
      .update({ status: 'ditolak' })
      .eq('id', topupId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal menolak topup',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Topup berhasil ditolak',
      });
      fetchTopups();
    }
  };

  const sendManualSaldo = async () => {
    if (!selectedMitra || !manualSaldo) {
      toast({
        title: 'Error',
        description: 'Pilih mitra dan masukkan nominal',
        variant: 'destructive',
      });
      return;
    }

    const { data: currentMitra, error: fetchError } = await supabase
      .from('mitra')
      .select('saldo')
      .eq('id', selectedMitra)
      .single();

    if (fetchError) {
      toast({
        title: 'Error',
        description: 'Gagal mengambil data saldo mitra',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('mitra')
      .update({ saldo: currentMitra.saldo + parseInt(manualSaldo) })
      .eq('id', selectedMitra);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengirim saldo manual',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Saldo manual berhasil dikirim',
      });
      setSelectedMitra('');
      setManualSaldo('');
      fetchMitras();
    }
  };

  const sendChatMessage = async (toId: string) => {
    if (!newChatMessage.trim()) return;

    const { error } = await supabase
      .from('chat')
      .insert([
        {
          from_id: 'admin',
          to_id: toId,
          message: newChatMessage,
        },
      ]);

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengirim pesan',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Pesan berhasil dikirim',
      });
      setNewChatMessage('');
      fetchChats();
    }
  };

  const changePassword = async () => {
    if (!newPassword) {
      toast({
        title: 'Error',
        description: 'Masukkan password baru',
        variant: 'destructive',
      });
      return;
    }

    const { error } = await supabase
      .from('admin_credentials')
      .update({ password: newPassword })
      .eq('username', 'admin');

    if (error) {
      toast({
        title: 'Error',
        description: 'Gagal mengubah password',
        variant: 'destructive',
      });
    } else {
      toast({
        title: 'Success',
        description: 'Password berhasil diubah',
      });
      setNewPassword('');
    }
  };

  const logout = () => {
    localStorage.removeItem('adminSession');
    window.location.reload();
  };

  const stats = [
    {
      title: 'Total Mitra',
      value: mitras.length,
      icon: Users,
      color: 'from-blue-500 to-blue-600',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
      change: '+12%'
    },
    {
      title: 'Total Saldo',
      value: `${(mitras.reduce((sum, mitra) => sum + mitra.saldo, 0) / 1000000).toFixed(1)}M`,
      icon: DollarSign,
      color: 'from-green-500 to-green-600',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
      change: '+8%'
    },
    {
      title: 'Pending',
      value: topups.filter(t => t.status === 'menunggu').length,
      icon: Clock,
      color: 'from-orange-500 to-orange-600',
      bgColor: 'bg-orange-50',
      textColor: 'text-orange-600',
      change: '-5%'
    },
    {
      title: 'Invoice',
      value: invoices.length,
      icon: FileText,
      color: 'from-purple-500 to-purple-600',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
      change: '+23%'
    }
  ];

  const tabItems = [
    { id: 'beranda', label: 'Home', icon: Home },
    { id: 'verifikasi', label: 'Verify', icon: UserCheck },
    { id: 'topup', label: 'TopUp', icon: CreditCard },
    { id: 'manual', label: 'Manual', icon: HandCoins },
    { id: 'kelola', label: 'Manage', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Mobile Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/50">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">SmartCare</h1>
                <p className="text-xs text-slate-500">Admin Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative">
                <Button variant="ghost" size="sm" className="relative p-2 rounded-full">
                  <Bell className="h-5 w-5 text-slate-600" />
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-medium">
                    3
                  </span>
                </Button>
              </div>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                className="p-2 rounded-full"
              >
                {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="absolute right-0 top-16 w-64 bg-white rounded-l-3xl shadow-2xl p-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-3 p-3 rounded-2xl bg-slate-50">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-semibold">A</span>
                </div>
                <div>
                  <p className="font-semibold text-slate-800">Admin</p>
                  <p className="text-xs text-slate-500">admin@smartcare.com</p>
                </div>
              </div>
              <Button 
                onClick={logout} 
                variant="ghost" 
                className="w-full justify-start text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-3" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Mobile Tab Navigation */}
          <div className="sticky top-20 z-30 bg-white/80 backdrop-blur-xl rounded-3xl shadow-lg border border-slate-200/50 p-2">
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1">
              {tabItems.slice(0, 4).map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id}
                  className="flex flex-col items-center space-y-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl py-3 px-2 transition-all duration-300"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
            
            {/* Second row of tabs */}
            <TabsList className="grid w-full grid-cols-4 bg-transparent gap-1 mt-2">
              {tabItems.slice(4).map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id}
                  className="flex flex-col items-center space-y-1 data-[state=active]:bg-gradient-to-br data-[state=active]:from-indigo-500 data-[state=active]:to-purple-500 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-2xl py-3 px-2 transition-all duration-300"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="text-xs font-medium">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="beranda" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 gap-4">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-lg bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-2xl ${stat.bgColor}`}>
                        <stat.icon className={`h-5 w-5 ${stat.textColor}`} />
                      </div>
                      <div className="flex items-center text-xs text-green-600 font-medium">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {stat.change}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 mb-1">{stat.title}</p>
                      <p className="text-lg font-bold text-slate-800">{stat.value}</p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <UserCheck className="h-5 w-5 mr-2" />
                        <h3 className="font-semibold">Verifikasi Pending</h3>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {mitras.filter(mitra => mitra.status_verifikasi === 'belum').length}
                      </div>
                      <p className="text-indigo-100 text-sm">Mitra menunggu verifikasi</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <UserCheck className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg rounded-3xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center mb-2">
                        <Clock className="h-5 w-5 mr-2" />
                        <h3 className="font-semibold">TopUp Pending</h3>
                      </div>
                      <div className="text-2xl font-bold mb-1">
                        {topups.filter(t => t.status === 'menunggu').length}
                      </div>
                      <p className="text-emerald-100 text-sm">Permintaan topup menunggu</p>
                    </div>
                    <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                      <Clock className="h-8 w-8" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verifikasi" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Verifikasi Mitra
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {mitras.filter(mitra => mitra.status_verifikasi === 'belum').map(mitra => (
                    <div key={mitra.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{mitra.nama.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{mitra.nama}</h3>
                            <p className="text-xs text-slate-500">{mitra.email}</p>
                            <p className="text-xs text-slate-500">{mitra.wa}</p>
                          </div>
                        </div>
                        <Button 
                          onClick={() => verifyMitra(mitra.id)}
                          size="sm"
                          className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topup" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Konfirmasi TopUp
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {topups.filter(topup => topup.status === 'menunggu').map(topup => (
                    <div key={topup.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-2xl flex items-center justify-center">
                            <DollarSign className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{topup.mitra?.nama}</h3>
                            <p className="text-xs text-slate-500">Rp {topup.nominal.toLocaleString()}</p>
                            <p className="text-xs text-slate-500">{topup.wa}</p>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => approveTopup(topup.id, topup.mitra_id, topup.nominal)}
                          size="sm"
                          className="flex-1 bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 text-white rounded-xl shadow-lg"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Approve
                        </Button>
                        <Button 
                          onClick={() => rejectTopup(topup.id)}
                          variant="outline"
                          size="sm"
                          className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <HandCoins className="h-5 w-5 mr-2" />
                  Kirim Saldo Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mitra-select" className="text-sm font-medium text-slate-700">Pilih Mitra</Label>
                    <Select value={selectedMitra} onValueChange={setSelectedMitra}>
                      <SelectTrigger className="mt-2 border-slate-200 focus:border-indigo-500 rounded-2xl bg-slate-50">
                        <SelectValue placeholder="Pilih mitra" />
                      </SelectTrigger>
                      <SelectContent>
                        {mitras.map(mitra => (
                          <SelectItem key={mitra.id} value={mitra.id}>
                            {mitra.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="manual-saldo" className="text-sm font-medium text-slate-700">Nominal</Label>
                    <Input
                      id="manual-saldo"
                      type="number"
                      value={manualSaldo}
                      onChange={(e) => setManualSaldo(e.target.value)}
                      placeholder="Masukkan nominal"
                      className="mt-2 border-slate-200 focus:border-indigo-500 rounded-2xl bg-slate-50"
                    />
                  </div>
                  <Button 
                    onClick={sendManualSaldo}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    Kirim Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kelola" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <Users className="h-5 w-5 mr-2" />
                  Kelola Mitra
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {mitras.map(mitra => (
                    <div key={mitra.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-2xl flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">{mitra.nama.charAt(0).toUpperCase()}</span>
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{mitra.nama}</h3>
                            <p className="text-xs text-slate-500">{mitra.email}</p>
                            <p className="text-xs text-slate-500">Rp {mitra.saldo.toLocaleString()}</p>
                            <Badge variant={mitra.status_verifikasi === 'sudah' ? 'default' : 'secondary'} className="mt-1 text-xs">
                              {mitra.status_verifikasi}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="flex-1 border-slate-200 rounded-xl">
                          Detail
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="flex-1 border-red-300 text-red-600 hover:bg-red-50 rounded-xl">
                              Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-3xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Mitra</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus mitra {mitra.nama}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-2xl">Batal</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600 rounded-2xl">Hapus</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="chat" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {chats.map(chat => (
                    <div key={chat.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-semibold text-slate-800 text-sm">
                            {chat.from_id === 'admin' ? 'Admin' : chat.from_id}
                          </p>
                          <p className="text-sm text-slate-600">{chat.message}</p>
                        </div>
                        <p className="text-xs text-slate-500">
                          {new Date(chat.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {chat.from_id !== 'admin' && (
                        <div className="mt-3 space-y-2">
                          <Input
                            placeholder="Balas pesan..."
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            className="border-slate-200 focus:border-indigo-500 rounded-2xl bg-white"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => sendChatMessage(chat.from_id)}
                            className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
                          >
                            <MessageSquare className="h-3 w-3 mr-2" />
                            Kirim
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="invoice" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <FileText className="h-5 w-5 mr-2" />
                  Laporan Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-3">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="p-4 bg-slate-50 rounded-2xl">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center">
                            <FileText className="h-6 w-6 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold text-slate-800 text-sm">{invoice.mitra?.nama}</h3>
                            <p className="text-xs text-slate-500">
                              Rp {invoice.total.toLocaleString()}
                            </p>
                            <p className="text-xs text-slate-500">
                              {new Date(invoice.waktu_mulai).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <Button variant="outline" size="sm" className="border-slate-200 rounded-xl">
                          Unduh
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card className="border-0 shadow-lg rounded-3xl bg-white/80 backdrop-blur-sm">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center text-slate-800 text-lg">
                  <Settings className="h-5 w-5 mr-2" />
                  Pengaturan
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-password" className="text-sm font-medium text-slate-700">Password Baru</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="mt-2 border-slate-200 focus:border-indigo-500 rounded-2xl bg-slate-50"
                    />
                  </div>
                  <Button 
                    onClick={changePassword}
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white rounded-2xl shadow-lg"
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Ubah Password
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminDashboard;
