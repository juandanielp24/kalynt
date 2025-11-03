'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Button,
  Input,
  Label,
} from '@retail/ui';
import { Store } from 'lucide-react';
import { useAuthContext } from '@/lib/auth/provider';
import { toast } from 'sonner';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuthContext();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    tenantName: '',
    tenantSlug: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));

    // Auto-generate slug from tenant name
    if (field === 'tenantName' && !formData.tenantSlug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setFormData((prev) => ({ ...prev, tenantSlug: slug }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    if (formData.password.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setIsLoading(true);

    try {
      await register({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        tenantName: formData.tenantName,
        tenantSlug: formData.tenantSlug,
      });

      toast.success('Cuenta creada exitosamente', {
        description: 'Redirigiendo al dashboard...',
      });

      // El hook ya hace auto-login después del registro
      setTimeout(() => {
        router.push('/dashboard');
      }, 1000);
    } catch (error: any) {
      toast.error('Error al crear la cuenta', {
        description: error.message || 'Intenta nuevamente',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary">
            <Store className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Crear cuenta nueva
          </CardTitle>
          <CardDescription>
            Registra tu empresa y comienza a usar Retail Super App
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Juan Pérez"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                required
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="admin@ejemplo.com"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                required
                autoComplete="email"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={formData.confirmPassword}
                onChange={(e) => handleChange('confirmPassword', e.target.value)}
                required
                autoComplete="new-password"
                disabled={isLoading}
              />
            </div>

            <div className="border-t pt-4">
              <p className="text-sm font-medium mb-3">Información de la empresa</p>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="tenantName">Nombre de la empresa</Label>
                  <Input
                    id="tenantName"
                    type="text"
                    placeholder="Mi Empresa S.A."
                    value={formData.tenantName}
                    onChange={(e) => handleChange('tenantName', e.target.value)}
                    required
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tenantSlug">
                    Identificador único
                  </Label>
                  <Input
                    id="tenantSlug"
                    type="text"
                    placeholder="mi-empresa"
                    value={formData.tenantSlug}
                    onChange={(e) => handleChange('tenantSlug', e.target.value)}
                    required
                    disabled={isLoading}
                    pattern="[a-z0-9-]+"
                  />
                  <p className="text-xs text-muted-foreground">
                    Solo letras minúsculas, números y guiones
                  </p>
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? 'Creando cuenta...' : 'Crear cuenta'}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <p className="text-muted-foreground">
              ¿Ya tienes cuenta?{' '}
              <Link
                href="/login"
                className="text-primary hover:underline font-medium"
              >
                Iniciar sesión
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
