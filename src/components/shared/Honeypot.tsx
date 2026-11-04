import { HONEYPOT_FIELD } from "@/lib/waitlist/constants";

const HIDDEN: React.CSSProperties = {
  position: "absolute",
  width: 1,
  height: 1,
  overflow: "hidden",
  clipPath: "inset(50%)",
  whiteSpace: "nowrap",
};

/**
 * Bot trap: invisible and skipped by keyboard and screen readers, so only a script
 * fills it. Keep it away from the first and last position in a form (useFocusTrap
 * treats those as the Tab boundaries).
 */
export function Honeypot({
  value,
  onChange,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div aria-hidden="true" style={HIDDEN}>
      <label>
        Leave this empty
        <input type="text" name={HONEYPOT_FIELD} tabIndex={-1} autoComplete="off" value={value} onChange={onChange} />
      </label>
    </div>
  );
}
