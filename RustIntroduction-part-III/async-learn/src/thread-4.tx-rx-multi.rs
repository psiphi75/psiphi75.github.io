use std::sync::mpsc; // Multiproducer, single consumer
use std::thread;

fn main() {
    // --snip--
    let (tx, rx) = mpsc::channel();

    let tx1 = tx.clone();
    thread::spawn(move || {
        let val = String::from("hi - 1");
        tx1.send(val).unwrap();
    });

    thread::spawn(move || {
        let val = String::from("hi - 2");
        tx.send(val).unwrap();
    });

    for received in rx {
        println!("Got: {}", received);
    }
    // --snip--
}
