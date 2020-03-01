use std::sync::mpsc; // Multiproducer, single consumer
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();
    let val = String::from("hi");

    thread::spawn(move || {
        tx.send(val).unwrap();
    });

    let received = rx.recv().unwrap();
    println!("Got: {}", received);
}
