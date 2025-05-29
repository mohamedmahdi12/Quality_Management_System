import React from "react";

export function MultiSelect({ options, value, onChange, placeholder, filterRoles }) {
  // إذا تم تمرير filterRoles، صفّي الخيارات بناءً على الدور
  const filteredOptions = filterRoles
    ? options.filter(opt => filterRoles.includes(opt.role))
    : options;

  return (
    <select
      multiple
      value={value}
      onChange={e => {
        const selected = Array.from(e.target.selectedOptions, opt => opt.value);
        onChange(selected);
      }}
      className="border rounded px-3 py-2 w-full"
    >
      <option disabled value="">
        {placeholder || "Select..."}
      </option>
      {filteredOptions.map(opt => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
} 