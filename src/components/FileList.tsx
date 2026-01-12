import { FileInfo } from '../types';

interface FileListProps {
  files: FileInfo[];
  totalSize: number;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type: FileInfo['fileType']): string {
  switch (type) {
    case 'image': return '🖼️';
    case 'video': return '🎬';
    default: return '📄';
  }
}

export default function FileList({ files, totalSize }: FileListProps) {
  const imageCount = files.filter(f => f.fileType === 'image').length;
  const videoCount = files.filter(f => f.fileType === 'video').length;
  const otherCount = files.filter(f => f.fileType === 'other').length;

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* 统计信息 */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-800 rounded-lg">
        <div className="flex gap-4 text-sm">
          <span className="text-gray-400">
            🖼️ {imageCount} 张图片
          </span>
          <span className="text-gray-400">
            🎬 {videoCount} 个视频
          </span>
          {otherCount > 0 && (
            <span className="text-gray-400">
              📄 {otherCount} 其他
            </span>
          )}
        </div>
        <div className="text-gray-300 font-medium">
          {formatSize(totalSize)}
        </div>
      </div>

      {/* 文件列表 */}
      <div className="max-h-64 overflow-y-auto space-y-1">
        {files.slice(0, 50).map((file, index) => (
          <div
            key={index}
            className="flex items-center justify-between py-2 px-3 hover:bg-gray-800/50 rounded"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span>{getFileIcon(file.fileType)}</span>
              <span className="text-gray-300 truncate text-sm">
                {file.name}
              </span>
            </div>
            <span className="text-gray-500 text-sm flex-shrink-0 ml-2">
              {formatSize(file.size)}
            </span>
          </div>
        ))}
        {files.length > 50 && (
          <div className="text-center text-gray-500 text-sm py-2">
            ... 还有 {files.length - 50} 个文件
          </div>
        )}
      </div>
    </div>
  );
}
