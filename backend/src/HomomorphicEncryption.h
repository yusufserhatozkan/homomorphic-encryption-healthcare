#ifndef HOMOMORPHIC_ENCRYPTION_H
#define HOMOMORPHIC_ENCRYPTION_H

#include "../libraries/SEAL/native/src/seal/seal.h"
#include <string>
#include <sstream>
#include <memory>

class HomomorphicEncryption {
public:
    HomomorphicEncryption();

    std::string encrypt(int value);
    int decrypt(const std::string& encrypted_data);
    std::string add(const std::string& encrypted_a, const std::string& encrypted_b);

private:
    seal::EncryptionParameters parms;
    std::shared_ptr<seal::SEALContext> context;

    seal::PublicKey public_key;
    seal::SecretKey secret_key;

    seal::Encryptor* encryptor;
    seal::Evaluator* evaluator;
    seal::Decryptor* decryptor;
};

#endif
