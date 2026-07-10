export default function Loading() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-[3px] border-border border-t-primary" style={{ animationTimingFunction: "cubic-bezier(0.4,0,0.2,1)", animationDuration: "0.7s" }} />
    </div>
  );
}