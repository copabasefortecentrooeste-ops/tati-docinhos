import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

export default function AdminLogin() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsSubmitting(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setIsSubmitting(false);
      toast({
        title: 'Credenciais inválidas',
        description: 'Verifique o e-mail e a senha e tente novamente.',
        variant: 'destructive',
      });
      return;
    }

    // Verify admin role from app_metadata (set server-side via service-role key)
    const role = data.session?.user?.app_metadata?.role;
    if (role !== 'admin') {
      await supabase.auth.signOut();
      setIsSubmitting(false);
      toast({
        title: 'Acesso não autorizado',
        description: 'Esta conta não tem permissão de administrador.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(false);
    navigate(`/${slug}/admin`);
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
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="username"
            required
            className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <input
            type="password"
            placeholder="Senha de acesso"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
            className="w-full rounded-button border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <motion.button
            whileTap={{ scale: 0.95 }}
            type="submit"
            disabled={isSubmitting}
            className="w-full rounded-button bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {isSubmitting ? 'Entrando...' : 'Entrar'}
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
