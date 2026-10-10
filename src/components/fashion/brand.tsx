export function Emblem({ monogram = "TKM" }: { monogram?: string }) {
  return (
    <svg
      className="brand-emblem"
      viewBox="0 0 64 76"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M8 8h48v35c0 13-14 22-24 27C22 65 8 56 8 43V8Z"
        stroke="currentColor"
      />
      <path
        d="M13 13h38v29c0 10-10 17-19 22-9-5-19-12-19-22V13Z"
        stroke="currentColor"
        opacity=".4"
      />
      <path d="M23 5h18M32 1v8M23 54h18" stroke="currentColor" />
      <text
        x="32"
        y="40"
        textAnchor="middle"
        fill="currentColor"
        fontFamily="Georgia,serif"
        fontSize="14"
        letterSpacing="-1"
      >
        {monogram}
      </text>
    </svg>
  );
}
