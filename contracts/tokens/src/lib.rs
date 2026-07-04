
#![no_std]
use soroban_sdk::{contract, contractimpl, contracttype, symbol_short, Env, String, Symbol, Vec};

// Struktur data yang akan menyimpan tokens
#[contracttype]
#[derive(Clone, Debug)]
pub struct Token {
    id: u64,
    name: String,
    type_token: String,
}

// Storage key untuk data tokens
const TKN_DATA: Symbol = symbol_short!("TKN_DATA");

#[contract]
pub struct TokenContract;

#[contractimpl]
impl TokenContract {
    pub fn get_token(env: Env) -> Vec<Token> {
        // 1. ambil data token dari storage
        return env.storage().instance().get(&TKN_DATA).unwrap_or(Vec::new(&env));
    }

    // Fungsi untuk membuat token baru
    pub fn create_token(env: Env, name: String, type_token: String) -> String {
        // 1. ambil data tokens dari storage
        let mut tokens: Vec<Token> = env.storage().instance().get(&TKN_DATA).unwrap_or(Vec::new(&env));
        
        // 2. Buat object token baru
        let token = Token {
            id: env.prng().gen::<u64>(),
            name: name,
            type_token: type_token,
        };
        
        // 3. tambahkan token baru ke tokens lama
        tokens.push_back(token);
        
        // 4. simpan tokens ke storage
        env.storage().instance().set(&TKN_DATA, &tokens);
        
        return String::from_str(&env, "Tokens berhasil ditambahkan");
    }

    // Fungsi untuk menghapus token berdasarkan id
    pub fn delete_token(env: Env, id: u64) -> String {
        // 1. ambil data tokens dari storage 
        let mut tokens: Vec<Token> = env.storage().instance().get(&TKN_DATA).unwrap_or(Vec::new(&env));

        // 2. cari index token yang akan dihapus menggunakan perulangan
        for i in 0..tokens.len() {
            if tokens.get(i).unwrap().id == id {
                tokens.remove(i);

                env.storage().instance().set(&TKN_DATA, &tokens);
                return String::from_str(&env, "Berhasil hapus tokens");
            }
        }

        return String::from_str(&env, "Tokens tidak ditemukan")
    }
}

mod test;