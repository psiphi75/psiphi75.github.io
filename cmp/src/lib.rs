#![feature(test)]
extern crate test;

#[inline(always)]
fn is_odd(a: u64) -> bool {
  a % 2 != 0
}

// Functional
pub fn functional(upper: u64) -> u64 {
  (0..)
    .map(|n| n * n)
    .take_while(|&n| n < upper)
    .filter(|n| is_odd(*n))
    .sum()
}

// Iterative
pub fn iterative(upper: u64) -> u64 {
  let mut acc = 0;
  for n in 0.. {
    let n_squared = n * n;
    if n_squared >= upper {
      break;
    } else if is_odd(n_squared) {
      acc += n_squared;
    }
  }
  acc
}

#[cfg(test)]
mod tests {

  use super::*;
  use test::Bencher;

  #[bench]
  fn bench_functional_1000000(b: &mut Bencher) {
    b.iter(|| functional(1000000));
  }

  #[bench]
  fn bench_iterative_1000000(b: &mut Bencher) {
    b.iter(|| iterative(1000000));
  }
}
