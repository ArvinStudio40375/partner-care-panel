
-- Create table for admin credentials
CREATE TABLE public.admin_credentials (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for mitra
CREATE TABLE public.mitra (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  wa TEXT NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'mitra',
  status_verifikasi TEXT NOT NULL DEFAULT 'belum',
  saldo INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for topup
CREATE TABLE public.topup (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  mitra_id UUID NOT NULL,
  nominal INTEGER NOT NULL,
  wa TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'menunggu',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for chat
CREATE TABLE public.chat (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  from_id TEXT NOT NULL,
  to_id TEXT NOT NULL,
  message TEXT NOT NULL,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create table for invoice
CREATE TABLE public.invoice (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pesanan_id UUID NOT NULL,
  mitra_id UUID NOT NULL,
  waktu_mulai TIMESTAMP WITH TIME ZONE NOT NULL,
  waktu_selesai TIMESTAMP WITH TIME ZONE,
  total INTEGER NOT NULL,
  file_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.admin_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mitra ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.topup ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access
CREATE POLICY "Admin can view all admin_credentials" ON public.admin_credentials FOR SELECT USING (true);
CREATE POLICY "Admin can view all mitra" ON public.mitra FOR ALL USING (true);
CREATE POLICY "Admin can view all topup" ON public.topup FOR ALL USING (true);
CREATE POLICY "Admin can view all chat" ON public.chat FOR ALL USING (true);
CREATE POLICY "Admin can view all invoice" ON public.invoice FOR ALL USING (true);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_admin_credentials_updated_at BEFORE UPDATE ON public.admin_credentials FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_mitra_updated_at BEFORE UPDATE ON public.mitra FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_topup_updated_at BEFORE UPDATE ON public.topup FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();
CREATE TRIGGER update_invoice_updated_at BEFORE UPDATE ON public.invoice FOR EACH ROW EXECUTE PROCEDURE public.update_updated_at_column();

-- Insert default admin account
INSERT INTO public.admin_credentials (username, password) VALUES ('admin', 'admin123');

-- Insert sample data for testing
INSERT INTO public.mitra (nama, email, wa, password, status_verifikasi, saldo) VALUES 
('Mitra Test 1', 'mitra1@test.com', '081234567890', 'password123', 'belum', 100000),
('Mitra Test 2', 'mitra2@test.com', '081234567891', 'password123', 'sudah', 250000);

INSERT INTO public.topup (mitra_id, nominal, wa, status) VALUES
((SELECT id FROM public.mitra WHERE nama = 'Mitra Test 1'), 50000, '081234567890', 'menunggu'),
((SELECT id FROM public.mitra WHERE nama = 'Mitra Test 2'), 100000, '081234567891', 'menunggu');

INSERT INTO public.chat (from_id, to_id, message) VALUES
('mitra1', 'admin', 'Halo admin, saya butuh bantuan'),
('admin', 'mitra1', 'Halo, ada yang bisa saya bantu?');

INSERT INTO public.invoice (pesanan_id, mitra_id, waktu_mulai, waktu_selesai, total) VALUES
(gen_random_uuid(), (SELECT id FROM public.mitra WHERE nama = 'Mitra Test 1'), now() - interval '2 hours', now() - interval '1 hour', 75000),
(gen_random_uuid(), (SELECT id FROM public.mitra WHERE nama = 'Mitra Test 2'), now() - interval '1 hour', now(), 125000);
