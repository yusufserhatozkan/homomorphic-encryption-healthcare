#include "HomomorphicEncryption.h"
#include <vector>
#include <stdexcept>
#include <cstdint>
#include <cmath>
#include <sstream>
#include <iomanip>
#include <chrono>
#include <iostream>

namespace {
    const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";

    std::string to_base64(const std::string& input) {
        std::string ret;
        int val = 0, valb = -6;
        for (uint8_t c : input) {
            val = (val << 8) + c;
            valb += 8;
            while (valb >= 0) {
                ret.push_back(base64_chars[(val >> valb) & 0x3F]);
                valb -= 6;
            }
        }
        if (valb > -6) ret.push_back(base64_chars[((val << 8) >> (valb + 8)) & 0x3F]);
        while (ret.size() % 4) ret.push_back('=');
        return ret;
    }

    std::string from_base64(const std::string& input) {
        std::vector<int> T(256, -1);
        for (int i = 0; i < 64; i++) T[base64_chars[i]] = i;

        std::string output;
        int val = 0, valb = -8;
        for (uint8_t c : input) {
            if (T[c] == -1) break;
            val = (val << 6) + T[c];
            valb += 6;
            if (valb >= 0) {
                output.push_back(char((val >> valb) & 0xFF));
                valb -= 8;
            }
        }
        return output;
    }
}

HomomorphicEncryption::HomomorphicEncryption(bool use_ckks, bool should_generate_keys) 
    : use_ckks(use_ckks), scale(pow(2.0, 40)) {
    
    if (use_ckks) {
        init_ckks();
    } else {
        init_bfv();
    }

    context = std::make_shared<seal::SEALContext>(parms);
    evaluator = std::make_unique<seal::Evaluator>(*context);

    if (should_generate_keys) {
        generate_keys();
    }
}

void HomomorphicEncryption::init_bfv() {
    parms = seal::EncryptionParameters(seal::scheme_type::bfv);
    size_t poly_modulus_degree = 4096;
    parms.set_poly_modulus_degree(poly_modulus_degree);
    parms.set_coeff_modulus(seal::CoeffModulus::BFVDefault(poly_modulus_degree));
    parms.set_plain_modulus(seal::PlainModulus::Batching(poly_modulus_degree, 20));
}

void HomomorphicEncryption::init_ckks() {
    parms = seal::EncryptionParameters(seal::scheme_type::ckks);
    size_t poly_modulus_degree = 8192;
    parms.set_poly_modulus_degree(poly_modulus_degree);
    parms.set_coeff_modulus(seal::CoeffModulus::Create(
        poly_modulus_degree, { 50, 30, 30, 50 }));
}

void HomomorphicEncryption::generate_keys() {
    auto start = std::chrono::high_resolution_clock::now();

    seal::KeyGenerator keygen(*context);
    secret_key = keygen.secret_key();
    keygen.create_public_key(public_key);
    keygen.create_relin_keys(relin_keys);

    encryptor = std::make_unique<seal::Encryptor>(*context, public_key);
    decryptor = std::make_unique<seal::Decryptor>(*context, secret_key);
    
    if (use_ckks) {
        ckks_encoder = std::make_unique<seal::CKKSEncoder>(*context);
    } else {
        bfv_encoder = std::make_unique<seal::BatchEncoder>(*context);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();

    // Calculate public key size by serializing
    std::stringstream ss;
    public_key.save(ss);
    std::string pubkey_str = ss.str();
    size_t pubkey_size_bytes = pubkey_str.size();

    std::cout << "Key generation time: " << duration << " microseconds" << std::endl;
    std::cout << "Poly modulus degree: " << parms.poly_modulus_degree() << std::endl;
    std::cout << "Key size: " << pubkey_size_bytes << " bytes" << std::endl;
}

HomomorphicEncryption::~HomomorphicEncryption() = default;

std::string HomomorphicEncryption::encrypt(double value) const {
    if (!encryptor) throw std::runtime_error("Encryptor not initialized");
    
    seal::Plaintext plain;
    seal::Ciphertext encrypted;
    
    if (use_ckks) {
        ckks_encoder->encode(value, scale, plain);
        encryptor->encrypt(plain, encrypted);
    } else {
        size_t slot_count = bfv_encoder->slot_count();
        std::vector<uint64_t> values(slot_count, 0);
        values[0] = static_cast<uint64_t>(std::round(value));
        bfv_encoder->encode(values, plain);
        encryptor->encrypt(plain, encrypted);
    }
    
    return serialize(encrypted);
}

double HomomorphicEncryption::decrypt(const std::string& encrypted_data) const {
    if (!decryptor) throw std::runtime_error("Decryptor not initialized");
    
    seal::Ciphertext encrypted = deserialize(encrypted_data);
    seal::Plaintext plain;
    decryptor->decrypt(encrypted, plain);
    
    if (use_ckks) {
        std::vector<double> result;
        ckks_encoder->decode(plain, result);
        return result[0];
    } else {
        std::vector<uint64_t> result;
        bfv_encoder->decode(plain, result);
        return static_cast<double>(result[0]);
    }
}

std::string HomomorphicEncryption::add(const std::string& encrypted_a, 
                                      const std::string& encrypted_b) const {
    seal::Ciphertext a = deserialize(encrypted_a);
    seal::Ciphertext b = deserialize(encrypted_b);
    seal::Ciphertext result;
    
    evaluator->add(a, b, result);
    return serialize(result);
}

std::string HomomorphicEncryption::serialize(const seal::Ciphertext& ct) const {
    std::stringstream ss;
    ct.save(ss);
    return to_base64(ss.str());
}

seal::Ciphertext HomomorphicEncryption::deserialize(const std::string& str) const {
    std::string data = from_base64(str);
    std::stringstream ss(data);
    seal::Ciphertext ct;
    ct.load(*context, ss);
    return ct;
}

std::string HomomorphicEncryption::serialize_public_key() const {
    std::stringstream ss;
    public_key.save(ss);
    return to_base64(ss.str());
}

void HomomorphicEncryption::load_public_key(const std::string& serialized_key) {
    std::string data = from_base64(serialized_key);
    std::stringstream ss(data);
    public_key.load(*context, ss);
    encryptor = std::make_unique<seal::Encryptor>(*context, public_key);
}
