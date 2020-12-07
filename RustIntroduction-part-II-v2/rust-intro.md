class: center, middle

# Enums and Pattern Matching

James Cooper
(PhD student, University of Auckland)

(based on Chapter 6 of [The Book](https://doc.rust-lang.org/book/title-page.html))

---

## Enums aren't anything new! 😕

- C-style enums aren't anything new, no.
- Rust's enums aren't the same, however.
- Not just names for numbers, enums can potentially contain any types.
- Used to create an overall type for related types.

---

### A Sum Type By Any Other Name

- Rust's flavour of enums are known by various names
- F#: Discriminated Unions
- Haskell: Algebraic Data Types
- Also 'Sum Types' in mathematical terms

---

### A XOR B XOR C

- Enums are used to represent groups of types, when any given instance can be _only one_ type
- Essentially, they have a XOR relationship
- The Book gives the example of IP addresses
- An IP address can be IPv4 or IPv6, but never both at once

---

### Declaring the Gates of Babylon

- Let's declare all the colours of the rainbow 🌈
```Rust
    enum Rainbow {
        Red,
        Orange,
        Yellow,
        Green,
        Blue,
        Indigo,
        Violet
    }
```

???

The slide title is a reference to a song from the band Rainbow's 1978 album "Long Live Rock 'n' Roll".

---

### Assignation

- How to assign an instance of the enum to a variable?

```Rust
let dalaran = Rainbow::Violet;
```

- It's that simple
- Use the enum name and then the case name, separated with a double colon

???

Dalaran were the human mage nation in Warcraft 2, and their assigned colour was described as violet.

---

### But wait, there's more!

- The enum style seen so far can be quite handy, when combined with pattern matching (coming up)
- It still wouldn't _really_ be much different to C enums though
- We can, however, assign types to enum cases, e.g.

```Rust
    enum OldMacDonald {
        Goat(u8),
        Chicken(u8),
        Sheep(u8),
        Cow(u8),
        Horse(u8),
        Alpaca(u8),
    }
```

---

### eNUM

- We can 'contain' types inside our enum cases.
- How to use them?

```Rust
let g = OldMacDonald::Goat(5u8);

let mut c = OldMacDonald::Chicken(3u8);

c = OldMacDonald::Sheep(4u8);
```

- Yep, a given (mutable) variable is free to change enum cases

---

### 👍🏻 for diversity

- Using an enum means that the cases are logically connected somehow
- We want to be able to move between the cases
- That doesn't mean they all have to be the same, however
- We can give different cases different types
- But by using the enum, we can group them all together logically as parts of one super-type

---

### This probably isn't the best way to do this...

- Maybe we want to store those IP addresses differently?

```Rust
    enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

    let home = IpAddr::V4(127, 0, 0, 1);

    let loopback = IpAddr::V6(String::from("::1"));
```

- (example from The Book)

---

### Implementing enumeration

- Like structs, you can `impl` methods for enums
- You also can use enums as parameters for functions

```Rust
enum IpAddr {
        V4(u8, u8, u8, u8),
        V6(String),
    }

impl IpAddr {
    fn foo(&self) {
        // Method definition goes here
    }
}

fn make_HTTP_request(addr: IpAddr) -> Vec<u8> {
    // The function includes appropriate handling of each form of IP Address
}
```

---

## Pattern Matching

- The other half of the equation that really makes enums worthwhile
- Used in the match construct, which is a little like a switch statement (has been referred to as "switch on steriods")
- PM is found in pretty much all ML-derived languages, and others too
- E.g. Erlang does it a little differently (because of its Prolog origins), but pretty much runs on PM
- N.B. The first matching pattern is _always_ the one selected

---

### Matching colours

```Rust
    match acolour {
        Rainbow::Red => println!("Angry"),
        Rainbow::Orange => println!("Too much fake tan"),
        Rainbow::Yellow => println!("Belly"),
        Rainbow::Green => println!("Envy"),
        Rainbow::Blue => println!("Sadness"),
        Rainbow::Indigo => println!("Makes up the numbers"),
        Rainbow::Violet => println!("Imperial"),
    };
```

---

### Matching colours 2

```Rust
    let colour_word = match acolour {
        Rainbow::Red => "Angry",
        Rainbow::Orange => "Too much fake tan",
        Rainbow::Yellow => "Belly",
        Rainbow::Green => "Envy",
        Rainbow::Blue => "Sadness",
        Rainbow::Indigo => "Makes up the numbers",
        Rainbow::Violet => "Imperial",
    };
```

---

### Did you spot the difference?

- The match construct as a whole is an expression
- This means that you can assign the result of it to a variable
- The match construct will execute the right-hand side for whichever clause is matched to
- The result of that expression is the result of the whole statement

---

### One or many

- Don't need curly brackets and semi-colons for a single statement, but do for multiple statements

```Rust
match coin {
        Coin::Penny => {
            println!("Lucky penny!");
            1
        },
```

(taken from The Book)

- Result is 1, but the `println!` will also be executed.

---

### ... And in the pattern bind them

- Can bind parts of the matched pattern to variable names in the cases
- Can also specify literals in patterns, if desired, to discriminate specifc and general cases (called 'deconstruction')

```Rust
match ip_add {
        IpAddr::V4(192, 168, whocares, _) | IpAddr::V4(127, _, whocares, _) => println!("You're at home!"),
        IpAddr::V4(first, second, third, fourth) => println!("Not a home IPv4 address, starts with {}", first),
        IpAddr::V6(addr) => println!("{}", addr)
}
```

---

## In conclusion

- Enums let you model related types where something can only be one of them at time (exclusive or)
- Package said types into a super-type
- Enum cases can contain differing types themselves
- Pattern matching can be done on enums -> change behaviour based on what type a variable has
- Can also match to literals, or bind values to variable names
- Once you have become used to enums and pattern matching, you won't want to go without them

---

### More information?

- More to learn, this was only an introduction
- See The Book, [chapter 6](https://doc.rust-lang.org/book/ch06-00-enums.html) for more and enums and pattern matching
- [Chapter 18](https://doc.rust-lang.org/book/ch18-00-patterns.html) for much more on the patterns that can be specified
- See just about any Rust program anywhere written since v1.0 for instances of the use of enums and/or pattern matching