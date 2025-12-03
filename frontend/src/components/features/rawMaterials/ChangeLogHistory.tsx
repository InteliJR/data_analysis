// src/components/features/rawMaterials/ChangeLogHistory.tsx

import { useEffect, useRef } from "react";
import { useChangeLogsInfiniteQuery } from "@/api/rawMaterials";
import { Text } from "@/components/common/Text";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { FiUser } from "react-icons/fi";

interface ChangeLogHistoryProps {
  rawMaterialId: string;
}

export function ChangeLogHistory({ rawMaterialId }: ChangeLogHistoryProps) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
  } = useChangeLogsInfiniteQuery(rawMaterialId);

  const observerTarget = useRef<HTMLDivElement>(null);

  // Scroll infinito
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      code: "Código",
      name: "Nome",
      description: "Descrição",
      measurementUnit: "Unidade de Medida",
      inputGroup: "Grupo de Insumo",
      paymentTerm: "Prazo de Pagamento",
      acquisitionPrice: "Preço de Aquisição",
      currency: "Moeda",
      priceConvertedBrl: "Preço em BRL",
      additionalCost: "Custo Adicional",
      freights: "Fretes",
      created: "Criação do Registro",
    };
    return labels[field] || field;
  };

  if (isLoading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="sm" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <Text className="text-red-600 text-sm">
          Erro ao carregar histórico de mudanças
        </Text>
      </div>
    );
  }

  const allLogs = data?.pages.flatMap((page) => page.data) || [];

  if (allLogs.length === 0) {
    return (
      <div>
        <h4 className="text-sm font-semibold text-gray-700 mb-3">
          Histórico de Alterações
        </h4>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
          <Text className="text-gray-500 text-sm">
            Nenhuma alteração registrada
          </Text>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h4 className="text-sm font-semibold text-gray-700 mb-3">
        Histórico de Alterações ({allLogs.length} registros)
      </h4>

      <div className="max-h-[400px] overflow-y-auto border border-gray-200 rounded-lg">
        <div className="divide-y divide-gray-200">
          {allLogs.map((log) => (
            <div
              key={log.id}
              className="p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start mb-2">
                <Text variant="caption" className="font-semibold text-gray-900">
                  {getFieldLabel(log.field)}
                </Text>
                <Text variant="small" className="text-gray-500">
                  {format(new Date(log.changedAt), "dd/MM/yyyy 'às' HH:mm", {
                    locale: ptBR,
                  })}
                </Text>
              </div>

              <div className="space-y-1">
                {log.oldValue && (
                  <div className="flex items-start gap-2">
                    <Text
                      variant="small"
                      className="text-gray-600 flex-shrink-0"
                    >
                      De:
                    </Text>
                    <Text
                      variant="small"
                      className="text-red-600 line-through flex-1 break-words"
                    >
                      {log.oldValue}
                    </Text>
                  </div>
                )}

                {log.newValue && (
                  <div className="flex items-start gap-2">
                    <Text
                      variant="small"
                      className="text-gray-600 flex-shrink-0"
                    >
                      Para:
                    </Text>
                    <Text
                      variant="small"
                      className="text-green-600 font-medium flex-1 break-words"
                    >
                      {log.newValue}
                    </Text>
                  </div>
                )}

                {!log.oldValue && !log.newValue && (
                  <Text variant="small" className="text-gray-500 italic">
                    Campo limpo
                  </Text>
                )}
              </div>

              {/* SEÇÃO DE AUTOR COM ÍCONE */}
              <div className="mt-3 pt-2 border-t border-gray-200">
                <div className="flex items-center gap-2">
                  <FiUser className="text-gray-400 h-4 w-4 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <Text
                      variant="small"
                      className="text-gray-700 font-medium truncate"
                    >
                      {log.user?.name || "Usuário desconhecido"}
                    </Text>
                    <Text variant="small" className="text-gray-400 truncate">
                      {log.user?.email || "Email não disponível"}
                    </Text>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Target para o observer */}
        <div ref={observerTarget} className="h-4" />

        {/* Indicador de carregamento */}
        {isFetchingNextPage && (
          <div className="p-4 text-center">
            <LoadingSpinner size="sm" />
            <Text variant="small" className="text-gray-500 mt-2">
              Carregando mais registros...
            </Text>
          </div>
        )}

        {!hasNextPage && allLogs.length > 0 && (
          <div className="p-4 text-center border-t border-gray-200">
            <Text variant="small" className="text-gray-400">
              ✓ Todos os registros foram carregados
            </Text>
          </div>
        )}
      </div>
    </div>
  );
}
