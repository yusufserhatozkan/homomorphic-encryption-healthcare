#include "HomomorphicEncryption.h"
#include "seal/seal.h"


HomomorphicEncryption::HomomorphicEncryption() {
    parms = seal::EncryptionParameters(seal::scheme_type::bfv);
    parms.set_poly_modulus_degree(4096);
    parms.set_coeff_modulus(seal::CoeffModulus::BFVDefault(4096));
    parms.set_plain_modulus(256);

    context = std::make_shared<seal::SEALContext>(parms);

    if (!context->parameters_set()) {
        throw std::invalid_argument("SEALContext parameters are not valid!");
    }

    seal::KeyGenerator keygen(*context);
    keygen.create_public_key(public_key);
    secret_key = keygen.secret_key();

    encryptor = new seal::Encryptor(*context, public_key);
    evaluator = new seal::Evaluator(*context);
    decryptor = new seal::Decryptor(*context, secret_key);
}



std::string HomomorphicEncryption::encrypt(int value) {
    seal::Plaintext plain(std::to_string(value));
    seal::Ciphertext encrypted;
    encryptor->encrypt(plain, encrypted);

    std::stringstream ss;
    encrypted.save(ss);
    return ss.str();
}

int HomomorphicEncryption::decrypt(const std::string& encrypted_data) {
    seal::Ciphertext encrypted;
    std::stringstream ss(encrypted_data);
    encrypted.load(*context, ss);

    seal::Plaintext plain;
    decryptor->decrypt(encrypted, plain);
    return std::stoi(plain.to_string());
}

std::string HomomorphicEncryption::add(const std::string& encrypted_a, const std::string& encrypted_b) {
    seal::Ciphertext a, b;
    std::stringstream ssa(encrypted_a), ssb(encrypted_b);
    a.load(*context, ssa);
    b.load(*context, ssb);

    seal::Ciphertext result;
    evaluator->add(a, b, result);

    std::stringstream ssr;
    result.save(ssr);
    return ssr.str();
}
