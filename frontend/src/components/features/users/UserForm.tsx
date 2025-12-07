import { useState } from "react";
import { useForm } from "react-hook-form";
import type { FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Eye, EyeOff } from "lucide-react";
import type { User } from "@/types/user";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { useCreateUserMutation, useUpdateUserMutation } from "@/api/users";
import toast from "react-hot-toast";

const ROLE_OPTIONS = ["ADMIN", "COMERCIAL", "LOGISTICA", "IMPOSTO"] as const;

// ========================================
// Schemas de Validação
// ========================================

const CreateUserSchema = z
  .object({
    email: z.string().email("Email inválido."),
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    password: z.string().min(8, "A senha deve ter no mínimo 8 caracteres."),
    confirmPassword: z.string().min(8, "Confirmação obrigatória."),
    role: z.enum(ROLE_OPTIONS),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

const UpdateUserSchema = z
  .object({
    name: z.string().min(3, "O nome deve ter no mínimo 3 caracteres."),
    role: z.enum(ROLE_OPTIONS),
    isActive: z.boolean(),
    password: z.string().optional(),
    confirmPassword: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.password || data.confirmPassword) {
        return data.password === data.confirmPassword;
      }
      return true;
    },
    {
      message: "As senhas não coincidem.",
      path: ["confirmPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.password && data.password.length < 8) {
        return false;
      }
      return true;
    },
    {
      message: "A senha deve ter no mínimo 8 caracteres.",
      path: ["password"],
    }
  );

type CreateUserForm = z.infer<typeof CreateUserSchema>;
type UpdateUserForm = z.infer<typeof UpdateUserSchema>;

// ========================================
// Componente
// ========================================

interface UserFormProps {
  user?: User;
  mode: "create" | "edit";
  onSuccess: () => void;
  onCancel: () => void;
}

export function UserForm({ user, mode, onSuccess, onCancel }: UserFormProps) {
  const isEdit = mode === "edit";
  const schema = isEdit ? UpdateUserSchema : CreateUserSchema;

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<CreateUserForm | UpdateUserForm>({
    resolver: zodResolver(schema),
    defaultValues:
      isEdit && user
        ? {
            name: user.name,
            role: user.role,
            isActive: user.isActive,
            password: "",
            confirmPassword: "",
          }
        : {
            email: "",
            role: "COMERCIAL",
          },
  });

  const createErrors = errors as FieldErrors<CreateUserForm>;
  const updateErrors = errors as FieldErrors<UpdateUserForm>;

  const createUserMutation = useCreateUserMutation();
  const updateUserMutation = useUpdateUserMutation();

  const onSubmit = async (data: CreateUserForm | UpdateUserForm) => {
    try {
      if (isEdit && user) {
        const updateData = data as UpdateUserForm;
        const payload: any = {
          name: updateData.name,
          role: updateData.role,
          isActive: updateData.isActive,
        };

        // Só envia senha se foi preenchida
        if (updateData.password && updateData.password.trim() !== "") {
          payload.password = updateData.password;
        }

        await updateUserMutation.mutateAsync({ id: user.id, payload });
        toast.success("Usuário atualizado com sucesso!");
      } else {
        const createData = data as CreateUserForm;
        // NÃO envia isActive no POST - backend define como false por padrão
        const payload = {
          email: createData.email,
          name: createData.name,
          password: createData.password,
          role: createData.role,
        };
        await createUserMutation.mutateAsync(payload);
        toast.success("Usuário criado com sucesso! Lembre-se de ativá-lo.");
      }
      onSuccess();
    } catch (error: any) {
      const message =
        error.response?.data?.message || "Erro ao salvar usuário.";
      toast.error(message);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Campo Email - Apenas na criação */}
        {!isEdit && (
          <div className="sm:col-span-2">
            <Input
              id="email"
              type="email"
              label="Email"
              placeholder="exemplo@gmail.com"
              required
              {...register("email")}
              error={createErrors.email?.message}
            />
          </div>
        )}

        {/* Email não editável em modo edição */}
        {isEdit && user && (
          <div className="sm:col-span-2">
            <Input
              id="email-readonly"
              type="email"
              label="Email"
              value={user.email}
              disabled
            />
          </div>
        )}

        {/* Campo Nome */}
        <div className="sm:col-span-2">
          <Input
            id="name"
            label="Nome"
            placeholder="Nome do Usuário"
            required
            {...register("name")}
            error={errors.name?.message}
          />
        </div>

        {/* Campo Função (Role) */}
        <div className="sm:col-span-1">
          <Select
            id="role"
            label="Função"
            required
            {...register("role")}
            error={errors.role?.message}
          >
            <option value="COMERCIAL">COMERCIAL</option>
            <option value="LOGISTICA">LOGISTICA</option>
            <option value="IMPOSTO">IMPOSTO</option>
            <option value="ADMIN">ADMIN</option>
          </Select>
        </div>

        {/* Campo Status (isActive) - Apenas para Edição */}
        {isEdit && (
          <div className="sm:col-span-1">
            <Select
              id="isActive"
              label="Status"
              required
              {...register("isActive", {
                setValueAs: (v) => v === "true" || v === true,
              })}
              error={updateErrors.isActive?.message}
            >
              <option value="true">Ativo</option>
              <option value="false">Inativo</option>
            </Select>
          </div>
        )}

        {/* Campo Senha */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Senha{isEdit ? " (opcional)" : ""}
            {!isEdit && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              placeholder={
                isEdit
                  ? "Deixe em branco para não alterar"
                  : "Mínimo 8 caracteres"
              }
              {...register("password")}
              className={`flex h-10 w-full rounded-lg border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } bg-white px-3 py-2 pr-10 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                errors.password
                  ? "focus:ring-red-600"
                  : "focus:ring-primary-600"
              } focus:border-transparent hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.password && (
            <p className="text-sm text-red-600 mt-1">
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Confirmação de Senha */}
        <div className="sm:col-span-1">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Confirmar Senha{isEdit ? " (opcional)" : ""}
            {!isEdit && <span className="text-red-500 ml-1">*</span>}
          </label>
          <div className="relative">
            <input
              id="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              placeholder={
                isEdit ? "Deixe em branco para não alterar" : "Confirme a senha"
              }
              {...register("confirmPassword")}
              className={`flex h-10 w-full rounded-lg border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } bg-white px-3 py-2 pr-10 text-sm placeholder:text-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 ${
                errors.confirmPassword
                  ? "focus:ring-red-600"
                  : "focus:ring-primary-600"
              } focus:border-transparent hover:border-gray-400 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-gray-100`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
            >
              {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-sm text-red-600 mt-1">
              {errors.confirmPassword.message}
            </p>
          )}
        </div>
      </div>

      {/* Botões de Ação */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="secondary"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button type="submit" isLoading={isSubmitting} variant="primary">
          {isEdit ? "Salvar alterações" : "Criar usuário"}
        </Button>
      </div>
    </form>
  );
}
