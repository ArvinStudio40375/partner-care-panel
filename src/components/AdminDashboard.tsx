
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Admin SmartCare</h1>
            <Button onClick={logout} variant="outline">
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="beranda">Beranda</TabsTrigger>
            <TabsTrigger value="verifikasi">Verifikasi</TabsTrigger>
            <TabsTrigger value="topup">Top Up</TabsTrigger>
            <TabsTrigger value="manual">Manual</TabsTrigger>
            <TabsTrigger value="kelola">Kelola</TabsTrigger>
            <TabsTrigger value="chat">Chat</TabsTrigger>
            <TabsTrigger value="invoice">Invoice</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="beranda" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>Total Mitra</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{mitras.length}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Saldo Sistem</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    Rp {mitras.reduce((sum, mitra) => sum + mitra.saldo, 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Top Up Menunggu</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">
                    {topups.filter(t => t.status === 'menunggu').length}
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Total Invoice</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{invoices.length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="verifikasi" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Verifikasi Mitra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mitras.filter(mitra => mitra.status_verifikasi === 'belum').map(mitra => (
                    <div key={mitra.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{mitra.nama}</h3>
                        <p className="text-sm text-gray-600">{mitra.email}</p>
                        <p className="text-sm text-gray-600">{mitra.wa}</p>
                      </div>
                      <Button onClick={() => verifyMitra(mitra.id)}>
                        Verifikasi
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="topup" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Konfirmasi Top Up</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topups.filter(topup => topup.status === 'menunggu').map(topup => (
                    <div key={topup.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{topup.mitra?.nama}</h3>
                        <p className="text-sm text-gray-600">Nominal: Rp {topup.nominal.toLocaleString()}</p>
                        <p className="text-sm text-gray-600">WA: {topup.wa}</p>
                      </div>
                      <div className="space-x-2">
                        <Button 
                          onClick={() => approveTopup(topup.id, topup.mitra_id, topup.nominal)}
                          variant="default"
                        >
                          Setujui
                        </Button>
                        <Button 
                          onClick={() => rejectTopup(topup.id)}
                          variant="destructive"
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

          <TabsContent value="manual" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kirim Saldo Manual</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="mitra-select">Pilih Mitra</Label>
                    <Select value={selectedMitra} onValueChange={setSelectedMitra}>
                      <SelectTrigger>
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
                    <Label htmlFor="manual-saldo">Nominal</Label>
                    <Input
                      id="manual-saldo"
                      type="number"
                      value={manualSaldo}
                      onChange={(e) => setManualSaldo(e.target.value)}
                      placeholder="Masukkan nominal"
                    />
                  </div>
                  <Button onClick={sendManualSaldo}>Kirim Saldo</Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="kelola" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Kelola Mitra</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mitras.map(mitra => (
                    <div key={mitra.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{mitra.nama}</h3>
                        <p className="text-sm text-gray-600">{mitra.email}</p>
                        <p className="text-sm text-gray-600">Saldo: Rp {mitra.saldo.toLocaleString()}</p>
                        <Badge variant={mitra.status_verifikasi === 'sudah' ? 'default' : 'secondary'}>
                          {mitra.status_verifikasi}
                        </Badge>
                      </div>
                      <div className="space-x-2">
                        <Button variant="outline" size="sm">
                          Detail
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="sm">
                              Hapus
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Hapus Mitra</AlertDialogTitle>
                              <AlertDialogDescription>
                                Apakah Anda yakin ingin menghapus mitra {mitra.nama}?
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Batal</AlertDialogCancel>
                              <AlertDialogAction>Hapus</AlertDialogAction>
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
            <Card>
              <CardHeader>
                <CardTitle>Live Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {chats.map(chat => (
                    <div key={chat.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-semibold">
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
                          />
                          <Button 
                            size="sm" 
                            onClick={() => sendChatMessage(chat.from_id)}
                          >
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
            <Card>
              <CardHeader>
                <CardTitle>Laporan Invoice</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {invoices.map(invoice => (
                    <div key={invoice.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h3 className="font-semibold">{invoice.mitra?.nama}</h3>
                        <p className="text-sm text-gray-600">
                          Total: Rp {invoice.total.toLocaleString()}
                        </p>
                        <p className="text-sm text-gray-600">
                          Waktu: {new Date(invoice.waktu_mulai).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="outline" size="sm">
                        Unduh
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Pengaturan</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="new-password">Password Baru</Label>
                    <Input
                      id="new-password"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Masukkan password baru"
                    />
                  </div>
                  <Button onClick={changePassword}>Ubah Password</Button>
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
