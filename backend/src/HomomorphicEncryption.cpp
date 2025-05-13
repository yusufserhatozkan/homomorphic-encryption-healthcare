#include "HomomorphicEncryption.h"
#include "seal/seal.h"
#include <vector>
#include "seal/util/streambuf.h"
#include <string>
#include <vector>
#include <stdexcept>

static const std::string base64_chars = 
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



HomomorphicEncryption::HomomorphicEncryption() {
    parms = seal::EncryptionParameters(seal::scheme_type::bfv);
    parms.set_poly_modulus_degree(4096);
    parms.set_coeff_modulus(seal::CoeffModulus::BFVDefault(4096)); 
    parms.set_plain_modulus(16384); 


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

std::string HomomorphicEncryption::encrypt(int value) const {
    seal::Plaintext plain(std::to_string(value));
    seal::Ciphertext encrypted;
    encryptor->encrypt(plain, encrypted);

    std::stringstream ss;
    encrypted.save(ss);

    std::string binary_data = ss.str();
    return to_base64(binary_data);
}

int HomomorphicEncryption::decrypt(const std::string& encrypted_data) const {
    std::string binary_data = from_base64(encrypted_data);

    seal::Ciphertext encrypted;
    std::stringstream ss(binary_data);
    encrypted.load(*context, ss);

    seal::Plaintext plain;
    decryptor->decrypt(encrypted, plain);

    return std::stoi(plain.to_string());

}

int HomomorphicEncryption::decryptCSV(const std::string& encrypted_data) const {
    std::string binary_data = from_base64(encrypted_data);

    seal::Ciphertext encrypted;
    std::stringstream ss(binary_data);
    encrypted.load(*context, ss);

    seal::Plaintext plain;
    decryptor->decrypt(encrypted, plain);

    return plain.data()[0];

}

std::string HomomorphicEncryption::add(const std::string& encrypted_a, const std::string& encrypted_b) const {
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
