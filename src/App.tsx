import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { open as openDialog } from '@tauri-apps/plugin-dialog';
import { revealItemInDir } from '@tauri-apps/plugin-opener';

import FileList from './components/FileList';
import ProgressBar from './components/ProgressBar';
import ResultPanel from './components/ResultPanel';
import { FileInfo, ProgressPayload, CompressResult, SingleCompressResult, AppStatus, InputMode } from './types';

function App() {
  const [status, setStatus] = useState<AppStatus>('idle');
  const [inputMode, setInputMode] = useState<InputMode>('folder');
  const [inputPath, setInputPath] = useState<string | null>(null);
  const [outputDir, setOutputDir] = useState<string | null>(null);
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [singleFile, setSingleFile] = useState<FileInfo | null>(null);
  const [totalSize, setTotalSize] = useState(0);
  const [progress, setProgress] = useState({ current: 0, total: 0, file: '' });
  const [result, setResult] = useState<CompressResult | SingleCompressResult | null>(null);

  // 压缩选项
  const [imageToWebp, setImageToWebp] = useState(true);
  const [generatePoster, setGeneratePoster] = useState(true);

  // 监听压缩进度
  useEffect(() => {
    const unlisten = listen<ProgressPayload>('compress-progress', (event) => {
      setProgress({
        current: event.payload.current,
        total: event.payload.total,
        file: event.payload.file,
      });
    });
    return () => {
      unlisten.then(fn => fn());
    };
  }, []);

  // 选择文件夹
  const handleSelectFolder = async () => {
    const selected = await openDialog({
      directory: true,
      title: '选择要压缩的文件夹',
    });

    if (selected && typeof selected === 'string') {
      setInputPath(selected);
      setInputMode('folder');
      setStatus('scanning');

      try {
        const fileList = await invoke<FileInfo[]>('scan_folder', { path: selected });
        setFiles(fileList);
        setSingleFile(null);
        setTotalSize(fileList.reduce((sum, f) => sum + f.size, 0));
        setStatus('ready');
      } catch (error) {
        console.error('扫描失败:', error);
        setStatus('idle');
      }
    }
  };

  // 选择单个文件
  const handleSelectFile = async () => {
    const selected = await openDialog({
      directory: false,
      multiple: false,
      title: '选择要压缩的文件',
      filters: [{
        name: '媒体文件',
        extensions: ['jpg', 'jpeg', 'png', 'webp', 'gif', 'bmp', 'mp4', 'mov', 'avi', 'mkv', 'webm']
      }]
    });

    if (selected && typeof selected === 'string') {
      setInputPath(selected);
      setInputMode('file');
      setStatus('scanning');

      try {
        const fileInfo = await invoke<FileInfo>('scan_file', { path: selected });
        setSingleFile(fileInfo);
        setFiles([]);
        setTotalSize(fileInfo.size);
        setStatus('ready');
      } catch (error) {
        console.error('扫描失败:', error);
        alert(error);
        setStatus('idle');
      }
    }
  };

  // 选择输出目录
  const handleSelectOutput = async () => {
    const selected = await openDialog({
      directory: true,
      title: '选择输出目录',
    });
    if (selected && typeof selected === 'string') {
      setOutputDir(selected);
    }
  };

  // 开始压缩
  const handleCompress = async () => {
    if (!inputPath) return;

    // 默认输出目录
    let output = outputDir;
    if (!output) {
      if (inputMode === 'folder') {
        output = `${inputPath}-compressed`;
      } else {
        // 单文件模式，输出到同目录
        output = inputPath.substring(0, inputPath.lastIndexOf('/'));
      }
    }
    setOutputDir(output);
    setStatus('compressing');

    try {
      if (inputMode === 'folder') {
        const compressResult = await invoke<CompressResult>('compress_folder', {
          inputDir: inputPath,
          outputDir: output,
          imageToWebp,
          generatePoster,
        });
        setResult(compressResult);
      } else {
        const compressResult = await invoke<SingleCompressResult>('compress_file', {
          inputPath,
          outputDir: output,
          toWebp: imageToWebp,
          generatePoster,
        });
        setResult(compressResult);
      }
      setStatus('done');
    } catch (error) {
      console.error('压缩失败:', error);
      alert(`压缩失败: ${error}`);
      setStatus('ready');
    }
  };

  // 打开输出文件夹
  const handleOpenFolder = async () => {
    // 优先使用后端返回的实际输出路径
    const pathToOpen = result && 'outputPath' in result ? result.outputPath : outputDir;
    if (pathToOpen) {
      try {
        await revealItemInDir(pathToOpen);
      } catch (error) {
        console.error('打开文件夹失败:', error);
      }
    }
  };

  // 重置
  const handleReset = () => {
    setStatus('idle');
    setInputPath(null);
    setOutputDir(null);
    setFiles([]);
    setSingleFile(null);
    setTotalSize(0);
    setProgress({ current: 0, total: 0, file: '' });
    setResult(null);
  };

  // 格式化文件大小
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // 判断是否有视频文件
  const hasVideo = inputMode === 'file'
    ? singleFile?.fileType === 'video'
    : files.some(f => f.fileType === 'video');

  // 判断是否有图片文件
  const hasImage = inputMode === 'file'
    ? singleFile?.fileType === 'image'
    : files.some(f => f.fileType === 'image');

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      {/* 标题 */}
      <h1 className="text-2xl font-bold text-center mb-8">
        资源压缩工具
      </h1>

      {/* 主内容区 */}
      <div className="max-w-3xl mx-auto">
        {status === 'idle' && (
          <div className="space-y-6">
            {/* 选择模式 */}
            <div className="flex gap-4 justify-center">
              <button
                onClick={handleSelectFolder}
                className="flex-1 max-w-xs border-2 border-dashed border-gray-600 hover:border-blue-500 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-800/50"
              >
                <div className="text-5xl mb-3">📁</div>
                <p className="text-lg text-gray-300">选择文件夹</p>
                <p className="text-sm text-gray-500 mt-1">批量压缩</p>
              </button>

              <button
                onClick={handleSelectFile}
                className="flex-1 max-w-xs border-2 border-dashed border-gray-600 hover:border-green-500 rounded-xl p-8 text-center cursor-pointer transition-all duration-200 hover:bg-gray-800/50"
              >
                <div className="text-5xl mb-3">📄</div>
                <p className="text-lg text-gray-300">选择文件</p>
                <p className="text-sm text-gray-500 mt-1">单个压缩</p>
              </button>
            </div>

            <p className="text-center text-gray-500 text-sm">
              支持 JPG、PNG、WebP、GIF、MP4、MOV、AVI、MKV 等格式
            </p>
          </div>
        )}

        {status === 'scanning' && (
          <div className="text-center text-gray-400">
            <div className="text-4xl mb-4">🔍</div>
            <p>正在扫描...</p>
          </div>
        )}

        {status === 'ready' && (
          <div className="space-y-6">
            {/* 文件信息 */}
            {inputMode === 'folder' ? (
              <FileList files={files} totalSize={totalSize} />
            ) : singleFile && (
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center gap-4">
                  <div className="text-4xl">
                    {singleFile.fileType === 'image' ? '🖼️' : '🎬'}
                  </div>
                  <div className="flex-1">
                    <p className="text-lg font-medium truncate">{singleFile.name}</p>
                    <p className="text-gray-400 text-sm">
                      {singleFile.fileType === 'image' ? '图片' : '视频'} · {formatSize(singleFile.size)} · .{singleFile.extension}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 压缩选项 */}
            <div className="bg-gray-800 rounded-lg p-4 space-y-3">
              <p className="text-gray-400 text-sm font-medium">压缩选项</p>

              {hasImage && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={imageToWebp}
                    onChange={(e) => setImageToWebp(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300">图片转换为 WebP 格式</span>
                  <span className="text-gray-500 text-sm">（推荐，体积更小）</span>
                </label>
              )}

              {hasVideo && (
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={generatePoster}
                    onChange={(e) => setGeneratePoster(e.target.checked)}
                    className="w-4 h-4 rounded"
                  />
                  <span className="text-gray-300">生成视频封面</span>
                  <span className="text-gray-500 text-sm">（提取首帧为 WebP）</span>
                </label>
              )}

              <div className="pt-2 border-t border-gray-700">
                <button
                  onClick={handleSelectOutput}
                  className="text-sm text-blue-400 hover:text-blue-300"
                >
                  {outputDir ? '更改输出目录' : '选择输出目录（可选）'}
                </button>
                {outputDir && (
                  <p className="text-gray-500 text-sm mt-1 truncate">
                    输出到: {outputDir}
                  </p>
                )}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={handleCompress}
                className="px-8 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg transition-colors"
              >
                开始压缩
              </button>
            </div>
          </div>
        )}

        {status === 'compressing' && (
          <ProgressBar
            current={inputMode === 'folder' ? progress.current : 1}
            total={inputMode === 'folder' ? progress.total : 1}
            fileName={inputMode === 'folder' ? progress.file : singleFile?.name || ''}
          />
        )}

        {status === 'done' && result && (
          <ResultPanel
            result={result}
            isSingleFile={inputMode === 'file'}
            onOpenFolder={handleOpenFolder}
            onReset={handleReset}
          />
        )}
      </div>
    </div>
  );
}

export default App;
