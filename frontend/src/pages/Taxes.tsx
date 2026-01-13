// src/pages/Taxes.tsx

import { Heading } from "@/components/common/Heading";
import { FreightTaxesSection } from "@/components/features/taxes/FreightTaxesSection";
import { RawMaterialTaxesSection } from "@/components/features/taxes/RawMaterialTaxesSection";

export default function Taxes() {
  return (
    <>
      <Heading as="h1" variant="title" className="mb-6">
        Gestão de Impostos
      </Heading>

      <div className="mb-12">
        <FreightTaxesSection />
      </div>

      <div className="mb-8">
        <RawMaterialTaxesSection />
      </div>
    </>
  );
}
