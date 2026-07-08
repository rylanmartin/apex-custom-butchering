type ProgressBarProps = {
  step: number;
};

export default function ProgressBar({ step }: ProgressBarProps) {
  const percent = (step / 4) * 100;

  return (
    <div className="mb-10 rounded-2xl bg-white p-6 shadow">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Schedule Processing</h2>

        <span className="text-sm font-semibold text-gray-600">
          Step {step} of 4
        </span>
      </div>

      <div className="h-4 overflow-hidden rounded-full bg-gray-200">
        <div
          className="h-full rounded-full bg-red-700 transition-all duration-500"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}