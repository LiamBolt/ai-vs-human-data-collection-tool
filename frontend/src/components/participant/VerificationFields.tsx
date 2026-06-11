import { RadioGroup } from '@/components/ui/RadioGroup'
import { Input } from '@/components/ui/Input'
import type { VerificationMethod } from '@/types'

interface VerificationFieldsProps {
  method: VerificationMethod | null
  onMethodChange: (method: VerificationMethod) => void
  methodOther: string
  onMethodOtherChange: (text: string) => void
  evidence: string
  onEvidenceChange: (text: string) => void
  errors?: {
    method?: string
    evidence?: string
  }
}

const METHOD_OPTIONS = [
  { value: 'RECOMPUTE', label: 'Recompute — solved again independently' },
  { value: 'ESTIMATE', label: 'Estimate — checked with a rough estimate' },
  { value: 'ALT_METHOD', label: 'Alt method — used a different approach' },
  { value: 'CONSISTENCY', label: 'Consistency — checked for logical consistency' },
  { value: 'OTHER', label: 'Other' },
]

export function VerificationFields({
  method,
  onMethodChange,
  methodOther,
  onMethodOtherChange,
  evidence,
  onEvidenceChange,
  errors = {},
}: VerificationFieldsProps) {
  return (
    <div className="flex flex-col gap-4 pl-4 border-l-2 border-accent/30">
      <RadioGroup
        label="Verification method"
        options={METHOD_OPTIONS}
        value={method}
        onChange={(v) => onMethodChange(v as VerificationMethod)}
        error={errors.method}
      />

      {method === 'OTHER' && (
        <Input
          label="Describe your verification method"
          value={methodOther}
          onChange={(e) => onMethodOtherChange(e.target.value)}
          inputWidth="w-full"
        />
      )}

      <Input
        label="Verification evidence"
        hint="Write one sentence describing what you found when verifying."
        value={evidence}
        onChange={(e) => onEvidenceChange(e.target.value)}
        error={errors.evidence}
        inputWidth="w-full"
      />
    </div>
  )
}
