import { Suspense } from 'react';
import MiCuentaConfiguracionPage from '@/app/cuenta/page';
import { WanderlustLoader } from '@/components/WanderlustLoader';

export default function ConfiguracionPage() {
  return (
    <Suspense fallback={<WanderlustLoader />}>
      <MiCuentaConfiguracionPage />
    </Suspense>
  );
}
