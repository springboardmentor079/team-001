const pool = require("../db");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const signupRoles = new Set(["Administrator", "Project Manager", "Site Engineer", "Worker", "Site Worker", "Client"]);

const signup = async (req, res) => {
    try {
        const { name, email, password, role, phone } = req.body;

        if (!name || !email || !password || !role) {
            return res.status(400).json({
                message: "All fields are required"
            });
        }
        if (!signupRoles.has(role)) {
            return res.status(400).json({
                message: "Select a supported BuildTrack role."
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            `INSERT INTO users (name, email, password_hash, role, phone)
             VALUES ($1, $2, $3, $4, $5)
             RETURNING id, name, email, phone, role, is_active`,
            [name, email, hashedPassword, role, phone || null]
        );

        res.status(201).json({
            message: "User registered successfully",
            user: result.rows[0]
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Signup failed",
            error: error.message
        });
    }
};


const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                message: "Email and password are required"
            });
        }

        const result = await pool.query(
            "SELECT * FROM users WHERE email = $1",
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const user = result.rows[0];

        const passwordMatch = await bcrypt.compare(
            password,
            user.password_hash
        );

        if (!passwordMatch) {
            return res.status(401).json({
                message: "Invalid email or password"
            });
        }

        const token = jwt.sign(
            {
                id: user.id,
                role: user.role
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "1h"
            }
        );

        res.json({
            message: "Login successful",
            token: token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone || null,
                role: user.role,
                is_active: user.is_active
            }
        });

    } catch (error) {
        console.error(error);

        res.status(500).json({
            message: "Login failed",
            error: error.message
        });
    }
};


module.exports = {
    signup,
    login
};