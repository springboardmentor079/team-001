require("dotenv").config();

const app = require("./server");
const pool = require("./db");

const PORT = process.env.PORT || 5000;

pool.query("SELECT NOW()", (err, result) => {
    if (err) {
        console.error("Database connection failed:", err.message);
    } else {
        console.log("PostgreSQL connected:", result.rows[0]);
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});