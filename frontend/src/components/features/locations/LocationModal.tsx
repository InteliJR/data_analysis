import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { toast } from "react-hot-toast";
import { Modal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import {
  BRAZIL_STATES,
  STATE_NAMES,
  CITIES_BY_STATE,
} from "@/constants/brazil-locations";
import { useCreateLocationMutation } from "@/api/locations";
import type { CreateLocationPayload } from "@/api/locations";

interface LocationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: (locationId: string) => void;
}

export function LocationModal({
  isOpen,
  onClose,
  onCreated,
}: LocationModalProps) {
  const { register, handleSubmit, watch, reset, setValue, formState } =
    useForm<CreateLocationPayload>({
      defaultValues: { country: "BR", name: "", stateUf: "", city: "" },
    });

  const selectedState = watch("stateUf");
  const cities = selectedState ? CITIES_BY_STATE[selectedState] ?? [] : [];

  const createLocation = useCreateLocationMutation();

  useEffect(() => {
    if (!selectedState) {
      setValue("city", "");
    } else if (!cities.includes(watch("city"))) {
      setValue("city", "");
    }
  }, [selectedState, cities, setValue, watch]);

  const onSubmit = async (values: CreateLocationPayload) => {
    try {
      const payload = {
        name: values.name.trim(),
        stateUf: values.stateUf.toUpperCase(),
        city: values.city.trim(),
        country: (values.country || "BR").toUpperCase(),
      };
      const location = await createLocation.mutateAsync(payload);
      toast.success("Localização criada com sucesso");
      onCreated?.(location.id);
      reset({ country: "BR", name: "", stateUf: "", city: "" });
      onClose();
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao criar localização";
      toast.error(message);
    }
  };

  const isSubmitting = createLocation.isPending;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nova Localização" size="md">
      <form
        id="create-location-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-4"
      >
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
            {...register("name", { required: "Nome é obrigatório" })}
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
                {selectedState ? "Selecione a cidade" : "Selecione um estado"}
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
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            form="create-location-form"
            isLoading={isSubmitting}
          >
            Salvar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
