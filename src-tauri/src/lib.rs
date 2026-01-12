use serde::{Deserialize, Serialize};
use std::fs;
use std::path::Path;
use std::process::Command;
use std::time::{SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Window};
use walkdir::WalkDir;

// 生成时间戳字符串 (格式: YYYYMMDD_HHMMSS)
fn generate_timestamp() -> String {
    let duration = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap_or_default();
    let secs = duration.as_secs();

    // 简单的时间戳，使用秒数的后6位
    format!("{}", secs % 1000000)
}

// 文件信息
#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct FileInfo {
    pub path: String,
    pub name: String,
    pub size: u64,
    pub file_type: String,
    pub extension: String,
}

// 进度信息
#[derive(Serialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct ProgressPayload {
    pub file: String,
    pub current: usize,
    pub total: usize,
    pub original_size: u64,
    pub compressed_size: u64,
}

// 压缩结果
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressResult {
    pub total_original: u64,
    pub total_compressed: u64,
    pub file_count: usize,
    pub output_path: String,
}

// 单文件压缩结果
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct SingleCompressResult {
    pub original_size: u64,
    pub compressed_size: u64,
    pub output_path: String,
    pub poster_path: Option<String>,
}

// 图片扩展名
const IMAGE_EXTENSIONS: &[&str] = &["jpg", "jpeg", "png", "webp", "gif", "bmp"];
// 视频扩展名
const VIDEO_EXTENSIONS: &[&str] = &["mp4", "mov", "avi", "mkv", "webm"];

fn get_file_type(path: &Path) -> &'static str {
    let ext = path
        .extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase();

    if IMAGE_EXTENSIONS.contains(&ext.as_str()) {
        "image"
    } else if VIDEO_EXTENSIONS.contains(&ext.as_str()) {
        "video"
    } else {
        "other"
    }
}

// 获取文件扩展名
fn get_extension(path: &Path) -> String {
    path.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("")
        .to_lowercase()
}

// 内部扫描函数
fn do_scan_folder(path: &str) -> Result<Vec<FileInfo>, String> {
    let mut files = Vec::new();

    for entry in WalkDir::new(path).into_iter().filter_map(|e| e.ok()) {
        if entry.file_type().is_file() {
            let file_path = entry.path();
            let file_type = get_file_type(file_path);

            // 只处理图片和视频
            if file_type == "other" {
                continue;
            }

            let metadata = fs::metadata(file_path).map_err(|e| e.to_string())?;

            files.push(FileInfo {
                path: file_path.to_string_lossy().to_string(),
                name: file_path
                    .strip_prefix(path)
                    .unwrap_or(file_path)
                    .to_string_lossy()
                    .to_string(),
                size: metadata.len(),
                file_type: file_type.to_string(),
                extension: get_extension(file_path),
            });
        }
    }

    Ok(files)
}

// 扫描单个文件
fn do_scan_file(path: &str) -> Result<FileInfo, String> {
    let file_path = Path::new(path);

    if !file_path.exists() {
        return Err("文件不存在".to_string());
    }

    if !file_path.is_file() {
        return Err("不是有效的文件".to_string());
    }

    let file_type = get_file_type(file_path);
    if file_type == "other" {
        return Err("不支持的文件类型".to_string());
    }

    let metadata = fs::metadata(file_path).map_err(|e| e.to_string())?;

    Ok(FileInfo {
        path: path.to_string(),
        name: file_path.file_name()
            .unwrap_or_default()
            .to_string_lossy()
            .to_string(),
        size: metadata.len(),
        file_type: file_type.to_string(),
        extension: get_extension(file_path),
    })
}

// 扫描文件夹命令
#[tauri::command]
fn scan_folder(path: String) -> Result<Vec<FileInfo>, String> {
    do_scan_folder(&path)
}

// 扫描单个文件命令
#[tauri::command]
fn scan_file(path: String) -> Result<FileInfo, String> {
    do_scan_file(&path)
}

// 压缩图片 - 默认转 WebP，保持原格式时使用原扩展名
fn compress_image(
    input: &Path,
    output: &Path,
    to_webp: bool,
) -> Result<(u64, String), Box<dyn std::error::Error>> {
    let img = image::open(input)?;

    let final_path = if to_webp {
        output.with_extension("webp")
    } else {
        output.to_path_buf()
    };

    img.save(&final_path)?;

    Ok((fs::metadata(&final_path)?.len(), final_path.to_string_lossy().to_string()))
}

// 压缩视频 - 保持原格式输出，保留封面流
fn compress_video(
    input: &Path,
    output: &Path,
    generate_poster: bool,
) -> Result<(u64, Option<String>), Box<dyn std::error::Error>> {
    // 保持原扩展名
    let ext = input.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("mp4");
    let output_video = output.with_extension(ext);

    // 使用更兼容的压缩参数
    // -map 0 保留所有流（包括封面流）
    // -c:v libx264 视频编码
    // -pix_fmt yuv420p 确保兼容性
    // -c:a aac 音频编码
    // -c:s copy 复制字幕流
    // -c:t copy 复制附件流（封面等）
    let status = Command::new("ffmpeg")
        .args([
            "-i",
            input.to_str().unwrap(),
            "-map", "0",                    // 保留所有流
            "-c:v", "libx264",              // 视频编码
            "-crf", "23",                   // 质量参数
            "-preset", "medium",            // 编码速度
            "-pix_fmt", "yuv420p",          // 像素格式，确保兼容性
            "-c:a", "aac",                  // 音频编码
            "-b:a", "128k",                 // 音频比特率
            "-c:s", "copy",                 // 复制字幕流
            "-disposition:v:0", "default",  // 设置第一个视频流为默认
            "-movflags", "+faststart",      // 快速启动
            "-max_muxing_queue_size", "1024", // 避免队列溢出
            output_video.to_str().unwrap(),
            "-y",
        ])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()?;

    if !status.success() {
        return Err("FFmpeg 压缩失败".into());
    }

    // 根据选项决定是否提取封面
    let poster_path = if generate_poster {
        let poster = output_video.with_extension("").to_string_lossy().to_string() + "-poster.webp";
        if extract_poster(input, Path::new(&poster)).is_ok() {
            Some(poster)
        } else {
            None
        }
    } else {
        None
    };

    Ok((fs::metadata(&output_video)?.len(), poster_path))
}

