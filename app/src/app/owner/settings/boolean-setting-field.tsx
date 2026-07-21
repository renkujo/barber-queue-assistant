"use client";

import { useState } from "react";
import {
  FormField,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";

type BooleanSettingId = "queueIntakeEnabled" | "bookingEnabled" | "walkInEnabled";

const booleanOptions = [
  { label: "เปิด", value: "true" },
  { label: "ปิด", value: "false" },
];

const getBooleanLabel = (value: boolean) => (value ? "เปิด" : "ปิด");

export const BooleanSettingField = ({
  id,
  label,
  value,
  hint,
}: {
  id: BooleanSettingId;
  label: string;
  value: boolean;
  hint: string;
}) => {
  const [selectedValue, setSelectedValue] = useState(String(value));
  const isEnabled = selectedValue === "true";

  return (
    <FormField id={id} label={label} description={hint}>
      <div className="bqa-owner-settings-select-row">
        <Select name={id} value={selectedValue} onValueChange={setSelectedValue} required>
          <SelectTrigger id={id}>
            <SelectValue placeholder="เลือกสถานะ" />
          </SelectTrigger>
          <SelectContent className="qw-v2-select-content">
            {booleanOptions.map((option) => (
              <SelectItem value={option.value} key={option.value}>{option.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className={isEnabled ? "bqa-owner-settings-state bqa-owner-settings-state--on" : "bqa-owner-settings-state"}>
          {getBooleanLabel(isEnabled)}
        </span>
      </div>
    </FormField>
  );
};
