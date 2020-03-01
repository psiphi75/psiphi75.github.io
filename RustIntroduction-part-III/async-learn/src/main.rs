use async_std::task;
use futures::executor::block_on;
use futures::join;
use std::time::Duration;

async fn db_call(time: u64) {
    task::sleep(Duration::from_millis(time)).await;
}

async fn get_book() -> String {
    db_call(1000).await;
    String::from("Book")
}
async fn get_music() -> String {
    db_call(1500).await;
    String::from("Music")
}

async fn get_book_and_music() -> (String, String) {
    let book_fut = get_book();
    let music_fut = get_music();
    join!(book_fut, music_fut)
}

fn main() {
    let future = get_book_and_music();
    let result = block_on(future);
    println!("{:?}", result);
}
