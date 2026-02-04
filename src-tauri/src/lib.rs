use image::ImageFormat;
use std::io::Write;
use std::process::{Child, Command, Stdio};
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use tauri::{Emitter, Manager, State};
use xcap::Window;

struct CaptureState {
    is_capturing: bool,
}

struct AppState {
    capture_state: Arc<Mutex<CaptureState>>,
    recording_process: Arc<Mutex<Option<Child>>>,
}

#[derive(serde::Serialize)]
struct WindowInfo {
    id: String,
    title: String,
    app_name: String,
}

#[tauri::command]
fn get_windows() -> Result<Vec<WindowInfo>, String> {
    let windows = Window::all().map_err(|e| e.to_string())?;
    let mut window_infos = Vec::new();

    for window in windows {
        // xcap 0.7+ returns Result for id, title, app_name
        match (window.id(), window.title(), window.app_name()) {
            (Ok(id), Ok(title), Ok(app_name)) => {
                if !title.is_empty() {
                    window_infos.push(WindowInfo {
                        id: id.to_string(),
                        title,
                        app_name,
                    });
                }
            }
            _ => continue, // Skip windows if we can't get their info
        }
    }
    Ok(window_infos)
}

#[tauri::command]
fn start_capture(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    window_id: String,
    interval_ms: u64,
) -> Result<(), String> {
    let mut capture_state = state.capture_state.lock().map_err(|e| e.to_string())?;

    if capture_state.is_capturing {
        return Err("Already capturing".to_string());
    }

    capture_state.is_capturing = true;
    let capture_state_clone = state.capture_state.clone();

    // Create captures directory if it doesn't exist
    let mut captures_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    captures_dir.push("captures");
    if !captures_dir.exists() {
        std::fs::create_dir_all(&captures_dir).map_err(|e| e.to_string())?;
    }

    // Spawn a background thread for capturing
    thread::spawn(move || {
        loop {
            // Check if we should stop
            {
                let state = capture_state_clone.lock().unwrap();
                if !state.is_capturing {
                    break;
                }
            }

            // Find the window again (windows can be closed/reopened, ids might change but xcap uses stable ids mostly)
            // Note: xcap window IDs are platform specific.
            // We need to iterate to find the window with the matching ID.
            let windows = Window::all().unwrap_or_default();
            let target_window = windows.into_iter().find(|w| {
                if let Ok(id) = w.id() {
                    id.to_string() == window_id
                } else {
                    false
                }
            });

            if let Some(window) = target_window {
                match window.capture_image() {
                    Ok(image) => {
                        let timestamp = SystemTime::now()
                            .duration_since(UNIX_EPOCH)
                            .unwrap()
                            .as_millis();

                        let filename = format!("capture_{}.webp", timestamp);
                        let file_path = captures_dir.join(filename);

                        // Save as WebP
                        // xcap returns an RgbaImage, we can save it using the image crate
                        if let Err(e) = image.save_with_format(&file_path, ImageFormat::WebP) {
                            eprintln!("Failed to save image: {}", e);
                        } else {
                            let _ = app_handle
                                .emit("capture-taken", file_path.to_string_lossy().to_string());
                        }
                    }
                    Err(e) => eprintln!("Failed to capture window: {}", e),
                }
            } else {
                eprintln!("Target window not found");
                // Optional: Stop capturing if window is lost?
            }

            thread::sleep(Duration::from_millis(interval_ms));
        }
    });

    Ok(())
}

#[tauri::command]
fn stop_capture(state: State<'_, AppState>) -> Result<(), String> {
    let mut capture_state = state.capture_state.lock().map_err(|e| e.to_string())?;
    capture_state.is_capturing = false;
    Ok(())
}

#[tauri::command]
fn get_capture_path(app_handle: tauri::AppHandle) -> Result<String, String> {
    let mut captures_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    captures_dir.push("captures");
    Ok(captures_dir.to_string_lossy().to_string())
}

#[tauri::command]
fn start_record(
    app_handle: tauri::AppHandle,
    state: State<'_, AppState>,
    window_id: String,
) -> Result<(), String> {
    let mut recording_process = state.recording_process.lock().map_err(|e| e.to_string())?;

    if recording_process.is_some() {
        return Err("Already recording".to_string());
    }

    // Find the window to get the title
    let windows = Window::all().map_err(|e| e.to_string())?;
    let target_window = windows.into_iter().find(|w| {
        if let Ok(id) = w.id() {
            id.to_string() == window_id
        } else {
            false
        }
    });

    let window_title = match target_window {
        Some(w) => w.title().map_err(|e| e.to_string())?,
        None => return Err("Target window not found".to_string()),
    };

    if window_title.is_empty() {
        return Err("Window has no title, cannot record with gdigrab".to_string());
    }

    // Prepare output path
    let mut captures_dir = app_handle
        .path()
        .app_data_dir()
        .map_err(|e| e.to_string())?;
    captures_dir.push("captures");
    if !captures_dir.exists() {
        std::fs::create_dir_all(&captures_dir).map_err(|e| e.to_string())?;
    }

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .unwrap()
        .as_millis();
    let filename = format!("recording_{}.mp4", timestamp);
    let output_path = captures_dir.join(filename);

    // Spawn ffmpeg
    // ffmpeg -f gdigrab -framerate 30 -i title="Window Title" -vcodec libx264 -preset ultrafast -crf 23 output.mp4
    let child = Command::new("ffmpeg")
        .arg("-f")
        .arg("gdigrab")
        .arg("-framerate")
        .arg("30")
        .arg("-i")
        .arg(format!("title={}", window_title))
        .arg("-vcodec")
        .arg("libx264")
        .arg("-preset")
        .arg("ultrafast")
        .arg("-crf")
        .arg("23")
        .arg(output_path.to_string_lossy().to_string())
        .stdin(Stdio::piped()) // Enable stdin to send 'q' later
        .spawn()
        .map_err(|e| format!("Failed to start ffmpeg: {}", e))?;

    *recording_process = Some(child);

    app_handle
        .emit("recording-started", ())
        .map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
fn stop_record(app_handle: tauri::AppHandle, state: State<'_, AppState>) -> Result<(), String> {
    let mut recording_process = state.recording_process.lock().map_err(|e| e.to_string())?;

    if let Some(mut child) = recording_process.take() {
        // Try to write 'q' to stdin to stop gracefully
        if let Some(mut stdin) = child.stdin.take() {
            let _ = stdin.write_all(b"q");
        }

        // Wait for a bit (optional, or just wait(). usually ffmpeg exits quickly after q)
        // If we want to be robust we might want to spawn a thread to wait, but for now let's just wait here.
        // If it hangs, the UI might freeze. But start/stop is usually user initiated events.
        match child.wait() {
            Ok(status) => {
                if !status.success() {
                    // eprintln!("FFmpeg exited with error: {}", status);
                }
            }
            Err(e) => {
                // If waiting fails, try to kill
                let _ = child.kill();
                return Err(format!("Failed to wait for ffmpeg: {}", e));
            }
        }

        app_handle
            .emit("recording-stopped", ())
            .map_err(|e| e.to_string())?;
    }

    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .manage(AppState {
            capture_state: Arc::new(Mutex::new(CaptureState {
                is_capturing: false,
            })),
            recording_process: Arc::new(Mutex::new(None)),
        })
        .invoke_handler(tauri::generate_handler![
            get_windows,
            start_capture,
            stop_capture,
            get_capture_path,
            start_record,
            stop_record
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
