// src/pages/Taxes.tsx

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Heading } from "@/components/common/Heading";
import { SecondaryButton } from "@/components/common/SecondaryButton";
import { ConfirmModal } from "@/components/common/ConfirmModal";
import { LoadingSpinner } from "@/components/common/LoadingSpinner";
import { FiPlus } from "react-icons/fi";

import { FreightTaxesSection } from "@/components/features/taxes/FreightTaxesSection";
import { RawMaterialTaxesSection } from "@/components/features/taxes/RawMaterialTaxesSection";
import { FreightTaxModal } from "@/components/features/taxes/FreightTaxModal";
import { RawMaterialTaxModal } from "@/components/features/taxes/RawMaterialTaxModal";

import type { FreightTax, RawMaterialTax } from "@/types/taxes";
import {
  useDeleteFreightTaxMutation,
  useDeleteRawMaterialTaxMutation,
} from "@/api/taxes";

export default function Taxes() {
  // Estados para Freight Taxes
  const [isFreightModalOpen, setIsFreightModalOpen] = useState(false);
  const [editingFreightTax, setEditingFreightTax] = useState<FreightTax | null>(
    null
  );
  const [deletingFreightTaxId, setDeletingFreightTaxId] = useState<
    string | null
  >(null);

  // Estados para Raw Material Taxes
  const [isRawMaterialModalOpen, setIsRawMaterialModalOpen] = useState(false);
  const [editingRawMaterialTax, setEditingRawMaterialTax] =
    useState<RawMaterialTax | null>(null);
  const [deletingRawMaterialTaxId, setDeletingRawMaterialTaxId] = useState<
    string | null
  >(null);

  // Mutations
  const deleteFreightTaxMutation = useDeleteFreightTaxMutation();
  const deleteRawMaterialTaxMutation = useDeleteRawMaterialTaxMutation();

  // Handlers - Freight Taxes
  const handleOpenCreateFreightModal = () => {
    setEditingFreightTax(null);
    setIsFreightModalOpen(true);
  };

  const handleOpenEditFreightModal = (tax: FreightTax) => {
    setEditingFreightTax(tax);
    setIsFreightModalOpen(true);
  };

  const handleCloseFreightModal = () => {
    setIsFreightModalOpen(false);
    setEditingFreightTax(null);
  };

  const handleDeleteFreightTax = async () => {
    if (!deletingFreightTaxId) return;

    try {
      await deleteFreightTaxMutation.mutateAsync(deletingFreightTaxId);
      toast.success("Imposto de frete excluído com sucesso");
      setDeletingFreightTaxId(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Erro ao excluir imposto de frete";
      toast.error(message);
    }
  };

  // Handlers - Raw Material Taxes
  const handleOpenCreateRawMaterialModal = () => {
    setEditingRawMaterialTax(null);
    setIsRawMaterialModalOpen(true);
  };

  const handleOpenEditRawMaterialModal = (tax: RawMaterialTax) => {
    setEditingRawMaterialTax(tax);
    setIsRawMaterialModalOpen(true);
  };

  const handleCloseRawMaterialModal = () => {
    setIsRawMaterialModalOpen(false);
    setEditingRawMaterialTax(null);
  };

  const handleDeleteRawMaterialTax = async () => {
    if (!deletingRawMaterialTaxId) return;

    try {
      await deleteRawMaterialTaxMutation.mutateAsync(deletingRawMaterialTaxId);
      toast.success("Imposto de matéria-prima excluído com sucesso");
      setDeletingRawMaterialTaxId(null);
    } catch (error: any) {
      const message =
        error?.response?.data?.message ||
        "Erro ao excluir imposto de matéria-prima";
      toast.error(message);
    }
  };

  return (
    <>
      <Heading as="h1" variant="title" className="mb-6">
        Gestão de Impostos
      </Heading>

      {/* SEÇÃO: IMPOSTOS DE FRETE */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-6">
          <Heading as="h2" variant="subtitle">
            Impostos de Frete
          </Heading>
          <SecondaryButton
            variant="primary"
            leftIcon={FiPlus}
            onClick={handleOpenCreateFreightModal}
            className="cursor-pointer"
          >
            Novo Imposto de Frete
          </SecondaryButton>
        </div>

        <FreightTaxesSection
          onEdit={handleOpenEditFreightModal}
          onDelete={(id) => setDeletingFreightTaxId(id)}
        />
      </div>

      {/* SEÇÃO: IMPOSTOS DE MATÉRIA-PRIMA */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <Heading as="h2" variant="subtitle">
            Impostos de Matéria-Prima
          </Heading>
          <SecondaryButton
            variant="primary"
            leftIcon={FiPlus}
            onClick={handleOpenCreateRawMaterialModal}
            className="cursor-pointer"
          >
            Novo Imposto de Matéria-Prima
          </SecondaryButton>
        </div>

        <RawMaterialTaxesSection
          onEdit={handleOpenEditRawMaterialModal}
          onDelete={(id) => setDeletingRawMaterialTaxId(id)}
        />
      </div>

      {/* MODAIS */}
      <FreightTaxModal
        isOpen={isFreightModalOpen}
        onClose={handleCloseFreightModal}
        tax={editingFreightTax}
      />

      <RawMaterialTaxModal
        isOpen={isRawMaterialModalOpen}
        onClose={handleCloseRawMaterialModal}
        tax={editingRawMaterialTax}
      />

      <ConfirmModal
        isOpen={!!deletingFreightTaxId}
        onClose={() => setDeletingFreightTaxId(null)}
        onConfirm={handleDeleteFreightTax}
        title="Excluir Imposto de Frete"
        message="Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />

      <ConfirmModal
        isOpen={!!deletingRawMaterialTaxId}
        onClose={() => setDeletingRawMaterialTaxId(null)}
        onConfirm={handleDeleteRawMaterialTax}
        title="Excluir Imposto de Matéria-Prima"
        message="Tem certeza que deseja excluir este imposto? Esta ação não pode ser desfeita."
        confirmText="Excluir"
      />
    </>
  );
}
