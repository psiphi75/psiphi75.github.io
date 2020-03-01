fn get_page() {
    // Spawn two threads to do work.
    let thread_one = thread::spawn(|| db_query("user"));
    let thread_two = thread::spawn(|| db_query("page"));

    // Wait for both threads to complete.
    thread_one.join().expect("thread one panicked");
    thread_two.join().expect("thread two panicked");
}

async fn get_page_async() {
    // Create two different "futures" which, when run to completion,
    // will asynchronously query the database.
    let future_one = db_query_async("user");
    let future_two = db_query_async("page");

    // Run both futures to completion at the same time.
    join!(future_one, future_two);
}
