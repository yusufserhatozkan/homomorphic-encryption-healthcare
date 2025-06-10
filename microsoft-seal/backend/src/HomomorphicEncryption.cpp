/**
 * HomomorphicEncryption.cpp
 * 
 * Implementation of the HomomorphicEncryption wrapper class for Microsoft SEAL library.
 * This file provides a simplified interface for homomorphic encryption operations
 * supporting both BFV (integers) and CKKS (floating-point) schemes.
 * 
 * Key features:
 * - Encryption/decryption of numeric values
 * - Homomorphic addition operations
 * - Key serialization and management
 * - Base64 encoding for data transport
 */

#include "HomomorphicEncryption.h"
#include <vector>         // For std::vector containers
#include <stdexcept>      // For exception handling
#include <cstdint>        // For fixed-width integer types
#include <cmath>          // For mathematical operations (pow, round)
#include <sstream>        // For string stream operations
#include <iomanip>        // For I/O formatting
#include <chrono>         // For timing measurements
#include <iostream>       // For console output

/**
 * Anonymous namespace containing utility functions for Base64 encoding/decoding
 * Used for serializing encrypted data for transmission over HTTP/JSON
 */
namespace {
    // Base64 alphabet used for encoding binary data to text
    const std::string base64_chars = 
        "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
        "abcdefghijklmnopqrstuvwxyz"
        "0123456789+/";

