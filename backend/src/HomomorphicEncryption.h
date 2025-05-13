#ifndef HOMOMORPHIC_ENCRYPTION_H
#define HOMOMORPHIC_ENCRYPTION_H

#include "../libraries/SEAL/native/src/seal/seal.h"
#include <string>
#include <sstream>
#include <memory>

class HomomorphicEncryption {
public:
    HomomorphicEncryption();

    std::string encrypt(int value) const;
    int decrypt(const std::string& encrypted_data) const;
    int decryptCSV(const std::string& encrypted_data) const;
    std::string add(const std::string& encrypted_a, const std::string& encrypted_b) const;

private:
    seal::EncryptionParameters parms;
    std::shared_ptr<seal::SEALContext> context;

    seal::PublicKey public_key;
    seal::SecretKey secret_key;

    mutable seal::Encryptor* encryptor;
    mutable seal::Evaluator* evaluator;
    mutable seal::Decryptor* decryptor;
};

#endif // HOMOMORPHIC_ENCRYPTION_H