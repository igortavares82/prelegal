"use client";

interface GenericFormProps {
  fieldKeys: string[];
  values: Record<string, string>;
  onChange: (values: Record<string, string>) => void;
  disabled?: boolean;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 px-3 py-2 text-sm shadow-sm focus:border-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-500 dark:border-zinc-700 dark:bg-zinc-900";
const labelClass = "block text-sm font-medium text-zinc-700 dark:text-zinc-300";
const fieldWrapClass = "flex flex-col gap-1";

function fieldId(key: string): string {
  return `generic-field-${key.toLowerCase().replace(/\s+/g, "-")}`;
}

/**
 * A plain label+input row per field, driven entirely by data (the field
 * list derived from a document's template) rather than bespoke per-field
 * widgets — the manual-edit fallback for every document type besides the
 * Mutual NDA, which keeps NdaForm's richer, hand-built UI.
 */
export default function GenericForm({ fieldKeys, values, onChange, disabled = false }: GenericFormProps) {
  function update(key: string, value: string) {
    onChange({ ...values, [key]: value });
  }

  return (
    <form className="flex flex-col gap-4" onSubmit={(e) => e.preventDefault()}>
      <fieldset disabled={disabled} className="contents">
        {fieldKeys.map((key) => (
          <div key={key} className={fieldWrapClass}>
            <label className={labelClass} htmlFor={fieldId(key)}>
              {key}
            </label>
            <input
              id={fieldId(key)}
              className={inputClass}
              value={values[key] ?? ""}
              onChange={(e) => update(key, e.target.value)}
            />
          </div>
        ))}
      </fieldset>
    </form>
  );
}
