
// Supabase Configuration
const SUPABASE_URL = "https://xkbhdmpalgurcctylemv.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYmhkbXBhbGd1cmNjdHlsZW12Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM1ODMxNTYsImV4cCI6MjA2OTE1OTE1Nn0.6k2hRb6rrjHj4tc-yNWNsi0v7Hxk6modx8dt1Gls2wI";

// Initialize Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Utility Functions
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0
    }).format(amount);
}

function formatDate(date) {
    return new Date(date).toLocaleDateString('id-ID', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Auth Functions
async function registerAdmin(username, password) {
    try {
        const { data, error } = await supabase
            .from('admin_credentials')
            .insert([{ username, password }]);
        
        if (error) throw error;
        
        return { success: true, message: 'Admin berhasil didaftarkan' };
    } catch (error) {
        console.error('Error registering admin:', error);
        return { success: false, message: 'Gagal mendaftarkan admin' };
    }
}

async function loginAdmin(username, password) {
    try {
        const { data, error } = await supabase
            .from('admin_credentials')
            .select('*')
            .eq('username', username)
            .eq('password', password)
            .single();
        
        if (error) throw error;
        
        if (data) {
            localStorage.setItem('adminData', JSON.stringify(data));
            return { success: true, data };
        } else {
            return { success: false, message: 'Username atau password salah' };
        }
    } catch (error) {
        console.error('Error logging in:', error);
        return { success: false, message: 'Username atau password salah' };
    }
}

async function checkAdminAuth() {
    const adminData = localStorage.getItem('adminData');
    if (!adminData) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

function logout() {
    localStorage.removeItem('adminData');
    window.location.href = 'login.html';
}

// Dashboard Functions
async function loadDashboardStats() {
    try {
        // Total Mitra
        const { data: mitraData, error: mitraError } = await supabase
            .from('mitra')
            .select('*');
        
        if (mitraError) throw mitraError;
        
        // Total Saldo
        const totalSaldo = mitraData.reduce((sum, mitra) => sum + mitra.saldo, 0);
        
        // Top Up Menunggu
        const { data: topupData, error: topupError } = await supabase
            .from('topup')
            .select('*')
            .eq('status', 'menunggu');
        
        if (topupError) throw topupError;
        
        // Total Invoice
        const { data: invoiceData, error: invoiceError } = await supabase
            .from('invoice')
            .select('*');
        
        if (invoiceError) throw invoiceError;
        
        // Update UI
        document.getElementById('totalMitra').textContent = mitraData.length;
        document.getElementById('totalSaldo').textContent = formatCurrency(totalSaldo);
        document.getElementById('topupMenunggu').textContent = topupData.length;
        document.getElementById('totalInvoice').textContent = invoiceData.length;
        
    } catch (error) {
        console.error('Error loading dashboard stats:', error);
        showNotification('Gagal memuat statistik dashboard', 'error');
    }
}

async function loadRecentActivities() {
    try {
        const activities = [];
        
        // Recent registrations
        const { data: newMitra, error: mitraError } = await supabase
            .from('mitra')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!mitraError) {
            newMitra.forEach(mitra => {
                activities.push({
                    message: `Mitra baru: ${mitra.nama}`,
                    time: mitra.created_at,
                    type: 'mitra'
                });
            });
        }
        
        // Recent topups
        const { data: recentTopup, error: topupError } = await supabase
            .from('topup')
            .select('*, mitra(nama)')
            .order('created_at', { ascending: false })
            .limit(3);
        
        if (!topupError) {
            recentTopup.forEach(topup => {
                activities.push({
                    message: `Top up ${formatCurrency(topup.nominal)} dari ${topup.mitra.nama}`,
                    time: topup.created_at,
                    type: 'topup'
                });
            });
        }
        
        // Sort by time
        activities.sort((a, b) => new Date(b.time) - new Date(a.time));
        
        // Update UI
        const activityList = document.getElementById('recentActivities');
        activityList.innerHTML = activities.slice(0, 5).map(activity => `
            <div class="activity-item">
                <strong>${activity.message}</strong><br>
                <small>${formatDate(activity.time)}</small>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading recent activities:', error);
    }
}

// Verifikasi Mitra Functions
async function loadVerifikasiMitra() {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .eq('status_verifikasi', 'belum')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tableBody = document.getElementById('verifikasiTable');
        tableBody.innerHTML = data.map(mitra => `
            <tr>
                <td>${mitra.nama}</td>
                <td>${mitra.email}</td>
                <td>${mitra.wa}</td>
                <td><span class="badge badge-warning">${mitra.status_verifikasi}</span></td>
                <td>
                    <button class="btn btn-success" onclick="verifikasiMitra('${mitra.id}')">
                        <i class="fas fa-check"></i> Verifikasi
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading verifikasi mitra:', error);
        showNotification('Gagal memuat data verifikasi mitra', 'error');
    }
}

async function verifikasiMitra(mitraId) {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .update({ status_verifikasi: 'sudah' })
            .eq('id', mitraId);
        
        if (error) throw error;
        
        showNotification('Mitra berhasil diverifikasi!', 'success');
        await loadVerifikasiMitra();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error verifying mitra:', error);
        showNotification('Gagal memverifikasi mitra', 'error');
    }
}

// Top Up Functions
async function loadTopupRequests() {
    try {
        const { data, error } = await supabase
            .from('topup')
            .select('*, mitra(nama)')
            .eq('status', 'menunggu')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tableBody = document.getElementById('topupTable');
        tableBody.innerHTML = data.map(topup => `
            <tr>
                <td>${topup.mitra.nama}</td>
                <td>${formatCurrency(topup.nominal)}</td>
                <td>${topup.wa}</td>
                <td><span class="badge badge-warning">${topup.status}</span></td>
                <td>${formatDate(topup.created_at)}</td>
                <td>
                    <button class="btn btn-success" onclick="approveTopup('${topup.id}', '${topup.mitra_id}', ${topup.nominal})">
                        <i class="fas fa-check"></i> Setujui
                    </button>
                    <button class="btn btn-danger" onclick="rejectTopup('${topup.id}')">
                        <i class="fas fa-times"></i> Tolak
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading topup requests:', error);
        showNotification('Gagal memuat permintaan top up', 'error');
    }
}

async function approveTopup(topupId, mitraId, nominal) {
    try {
        // Update topup status
        const { error: topupError } = await supabase
            .from('topup')
            .update({ status: 'disetujui' })
            .eq('id', topupId);
        
        if (topupError) throw topupError;
        
        // Update mitra saldo
        const { data: mitraData, error: mitraError } = await supabase
            .from('mitra')
            .select('saldo')
            .eq('id', mitraId)
            .single();
        
        if (mitraError) throw mitraError;
        
        const { error: updateError } = await supabase
            .from('mitra')
            .update({ saldo: mitraData.saldo + nominal })
            .eq('id', mitraId);
        
        if (updateError) throw updateError;
        
        showNotification('Top up berhasil disetujui!', 'success');
        await loadTopupRequests();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error approving topup:', error);
        showNotification('Gagal menyetujui top up', 'error');
    }
}

async function rejectTopup(topupId) {
    try {
        const { error } = await supabase
            .from('topup')
            .update({ status: 'ditolak' })
            .eq('id', topupId);
        
        if (error) throw error;
        
        showNotification('Top up berhasil ditolak!', 'success');
        await loadTopupRequests();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error rejecting topup:', error);
        showNotification('Gagal menolak top up', 'error');
    }
}

// Manual Saldo Functions
async function loadMitraSelect() {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .eq('status_verifikasi', 'sudah')
            .order('nama');
        
        if (error) throw error;
        
        const select = document.getElementById('mitraSelect');
        select.innerHTML = '<option value="">Pilih Mitra</option>' +
            data.map(mitra => `<option value="${mitra.id}">${mitra.nama} (${formatCurrency(mitra.saldo)})</option>`).join('');
        
    } catch (error) {
        console.error('Error loading mitra select:', error);
        showNotification('Gagal memuat data mitra', 'error');
    }
}

async function kirimSaldoManual(mitraId, nominal) {
    try {
        // Get current saldo
        const { data: mitraData, error: mitraError } = await supabase
            .from('mitra')
            .select('saldo')
            .eq('id', mitraId)
            .single();
        
        if (mitraError) throw mitraError;
        
        // Update saldo
        const { error: updateError } = await supabase
            .from('mitra')
            .update({ saldo: mitraData.saldo + nominal })
            .eq('id', mitraId);
        
        if (updateError) throw updateError;
        
        return { success: true, message: 'Saldo berhasil dikirim' };
        
    } catch (error) {
        console.error('Error sending manual saldo:', error);
        return { success: false, message: 'Gagal mengirim saldo' };
    }
}

// Kelola Mitra Functions
async function loadAllMitra() {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tableBody = document.getElementById('kelolaMitraTable');
        tableBody.innerHTML = data.map(mitra => `
            <tr>
                <td>${mitra.nama}</td>
                <td>${mitra.email}</td>
                <td>${mitra.wa}</td>
                <td><span class="badge badge-${mitra.status_verifikasi === 'sudah' ? 'success' : 'warning'}">${mitra.status_verifikasi}</span></td>
                <td>${formatCurrency(mitra.saldo)}</td>
                <td>
                    <button class="btn btn-warning" onclick="showMitraDetail('${mitra.id}')">
                        <i class="fas fa-eye"></i> Detail
                    </button>
                    <button class="btn btn-danger" onclick="deleteMitra('${mitra.id}')">
                        <i class="fas fa-trash"></i> Hapus
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading all mitra:', error);
        showNotification('Gagal memuat data mitra', 'error');
    }
}

async function deleteMitra(mitraId) {
    if (!confirm('Apakah Anda yakin ingin menghapus mitra ini?')) return;
    
    try {
        const { error } = await supabase
            .from('mitra')
            .delete()
            .eq('id', mitraId);
        
        if (error) throw error;
        
        showNotification('Mitra berhasil dihapus!', 'success');
        await loadAllMitra();
        await loadDashboardStats();
        
    } catch (error) {
        console.error('Error deleting mitra:', error);
        showNotification('Gagal menghapus mitra', 'error');
    }
}

function showMitraDetail(mitraId) {
    // This would typically open a modal or navigate to a detail page
    alert(`Detail mitra ID: ${mitraId}`);
}

// Chat Functions
async function loadChatMessages() {
    try {
        const { data, error } = await supabase
            .from('chat')
            .select('*')
            .order('timestamp', { ascending: true });
        
        if (error) throw error;
        
        const chatMessages = document.getElementById('chatMessages');
        chatMessages.innerHTML = data.map(message => `
            <div class="chat-message ${message.from_id === 'admin' ? 'admin' : 'user'}">
                <strong>${message.from_id}:</strong> ${message.message}<br>
                <small>${formatDate(message.timestamp)}</small>
            </div>
        `).join('');
        
        // Scroll to bottom
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
    } catch (error) {
        console.error('Error loading chat messages:', error);
        showNotification('Gagal memuat pesan chat', 'error');
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chatInput');
    const message = input.value.trim();
    
    if (!message) return;
    
    try {
        const { error } = await supabase
            .from('chat')
            .insert([{
                from_id: 'admin',
                to_id: 'user',
                message: message
            }]);
        
        if (error) throw error;
        
        input.value = '';
        await loadChatMessages();
        
    } catch (error) {
        console.error('Error sending chat message:', error);
        showNotification('Gagal mengirim pesan', 'error');
    }
}

// Invoice Functions
async function loadInvoiceData() {
    try {
        const { data, error } = await supabase
            .from('invoice')
            .select('*, mitra(nama)')
            .order('created_at', { ascending: false });
        
        if (error) throw error;
        
        const tableBody = document.getElementById('invoiceTable');
        tableBody.innerHTML = data.map(invoice => `
            <tr>
                <td>${invoice.pesanan_id}</td>
                <td>${invoice.mitra.nama}</td>
                <td>${formatDate(invoice.waktu_mulai)}</td>
                <td>${invoice.waktu_selesai ? formatDate(invoice.waktu_selesai) : 'Belum selesai'}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="downloadInvoice('${invoice.id}')">
                        <i class="fas fa-download"></i> Unduh
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error loading invoice data:', error);
        showNotification('Gagal memuat data invoice', 'error');
    }
}

async function loadMitraFilter() {
    try {
        const { data, error } = await supabase
            .from('mitra')
            .select('*')
            .order('nama');
        
        if (error) throw error;
        
        const select = document.getElementById('filterMitra');
        select.innerHTML = '<option value="">Semua Mitra</option>' +
            data.map(mitra => `<option value="${mitra.id}">${mitra.nama}</option>`).join('');
        
    } catch (error) {
        console.error('Error loading mitra filter:', error);
    }
}

async function applyInvoiceFilter() {
    const mitraId = document.getElementById('filterMitra').value;
    const tanggal = document.getElementById('filterTanggal').value;
    
    try {
        let query = supabase
            .from('invoice')
            .select('*, mitra(nama)')
            .order('created_at', { ascending: false });
        
        if (mitraId) {
            query = query.eq('mitra_id', mitraId);
        }
        
        if (tanggal) {
            query = query.gte('waktu_mulai', tanggal);
        }
        
        const { data, error } = await query;
        
        if (error) throw error;
        
        const tableBody = document.getElementById('invoiceTable');
        tableBody.innerHTML = data.map(invoice => `
            <tr>
                <td>${invoice.pesanan_id}</td>
                <td>${invoice.mitra.nama}</td>
                <td>${formatDate(invoice.waktu_mulai)}</td>
                <td>${invoice.waktu_selesai ? formatDate(invoice.waktu_selesai) : 'Belum selesai'}</td>
                <td>${formatCurrency(invoice.total)}</td>
                <td>
                    <button class="btn btn-secondary" onclick="downloadInvoice('${invoice.id}')">
                        <i class="fas fa-download"></i> Unduh
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error applying invoice filter:', error);
        showNotification('Gagal menerapkan filter', 'error');
    }
}

function downloadInvoice(invoiceId) {
    // This would typically generate and download a PDF
    alert(`Mengunduh invoice ID: ${invoiceId}`);
}

// Settings Functions
async function changeAdminPassword(currentPassword, newPassword) {
    try {
        const adminData = JSON.parse(localStorage.getItem('adminData'));
        
        // Verify current password
        const { data: verifyData, error: verifyError } = await supabase
            .from('admin_credentials')
            .select('*')
            .eq('id', adminData.id)
            .eq('password', currentPassword)
            .single();
        
        if (verifyError || !verifyData) {
            return { success: false, message: 'Password lama tidak sesuai' };
        }
        
        // Update password
        const { error: updateError } = await supabase
            .from('admin_credentials')
            .update({ password: newPassword })
            .eq('id', adminData.id);
        
        if (updateError) throw updateError;
        
        // Update localStorage
        adminData.password = newPassword;
        localStorage.setItem('adminData', JSON.stringify(adminData));
        
        return { success: true, message: 'Password berhasil diubah' };
        
    } catch (error) {
        console.error('Error changing password:', error);
        return { success: false, message: 'Gagal mengubah password' };
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on the dashboard page
    if (document.getElementById('dashboard-container')) {
        checkAdminAuth();
    }
});
