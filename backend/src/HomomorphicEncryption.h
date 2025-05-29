#ifndef HOMOMORPHIC_ENCRYPTION_H
#define HOMOMORPHIC_ENCRYPTION_H

#include "seal/seal.h"
#include <string>
#include <memory>

class HomomorphicEncryption {
public:
 
    HomomorphicEncryption(bool use_ckks = false);
    
    ~HomomorphicEncryption();

    std::string encrypt(double value) const;
    
    double decrypt(const std::string& encrypted_data) const;

    std::string add(const std::string& encrypted_a, const std::string& encrypted_b) const;

private:
    bool use_ckks; 
    seal::EncryptionParameters parms;
    std::shared_ptr<seal::SEALContext> context;
    seal::PublicKey public_key;
    seal::SecretKey secret_key;
    mutable seal::Encryptor* encryptor;
    mutable seal::Evaluator* evaluator;
    mutable seal::Decryptor* decryptor;
    

    seal::CKKSEncoder* ckks_encoder;
    double scale;  
};

#endif