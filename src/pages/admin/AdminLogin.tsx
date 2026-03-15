import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { useAdminStore } from '@/store/adminStore';
import { toast } from '@/hooks/use-toast';

export default function AdminLogin() {
  const [password, setPassword] = useState('');
  const login = useAdminStore((s) => s.login);
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(password)) {
      navigate('/admin');
    } else {
      toast({ title: 'Senha incorreta', variant: 'destructive' });
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-sm rounded-container bg-card p-8 shadow-elevated"
      >
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock size={20} className="text-primary" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Painel Admin</h1>
          <p className="mt-1 text-sm text-muted-foreground">Taty Docinhos</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            className="w-full rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Entrar
          </motion.button>
        </form>
        <p className="mt-4 text-center text-xs text-muted-foreground">Senha demo: taty2024</p>
      </motion.div>
    </div>
  );
}
