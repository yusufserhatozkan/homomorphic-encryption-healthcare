#ifndef HOMOMORPHIC_ENCRYPTION_H
#define HOMOMORPHIC_ENCRYPTION_H

#include "seal/seal.h"
#include <string>
#include <memory>
#include <stdexcept>
#include <vector>

class HomomorphicEncryption {
public:
    HomomorphicEncryption(bool use_ckks = false, bool generate_keys = true);
    ~HomomorphicEncryption();

    std::string encrypt(double value) const;
    double decrypt(const std::string& encrypted_data) const;
    std::string add(const std::string& encrypted_a, const std::string& encrypted_b) const;
    std::string serialize_public_key() const;
    void load_public_key(const std::string& serialized_key);
    
    // New methods for CSV operations
    std::vector<std::string> encrypt_array(const std::vector<double>& values) const;
    std::string sum(const std::vector<std::string>& ciphertexts) const;
    std::string multiply_plain(const std::string& ciphertext, double scalar) const;

private:
    bool use_ckks; 
    seal::EncryptionParameters parms;
    std::shared_ptr<seal::SEALContext> context;
    seal::PublicKey public_key;
    seal::SecretKey secret_key;
    seal::RelinKeys relin_keys;
    std::unique_ptr<seal::Encryptor> encryptor;
    std::unique_ptr<seal::Evaluator> evaluator;
    std::unique_ptr<seal::Decryptor> decryptor;
    std::unique_ptr<seal::CKKSEncoder> ckks_encoder;
    std::unique_ptr<seal::BatchEncoder> bfv_encoder;
    double scale;
    
    std::string serialize(const seal::Ciphertext& ct) const;
    seal::Ciphertext deserialize(const std::string& str) const;
    void init_bfv();
    void init_ckks();
    void generate_keys();
};

#endif