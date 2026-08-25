export function Sky() {
  return (
    <div aria-hidden className="sky-base fixed inset-0 overflow-hidden">
      <div className="sky-clouds sky-clouds-far" />
      <div className="sky-clouds sky-clouds-near" />
      <div className="sky-dither absolute inset-0" />
    </div>
  );
}
