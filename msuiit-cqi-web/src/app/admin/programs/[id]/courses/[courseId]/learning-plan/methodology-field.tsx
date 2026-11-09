"use client";

import { useId, useState } from "react";
import { LEARNING_RESOURCES, METHODOLOGIES } from "./presets";

// Picking an option from the dropdown appends it to the textarea (one per
// line), so several can be combined and the text edited freely.
function PresetListField({
  name,
  label,
  placeholder,
  options,
  defaultValue = "",
  className,
}: {
  name: string;
  label: string;
  placeholder: string;
  options: string[];
  defaultValue?: string;
  className: string;
}) {
  const id = useId();
  const [value, setValue] = useState(defaultValue);

  function add(option: string) {
    if (!option) return;
    const lines = value.split("\n").map((l) => l.trim());
    if (lines.includes(option)) return;
    setValue(value.trim() ? `${value.trim()}\n${option}` : option);
  }

  return (
    <div className="text-sm sm:col-span-2">
      <label htmlFor={id}>{label}</label>
      <select
        id={id}
        value=""
        onChange={(e) => add(e.target.value)}
        className={className}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <textarea
        name={name}
        rows={3}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        aria-label={label}
        className={className}
      />
    </div>
  );
}

export function MethodologyField({
  className,
  defaultValue,
}: {
  className: string;
  defaultValue?: string;
}) {
  return (
    <PresetListField
      name="methodology"
      label="Teaching/learning methodology"
      placeholder="Add a methodology…"
      options={METHODOLOGIES}
      defaultValue={defaultValue}
      className={className}
    />
  );
}

export function ResourcesField({
  className,
  defaultValue,
}: {
  className: string;
  defaultValue?: string;
}) {
  return (
    <PresetListField
      name="learningResources"
      label="Learning resources"
      placeholder="Add a resource…"
      options={LEARNING_RESOURCES}
      defaultValue={defaultValue}
      className={className}
    />
  );
}