// 提取视频封面
fn extract_poster(input: &Path, output: &Path) -> Result<(), Box<dyn std::error::Error>> {
    let temp_jpg = output.with_extension("jpg");

    let status = Command::new("ffmpeg")
        .args([
            "-i",
            input.to_str().unwrap(),
            "-vframes",
            "1",
            "-q:v",
            "2",
            temp_jpg.to_str().unwrap(),
            "-y",
        ])
        .stdout(std::process::Stdio::null())
        .stderr(std::process::Stdio::null())
        .status()?;

    if !status.success() {
        return Err("提取封面失败".into());
    }

    if temp_jpg.exists() {
        let img = image::open(&temp_jpg)?;
        img.save(output)?;
        let _ = fs::remove_file(&temp_jpg);
    }

    Ok(())
}

// 单文件压缩命令
#[tauri::command]
async fn compress_file(
    input_path: String,
    output_dir: String,
    to_webp: bool,
    generate_poster: bool,
) -> Result<SingleCompressResult, String> {
    let input = Path::new(&input_path);
    let output_path = Path::new(&output_dir);

    fs::create_dir_all(output_path).map_err(|e| e.to_string())?;

    // 获取文件名（不含扩展名）和扩展名，添加时间戳
    let stem = input.file_stem()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let ext = input.extension()
        .and_then(|e| e.to_str())
        .unwrap_or("");

    // 生成带时间戳的文件名
    let timestamped_name = format!("{}-{}", stem, generate_timestamp());
    let dest = output_path.join(&timestamped_name);

    let original_size = fs::metadata(input).map_err(|e| e.to_string())?.len();
    let file_type = get_file_type(input);

    match file_type {
        "image" => {
            let (compressed_size, final_path) = compress_image(input, &dest, to_webp)
                .map_err(|e| e.to_string())?;
            Ok(SingleCompressResult {
                original_size,
                compressed_size,
                output_path: final_path,
                poster_path: None,
            })
        }
        "video" => {
            let (compressed_size, poster_path) = compress_video(input, &dest, generate_poster)
                .map_err(|e| e.to_string())?;
            Ok(SingleCompressResult {
                original_size,
                compressed_size,
                output_path: dest.with_extension(ext).to_string_lossy().to_string(),
                poster_path,
            })
        }
        _ => Err("不支持的文件类型".to_string()),
    }
}

// 压缩文件夹命令
#[tauri::command]
async fn compress_folder(
    window: Window,
    input_dir: String,
    output_dir: String,
    image_to_webp: bool,
    generate_poster: bool,
) -> Result<CompressResult, String> {
    let input_path = Path::new(&input_dir);
    let output_path = Path::new(&output_dir);

    // 获取输入文件夹名称，添加时间戳避免重复
    let folder_name = input_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .to_string();
    let timestamped_name = format!("{}-{}", folder_name, generate_timestamp());
    let final_output = output_path.join(&timestamped_name);

    fs::create_dir_all(&final_output).map_err(|e| e.to_string())?;

    let files = do_scan_folder(&input_dir)?;
    let total = files.len();

    let mut total_original: u64 = 0;
    let mut total_compressed: u64 = 0;

    for (index, file) in files.iter().enumerate() {
        let source = Path::new(&file.path);
        let relative = source.strip_prefix(input_path).unwrap_or(source);
        let dest = final_output.join(relative);

        if let Some(parent) = dest.parent() {
            let _ = fs::create_dir_all(parent);
        }

        total_original += file.size;

        let compressed_size = match file.file_type.as_str() {
            "image" => {
                compress_image(source, &dest, image_to_webp)
                    .map(|(size, _)| size)
                    .unwrap_or_else(|_| {
                        let _ = fs::copy(source, &dest);
                        file.size
                    })
            }
            "video" => {
                compress_video(source, &dest, generate_poster)
                    .map(|(size, _)| size)
                    .unwrap_or_else(|_| {
                        let _ = fs::copy(source, &dest);
                        file.size
                    })
            }
            _ => {
                let _ = fs::copy(source, &dest);
                file.size
            }
        };

        total_compressed += compressed_size;

        let _ = window.emit(
            "compress-progress",
            ProgressPayload {
                file: file.name.clone(),
                current: index + 1,
                total,
                original_size: file.size,
                compressed_size,
            },
        );
    }

    Ok(CompressResult {
        total_original,
        total_compressed,
        file_count: total,
        output_path: final_output.to_string_lossy().to_string(),
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_shell::init())
        .invoke_handler(tauri::generate_handler![
            scan_folder,
            scan_file,
            compress_folder,
            compress_file
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
