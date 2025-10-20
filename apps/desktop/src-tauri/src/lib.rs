#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  use tauri::menu::{MenuBuilder, MenuItemBuilder};
  use tauri::tray::TrayIconBuilder;
  use tauri::Emitter;
  use tauri::Manager;

  struct TrayStore { tray: tauri::tray::TrayIcon }

  #[tauri::command]
  async fn set_tray_tooltip(store: tauri::State<'_, TrayStore>, text: String) -> Result<(), String> {
    store.tray.set_tooltip(Some(text)).map_err(|e| e.to_string())
  }

  tauri::Builder::default()
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }

      // Register notification plugin
      app.handle().plugin(tauri_plugin_notification::init())?;

      // Build tray menu
      let start = MenuItemBuilder::with_id("start", "Start").build(app)?;
      let pause = MenuItemBuilder::with_id("pause", "Pause").build(app)?;
      let skip = MenuItemBuilder::with_id("skip", "Skip").build(app)?;
      let extend = MenuItemBuilder::with_id("extend", "Extend +1m").build(app)?;
      let mini = MenuItemBuilder::with_id("toggle_mini", "Toggle Mini").build(app)?;
      let quit = MenuItemBuilder::with_id("quit", "Quit").build(app)?;
      let menu = MenuBuilder::new(app)
        .items(&[&start, &pause, &skip, &extend, &mini, &quit])
        .build()?;

      // Build tray icon with menu
      let tray_icon = TrayIconBuilder::new().menu(&menu)
        .on_menu_event(|app, event| {
          let id = event.id.as_ref();
          match id {
            "start" => {
              let _ = app.emit("cadence:tray", serde_json::json!({"action":"start"}));
            }
            "pause" => {
              let _ = app.emit("cadence:tray", serde_json::json!({"action":"pause"}));
            }
            "skip" => {
              let _ = app.emit("cadence:tray", serde_json::json!({"action":"skip"}));
            }
            "extend" => {
              let _ = app.emit("cadence:tray", serde_json::json!({"action":"extend","minutes":1}));
            }
            "toggle_mini" => {
              let _ = app.emit("cadence:tray", serde_json::json!({"action":"toggle_mini"}));
            }
            "quit" => {
              app.exit(0);
            }
            _ => {}
          }
        })
        .build(app)?;

      // Store tray in app state
      app.manage(TrayStore { tray: tray_icon });

      // Create the main window programmatically so we can control platform-specific transparency
      use tauri::{WebviewWindowBuilder, WebviewUrl};
      #[cfg(debug_assertions)]
      let url = WebviewUrl::External("http://127.0.0.1:5174".parse().unwrap());
      #[cfg(not(debug_assertions))]
      let url = WebviewUrl::App("index.html".into());

      #[cfg(target_os = "windows")]
      let transparent = true; // fully glass on Windows to eliminate accent border
      #[cfg(target_os = "macos")]
      let transparent = true;  // keep glass on macOS
      #[cfg(not(any(target_os = "windows", target_os = "macos")))]
      let transparent = false;

      // Disable OS shadow on Windows to avoid an outer glow/border; we draw our own in CSS
      #[cfg(target_os = "windows")]
      let use_shadow = false;
      #[cfg(not(target_os = "windows"))]
      let use_shadow = true;

      WebviewWindowBuilder::new(app, "main", url)
        .title("@cadence/desktop")
        .inner_size(1200.0, 850.0)
        .min_inner_size(900.0, 640.0)
        .resizable(true)
        .decorations(false)
        .shadow(use_shadow)
        .transparent(transparent)
        .build()?;

      // Webview is transparent via window transparency; no explicit background color needed

      Ok(())
    })
    .invoke_handler(tauri::generate_handler![set_tray_tooltip, set_window_effect])
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}

#[tauri::command]
async fn set_window_effect(window: tauri::WebviewWindow, effect: String) -> Result<(), String> {
  // Best-effort: apply OS-level effects when available. Otherwise, no-op.
  #[cfg(target_os = "windows")]
  {
    // Option A: use CSS glass on Windows; never apply native Acrylic/Mica
    #[allow(unused_imports)]
    use window_vibrancy::{clear_acrylic, clear_mica};
    let _ = clear_acrylic(&window);
    let _ = clear_mica(&window);
  }
  #[cfg(target_os = "macos")]
  {
    use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
    match effect.as_str() {
      "vibrancy" | "mica" | "acrylic" => {
        apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
          .map_err(|e| e.to_string())?;
      }
      _ => {
        // no-op
      }
    }
  }
  Ok(())
}
