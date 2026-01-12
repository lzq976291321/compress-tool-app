import { CompressResult, SingleCompressResult } from '../types';

interface ResultPanelProps {
  result: CompressResult | SingleCompressResult;
  isSingleFile: boolean;
  onOpenFolder: () => void;
  onReset: () => void;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isSingleResult(result: CompressResult | SingleCompressResult): result is SingleCompressResult {
  return 'originalSize' in result;
}

export default function ResultPanel({ result, isSingleFile, onOpenFolder, onReset }: ResultPanelProps) {
  const originalSize = isSingleResult(result) ? result.originalSize : result.totalOriginal;
  const compressedSize = isSingleResult(result) ? result.compressedSize : result.totalCompressed;
  const savings = originalSize - compressedSize;
  const savingsPercent = originalSize > 0
    ? Math.round((savings / originalSize) * 100)
    : 0;

  const singleResult = isSingleResult(result) ? result : null;

  return (
    <div className="w-full max-w-xl mx-auto text-center">
      {/* 成功图标 */}
      <div className="text-6xl mb-4">✨</div>
      <h2 className="text-2xl font-bold text-white mb-6">压缩完成！</h2>

      {/* 统计卡片 */}
      <div className="bg-gray-800 rounded-xl p-6 mb-6">
        <div className="flex items-center justify-center gap-4 text-2xl mb-4">
          <span className="text-gray-400">{formatSize(originalSize)}</span>
          <span className="text-gray-600">→</span>
          <span className="text-green-400">{formatSize(compressedSize)}</span>
        </div>

        <div className="text-lg">
          <span className="text-gray-400">节省 </span>
          <span className="text-green-400 font-bold">
            {formatSize(savings)} ({savingsPercent}%)
          </span>
        </div>

        {/* 单文件模式下显示封面信息 */}
        {singleResult?.posterPath && (
          <div className="mt-4 pt-4 border-t border-gray-700 text-sm text-gray-400">
            已生成视频封面
          </div>
        )}
      </div>

      {/* 文件统计 */}
      <div className="text-gray-400 text-sm mb-8">
        {isSingleFile ? (
          '已处理 1 个文件'
        ) : (
          `共处理 ${(result as CompressResult).fileCount} 个文件`
        )}
      </div>

      {/* 操作按钮 */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={onOpenFolder}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors"
        >
          打开输出文件夹
        </button>
        <button
          onClick={onReset}
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          继续压缩
        </button>
      </div>
    </div>
  );
}
