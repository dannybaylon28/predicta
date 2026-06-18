import { parseGoalsInput } from "../../utils/scores";

type ScoreInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  label: string;
};

export function ScoreInput({ value, onChange, label }: ScoreInputProps) {
  return (
    <input
      type="number"
      min={0}
      max={15}
      inputMode="numeric"
      aria-label={label}
      value={value === null ? "" : value}
      onChange={(event) => onChange(parseGoalsInput(event.target.value))}
    />
  );
}