    /**
     * Converts binary data to Base64 string representation
     * @param input Raw binary data as string
     * @return Base64 encoded string
     */
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
        while (ret.size() % 4) ret.push_back('=');  // Add padding
        return ret;
    }

    /**
     * Converts Base64 string back to binary data
     * @param input Base64 encoded string
     * @return Decoded binary data as string
     */
    std::string from_base64(const std::string& input) {
        std::vector<int> T(256, -1);  // Translation table
        for (int i = 0; i < 64; i++) T[base64_chars[i]] = i;

        std::string output;
        int val = 0, valb = -8;
        for (uint8_t c : input) {
            if (T[c] == -1) break;  // Stop at invalid character (padding)
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

/**
 * Constructor for HomomorphicEncryption wrapper class
 * 
 * @param use_ckks If true, uses CKKS scheme (floating-point), otherwise BFV (integers)
 * @param should_generate_keys If true, generates new key pair automatically
 * 
 * CKKS: Supports approximate arithmetic on encrypted floating-point numbers
 * BFV: Supports exact arithmetic on encrypted integers with batching
 */
HomomorphicEncryption::HomomorphicEncryption(bool use_ckks, bool should_generate_keys) 
    : use_ckks(use_ckks), scale(pow(2.0, 40)) {  // Scale factor for CKKS precision
    
    // Initialize encryption parameters based on chosen scheme
    if (use_ckks) {
        init_ckks();
    } else {
        init_bfv();
    }

    // Create SEAL context and evaluator for homomorphic operations
    context = std::make_shared<seal::SEALContext>(parms);
    evaluator = std::make_unique<seal::Evaluator>(*context);

    // Generate keys if requested (typically for testing/demo purposes)
    if (should_generate_keys) {
        generate_keys();
    }
}

/**
 * Initialize BFV (Brakerski-Fan-Vercauteren) encryption parameters
 * BFV is designed for exact integer arithmetic with SIMD batching capabilities
 */
void HomomorphicEncryption::init_bfv() {
    parms = seal::EncryptionParameters(seal::scheme_type::bfv);
    size_t poly_modulus_degree = 8192;  // Polynomial degree (affects security and performance)
    parms.set_poly_modulus_degree(poly_modulus_degree);

    // Coefficient modulus chain for modulus switching (enables more operations)
    // Format: {first_prime, intermediate_primes..., last_prime}
    parms.set_coeff_modulus(seal::CoeffModulus::Create(
        poly_modulus_degree, {50, 30, 30, 50}));

    // Plaintext modulus - enables batching of multiple integers in one ciphertext
    parms.set_plain_modulus(seal::PlainModulus::Batching(poly_modulus_degree, 20));
}

/**
 * Initialize CKKS (Cheon-Kim-Kim-Song) encryption parameters  
 * CKKS is designed for approximate arithmetic on floating-point numbers
 */
void HomomorphicEncryption::init_ckks() {
    parms = seal::EncryptionParameters(seal::scheme_type::ckks);
    size_t poly_modulus_degree = 8192;  // Must be power of 2
    parms.set_poly_modulus_degree(poly_modulus_degree);

    // Coefficient modulus for CKKS - more levels allow more operations
    // Each level corresponds to a prime in the modulus chain
    parms.set_coeff_modulus(seal::CoeffModulus::Create(
        poly_modulus_degree, {50, 30, 30, 50}));
    // Note: CKKS doesn't use plain_modulus
}


/**
 * Generate cryptographic keys and initialize encryption/decryption components
 * This includes public key, secret key, and relinearization keys
 * Also measures and reports key generation performance metrics
 */
void HomomorphicEncryption::generate_keys() {
    auto start = std::chrono::high_resolution_clock::now();

    // Generate the key pair and auxiliary keys
    seal::KeyGenerator keygen(*context);
    secret_key = keygen.secret_key();           // Private key for decryption
    keygen.create_public_key(public_key);       // Public key for encryption
    keygen.create_relin_keys(relin_keys);       // Relinearization keys for multiplication

    // Initialize encryptor and decryptor with the generated keys
    encryptor = std::make_unique<seal::Encryptor>(*context, public_key);
    decryptor = std::make_unique<seal::Decryptor>(*context, secret_key);
    
    // Initialize the appropriate encoder based on the scheme
    if (use_ckks) {
        // CKKS encoder for floating-point numbers
        ckks_encoder = std::make_unique<seal::CKKSEncoder>(*context);
    } else {
        // BFV batch encoder for integer vectors
        bfv_encoder = std::make_unique<seal::BatchEncoder>(*context);
    }

    auto end = std::chrono::high_resolution_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::microseconds>(end - start).count();

    // Calculate public key size by serializing it
    std::stringstream ss;
    public_key.save(ss);
    std::string pubkey_str = ss.str();
    size_t pubkey_size_bytes = pubkey_str.size();

    // Print performance and parameter information
    std::cout << "Key generation time: " << duration << " microseconds" << std::endl;
    std::cout << "Poly modulus degree: " << parms.poly_modulus_degree() << std::endl;
    std::cout << "Modulus Coefficients: [ ";
    for (const auto& mod : parms.coeff_modulus()) {
        std::cout << mod.value() << " ";
    }
    std::cout << "]" << std::endl;

    std::cout << "Key size: " << pubkey_size_bytes << " bytes" << std::endl;
}

// Destructor - uses default implementation (smart pointers handle cleanup)
HomomorphicEncryption::~HomomorphicEncryption() = default;

/**
 * Encrypt a single numeric value using the configured encryption scheme
 * 
 * @param value The numeric value to encrypt (double for both schemes)
 * @return Base64-encoded serialized ciphertext
 * 
 * For CKKS: Directly encodes the floating-point value with specified scale
 * For BFV: Rounds to integer and places in first slot of batch encoding
 */
std::string HomomorphicEncryption::encrypt(double value) const {
    if (!encryptor) throw std::runtime_error("Encryptor not initialized");
    
    seal::Plaintext plain;
    seal::Ciphertext encrypted;
    
    if (use_ckks) {
        // CKKS: Encode floating-point value with scaling factor
        ckks_encoder->encode(value, scale, plain);
        encryptor->encrypt(plain, encrypted);
    } else {
        // BFV: Batch encode with value in first slot
        size_t slot_count = bfv_encoder->slot_count();
        std::vector<uint64_t> values(slot_count, 0);  // Initialize all slots to 0
        values[0] = static_cast<uint64_t>(std::round(value));  // Place value in first slot
        bfv_encoder->encode(values, plain);
        encryptor->encrypt(plain, encrypted);
    }
    
    return serialize(encrypted);  // Convert to Base64 string for transport
}

/**
 * Decrypt a ciphertext back to its original numeric value
 * 
 * @param encrypted_data Base64-encoded serialized ciphertext
 * @return The decrypted numeric value as double
 * 
 * For CKKS: Returns the first element of the decoded vector (approximate)
 * For BFV: Returns the first slot value converted to double (exact)
 */
double HomomorphicEncryption::decrypt(const std::string& encrypted_data) const {
    if (!decryptor) throw std::runtime_error("Decryptor not initialized");
    
    // Deserialize the ciphertext from Base64 string
    seal::Ciphertext encrypted = deserialize(encrypted_data);
    seal::Plaintext plain;
    decryptor->decrypt(encrypted, plain);
    
    if (use_ckks) {
        // CKKS: Decode to vector of doubles and return first element
        std::vector<double> result;
        ckks_encoder->decode(plain, result);
        return result[0];
    } else {
        // BFV: Decode to vector of integers and return first element as double
        std::vector<uint64_t> result;
        bfv_encoder->decode(plain, result);
        return static_cast<double>(result[0]);
    }
}

/**
 * Perform homomorphic addition of two encrypted values
 * Addition is performed directly on the ciphertexts without decryption
 * 
 * @param encrypted_a Base64-encoded first operand
 * @param encrypted_b Base64-encoded second operand
 * @return Base64-encoded result of encrypted addition
 * 
 * This operation works for both BFV and CKKS schemes
 * The result remains encrypted and can be used in further operations
 */
std::string HomomorphicEncryption::add(const std::string& encrypted_a, 
                                      const std::string& encrypted_b) const {
    // Deserialize both operands from Base64 strings
    seal::Ciphertext a = deserialize(encrypted_a);
    seal::Ciphertext b = deserialize(encrypted_b);
    seal::Ciphertext result;
    
    // Perform homomorphic addition: result = a + b (encrypted)
    evaluator->add(a, b, result);
    return serialize(result);  // Serialize result back to Base64
}

/**
 * Serialize a SEAL ciphertext to Base64 string for network transmission
 * 
 * @param ct The ciphertext to serialize
 * @return Base64-encoded string representation
 */
std::string HomomorphicEncryption::serialize(const seal::Ciphertext& ct) const {
    std::stringstream ss;
    ct.save(ss);                    // Save ciphertext to string stream
    return to_base64(ss.str());     // Encode binary data as Base64
}

/**
 * Deserialize a Base64 string back to SEAL ciphertext
 * 
 * @param str Base64-encoded ciphertext string
 * @return Reconstructed SEAL ciphertext object
 */
seal::Ciphertext HomomorphicEncryption::deserialize(const std::string& str) const {
    std::string data = from_base64(str);    // Decode Base64 to binary
    std::stringstream ss(data);
    seal::Ciphertext ct;
    ct.load(*context, ss);                  // Load ciphertext from stream
    return ct;
}

/**
 * Serialize the public key to Base64 string for sharing
 * Allows clients to encrypt data without access to the private key
 * 
 * @return Base64-encoded public key
 */
std::string HomomorphicEncryption::serialize_public_key() const {
    std::stringstream ss;
    public_key.save(ss);
    return to_base64(ss.str());
}

/**
 * Load a public key from Base64 string and initialize encryptor
 * Used when receiving a public key from another party
 * 
 * @param serialized_key Base64-encoded public key string
 */
void HomomorphicEncryption::load_public_key(const std::string& serialized_key) {
    std::string data = from_base64(serialized_key);
    std::stringstream ss(data);
    public_key.load(*context, ss);
    // Reinitialize encryptor with the new public key
    encryptor = std::make_unique<seal::Encryptor>(*context, public_key);
}

/**
 * Compute the homomorphic sum of multiple encrypted values
 * Efficiently adds all ciphertexts in a vector without decryption
 * 
 * @param ciphertexts Vector of Base64-encoded ciphertext strings
 * @return Base64-encoded encrypted sum result
 * 
 * This is useful for computing statistics on encrypted datasets,
 * such as sum of encrypted healthcare data or financial records.
 * The operation is performed entirely in the encrypted domain.
 */
std::string HomomorphicEncryption::sum(const std::vector<std::string>& ciphertexts) const {
    if (ciphertexts.empty()) {
        throw std::invalid_argument("Cannot sum empty vector of ciphertexts");
    }
    
    // Start with the first ciphertext as the accumulator
    seal::Ciphertext result = deserialize(ciphertexts[0]);
    
    // Add each subsequent ciphertext to the running sum
    for (size_t i = 1; i < ciphertexts.size(); i++) {
        seal::Ciphertext next = deserialize(ciphertexts[i]);
        evaluator->add_inplace(result, next);  // In-place addition for efficiency
    }
    
    return serialize(result);  // Return the encrypted sum
}

