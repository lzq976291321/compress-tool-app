# Compress Tool App

> A lightweight, fast, and open-source image & video compression tool for macOS. Built with Tauri + React + Rust.

[English](#english) | [中文](#中文)

---

## English

### Features

- **Image Compression** - Compress PNG, JPG, WebP, GIF, BMP images with high quality
- **Video Compression** - Compress MP4, MOV, AVI, MKV, WebM videos using H.264 codec
- **WebP Conversion** - Convert images to WebP format for smaller file sizes
- **Video Poster Generation** - Automatically extract first frame as video thumbnail
- **Batch Processing** - Compress entire folders while preserving directory structure
- **Single File Mode** - Compress individual files with ease
- **Lightweight** - Only ~6MB installer size (vs 150MB+ for Electron apps)
- **Native Performance** - Built with Rust for blazing fast compression

### Download

**[Download Latest Release](https://github.com/ryan129129/compress-tool-app/releases/latest)**

| Platform | Download |
|----------|----------|
| macOS (Apple Silicon) | [资源压缩工具_x.x.x_aarch64.dmg](https://github.com/ryan129129/compress-tool-app/releases/latest) |
| macOS (Intel) | Coming soon |
| Windows | Coming soon |
| Linux | Coming soon |

### Screenshots

<p align="center">
  <img src="./screenshots/home.png" width="400" alt="Home Screen" />
  <img src="./screenshots/compress.png" width="400" alt="Compression Progress" />
</p>

### Requirements

- macOS 10.15+
- FFmpeg (for video compression)

Install FFmpeg via Homebrew:
```bash
brew install ffmpeg
```

### Tech Stack

- **Frontend**: React + TypeScript + TailwindCSS
- **Backend**: Rust + Tauri 2.0
- **Image Processing**: image-rs crate
- **Video Processing**: FFmpeg

### Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run tauri dev

# Build for production
npm run tauri build
```

### License

MIT License - feel free to use in your own projects!

---

## 中文

### 功能特点

- **图片压缩** - 支持 PNG、JPG、WebP、GIF、BMP 等格式高质量压缩
- **视频压缩** - 支持 MP4、MOV、AVI、MKV、WebM 视频 H.264 编码压缩
- **WebP 转换** - 自动将图片转换为 WebP 格式，体积更小
- **视频封面生成** - 自动提取视频首帧作为封面图
- **批量处理** - 一键压缩整个文件夹，保留原始目录结构
- **单文件模式** - 支持单个文件快速压缩
- **轻量级** - 安装包仅 ~6MB（Electron 应用通常 150MB+）
- **原生性能** - 使用 Rust 构建，压缩速度快

### 下载安装

**[下载最新版本](https://github.com/ryan129129/compress-tool-app/releases/latest)**

| 平台 | 下载链接 |
|------|----------|
| macOS (Apple Silicon) | [资源压缩工具_x.x.x_aarch64.dmg](https://github.com/ryan129129/compress-tool-app/releases/latest) |
| macOS (Intel) | 即将支持 |
| Windows | 即将支持 |
| Linux | 即将支持 |

### 使用要求

- macOS 10.15+
- FFmpeg（用于视频压缩）

使用 Homebrew 安装 FFmpeg：
```bash
brew install ffmpeg
```

### 技术栈

- **前端**: React + TypeScript + TailwindCSS
- **后端**: Rust + Tauri 2.0
- **图片处理**: image-rs
- **视频处理**: FFmpeg

### 本地开发

```bash
# 安装依赖
npm install

# 开发模式运行
npm run tauri dev

# 构建生产版本
npm run tauri build
```

### 开源协议

MIT License - 欢迎自由使用！

---

## Keywords

image compression, video compression, compress images, compress videos, webp converter, batch image compression, batch video compression, macos compression tool, tauri app, rust image processing, ffmpeg video compression, lightweight compression tool, open source compression, 图片压缩, 视频压缩, 批量压缩, 资源压缩工具

## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=ryan129129/compress-tool-app&type=Date)](https://star-history.com/#ryan129129/compress-tool-app&Date)
