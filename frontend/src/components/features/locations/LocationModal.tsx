import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { FiEdit2, FiTrash2, FiPlus } from "react-icons/fi";

import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import {
  BRAZIL_STATES,
  STATE_NAMES,
  CITIES_BY_STATE,
} from "@/lib/brazil-locations";
import {
  useCreateLocationMutation,
  useDeleteLocationMutation,
  useLocationsQuery,
  useUpdateLocationMutation,
} from "@/api/locations";
import type { CreateLocationPayload } from "@/api/locations";
import type { Location } from "@/types/rawMaterial";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (locationId: string) => void;
}

const EMPTY_FORM_VALUES: CreateLocationPayload = {
  country: "BR",
  name: "",
  stateUf: "",
  city: "",
};

const LOCATION_PAGE_SIZE = 8;

export function LocationModal({
  isOpen,
  onClose,
  onCreated,
}: LocationModalProps) {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [editingLocation, setEditingLocation] = useState<Location | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locationPendingDelete, setLocationPendingDelete] =
    useState<Location | null>(null);

  const { register, handleSubmit, watch, reset, setValue, formState } =
    useForm<CreateLocationPayload>({
      defaultValues: { ...EMPTY_FORM_VALUES },
    });

  const selectedState = watch("stateUf");
  const cities = selectedState ? CITIES_BY_STATE[selectedState] ?? [] : [];

  const {
    data: locationsResponse,
    isLoading: isLoadingLocations,
    isFetching: isFetchingLocations,
  } = useLocationsQuery(
    { page, limit: LOCATION_PAGE_SIZE, search },
    { enabled: isOpen }
  );

  const createLocation = useCreateLocationMutation();
  const updateLocation = useUpdateLocationMutation();
  const deleteLocation = useDeleteLocationMutation();

  useEffect(() => {
    if (!selectedState) {
      setValue("city", "");
    } else if (!cities.includes(watch("city"))) {
      setValue("city", "");
    }
  }, [selectedState, cities, setValue, watch]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const timeoutId = window.setTimeout(() => {
      setPage(1);
      setSearch(searchInput.trim());
    }, 400);

    return () => window.clearTimeout(timeoutId);
  }, [searchInput, isOpen]);

  useEffect(() => {
    const totalFromResponse = locationsResponse?.meta?.totalPages;
    if (totalFromResponse === undefined || totalFromResponse === null) {
      return;
    }

    const totalPagesNormalized = Math.max(totalFromResponse, 1);
    if (page > totalPagesNormalized) {
      setPage(totalPagesNormalized);
    }
  }, [locationsResponse?.meta?.totalPages, page]);

  const isDuplicateName = (value: string) => {
    const normalized = value.trim().toLowerCase();
    if (!normalized) {
      return false;
    }

    return (locationsResponse?.data ?? []).some(
      (location) =>
        location.name.trim().toLowerCase() === normalized &&
        location.id !== editingLocation?.id
    );
  };

  const resetForm = () => {
    reset({ ...EMPTY_FORM_VALUES });
  };

  const handleCloseModal = () => {
    setEditingLocation(null);
    resetForm();
    setPage(1);
    setSearch("");
    setSearchInput("");
    setDeletingId(null);
    setLocationPendingDelete(null);
    onClose();
  };

  const handleEdit = (location: Location) => {
    setEditingLocation(location);
    reset({
      name: location.name,
      stateUf: location.stateUf,
      city: location.city,
      country: location.country || "BR",
    });
  };

  const handleCreateMode = () => {
    setEditingLocation(null);
    resetForm();
  };

  const handleDeleteRequest = (location: Location) => {
    setLocationPendingDelete(location);
  };

  const handleConfirmDelete = async () => {
    if (!locationPendingDelete) {
      return;
    }

    try {
      setDeletingId(locationPendingDelete.id);
      await deleteLocation.mutateAsync(locationPendingDelete.id);
      toast.success("Localização removida com sucesso");
      if (editingLocation?.id === locationPendingDelete.id) {
        handleCreateMode();
      }
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao remover localização";
      toast.error(message);
    } finally {
      setDeletingId(null);
      setLocationPendingDelete(null);
    }
  };

  const onSubmit = async (values: CreateLocationPayload) => {
    const payload = {
      name: values.name.trim(),
      stateUf: values.stateUf.toUpperCase(),
      city: values.city.trim(),
      country: (values.country || "BR").toUpperCase(),
    };

    try {
      if (editingLocation) {
        await updateLocation.mutateAsync({
          id: editingLocation.id,
          ...payload,
        });
        toast.success("Localização atualizada com sucesso");
      } else {
        const location = await createLocation.mutateAsync(payload);
        toast.success("Localização criada com sucesso");
        onCreated?.(location.id);
      }
      handleCreateMode();
    } catch (error: any) {
      const defaultMessage = editingLocation
        ? "Erro ao atualizar localização"
        : "Erro ao criar localização";
      const message = error?.response?.data?.message || defaultMessage;
      toast.error(message);
    }
  };

  const isSubmitting = createLocation.isPending || updateLocation.isPending;
  const locations = locationsResponse?.data ?? [];
  const meta = locationsResponse?.meta;
  const totalPages = Math.max(meta?.totalPages ?? 1, 1);
  const totalItems = meta?.total ?? 0;
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;
  const deleteTargetName = locationPendingDelete?.name ?? "";
  const deleteConfirmationMessage = deleteTargetName
    ? `Tem certeza de que deseja remover a localização "${deleteTargetName}"? Esta ação não pode ser desfeita.`
    : "Tem certeza de que deseja remover esta localização? Esta ação não pode ser desfeita.";

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleCloseModal}
        title="Gerenciar Localizações"
        size="3xl"
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  Localizações cadastradas
                </p>
                <p className="text-xs text-gray-500">
                  Selecione uma entrada para editar ou remover
                </p>
              </div>
              {editingLocation && (
                <button
                  type="button"
                  onClick={handleCreateMode}
                  className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  <FiPlus className="text-sm" /> Nova localização
                </button>
              )}
            </div>

            <div className="mb-3">
              <Input
                placeholder="Buscar por nome ou cidade"
                value={searchInput}
                onChange={(event) => setSearchInput(event.target.value)}
              />
              {isFetchingLocations && !isLoadingLocations && (
                <p className="text-xs text-gray-500 mt-1">
                  Atualizando lista...
                </p>
              )}
            </div>

            <div className="max-h-72 overflow-y-auto divide-y divide-gray-200 bg-white rounded-md border border-gray-100">
              {isLoadingLocations ? (
                <div className="flex items-center justify-center py-10">
                  <LoadingSpinner size="sm" />
                </div>
              ) : locations.length === 0 ? (
                <div className="p-6 text-center text-sm text-gray-500">
                  Nenhuma localização encontrada
                </div>
              ) : (
                locations.map((location) => (
                  <div
                    key={location.id}
                    className="flex items-center justify-between gap-3 px-3 py-3"
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-800">
                        {location.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        {location.city}/{location.stateUf}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleEdit(location)}
                        className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-full transition cursor-pointer disabled:cursor-not-allowed"
                        title="Editar"
                      >
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRequest(location)}
                        className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-full transition disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
                        title="Remover"
                        disabled={
                          deletingId === location.id || deleteLocation.isPending
                        }
                      >
                        {deletingId === location.id ? (
                          <span className="block h-4 w-4 border-2 border-red-200 border-t-red-600 rounded-full animate-spin" />
                        ) : (
                          <FiTrash2 />
                        )}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between mt-4 text-sm text-gray-600">
              <span>
                Mostrando {locations.length} de {totalItems} registros
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                  onClick={() =>
                    canGoPrev && setPage((prev) => Math.max(prev - 1, 1))
                  }
                  disabled={!canGoPrev}
                >
                  Anterior
                </button>
                <span className="text-xs text-gray-500">
                  Página {Math.min(page, totalPages)} de {totalPages}
                </span>
                <button
                  type="button"
                  className="px-3 py-1 border rounded-md text-sm disabled:opacity-50"
                  onClick={() => canGoNext && setPage((prev) => prev + 1)}
                  disabled={!canGoNext}
                >
                  Próxima
                </button>
              </div>
            </div>
          </div>

          <form
            id="location-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">
                  {editingLocation ? "Editar Localização" : "Nova Localização"}
                </p>
                {editingLocation && (
                  <p className="text-xs text-gray-500">
                    {editingLocation.name}
                  </p>
                )}
              </div>
              {!editingLocation && (
                <span className="text-xs text-gray-500">
                  Preencha os campos para cadastrar
                </span>
              )}
            </div>

            <div>
              <label
                className="block text-sm font-medium text-gray-700"
                htmlFor="location-name"
              >
                Nome
              </label>
              <Input
                id="location-name"
                placeholder="Ex: Matriz SP"
                maxLength={120}
                {...register("name", {
                  required: "Nome é obrigatório",
                  validate: (value) =>
                    isDuplicateName(value)
                      ? "Já existe uma localização com esse nome"
                      : true,
                })}
                error={formState.errors.name?.message}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="stateUf"
                >
                  Estado
                </label>
                <Select
                  id="stateUf"
                  {...register("stateUf", { required: "Estado é obrigatório" })}
                  error={formState.errors.stateUf?.message}
                  defaultValue=""
                >
                  <option value="" disabled>
                    Selecione o estado
                  </option>
                  {BRAZIL_STATES.map((uf) => (
                    <option key={uf} value={uf}>
                      {STATE_NAMES[uf] || uf}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <label
                  className="block text-sm font-medium text-gray-700"
                  htmlFor="city"
                >
                  Cidade
                </label>
                <Select
                  id="city"
                  disabled={!selectedState}
                  {...register("city", { required: "Cidade é obrigatória" })}
                  error={formState.errors.city?.message}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {selectedState
                      ? "Selecione a cidade"
                      : "Selecione um estado"}
                  </option>
                  {cities.map((city) => (
                    <option key={city} value={city}>
                      {city}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                form="location-form"
                isLoading={isSubmitting}
              >
                {editingLocation ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </form>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!locationPendingDelete}
        onClose={() => {
          if (deleteLocation.isPending) {
            return;
          }
          setLocationPendingDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Remover Localização"
        message={deleteConfirmationMessage}
        confirmText="Remover"
        isConfirming={deleteLocation.isPending}
      />
    </>
  );
}
