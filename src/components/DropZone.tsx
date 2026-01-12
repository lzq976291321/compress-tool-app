import { useState } from 'react';
import { open } from '@tauri-apps/plugin-dialog';

interface DropZoneProps {
  onSelect: (path: string) => void;
}

export default function DropZone({ onSelect }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleClick = async () => {
    const selected = await open({
      directory: true,
      title: '选择要压缩的文件夹',
    });
    if (selected && typeof selected === 'string') {
      onSelect(selected);
    }
  };

  return (
    <div
      onClick={handleClick}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        // Tauri 需要通过其他方式处理拖拽
      }}
      className={`
        border-2 border-dashed rounded-xl p-16 text-center cursor-pointer
        transition-all duration-200
        ${isDragging
          ? 'border-blue-500 bg-blue-500/10'
          : 'border-gray-600 hover:border-gray-500 hover:bg-gray-800/50'
        }
      `}
    >
      <div className="text-6xl mb-4">📁</div>
      <p className="text-xl text-gray-300">点击选择文件夹</p>
      <p className="text-sm text-gray-500 mt-2">支持批量压缩图片和视频</p>
    </div>
  );
}
