import { Text } from '@/components/common/Text';
// Removida a importação do Input

interface RateCardProps {
  title: string;
  value: string; // O valor mockado a ser exibido
}

export function RateCard({ title, value }: RateCardProps) {
  return (
    <div className="rounded-lg bg-white shadow-sm border border-blue-900 overflow-hidden">
      
      {/* Cabeçalho do Card */}
      <div className="bg-blue-900 p-3">
        <Text variant="small" className="font-medium text-white">
          {title}
        </Text>
      </div>
      
      {/* Corpo do Card (Agora com <Text>) */}
      <div className="p-4">
        {/* Trocamos o Input por Text */}
        <Text variant="body" className="text-right text-lg block w-full text-gray-800">
          {value}
        </Text>
      </div>
    </div>
  );
}