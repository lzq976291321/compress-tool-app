interface ProgressBarProps {
  current: number;
  total: number;
  fileName: string;
}

export default function ProgressBar({ current, total, fileName }: ProgressBarProps) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="w-full max-w-xl mx-auto">
      <div className="mb-4 text-center">
        <p className="text-lg text-gray-300">正在压缩...</p>
        <p className="text-sm text-gray-500 mt-1 truncate">
          {fileName}
        </p>
      </div>

      <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-500 to-blue-400 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="flex justify-between mt-2 text-sm text-gray-400">
        <span>{current} / {total} 个文件</span>
        <span>{percent}%</span>
      </div>
    </div>
  );
}
