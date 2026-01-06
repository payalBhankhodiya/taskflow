import pool from "../../db.js";


function createTable(){


    const tableQuery = `
        CREATE TABLE users(
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(50) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW() 
        );

        CREATE TABLE projects(
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'archived', 'completed')), 
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
        );
    `;

    pool.query(tableQuery, (error, results) => {
        if(error) {
            console.error('Error creating tables : ',error);
            return;
        }
        console.log('All tables created successfully!');
    });
    
}


async function alterTable(){

    const alterQuery = `
    ALTER TABLE users 
    ADD COLUMN avatar_url VARCHAR(200);

    ALTER TABLE projects 
    ADD COLUMN deadline DATE;
    `;

    try {
        await pool.query(alterQuery);
        console.log("data upadated successfully!");
    } catch(error) {
        console.error('error occour....', error);
    }


}
    
createTable();
alterTable();


// async function selectTable(){
//     try{
//         const res = await pool.query(`SELECT * FROM users`);
//         console.log(res.raws);
//     } catch (error) {
//         console.error('error occur...', error);
//     }
// }

// selectTable();



