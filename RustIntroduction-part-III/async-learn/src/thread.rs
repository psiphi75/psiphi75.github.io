use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        println!("hi from the spawned thread!");
        thread::sleep(Duration::from_millis(1));
        println!("hi again from the spawned thread!");
    });

    // Wait for the thread to finish
    handle.join().unwrap();
}
