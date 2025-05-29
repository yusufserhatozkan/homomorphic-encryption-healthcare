#include "HomomorphicEncryption.h"
#include <vector>
#include <stdexcept>
#include <cstdint>
#include <cmath> 

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

HomomorphicEncryption::HomomorphicEncryption(bool use_ckks_flag) 
    : use_ckks(use_ckks_flag), ckks_encoder(nullptr), scale(0.0) {
    
    if (use_ckks) { // CKKS
        parms = seal::EncryptionParameters(seal::scheme_type::ckks);
        size_t poly_modulus_degree = 8192;
        parms.set_poly_modulus_degree(poly_modulus_degree);
        parms.set_coeff_modulus(seal::CoeffModulus::Create(
            poly_modulus_degree, { 50, 30, 30, 50 }));
        
        context = std::make_shared<seal::SEALContext>(parms);
        scale = std::pow(2.0, 40);

        seal::KeyGenerator keygen(*context);
        keygen.create_public_key(public_key);
        secret_key = keygen.secret_key();

        encryptor = new seal::Encryptor(*context, public_key);
        evaluator = new seal::Evaluator(*context);
        decryptor = new seal::Decryptor(*context, secret_key);
        ckks_encoder = new seal::CKKSEncoder(*context);
    } else {
        // BFV
        parms = seal::EncryptionParameters(seal::scheme_type::bfv);
        size_t poly_modulus_degree = 4096;
        parms.set_poly_modulus_degree(poly_modulus_degree);
        parms.set_coeff_modulus(seal::CoeffModulus::BFVDefault(poly_modulus_degree));
        parms.set_plain_modulus(131071);  // 2^17 - 1
        
        context = std::make_shared<seal::SEALContext>(parms);
 
        seal::KeyGenerator keygen(*context);
        keygen.create_public_key(public_key);
        secret_key = keygen.secret_key();

        encryptor = new seal::Encryptor(*context, public_key);
        evaluator = new seal::Evaluator(*context);
        decryptor = new seal::Decryptor(*context, secret_key);
        ckks_encoder = nullptr; 
    }
}

HomomorphicEncryption::~HomomorphicEncryption() {

    delete encryptor;
    delete evaluator;
    delete decryptor;
    if (ckks_encoder) {
        delete ckks_encoder;
    }
}

std::string HomomorphicEncryption::encrypt(double value) const {
    if (use_ckks) {
        // CKKS
        seal::Plaintext plain;
        ckks_encoder->encode(value, scale, plain);
        seal::Ciphertext encrypted;
        encryptor->encrypt(plain, encrypted);
        
        std::stringstream ss;
        encrypted.save(ss);
        return to_base64(ss.str());
    } else {
        // BFV
        seal::Plaintext plain(parms.poly_modulus_degree());
        plain.set_zero();
        plain[0] = static_cast<uint64_t>(value);
        
        seal::Ciphertext encrypted;
        encryptor->encrypt(plain, encrypted);
        
        std::stringstream ss;
        encrypted.save(ss);
        return to_base64(ss.str());
    }
}

double HomomorphicEncryption::decrypt(const std::string& encrypted_data) const {
    std::string binary_data = from_base64(encrypted_data);
    seal::Ciphertext encrypted;
    std::stringstream ss(binary_data);
    encrypted.load(*context, ss);
    
    if (use_ckks) {
        // CKKS
        seal::Plaintext plain;
        decryptor->decrypt(encrypted, plain);
        std::vector<double> result;
        ckks_encoder->decode(plain, result);
        return result[0];
    } else {
        // BFV
        seal::Plaintext plain;
        decryptor->decrypt(encrypted, plain);
        return static_cast<double>(plain[0]);
    }
}

std::string HomomorphicEncryption::add(const std::string& encrypted_a, 
                                      const std::string& encrypted_b) const {
    seal::Ciphertext a, b;
    
    std::string binary_a = from_base64(encrypted_a);
    std::string binary_b = from_base64(encrypted_b);
    
    std::stringstream ssa(binary_a), ssb(binary_b);
    a.load(*context, ssa);
    b.load(*context, ssb);
    
    seal::Ciphertext result;
    evaluator->add(a, b, result);
    
    std::stringstream ssr;
    result.save(ssr);
    return to_base64(ssr.str());
}