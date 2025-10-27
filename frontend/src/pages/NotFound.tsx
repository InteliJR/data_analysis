import { Link } from 'react-router-dom';
import { Button } from '@/components/common/Button';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-gray-200">404</h1>
        <div className="mt-4">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Página não encontrada
          </h2>
          <p className="text-gray-600 mb-8">
            A página que você está procurando não existe ou foi movida.
          </p>
          <Link to="/">
            <Button variant="primary">Voltar para o início</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}