//
// Created by Luca Nichifor on 4/14/25.
//

#ifndef CORSMIDDLEWARE_H
#define CORSMIDDLEWARE_H

#endif //CORSMIDDLEWARE_H
// src/CORSMiddleware.h
#pragma once
#include "crow.h"

class CORSMiddleware {
public:
    struct context {};

    void before_handle(crow::request& req, crow::response& res, context& ctx) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");

        if (req.method == crow::HTTPMethod::OPTIONS) {
            res.code = 204;
            res.end();
        }
    }

    void after_handle(crow::request& req, crow::response& res, context& ctx) {
        res.set_header("Access-Control-Allow-Origin", "http://localhost:5173");
        res.set_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
        res.set_header("Access-Control-Allow-Headers", "Content-Type");
    }
};