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
  CheckCircle
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

    // Update mitra saldo
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
      color: 'bg-blue-500',
      change: '+12%'
    },
    {
      title: 'Total Saldo Sistem',
      value: `Rp ${mitras.reduce((sum, mitra) => sum + mitra.saldo, 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-green-500',
      change: '+8%'
    },
    {
      title: 'Top Up Menunggu',
      value: topups.filter(t => t.status === 'menunggu').length,
      icon: Clock,
      color: 'bg-orange-500',
      change: '-5%'
    },
    {
      title: 'Total Invoice',
      value: invoices.length,
      icon: FileText,
      color: 'bg-purple-500',
      change: '+23%'
    }
  ];

  const tabItems = [
    { id: 'beranda', label: 'Beranda', icon: Home },
    { id: 'verifikasi', label: 'Verifikasi', icon: UserCheck },
    { id: 'topup', label: 'Top Up', icon: CreditCard },
    { id: 'manual', label: 'Manual', icon: HandCoins },
    { id: 'kelola', label: 'Kelola', icon: Users },
    { id: 'chat', label: 'Chat', icon: MessageSquare },
    { id: 'invoice', label: 'Invoice', icon: FileText },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-800">SmartCare Admin</h1>
                <p className="text-sm text-gray-600">Dashboard Management</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Cari..." 
                  className="pl-10 w-64 border-gray-300 focus:border-orange-500"
                />
              </div>
              <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white">
                  3
                </span>
              </Button>
              <Button onClick={logout} variant="outline" size="sm" className="border-gray-300">
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-6 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          {/* Modern Tab Navigation */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-2">
            <TabsList className="grid w-full grid-cols-8 bg-gray-50 rounded-xl p-1">
              {tabItems.map((item) => (
                <TabsTrigger 
                  key={item.id} 
                  value={item.id}
                  className="flex items-center space-x-2 data-[state=active]:bg-white data-[state=active]:shadow-sm rounded-lg transition-all duration-200"
                >
                  <item.icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="beranda" className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => (
                <Card key={index} className="border-0 shadow-md hover:shadow-lg transition-shadow duration-200 bg-white rounded-2xl">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`p-3 rounded-xl ${stat.color} bg-opacity-10`}>
                          <stat.icon className={`h-6 w-6 ${stat.color.replace('bg-', 'text-')}`} />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                          <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                        </div>
                      </div>
                      <div className="flex items-center text-sm text-green-600">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {stat.change}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-r from-orange-500 to-red-500 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Verifikasi Menunggu
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {mitras.filter(mitra => mitra.status_verifikasi === 'belum').length}
                  </div>
                  <p className="text-orange-100">Mitra perlu diverifikasi</p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-r from-green-500 to-teal-500 text-white">
                <CardHeader>
                  <CardTitle className="flex items-center text-white">
                    <Clock className="h-5 w-5 mr-2" />
                    Top Up Pending
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold mb-2">
                    {topups.filter(t => t.status === 'menunggu').length}
                  </div>
                  <p className="text-green-100">Permintaan top up menunggu</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verifikasi" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <UserCheck className="h-5 w-5 mr-2" />
                  Verifikasi Mitra
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {mitras.filter(mitra => mitra.status_verifikasi === 'belum').map(mitra => (
                    <div key={mitra.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-semibold">{mitra.nama.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{mitra.nama}</h3>
                          <p className="text-sm text-gray-600">{mitra.email}</p>
                          <p className="text-sm text-gray-600">{mitra.wa}</p>
                        </div>
                      </div>
                      <Button 
                        onClick={() => verifyMitra(mitra.id)}
                        className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Verifikasi
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topup" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <CreditCard className="h-5 w-5 mr-2" />
                  Konfirmasi Top Up
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {topups.filter(topup => topup.status === 'menunggu').map(topup => (
                    <div key={topup.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center">
                          <DollarSign className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{topup.mitra?.nama}</h3>
                          <p className="text-sm text-gray-600">Nominal: Rp {topup.nominal.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">WA: {topup.wa}</p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button 
                          onClick={() => approveTopup(topup.id, topup.mitra_id, topup.nominal)}
                          className="bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600 text-white rounded-xl"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Setujui
                        </Button>
                        <Button 
                          onClick={() => rejectTopup(topup.id)}
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl"
                        >
                          Tolak
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="manual" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <HandCoins className="h-5 w-5 mr-2" />
                  Kirim Saldo Manual
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="mitra-select" className="text-sm font-medium text-gray-700">Pilih Mitra</Label>
                    <Select value={selectedMitra} onValueChange={setSelectedMitra}>
                      <SelectTrigger className="mt-2 border-gray-300 focus:border-orange-500 rounded-xl">
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
                    <Label htmlFor="manual-saldo" className="text-sm font-medium text-gray-700">Nominal</Label>
                    <Input
                      id="manual-saldo"
                      type="number"
                      value={manualSaldo}
                      onChange={(e) => setManualSaldo(e.target.value)}
                      placeholder="Masukkan nominal"
                      className="mt-2 border-gray-300 focus:border-orange-500 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={sendManualSaldo}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl"
                  >
                    <HandCoins className="h-4 w-4 mr-2" />
                    Kirim Saldo
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kelola" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <Users className="h-5 w-5 mr-2" />
                  Kelola Mitra
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {mitras.map(mitra => (
                    <div key={mitra.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl flex items-center justify-center">
                          <span className="text-white font-semibold">{mitra.nama.charAt(0).toUpperCase()}</span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{mitra.nama}</h3>
                          <p className="text-sm text-gray-600">{mitra.email}</p>
                          <p className="text-sm text-gray-600">Saldo: Rp {mitra.saldo.toLocaleString()}</p>
                          <Badge variant={mitra.status_verifikasi === 'sudah' ? 'default' : 'secondary'} className="mt-1">
                            {mitra.status_verifikasi}
                          </Badge>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm" className="border-gray-300 rounded-xl">
                          Detail
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="outline" size="sm" className="border-red-300 text-red-600 hover:bg-red-50 rounded-xl">
                              Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Mitra</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus mitra {mitra.nama}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Batal</AlertDialogCancel>
                              <AlertDialogAction className="bg-red-500 hover:bg-red-600 rounded-xl">Hapus</AlertDialogAction>
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

          <TabsContent value="chat" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <MessageSquare className="h-5 w-5 mr-2" />
                  Live Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {chats.map(chat => (
                    <div key={chat.id} className="p-4 bg-gray-50 rounded-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold text-gray-800">
                            {chat.from_id === 'admin' ? 'Admin' : chat.from_id}
                          </p>
                          <p className="text-sm text-gray-600">{chat.message}</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(chat.timestamp).toLocaleString()}
                        </p>
                      </div>
                      {chat.from_id !== 'admin' && (
                        <div className="mt-2 space-y-2">
                          <Input
                            placeholder="Balas pesan..."
                            value={newChatMessage}
                            onChange={(e) => setNewChatMessage(e.target.value)}
                            className="border-gray-300 focus:border-orange-500 rounded-xl"
                          />
                          <Button 
                            size="sm" 
                            onClick={() => sendChatMessage(chat.from_id)}
                            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl"
                          >
                            <MessageSquare className="h-4 w-4 mr-2" />
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

          <TabsContent value="invoice" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <FileText className="h-5 w-5 mr-2" />
                  Laporan Invoice
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-800">{invoice.mitra?.nama}</h3>
                          <p className="text-sm text-gray-600">
                            Total: Rp {invoice.total.toLocaleString()}
                          </p>
                          <p className="text-sm text-gray-600">
                            Waktu: {new Date(invoice.waktu_mulai).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" className="border-gray-300 rounded-xl">
                        Unduh
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <Card className="border-0 shadow-md rounded-2xl bg-white">
              <CardHeader className="border-b border-gray-100">
                <CardTitle className="flex items-center text-gray-800">
                  <Settings className="h-5 w-5 mr-2" />
                  Pengaturan
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="new-password" className="text-sm font-medium text-gray-700">Password Baru</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                      className="mt-2 border-gray-300 focus:border-orange-500 rounded-xl"
                    />
                  </div>
                  <Button 
                    onClick={changePassword}
                    className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-xl"
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
