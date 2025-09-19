fn main() {
    // Configure VOSK library paths
    println!("cargo:rustc-link-search=native=.");
    println!("cargo:rustc-link-lib=libvosk");
    
    // Copy VOSK DLLs to target directory
    let target_dir = std::env::var("OUT_DIR").unwrap();
    let target_dir = std::path::Path::new(&target_dir)
        .parent()
        .unwrap()
        .parent()
        .unwrap()
        .parent()
        .unwrap();
    
    // Copy DLLs
    let dlls = vec![
        "libvosk.dll",
        "libgcc_s_seh-1.dll", 
        "libstdc++-6.dll",
        "libwinpthread-1.dll"
    ];
    
    for dll in dlls {
        if std::path::Path::new(dll).exists() {
            let dest = target_dir.join(dll);
            if let Err(_) = std::fs::copy(dll, &dest) {
                println!("cargo:warning=Failed to copy {}", dll);
            }
        }
    }
    
    tauri_build::build()
}